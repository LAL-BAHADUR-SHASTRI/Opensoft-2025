from sqlalchemy import Column, String, Integer, Float, Date, Text
from app.core.database import Base

class PerformanceTracker(Base):
    __tablename__ = "performance_tracker"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, index=True)
    review_date = Column(Date, index=True)
    rating = Column(Float)
    manager_id = Column(String, index=True)
    comments = Column(Text, nullable=True)