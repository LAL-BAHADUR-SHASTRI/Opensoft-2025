from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
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
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_hr)  # Only HR can upload CSVs
):
    """
    Upload multiple CSV files and process them based on headers.
    After processing, automatically create User accounts for all employee_ids.
    """
    results = []
    processor = CSVProcessor(db)
    
    # Process all CSV files
    for file in files:
        try:
            # Save file temporarily
            file_location = f"temp_{file.filename}"
            with open(file_location, "wb") as buffer:
                contents = await file.read()
                buffer.write(contents)
            
            # Process the file
            df = pd.read_csv(file_location)
            
            # Process the DataFrame based on its headers
            result = processor.process_csv(df, file.filename)
            results.append({
                "filename": file.filename,
                "status": "success" if result["success"] else "error",
                "table": result.get("table", None),
                "message": result.get("message", ""),
                "records_added": result.get("records_added", 0)
            })
            
            # Remove the temporary file
            os.remove(file_location)
            
        except Exception as e:
            logger.error(f"Error processing file {file.filename}: {str(e)}")
            results.append({
                "filename": file.filename,
                "status": "error",
                "message": str(e)
            })
            # Clean up if file was created
            if os.path.exists(f"temp_{file.filename}"):
                os.remove(f"temp_{file.filename}")
    
    # After all files are processed, extract employee IDs and create users
    try:
        # Get all tables that have employee_id column
        unique_employee_ids = set()
        
        # Query each table model that has an employee_id column
        for table_name, model in processor.table_models.items():
            if hasattr(model, 'employee_id'):
                # Extract unique employee_ids
                employee_ids = db.query(model.employee_id).distinct().all()
                for row in employee_ids:
                    if row[0]:  # Skip None values
                        unique_employee_ids.add(row[0])
        
        # Create counts to track what we create
        employees_created = 0
        users_created = 0
        
        # Process each unique employee_id
        for emp_id in unique_employee_ids:
            # Check if Employee record exists
            existing_employee = db.query(Employee).filter(Employee.employee_id == emp_id).first()
            if not existing_employee:
                # Create Employee record with default values
                employee = Employee(
                    employee_id=emp_id,
                    name=f"Employee {emp_id}",  # Default name
                    department="Unassigned"     # Default department
                )
                db.add(employee)
                employees_created += 1
            
            # Check if User record exists with this employee_id
            existing_user = db.query(User).filter(User.employee_id == emp_id).first()
            if not existing_user:
                # Create User record for authentication
                user = User(
                    email=f"{emp_id.lower()}@example.com",  # Default email
                    username=emp_id.lower(),               # Username = employee_id (lowercase)
                    hashed_password=get_password_hash(emp_id.lower()),  # Password = employee_id
                    role=UserRole.EMPLOYEE,
                    employee_id=emp_id
                )
                db.add(user)
                users_created += 1
        
        # Commit all changes
        db.commit()
        
        # Add results
        results.append({
            "status": "success",
            "message": f"User accounts created: {users_created}, employee records created: {employees_created}",
            "unique_employee_ids": len(unique_employee_ids)
        })
        
    except Exception as e:
        logger.error(f"Error creating user accounts: {str(e)}")
        results.append({
            "status": "error",
            "message": f"Error creating user accounts: {str(e)}"
        })
    
    return {"results": results}

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