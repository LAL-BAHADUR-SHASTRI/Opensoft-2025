from sqlalchemy import Column, String, Integer, Float, Date
from app.core.database import Base

class ActivityTracker(Base):
    __tablename__ = "activity_tracker"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, index=True)
    date = Column(Date, index=True)
    teams_messages_sent = Column(Integer)  # Will map from Teams_Messages
    emails_sent = Column(Integer)
    meetings_attended = Column(Integer)
    work_hours = Column(Float)