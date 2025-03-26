import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
import logging
from datetime import datetime
from typing import Dict, Any, List
import re
import os

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
            "vibe_meter": VibeMeter
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
    
    def get_table_data(self, table_name: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get data from a specific table
        """
        if table_name not in self.table_models:
            raise ValueError(f"Unknown table: {table_name}")
        
        model = self.table_models[table_name]
        records = self.db.query(model).limit(limit).all()
        
        # Convert to dict
        result = []
        for record in records:
            item = {}
            for column in inspect(model).c.keys():
                item[column] = getattr(record, column)
            result.append(item)
            
        return result
    
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
        
        # Create user accounts and employee records
        from app.models.user import User
        from app.models.employee import Employee
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
