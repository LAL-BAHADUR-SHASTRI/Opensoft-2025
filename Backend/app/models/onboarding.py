from sqlalchemy import Column, String, Integer, Date, Text, Boolean
from app.core.database import Base

class OnboardingTracker(Base):
    __tablename__ = "onboarding_tracker"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, index=True)
    joining_date = Column(Date)  # Make sure this field is present to fix the error
    onboarding_feedback = Column(Text, nullable=True)
    mentor_assigned = Column(String, nullable=True)
    initial_training_completed = Column(String, nullable=True)  # Changed to String since CSV likely has text values