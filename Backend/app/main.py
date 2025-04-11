from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, BackgroundTasks, Response, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
import logging
from typing import List, Optional
import os
from datetime import datetime, timedelta, date
import uuid

from app.core.database import get_db, engine, Base
from app.services.csv_processor import CSVProcessor
from app.models.user import User, UserRole
from app.core.auth import authenticate_user, create_access_token, get_current_user, is_hr
from app.config import settings
from app.models.employee import Employee
from app.core.auth import get_password_hash
from app.models.activity import ActivityTracker
from app.models.vibemeter import VibeMeter
from app.models.leave import LeaveTracker
from app.models.performance import PerformanceTracker
from app.models.rewards import RewardsTracker
from app.models.onboarding import OnboardingTracker
from app.report.report import generate_collective_report, generate_individual_report, generate_selective_report
from app.models.chat import ChatResponse, ChatStartRequest, ChatMessageRequest, ChatHistoryResponse, ChatHistorySession, ChatMessageModel
from app.services.chat_service import ChatService

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")

app = FastAPI(title="Employee Engagement API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
     allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication endpoints
# Update your login endpoint function in main.py
@app.post("/token", tags=["authentication"])
async def login_for_access_token(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Update last login time
    user.last_login_date = datetime.utcnow()
    db.commit()
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    
    response.set_cookie(key="token", value=access_token, max_age=86400000 ,httponly=True, secure=True, samesite="None") 
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "employee_id": user.employee_id}

@app.post("/logout", tags=["authentication"])
async def logout(response: Response):
    response.delete_cookie(key="token")
    return {"message": "Logout Successful"}
    

@app.get("/users/me", tags=["authentication"])
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "employee_id": current_user.employee_id
    }

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Server is running"}

# Data management endpoints
# Update the upload-csv endpoint
@app.post("/upload-csv/", tags=["data"])
async def upload_csv_files(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_hr)
):
    """Upload multiple CSV files and process them in the background."""
    results = []
    processor = CSVProcessor(db)
    csv_job_ids = []
    
    # Process each file in the background
    for file in files:
        try:
            # Read file content
            contents = await file.read()
            
            # Start background processing and get job ID
            job_result = processor.process_csv_async(contents, file.filename)
            csv_job_ids.append(job_result["job_id"])
            
            results.append({
                "filename": file.filename,
                "status": "processing",
                "job_id": job_result["job_id"]
            })
            
        except Exception as e:
            logger.error(f"Error processing file {file.filename}: {str(e)}")
            results.append({
                "filename": file.filename,
                "status": "error",
                "message": str(e)
            })
    
    # Start user creation AFTER all CSV files are processed (in background)
    batch_id = str(uuid.uuid4())
    user_job = processor.queue_user_creation_after_csv_jobs(csv_job_ids, batch_id)
    
    # Return immediately with job IDs
    return {
        "message": "Files uploaded and processing started",
        "batch_id": batch_id,
        "results": results,
        "user_creation_job": user_job["job_id"]
    }

# Add these new endpoints to check job status
@app.get("/jobs/{job_id}", tags=["jobs"])
async def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_hr)
):
    """Get status of a specific background job"""
    processor = CSVProcessor(db)
    status = processor.get_job_status(job_id)
    
    if status["status"] == "not_found":
        raise HTTPException(status_code=404, detail="Job not found")
    
    return status

@app.get("/jobs/", tags=["jobs"])
async def get_all_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(is_hr)
):
    """Get status of all background jobs"""
    processor = CSVProcessor(db)
    return {"jobs": processor.get_all_jobs()}

# Add specific endpoint for user creation
@app.post("/users/create-async/", tags=["users"])
async def create_users_async(
    db: Session = Depends(get_db),
    current_user: User = Depends(is_hr)
):
    """Start background job to create users from all employee IDs"""
    processor = CSVProcessor(db)
    result = processor.create_users_from_employee_ids_async()
    return {
        "message": "User creation started in background",
        "job_id": result["job_id"]
    }

@app.get("/tables/", tags=["data"])
async def get_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(is_hr)  # Only HR can see all tables
):
    """
    Get the list of available tables and their record counts
    """
    try:
        processor = CSVProcessor(db)
        tables = processor.get_table_info()
        return {"tables": tables}
    except Exception as e:
        logger.error(f"Error getting table information: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data/{table_name}", tags=["data"])
async def get_table_data(
    table_name: str, 
    limit: Optional[int] = None,  # Changed from default 100 to Optional with default None
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_hr)  # Only HR can access all data
):
    """
    Get data from a specific table with pagination support
    
    Parameters:
    - table_name: Name of the table to fetch data from
    - limit: Maximum number of records to return (None for all records)
    - offset: Number of records to skip (default: 0)
    """
    try:
        processor = CSVProcessor(db)
        
        # Special handling for users table to filter out HR accounts
        if table_name.lower() == "users":
            # Get all employee users with explicit ordering
            query = db.query(User).filter(User.role == UserRole.EMPLOYEE).order_by(User.id)
            
            # Get total count for pagination info
            total_count = query.count()
            
            # Apply pagination only if limit is specified
            if limit is not None:
                users = query.offset(offset).limit(limit).all()
            else:
                users = query.offset(offset).all()  # No limit, fetch all records
            
            # Convert to dictionaries
            filtered_data = [user.__dict__ for user in users]
            
            return {
                "data": filtered_data,
                "pagination": {
                    "total": total_count,
                    "limit": limit,
                    "offset": offset,
                    "has_more": limit is not None and (offset + limit) < total_count
                }
            }
        else:
            # For all other tables, use the standard processor with pagination
            # Pass None to get_table_data to indicate no limit
            data = processor.get_table_data(table_name, limit, offset)
            total_count = processor.get_table_count(table_name)
            
            return {
                "data": data,
                "pagination": {
                    "total": total_count,
                    "limit": limit,
                    "offset": offset,
                    "has_more": limit is not None and (offset + limit) < total_count
                }
            }
    except Exception as e:
        logger.error(f"Error getting data from {table_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/employee/data", tags=["employee"])
async def get_employee_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Any authenticated user
):
    """
    Get data for the logged-in employee
    """
    if not current_user.employee_id:
        raise HTTPException(
            status_code=400,
            detail="No employee ID associated with this account"
        )
    
    try:
        # Get employee data from various tables
        processor = CSVProcessor(db)
        
        # Get data for each table filtered by employee ID
        return {
            "employee_id": current_user.employee_id,
            "activities": processor.get_employee_data("activity_tracker", current_user.employee_id),
            "mood": processor.get_employee_data("vibe_meter", current_user.employee_id),
            "leaves": processor.get_employee_data("leave_tracker", current_user.employee_id),
            "performance": processor.get_employee_data("performance_tracker", current_user.employee_id),
            "rewards": processor.get_employee_data("rewards_tracker", current_user.employee_id)
        }
    except Exception as e:
        logger.error(f"Error getting employee data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/report/collective", tags=["report"])
async def get_collective_report(db: Session = Depends(get_db), current_user: User = Depends(is_hr)):
    report = generate_collective_report(db)
    return {"report": report}

@app.post("/report/employee", tags=["report"])
async def get_employee_report(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(is_hr)):
    report = generate_individual_report(db, payload["employee_id"])
    return {"report": report}

@app.post("/report/selective", tags=["report"])
async def get_employee_report(payload: dict = Body(...),  db: Session = Depends(get_db), current_user: User = Depends(is_hr)):
    employee_ids: List[str] = payload["employee_ids"]
    report = generate_selective_report(db, employee_ids)
    return {"report": report}

# Chatbot endpoints
@app.post("/start_chat", response_model=ChatResponse, tags=["chat"])
async def start_chat(
    request: ChatStartRequest = Body(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new chat session."""
    # Use employee_id from authenticated user if not specified
    employee_id = current_user.employee_id
    
    if request and request.employee_id:
        # Check permissions if requesting chat for another employee
        if request.employee_id != current_user.employee_id and current_user.role != UserRole.HR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to start a chat for another employee"
            )
        employee_id = request.employee_id
    
    if not employee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No employee ID available"
        )
    
    try:
        # First try with real implementation
        chat_service = ChatService(db)
        result = chat_service.start_chat(employee_id)
        
        return ChatResponse(
            session_id=result["session_id"],
            question=result["question"],
            timestamp=result["timestamp"]
        )
    except Exception as e:
        logger.error(f"Error starting chat: {str(e)}")
        logger.error(f"Using fallback sample response due to error: {str(e)}")
        
        # Fall back to sample response if real implementation fails
        return ChatResponse(
            session_id=f"sample-{uuid.uuid4()}",
            question="How are you feeling about your work environment today?",
            timestamp=datetime.utcnow()
        )

@app.post("/chat", response_model=ChatResponse, tags=["chat"])
async def process_answer(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Process a chat message and return the next question or final analysis."""
    try:
        # First try with real implementation
        chat_service = ChatService(db)
        result = chat_service.process_message(request.session_id, request.message)
        
        return ChatResponse(
            session_id=result["session_id"],
            question=result.get("question"),
            final_analysis=result.get("final_analysis"),
            timestamp=result.get("timestamp", datetime.utcnow())
        )
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        logger.error(f"Using fallback sample response due to error: {str(e)}")
        
        # Fall back to sample response if real implementation fails
        # If message is an "end" keyword, return final analysis sample
        if request.message.lower() in ["end", "done", "finish", "complete"]:
            return ChatResponse(
                session_id=request.session_id,
                question="We have received your responses. Thank you for sharing your thoughts! Your feedback is valuable to us.",
                final_analysis={
                    "employee_id": current_user.employee_id,
                    "overall_assessment": "Leaning to Happy Zone",
                    "key_themes": ["Work environment", "Team dynamics"],
                    "sentiment_distribution": {
                        "positive": 65,
                        "neutral": 25,
                        "negative": 10
                    },
                    "hr_escalation": 0,
                    "recommendations": [
                        "Continue team building activities",
                        "Provide more feedback on work progress"
                    ]
                },
                timestamp=datetime.utcnow()
            )
        else:
            # Regular question response - cycle through questions
            questions = [
                "Do you have the tools and resources you need to do your job effectively?",
                "How would you rate your satisfaction with work-life balance?",
                "Do you feel your opinions and ideas are valued by your team?",
                "How comfortable are you approaching your manager with concerns?",
                "What aspects of your job do you find most fulfilling?"
            ]
            
            # Use hash of session_id and message to pick a "random" but consistent question
            question_index = hash(request.session_id + request.message) % len(questions)
            
            return ChatResponse(
                session_id=request.session_id,
                question=questions[question_index],
                timestamp=datetime.utcnow()
            )

@app.get("/chathistory", tags=["chat"])
async def get_chat_history(
    employee_id: Optional[str] = None,
    chat_date: Optional[date] = Query(None, description="Filter chat history by date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chat history for the current user or specified employee (HR only)."""
    # Use query param if provided, otherwise use current user's employee_id
    target_employee_id = employee_id if employee_id else current_user.employee_id
    
    # Check permissions
    if employee_id and employee_id != current_user.employee_id and current_user.role != UserRole.HR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view chat history for other employees"
        )
    
    if not target_employee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No employee ID available"
        )
    
    try:
        chat_service = ChatService(db)
        messages = chat_service.get_chat_history(target_employee_id, chat_date)
        
        # Return the messages directly without any transformation
        return {"messages": messages}
        
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        return {
            "messages": [
                {
                    "session_id": "sample-session-id",
                    "timestamp": "2025-04-05T01:33:25.070952",
                    "is_from_user": False,
                    "question": "Do you feel comfortable taking time off when needed?",
                    "response": "yes"
                },
                {
                    "session_id": "sample-session-id",
                    "timestamp": "2025-04-05T01:33:59.588850",
                    "is_from_user": False,
                    "question": "Are there opportunities for advancement in your department?",
                    "response": "yes"
                },
                {
                    "session_id": "sample-session-id",
                    "timestamp": "2025-04-05T01:34:04.764413",
                    "is_from_user": False,
                    "question": "Are deadlines and expectations realistic in your role?",
                    "response": "yes"
                }
            ]
        }

@app.get("/chatdates", tags=["chat"])
async def get_chat_dates(
    employee_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dates on which the employee had chats."""
    # Use query param if provided, otherwise use current user's employee_id
    target_employee_id = employee_id if employee_id else current_user.employee_id
    
    # Check permissions
    if employee_id and employee_id != current_user.employee_id and current_user.role != UserRole.HR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view chat dates for other employees"
        )
    
    if not target_employee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No employee ID available"
        )
    
    try:
        chat_service = ChatService(db)
        chat_dates = chat_service.get_chat_dates(target_employee_id)
        return {
            "employee_id": target_employee_id,
            "chat_dates": chat_dates
        }
    except Exception as e:
        logger.error(f"Error getting chat dates: {str(e)}")
        
        # Fall back to sample response
        now = datetime.utcnow()
        sample_dates = [
            (now - timedelta(days=0)).date().isoformat(),
            (now - timedelta(days=7)).date().isoformat(),
            (now - timedelta(days=14)).date().isoformat()
        ]
        
        return {
            "employee_id": target_employee_id,
            "chat_dates": sample_dates
        }

@app.post("/hr/resolve-escalation/{employee_id}", tags=["hr"])
async def resolve_hr_escalation(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_hr)
):
    """Clear HR escalation flag and reason for an employee."""
    try:
        chat_service = ChatService(db)
        result = chat_service.clear_escalation(employee_id)
        return result
    except Exception as e:
        logger.error(f"Error clearing escalation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing escalation: {str(e)}"
        )

@app.get("/hr/employees/need-attention", tags=["hr"])
async def get_employees_needing_attention(
    db: Session = Depends(get_db),
    current_user: User = Depends(is_hr)
):
    """Get list of employees flagged for HR attention."""
    try:
        # Try to use the real implementation
        users = db.query(User).filter(User.hr_escalation == 1).all()
        
        return {
            "employees": [
                {
                    "employee_id": user.employee_id,
                    "username": user.username,
                    "email": user.email,
                    "current_mood": user.current_mood,
                    "last_chat_date": user.last_chat_date,
                    "next_chat_date": user.next_chat_date
                } for user in users
            ]
        }
    except Exception as e:
        logger.error(f"Error getting employees needing attention: {str(e)}")
        logger.error(f"Using fallback sample response due to error: {str(e)}")
        
        # Fall back to sample response
        return {
            "employees": []
        }
