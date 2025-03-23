import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
import logging
from datetime import datetime
from typing import Dict, Any, List
import os

# Import models
from app.models.activity import ActivityTracker
from app.models.vibemeter import VibeMeter
from app.models.leave import LeaveTracker
from app.models.performance import PerformanceTracker
from app.models.rewards import RewardsTracker
from app.models.employee import Employee
from app.models.onboarding import OnboardingTracker

logger = logging.getLogger(__name__)

class CSVProcessor:
    def __init__(self, db: Session):
        self.db = db
        
        # Map filenames to tables
        self.filename_to_table = {
            "activity_tracker_dataset": "activity_tracker",
            "vibemeter_dataset": "vibe_meter",
            "leave_dataset": "leave_tracker",
            "performance_dataset": "performance_tracker", 
            "rewards_dataset": "rewards_tracker",
            "onboarding_dataset": "onboarding_tracker"
        }
        
        # Define header mappings for each file type
        self.header_mappings = {
            "activity_tracker": {
                "Employee_ID": "employee_id",
                "Teams_Messages_Sent": "teams_messages",
                "Emails_Sent": "emails",
                "Meetings_Attended": "meetings",
                "Work_Hours": "hours"
            },
            "vibe_meter": {
                "Employee_ID": "employee_id",
                "Response_Date": "date",
                "Vibe_Score": "score",
                "Emotion_Zone": "emotion"
            },
            "leave_tracker": {
                "Employee_ID": "employee_id",
                "Leave_Type": "leave_type",
                "Leave_Days": "days",
                "Leave_Start_Date": "start_date",
                "Leave_End_Date": "end_date"
            },
            "performance_tracker": {
                "Employee_ID": "employee_id",
                "Review_Period": "period",
                "Performance_Rating": "rating",
                "Manager_Feedback": "feedback",
                "Promotion_Consideration": "promotion_eligible"
            },
            "rewards_tracker": {
                "Employee_ID": "employee_id",
                "Award_Type": "reward_type",
                "Award_Date": "date",
                "Reward_Points": "points"
            },
            "onboarding_tracker": {
                "Employee_ID": "employee_id",
                "Joining_Date": "join_date",
                "Onboarding_Feedback": "feedback", 
                "Mentor_Assigned": "mentor",
                "Initial_Training_Completed": "training_completed"
            }
        }
        
        # Map tables to their model classes
        self.table_models = {
            "activity_tracker": ActivityTracker,
            "vibe_meter": VibeMeter,
            "leave_tracker": LeaveTracker,
            "performance_tracker": PerformanceTracker,
            "rewards_tracker": RewardsTracker,
            "employee": Employee,
            "onboarding_tracker": OnboardingTracker
        }
    
    def process_csv(self, df: pd.DataFrame, filename: str) -> Dict[str, Any]:
        """
        Process a CSV file and insert its data into the appropriate table
        based on header detection and/or filename
        """
        # Get the headers from the DataFrame
        headers = list(df.columns)
        
        # Extract the base filename without extension
        base_filename = os.path.splitext(os.path.basename(filename))[0]
        
        # First try to identify table by filename
        table_name = None
        for file_pattern, table in self.filename_to_table.items():
            if file_pattern in base_filename:
                table_name = table
                break
        
        # If not found by filename, try header matching as fallback
        if not table_name:
            logger.warning(f"Could not identify table for file {filename} by name, trying headers")
            table_name = self._identify_table_by_headers(headers)
        
        if not table_name:
            return {
                "success": False,
                "message": f"Could not identify table for headers: {headers}"
            }
        
        # Process and insert the data
        try:
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
    
    def _identify_table_by_headers(self, headers: List[str]) -> str:
        """
        Fallback method to identify table by headers when filename doesn't match
        """
        # Implement if needed, but primary identification should be by filename
        return None
    
    def _insert_data(self, df: pd.DataFrame, table_name: str) -> int:
        """
        Insert data from DataFrame into the specified table
        Returns the number of records added
        """
        model_class = self.table_models[table_name]
        records_added = 0
        
        # Get the mapping for this table's headers
        header_mapping = self.header_mappings.get(table_name, {})
        
        # Process each row and insert
        for _, row in df.iterrows():
            # Convert row to dict
            row_dict = row.to_dict()
            
            # Apply header mappings and handle field conversion
            processed_row = {}
            for key, value in row_dict.items():
                # Skip null/NaN values
                if pd.isna(value):
                    continue
                    
                # Use explicit mapping if available
                if key in header_mapping:
                    processed_key = header_mapping[key]
                else:
                    # Convert snake case properly (fix the double underscore issue)
                    # This replaces the previous incorrect conversion
                    processed_key = key.lower().replace(" ", "_")
                    
                processed_row[processed_key] = value
            
            try:
                # Create model instance
                db_model = model_class(**processed_row)
                self.db.add(db_model)
                records_added += 1
            except Exception as e:
                logger.error(f"Error inserting row: {str(e)}, data: {processed_row}")
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