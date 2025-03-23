from sqlalchemy import Column, String, Integer, Date
from app.core.database import Base

class Employee(Base):
    __tablename__ = "employee"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True)
    name = Column(String)
    department = Column(String, index=True)
    manager_id = Column(String, index=True)
    join_date = Column(Date)
    position = Column(String)