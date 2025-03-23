from sqlalchemy import Column, String, Integer, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class OnboardingTracker(Base):
    __tablename__ = "onboarding_tracker"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, ForeignKey("employee.employee_id"), index=True)
    join_date = Column(Date)
    feedback = Column(String)
    mentor = Column(String)
    training_completed = Column(Boolean, default=False)
    
    # Relationship with Employee model (optional)
    employee = relationship("Employee", foreign_keys=[employee_id], backref="onboarding")