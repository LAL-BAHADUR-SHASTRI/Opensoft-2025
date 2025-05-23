from sqlalchemy import Column, String, Integer, Float, Date, Text
from app.core.database import Base

class RewardsTracker(Base):
    __tablename__ = "rewards_tracker"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, index=True)
    date = Column(Date, index=True)  # For Award_Date
    reward_type = Column(String)  # For Award_Type
    amount = Column(Float)  # For Reward_Points
    justification = Column(Text, nullable=True)