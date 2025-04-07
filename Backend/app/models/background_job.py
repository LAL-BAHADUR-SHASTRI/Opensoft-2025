import enum
from sqlalchemy import Column, String, DateTime, Enum
from app.core.database import Base

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class BackgroundJob(Base):
    """Model for tracking background jobs"""
    __tablename__ = "background_jobs"
    
    id = Column(String, primary_key=True)
    job_type = Column(String, nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING, index=True)
    message = Column(String, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)