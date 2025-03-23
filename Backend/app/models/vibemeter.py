from sqlalchemy import Column, String, Integer, Float, Date, Text
from app.core.database import Base

class VibeMeter(Base):
    __tablename__ = "vibe_meter"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, index=True)
    date = Column(Date, index=True)
    mood_score = Column(Float)
    comments = Column(Text, nullable=True)