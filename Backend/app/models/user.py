from sqlalchemy import Column, String, Integer, Boolean, Enum
from sqlalchemy.sql import expression
from app.core.database import Base
import enum

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