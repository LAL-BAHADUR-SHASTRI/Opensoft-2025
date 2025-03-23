import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
import logging
from datetime import datetime
from typing import Dict, Any, List

# Import models
from app.models.activity import ActivityTracker
from app.models.vibemeter import VibeMeter
from app.models.leave import LeaveTracker
from app.models.performance import PerformanceTracker
from app.models.rewards import RewardsTracker
from app.models.employee import Employee

logger = logging.getLogger(__name__)

class CSVProcessor:
    def __init__(self, db: Session):
        self.db = db
        # Define expected headers for each table
        self.table_headers = {
            "activity_tracker": ["Employee_ID", "Date", "Teams_Messages_Sent", "Emails_Sent", "Meetings_Attended", "Work_Hours"],
            "vibe_meter": ["Employee_ID", "Date", "Mood_Score", "Comments"],
            "leave_tracker": ["Employee_ID", "Start_Date", "End_Date", "Leave_Type", "Status", "Days"],
            "performance_tracker": ["Employee_ID", "Review_Date", "Rating", "Manager_ID", "Comments"],
            "rewards_tracker": ["Employee_ID", "Date", "Reward_Type", "Amount", "Justification"],
            "employee": ["Employee_ID", "Name", "Department", "Manager_ID", "Join_Date", "Position"]
        }
        
        # Map tables to their model classes
        self.table_models = {
            "activity_tracker": ActivityTracker,
            "vibe_meter": VibeMeter,
            "leave_tracker": LeaveTracker,
            "performance_tracker": PerformanceTracker,
            "rewards_tracker": RewardsTracker,
            "employee": Employee
        }
    
    def process_csv(self, df: pd.DataFrame, filename: str) -> Dict[str, Any]:
        """
        Process a CSV file and insert its data into the appropriate table
        based on header detection
        """
        # Get the headers from the DataFrame
        headers = list(df.columns)
        
        # Determine which table this belongs to
        table_name = self._identify_table(headers)
        
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
    
    def _identify_table(self, headers: List[str]) -> str:
        """
        Identify which table the CSV belongs to based on its headers
        Returns the table name or None if no match
        """
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
        """
        Insert data from DataFrame into the specified table
        Returns the number of records added
        """
        model_class = self.table_models[table_name]
        records_added = 0
        
        # Process each row and insert
        for _, row in df.iterrows():
            # Convert row to dict
            row_dict = row.to_dict()
            
            # Handle date fields for different tables
            if table_name == "activity_tracker" and "Date" in row_dict:
                row_dict["date"] = self._parse_date(row_dict.pop("Date"))
            elif table_name == "vibe_meter" and "Date" in row_dict:
                row_dict["date"] = self._parse_date(row_dict.pop("Date"))
            elif table_name == "leave_tracker":
                if "Start_Date" in row_dict:
                    row_dict["start_date"] = self._parse_date(row_dict.pop("Start_Date"))
                if "End_Date" in row_dict:
                    row_dict["end_date"] = self._parse_date(row_dict.pop("End_Date"))
            elif table_name == "performance_tracker" and "Review_Date" in row_dict:
                row_dict["review_date"] = self._parse_date(row_dict.pop("Review_Date"))
            elif table_name == "rewards_tracker" and "Date" in row_dict:
                row_dict["date"] = self._parse_date(row_dict.pop("Date"))
            elif table_name == "employee" and "Join_Date" in row_dict:
                row_dict["join_date"] = self._parse_date(row_dict.pop("Join_Date"))
                
            # Convert to snake_case and standardize column names
            processed_row = {}
            for key, value in row_dict.items():
                # Convert camel/pascal case to snake_case
                snake_key = "".join(["_" + c.lower() if c.isupper() else c for c in key]).lstrip("_")
                processed_row[snake_key] = value
            
            # Create model instance
            db_model = model_class(**processed_row)
            self.db.add(db_model)
            records_added += 1
        
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