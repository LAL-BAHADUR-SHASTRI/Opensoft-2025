from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, BackgroundTasks, Response, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import pandas as pd
import logging
from typing import List
import os
from datetime import datetime, timedelta
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
     allow_origins=["http://localhost:5173"], 
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
    
    response.set_cookie(key="token", value=access_token, httponly=True, secure=True, samesite="None") 
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
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(is_hr)  # Only HR can access all data
):
    """
    Get data from a specific table
    """
    try:
        processor = CSVProcessor(db)
        data = processor.get_table_data(table_name, limit)
        return {"data": data}
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