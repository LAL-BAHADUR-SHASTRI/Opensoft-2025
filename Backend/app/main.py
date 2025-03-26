from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import pandas as pd
import logging
from typing import List
import os
from datetime import datetime, timedelta

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
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
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
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "employee_id": user.employee_id}

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
@app.post("/upload-csv/", tags=["data"])
async def upload_csv_files(
    background_tasks: BackgroundTasks,  # Add this parameter
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_hr)
):
    """Upload multiple CSV files and process them in the background."""
    results = []
    processor = CSVProcessor(db)
    
    # Process each file
    for file in files:
        try:
            # Save file temporarily
            file_location = f"temp_{file.filename}"
            with open(file_location, "wb") as buffer:
                contents = await file.read()
                buffer.write(contents)
            
            # Read the CSV file
            df = pd.read_csv(file_location)
            
            # Get initial response
            result = processor.process_csv_background(df, file.filename)
            
            # Schedule the actual processing in the background
            async def process_file_background(df, filename):
                try:
                    # First handle date columns and convert to proper format
                    for col in df.columns:
                        if 'date' in col.lower() or 'period' in col.lower():
                            df[col] = pd.to_datetime(df[col], errors='coerce')
                    
                    # Do the actual data insertion
                    records_added = processor._insert_data(df, result["table"])
                    logger.info(f"Background task completed: {filename}, added {records_added} records")
                except Exception as e:
                    logger.error(f"Background task error processing {filename}: {str(e)}")
                    
                # Clean up the temporary file
                if os.path.exists(file_location):
                    os.remove(file_location)
            
            # Add the background task
            background_tasks.add_task(process_file_background, df, file.filename)
            
            results.append({
                "filename": file.filename,
                "status": "processing",
                "table": result.get("table", None),
                "message": result.get("message", "")
            })
            
        except Exception as e:
            logger.error(f"Error preparing file {file.filename}: {str(e)}")
            results.append({
                "filename": file.filename,
                "status": "error",
                "message": str(e)
            })
            # Clean up if file was created
            if os.path.exists(f"temp_{file.filename}"):
                os.remove(f"temp_{file.filename}")
    
    # Add a background task for creating users
    async def create_users_background():
        try:
            # Your existing code for extracting employee IDs and creating users
            # [...]
            logger.info("Background task: User creation completed")
        except Exception as e:
            logger.error(f"Background task error creating users: {str(e)}")
    
    background_tasks.add_task(create_users_background)
    
    # Return immediately with processing status
    return {
        "results": results,
        "message": "Files are being processed in the background"
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