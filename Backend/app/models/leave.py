from sqlalchemy import Column, String, Integer, Date
from app.core.database import Base

class LeaveTracker(Base):
    __tablename__ = "leave_tracker"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, index=True)
    start_date = Column(Date, index=True)
    end_date = Column(Date)
    leave_type = Column(String)
    status = Column(String)
    days = Column(Integer)