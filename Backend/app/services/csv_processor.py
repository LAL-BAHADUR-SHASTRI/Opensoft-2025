import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text, func, create_engine
import logging
from datetime import datetime
from typing import Dict, Any, List
import re
import os
import threading
import uuid
import multiprocessing
from functools import partial
from concurrent.futures import ProcessPoolExecutor, as_completed
from contextlib import contextmanager
from sqlalchemy.orm import sessionmaker
from app.config import settings

from app.core.database import Base, engine

# Import models
from app.models.activity import ActivityTracker
from app.models.vibemeter import VibeMeter
from app.models.leave import LeaveTracker
from app.models.performance import PerformanceTracker
from app.models.rewards import RewardsTracker
from app.models.employee import Employee
from app.models.onboarding import OnboardingTracker
from app.core.auth import get_password_hash
from app.models.user import User, UserRole  # Add User model import

# Add this global dictionary to track background jobs
background_jobs = {}

logger = logging.getLogger(__name__)

class CSVProcessor:
    def __init__(self, db: Session):
        self.db = db
        
        # Define exact headers from the CSV files
        self.table_headers = {
            "activity_tracker": ["Employee_ID", "Date", "Teams_Messages", "Emails_Sent", "Meetings_Attended", "Work_Hours"],
            "leave_tracker": ["Employee_ID", "Leave_Type", "Leave_Days", "Leave_Start_Date", "Leave_End_Date"],
            "onboarding_tracker": ["Employee_ID", "Joining_Date", "Onboarding_Feedback", "Mentor_Assigned", "Initial_Training_Completed"],
            "performance_tracker": ["Employee_ID", "Review_Period", "Performance_Rating", "Manager_Feedback", "Promotion_Consideration"],
            "rewards_tracker": ["Employee_ID", "Award_Type", "Award_Date", "Reward_Points"],
            "vibe_meter": ["Employee_ID", "Response_Date", "Vibe_Score", "Emotion_Zone"]
        }
        
        # Column mappings to transform CSV headers to model fields
        self.column_mappings = {
            "activity_tracker": {
                "Employee_ID": "employee_id",
                "Date": "date",
                "Teams_Messages": "teams_messages_sent",
                "Emails_Sent": "emails_sent",
                "Meetings_Attended": "meetings_attended",
                "Work_Hours": "work_hours"
            },
            "leave_tracker": {
                "Employee_ID": "employee_id",
                "Leave_Type": "leave_type",
                "Leave_Days": "days",
                "Leave_Start_Date": "start_date",
                "Leave_End_Date": "end_date",
                "Status": "status" # This might be missing in your CSV
            },
            "onboarding_tracker": {
                "Employee_ID": "employee_id",
                "Joining_Date": "joining_date",
                "Onboarding_Feedback": "onboarding_feedback",
                "Mentor_Assigned": "mentor_assigned",
                "Initial_Training_Completed": "initial_training_completed"
            },
            "performance_tracker": {
                "Employee_ID": "employee_id",
                "Review_Period": "review_date",
                "Performance_Rating": "rating",
                "Manager_Feedback": "comments",
                "Promotion_Consideration": "manager_id" # Using this field for compatibility
            },
            "rewards_tracker": {
                "Employee_ID": "employee_id",
                "Award_Type": "reward_type",
                "Award_Date": "date",
                "Reward_Points": "amount" # Map points to amount
            },
            "vibe_meter": {
                "Employee_ID": "employee_id", 
                "Response_Date": "date",
                "Vibe_Score": "mood_score",
                "Emotion_Zone": "comments"
            }
        }
        
        # Map tables to model classes
        self.table_models = {
            "activity_tracker": ActivityTracker,
            "leave_tracker": LeaveTracker,
            "onboarding_tracker": OnboardingTracker,
            "performance_tracker": PerformanceTracker,
            "rewards_tracker": RewardsTracker,
            "vibe_meter": VibeMeter,
            "users": User,
        }
    
    def ensure_tables_exist(self):
        """Ensure all database tables exist before attempting inserts"""
        logger.info("Ensuring all database tables exist...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created")
        
    def process_csv(self, df: pd.DataFrame, filename: str) -> Dict[str, Any]:
        """Process a CSV file and insert data into the appropriate table"""
        # Get the headers from the DataFrame
        self.ensure_tables_exist()

        headers = list(df.columns)
        
        # Identify which table this belongs to
        table_name = self._identify_table(headers)
        
        if not table_name:
            return {
                "success": False,
                "message": f"Could not identify table for headers: {headers}"
            }
        
        # Process and insert the data
        try:
            # First handle date columns and convert to proper format
            for col in df.columns:
                if 'date' in col.lower() or 'period' in col.lower():
                    df[col] = pd.to_datetime(df[col], errors='coerce')
                    
            records_added = self._insert_data(df, table_name)
            return {
                "success": True,
                "table": table_name,
                "message": f"Successfully added data to {table_name}",
                "records_added": records_added
            }
        except Exception as e:
            logger.error(f"Error inserting data into {table_name}: {str(e)}")
            return {
                "success": False,
                "table": table_name,
                "message": f"Error: {str(e)}"
            }
    
    def process_csv_background(self, df: pd.DataFrame, filename: str) -> Dict[str, Any]:
        """
        Process a CSV file in the background and return immediate response.
        The actual processing continues after the response is sent.
        """
        # Get the headers from the DataFrame
        self.ensure_tables_exist()
        headers = list(df.columns)
        
        # Identify which table this belongs to
        table_name = self._identify_table(headers)
        
        if not table_name:
            return {
                "success": False,
                "message": f"Could not identify table for headers: {headers}",
                "status": "failed"
            }
        
        # Return immediate response that processing has started
        return {
            "success": True,
            "table": table_name,
            "message": f"Processing started for {filename} into {table_name}",
            "status": "processing"
        }

    def process_csv_async(self, file_content, filename):
        """Process CSV file asynchronously and track with job ID"""
        job_id = str(uuid.uuid4())
        
        def background_task():
            try:
                # Create a new session for this thread
                from app.core.database import SessionLocal
                db = SessionLocal()
                
                # Create a processor with the new session
                processor = CSVProcessor(db)
                
                # Read the CSV content
                import io
                df = pd.read_csv(io.StringIO(file_content.decode('utf-8')))
                
                # Process date columns
                for col in df.columns:
                    if 'date' in col.lower() or 'period' in col.lower():
                        try:
                            df[col] = pd.to_datetime(df[col], errors='coerce')
                        except Exception as e:
                            logger.error(f"Error converting dates in {col}: {str(e)}")
                
                # Identify table and insert data
                table_name = processor._identify_table(list(df.columns))
                if not table_name:
                    background_jobs[job_id] = {
                        "status": "failed",
                        "message": f"Could not identify table for file: {filename}",
                        "completed_at": datetime.now().isoformat()
                    }
                    return
                
                # Insert the data
                records_added = processor._insert_data(df, table_name)
                
                # Update job status
                background_jobs[job_id] = {
                    "status": "completed",
                    "table": table_name,
                    "records_added": records_added,
                    "filename": filename,
                    "completed_at": datetime.now().isoformat()
                }
                
                logger.info(f"Background job completed: {filename}, added {records_added} records to {table_name}")
                
                # Close the session
                db.close()
                
            except Exception as e:
                logger.error(f"Background job failed for {filename}: {str(e)}")
                background_jobs[job_id] = {
                    "status": "failed",
                    "message": str(e),
                    "filename": filename,
                    "completed_at": datetime.now().isoformat()
                }
        
        # Initialize job status
        background_jobs[job_id] = {
            "status": "processing",
            "filename": filename,
            "started_at": datetime.now().isoformat()
        }
        
        # Start background thread
        thread = threading.Thread(target=background_task)
        thread.daemon = True
        thread.start()
        
        return {"job_id": job_id, "status": "processing", "filename": filename}
    
    def create_users_from_employee_ids(self):
        """Create user accounts for all employee IDs in the database"""
        logger.info("Creating user accounts for all employee IDs...")
        
        # Get unique employee IDs from all tables
        unique_employee_ids = set()
        
        for table_name, model in self.table_models.items():
            if hasattr(model, 'employee_id'):
                # Get all unique employee IDs from this table
                employee_ids = self.db.query(model.employee_id).distinct().all()
                for record in employee_ids:
                    if record[0]:  # Skip None values
                        unique_employee_ids.add(record[0])
        
        logger.info(f"Found {len(unique_employee_ids)} unique employee IDs")
        
        if not unique_employee_ids:
            logger.warning("No employee IDs found in any tables.")
            return {"employees_created": 0, "users_created": 0, "message": "No employee IDs found"}
        
        # Check for existing employees and users to avoid creating duplicates
        from app.models.user import User
        from app.models.employee import Employee
        
        existing_employees = {e.employee_id for e in self.db.query(Employee.employee_id).all() if e.employee_id}
        existing_users = {u.employee_id for u in self.db.query(User.employee_id).all() if u.employee_id}
        
        # Filter out employee IDs that already have records
        employees_to_create = unique_employee_ids - existing_employees
        users_to_create = unique_employee_ids - existing_users
        
        logger.info(f"Found {len(employees_to_create)} employees and {len(users_to_create)} users to create")
        
        # Process them with multiprocessing if enough records
        if len(employees_to_create) > 50 or len(users_to_create) > 50:
            # Get database URL for worker processes
            from app.config import settings
            db_url = settings.DATABASE_URL
            
            # Determine optimal batch size and worker count
            cpu_count = multiprocessing.cpu_count()
            logger.info(f"Detected {cpu_count} CPU cores")
            worker_count = min(cpu_count, 18)  # Limit to avoid database connection issues
            
            # Create batches of IDs to process
            all_ids_to_process = list(unique_employee_ids)
            batch_size = max(50, len(all_ids_to_process) // worker_count)
            batches = [all_ids_to_process[i:i + batch_size] for i in range(0, len(all_ids_to_process), batch_size)]
            
            logger.info(f"Processing {len(unique_employee_ids)} IDs in {len(batches)} batches using {worker_count} workers")
            
            # Process batches in parallel
            total_employees_created = 0
            total_users_created = 0
            
            with ProcessPoolExecutor(max_workers=worker_count) as executor:
                futures = []
                for batch in batches:
                    # Create a tuple of (batch, existing_employees, existing_users, db_url)
                    futures.append(executor.submit(
                        self._process_user_creation_batch, 
                        batch, 
                        list(existing_employees), 
                        list(existing_users), 
                        db_url
                    ))
                
                # Collect results
                for future in as_completed(futures):
                    try:
                        result = future.result()
                        total_employees_created += result['employees_created']
                        total_users_created += result['users_created']
                    except Exception as e:
                        logger.error(f"Error in worker process: {str(e)}")
            
            logger.info(f"Created {total_employees_created} employee records and {total_users_created} user accounts using multiprocessing")
            return {"employees_created": total_employees_created, "users_created": total_users_created}
            
        else:
            # For small batches, process sequentially to avoid multiprocessing overhead
            from app.core.auth import get_password_hash
            
            users_created = 0
            employees_created = 0
            
            for emp_id in unique_employee_ids:
                # Check if Employee record exists
                existing_employee = self.db.query(Employee).filter(Employee.employee_id == emp_id).first()
                if not existing_employee:
                    employee = Employee(
                        employee_id=emp_id,
                        name=f"Employee {emp_id}",
                        department="Unassigned"
                    )
                    self.db.add(employee)
                    employees_created += 1
                
                # Check if User record exists
                existing_user = self.db.query(User).filter(User.employee_id == emp_id).first()
                if not existing_user:
                    user = User(
                        email=f"{emp_id.lower()}@example.com",
                        username=emp_id.lower(),
                        hashed_password=get_password_hash(emp_id.lower()),
                        role="employee",
                        employee_id=emp_id
                    )
                    self.db.add(user)
                    users_created += 1
            
            # Commit changes
            self.db.commit()
            
            logger.info(f"Created {employees_created} employee records and {users_created} user accounts")
            return {"employees_created": employees_created, "users_created": users_created}
    
    def create_users_from_employee_ids_async(self):
        """Create users from all employee IDs in a background job"""
        job_id = str(uuid.uuid4())
        
        # Start the background task
        background_tasks.add_task(
            self._create_users_from_employee_ids_task, 
            job_id=job_id
        )
        
        return {"job_id": job_id}
    
    async def _create_users_from_employee_ids_task(self, job_id):
        """Background task to create users from all employee IDs using multiprocessing"""
        self.logger.info(f"Starting job {job_id}: Creating users from employee IDs")
        
        try:
            # Create a job record
            job = BackgroundJob(
                id=job_id,
                job_type="create_users",
                status=JobStatus.RUNNING,
                start_time=datetime.now()
            )
            self.db.add(job)
            self.db.commit()
            
            # Get all employee IDs from the database
            employees = self.db.query(Employee).all()
            total_count = len(employees)
            
            if total_count == 0:
                self.logger.warning("No employee records found in database")
                self._update_job_status(job_id, JobStatus.COMPLETED, f"No employee records found")
                return
            
            self.logger.info(f"Found {total_count} employee records")
            
            # Get all existing users to avoid duplicates
            existing_users = self.db.query(User.employee_id).all()
            existing_ids = set([u[0] for u in existing_users])
            
            # Filter employees that don't have users yet
            employees_to_process = [e for e in employees if e.employee_id not in existing_ids]
            
            if not employees_to_process:
                self.logger.info("All employees already have user accounts")
                self._update_job_status(job_id, JobStatus.COMPLETED, f"All employees already have user accounts")
                return
            
            self.logger.info(f"Creating users for {len(employees_to_process)} employees")
            
            # Set up progress tracking
            total = len(employees_to_process)
            created_count = 0
            error_count = 0
            
            # Split employees into chunks for parallel processing
            chunk_size = max(1, total // (multiprocessing.cpu_count() * 2))
            employee_chunks = [employees_to_process[i:i+chunk_size] for i in range(0, total, chunk_size)]
            
            # Create a database URL without the SQLAlchemy connection info for worker processes
            db_url = settings.DATABASE_URL
            
            # Process chunks in parallel
            with ProcessPoolExecutor(max_workers=multiprocessing.cpu_count()) as executor:
                # Create partial function with database URL
                process_chunk_fn = partial(self._process_employee_chunk, db_url=db_url)
                
                # Submit all chunks for processing
                futures = {executor.submit(process_chunk_fn, chunk): i for i, chunk in enumerate(employee_chunks)}
                
                # Process results as they complete
                for future in as_completed(futures):
                    chunk_result = future.result()
                    created_count += chunk_result['created']
                    error_count += chunk_result['errors']
                    
                    # Update progress
                    progress = int((created_count + error_count) / total * 100)
                    self._update_job_status(
                        job_id, 
                        JobStatus.RUNNING, 
                        f"Progress: {progress}%. Created: {created_count}, Errors: {error_count}"
                    )
            
            # Job completed
            self._update_job_status(
                job_id, 
                JobStatus.COMPLETED,
                f"Created {created_count} users with {error_count} errors"
            )
            
        except Exception as e:
            self.logger.error(f"Error in job {job_id}: {str(e)}")
            self._update_job_status(job_id, JobStatus.FAILED, str(e))
    
    @staticmethod
    def _process_user_creation_batch(employee_ids, existing_employees, existing_users, db_url):
        """Process a batch of employee IDs to create users and employees in a worker process"""
        # Import needed modules in the worker process
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from app.models.user import User
        from app.models.employee import Employee
        from app.core.auth import get_password_hash
        import logging
        
        logger = logging.getLogger(__name__)
        
        logger.info(f"Processing batch of {len(employee_ids)} employee IDs")
        # Convert lists back to sets for faster lookups
        existing_employees_set = set(existing_employees)
        existing_users_set = set(existing_users)
        
        # Create a new database connection for this process
        engine = create_engine(db_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        employees_created = 0
        users_created = 0
        
        with SessionLocal() as db:
            try:
                for emp_id in employee_ids:
                    # Check if Employee record exists
                    if emp_id not in existing_employees_set:
                        employee = Employee(
                            employee_id=emp_id,
                            name=f"Employee {emp_id}",
                            department="Unassigned"
                        )
                        db.add(employee)
                        employees_created += 1
                    
                    # Check if User record exists
                    if emp_id not in existing_users_set:
                        user = User(
                            email=f"{emp_id.lower()}@example.com",
                            username=emp_id.lower(),
                            hashed_password=get_password_hash(emp_id.lower()),
                            role="employee",
                            employee_id=emp_id
                        )
                        db.add(user)
                        users_created += 1
                
                # Commit all changes at once for this batch
                db.commit()
                
            except Exception as e:
                logger.error(f"Error processing user creation batch: {str(e)}")
                db.rollback()
                raise
                
        return {
            "employees_created": employees_created,
            "users_created": users_created
        }
    
    def _update_job_status(self, job_id, status, message=None):
        """Update the status and message of a background job"""
        try:
            job = self.db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
            if job:
                job.status = status
                if message:
                    job.message = message
                if status in [JobStatus.COMPLETED, JobStatus.FAILED]:
                    job.end_time = datetime.now()
                self.db.commit()
        except Exception as e:
            self.logger.error(f"Error updating job {job_id} status: {str(e)}")
    
    def get_job_status(self, job_id):
        """Get the status of a background job"""
        if job_id in background_jobs:
            return background_jobs[job_id]
        return {"status": "not_found", "message": "Job not found"}
    
    def get_all_jobs(self):
        """Get status of all background jobs"""
        return background_jobs

    def _identify_table(self, headers: List[str]) -> str:
        """Identify the table based on headers"""
        best_match = None
        best_match_score = 0
        
        for table_name, expected_headers in self.table_headers.items():
            # Calculate match score (number of matching headers)
            match_score = sum(1 for h in headers if h in expected_headers)
            match_percentage = match_score / len(expected_headers)
            
            # If we have a better match, update
            if match_percentage > 0.7 and match_percentage > best_match_score:
                best_match = table_name
                best_match_score = match_percentage
        
        return best_match
    
    def _insert_data(self, df: pd.DataFrame, table_name: str) -> int:
        """Insert data into the table with proper column mappings"""
        model_class = self.table_models[table_name]
        column_map = self.column_mappings[table_name]
        records_added = 0
        
        # Process each row and insert
        for _, row in df.iterrows():
            try:
                # Map CSV columns to model fields
                processed_row = {}
                for csv_col, value in row.items():
                    if csv_col in column_map:
                        model_field = column_map[csv_col]
                        
                        # Handle date fields
                        if 'date' in model_field.lower() or model_field == 'review_date':
                            if pd.notna(value):
                                processed_row[model_field] = value
                        else:
                            processed_row[model_field] = value
                
                # Add default values for missing fields
                if table_name == "leave_tracker" and "status" not in processed_row:
                    processed_row["status"] = "Approved"
                
                # Create model instance
                db_model = model_class(**processed_row)
                self.db.add(db_model)
                records_added += 1
                
                # Commit in batches to avoid memory issues
                if records_added % 100 == 0:
                    self.db.flush()
                
            except Exception as e:
                logger.error(f"Error processing row: {str(e)}")
                raise
        
        # Commit all changes
        self.db.commit()
        return records_added
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse date strings in various formats"""
        try:
            # Try different date formats
            for fmt in ('%m/%d/%Y', '%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y'):
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
            
            # If we get here, none of the formats worked
            raise ValueError(f"Could not parse date: {date_str}")
        except Exception as e:
            logger.error(f"Error parsing date {date_str}: {str(e)}")
            # Return a default date if parsing fails
            return datetime.now()
    
    def get_table_info(self) -> List[Dict[str, Any]]:
        """
        Get information about all tables in the database
        """
        tables = []
        
        for table_name, model in self.table_models.items():
            try:
                # Count records in table
                count = self.db.query(model).count()
                tables.append({
                    "name": table_name,
                    "record_count": count,
                    "columns": self.table_headers[table_name]
                })
            except Exception as e:
                logger.error(f"Error getting info for table {table_name}: {str(e)}")
                tables.append({
                    "name": table_name,
                    "error": str(e)
                })
        
        return tables
    
    def get_table_data(self, table_name, limit=None, offset=0):
        """Get data from a table with pagination"""
        try:
            # Get the SQLAlchemy model for the table
            model = self._get_model_from_table_name(table_name)
            
            # Build query with ordering
            query = self.db.query(model).order_by(model.id)
            
            # Apply pagination only if limit is specified
            if limit is not None:
                query = query.offset(offset).limit(limit)
            else:
                query = query.offset(offset)  # No limit, fetch all after offset
                
            # Execute query and convert results to dictionaries
            results = query.all()
            return [row.__dict__ for row in results]
        except Exception as e:
            self.logger.error(f"Error getting data from {table_name}: {str(e)}")
            raise

    def get_table_count(self, table_name: str):
        """
        Get the total number of records in a table
        """
        table_class = self.get_table_class(table_name)
        if not table_class:
            raise ValueError(f"Table {table_name} not found")
        
        return self.db.query(func.count()).select_from(table_class).scalar()

    def get_employee_data(self, table_name: str, employee_id: str) -> List[Dict[str, Any]]:
        """
        Get data for a specific employee from a table
        """
        if table_name not in self.table_models:
            raise ValueError(f"Unknown table: {table_name}")
        
        model = self.table_models[table_name]
        
        # Get all records for this employee
        records = self.db.query(model).filter(model.employee_id == employee_id).all()
        
        # Convert to dict
        result = []
        for record in records:
            item = {}
            for column in inspect(model).c.keys():
                item[column] = getattr(record, column)
            result.append(item)
            
        return result
    
    def queue_user_creation_after_csv_jobs(self, csv_job_ids, batch_id):
        """Queue user creation to run after all CSV jobs complete"""
        job_id = str(uuid.uuid4())
        
        def wait_and_create_users():
            try:
                # Create a new session for this thread
                from app.core.database import SessionLocal
                db = SessionLocal()
                
                # First, wait for all CSV jobs to complete
                logger.info(f"Waiting for {len(csv_job_ids)} CSV jobs to complete before creating users")
                
                # Update job status to waiting
                background_jobs[job_id] = {
                    "status": "waiting",
                    "message": f"Waiting for {len(csv_job_ids)} CSV jobs to complete",
                    "csv_jobs": csv_job_ids,
                    "batch_id": batch_id,
                    "started_at": datetime.now().isoformat()
                }
                
                # Check if all CSV jobs are complete
                all_complete = False
                max_wait_time = 300  # Maximum wait time in seconds
                wait_start = datetime.now()
                
                while not all_complete:
                    # Check if we've waited too long
                    wait_duration = (datetime.now() - wait_start).total_seconds()
                    if wait_duration > max_wait_time:
                        logger.warning(f"Timed out waiting for CSV jobs after {wait_duration} seconds")
                        background_jobs[job_id] = {
                            "status": "failed",
                            "message": f"Timed out waiting for CSV jobs after {wait_duration} seconds",
                            "csv_jobs": csv_job_ids,
                            "completed_at": datetime.now().isoformat()
                        }
                        return
                    
                    # Check status of all CSV jobs
                    completed_jobs = 0
                    failed_jobs = 0
                    
                    for csv_job_id in csv_job_ids:
                        if csv_job_id in background_jobs:
                            job_status = background_jobs[csv_job_id]["status"]
                            if job_status == "completed":
                                completed_jobs += 1
                            elif job_status == "failed":
                                failed_jobs += 1
                    
                    # If all jobs have a final status, we can proceed
                    if completed_jobs + failed_jobs == len(csv_job_ids):
                        all_complete = True
                        logger.info(f"All CSV jobs complete: {completed_jobs} succeeded, {failed_jobs} failed")
                    else:
                        # Wait a bit before checking again
                        import time
                        time.sleep(2)
                
                # Update status to processing before starting user creation
                background_jobs[job_id] = {
                    "status": "processing",
                    "message": "Creating users from employee IDs",
                    "csv_jobs_completed": completed_jobs,
                    "csv_jobs_failed": failed_jobs,
                    "batch_id": batch_id
                }
                
                # Now create the users
                processor = CSVProcessor(db)
                
                try:
                    # Use the existing method that implements multiprocessing
                    result = processor.create_users_from_employee_ids()
                    
                    # Update job status
                    background_jobs[job_id] = {
                        "status": "completed",
                        "result": result,
                        "completed_at": datetime.now().isoformat(),
                        "batch_id": batch_id
                    }
                    
                    logger.info(f"Created {result['employees_created']} employee records and {result['users_created']} user accounts")
                    
                except Exception as e:
                    logger.error(f"Error in user creation process: {str(e)}")
                    background_jobs[job_id] = {
                        "status": "failed",
                        "error": str(e),
                        "completed_at": datetime.now().isoformat(),
                        "batch_id": batch_id
                    }
                    # Rollback in case of error
                    db.rollback()
                
                finally:
                    # Always close the session
                    db.close()
                    
            except Exception as e:
                logger.error(f"Failed to create database session: {str(e)}")
                background_jobs[job_id] = {
                    "status": "failed",
                    "error": f"Database connection error: {str(e)}",
                    "completed_at": datetime.now().isoformat(),
                    "batch_id": batch_id
                }
        
        # Initialize job status
        background_jobs[job_id] = {
            "status": "queued",
            "message": "Waiting for CSV processing to complete",
            "csv_jobs": csv_job_ids,
            "batch_id": batch_id,
            "queued_at": datetime.now().isoformat()
        }
        
        # Start background thread
        thread = threading.Thread(target=wait_and_create_users)
        thread.daemon = True
        thread.start()
        
        return {"job_id": job_id, "status": "queued", "type": "create_users", "batch_id": batch_id}
    
    def get_table_class(self, table_name: str):
        """Get the model class associated with a table name"""
        table_name_lower = table_name.lower()
        
        # Check direct match
        if table_name_lower in self.table_models:
            return self.table_models[table_name_lower]
            
        # Try pluralization and other common variations
        if table_name_lower.endswith('s') and table_name_lower[:-1] in self.table_models:
            return self.table_models[table_name_lower[:-1]]
            
        # Check for special cases
        special_cases = {
            'employees': 'employee',
            'users': 'users',
            'activities': 'activity_tracker',
            'performances': 'performance_tracker',
            'leaves': 'leave_tracker',
            'rewards': 'rewards_tracker',
            'vibemeter': 'vibe_meter',
            'onboardings': 'onboarding_tracker'
        }
        
        if table_name_lower in special_cases and special_cases[table_name_lower] in self.table_models:
            return self.table_models[special_cases[table_name_lower]]
            
        # If table is not found, return None
        logger.warning(f"Table model not found for: {table_name}")
        return None
