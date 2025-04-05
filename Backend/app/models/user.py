from sqlalchemy import Column, String, Integer, Boolean, Enum, DateTime
from sqlalchemy.sql import expression
from app.core.database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    EMPLOYEE = "employee"
    HR = "hr"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=UserRole.EMPLOYEE)
    is_active = Column(Boolean, server_default=expression.true())
    employee_id = Column(String, nullable=True)  # For linking to employee data
    last_login_date = Column(DateTime, nullable=True)  # Track last login
    last_chat_date = Column(DateTime, nullable=True)  # Track last chat
    current_mood = Column(String, nullable=True)  # Current mood based on chat
    next_chat_date = Column(DateTime, nullable=True)  # Schedule follow-up chat
    hr_escalation = Column(Boolean, default=False)  # Flag for HR attention
    escalation_reason = Column(String, nullable=True)  # Reason for HR escalation