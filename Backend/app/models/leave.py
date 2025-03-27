from sqlalchemy import Column, String, Integer, Date
from app.core.database import Base

class LeaveTracker(Base):
    __tablename__ = "leave_tracker"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, index=True)
    start_date = Column(Date, index=True)  # For Leave_Start_Date
    end_date = Column(Date)  # For Leave_End_Date
    leave_type = Column(String)  # For Leave_Type
    status = Column(String, nullable=True)  # This might be missing in your CSV
    days = Column(Integer)  # For Leave_Days