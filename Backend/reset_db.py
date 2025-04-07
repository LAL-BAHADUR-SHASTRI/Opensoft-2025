import os
import sys
import psycopg2
from app.core.database import engine, Base, SessionLocal
from app.models.activity import ActivityTracker
from app.models.vibemeter import VibeMeter
from app.models.leave import LeaveTracker
from app.models.performance import PerformanceTracker
from app.models.rewards import RewardsTracker
from app.models.employee import Employee
from app.models.onboarding import OnboardingTracker
from app.models.user import User, UserRole
from app.models.chat import ChatMessage
from app.core.auth import get_password_hash
from sqlalchemy.orm import Session
from app.config import settings

def reset_database():
    """Drop all tables and recreate them from scratch"""
    print("WARNING: This will erase ALL DATA in the database.")
    print("Type 'CONFIRM' to proceed:")
    
    confirmation = input().strip()
    if confirmation != "CONFIRM":
        print("Operation cancelled.")
        return
    
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped successfully!")
    
    print("Creating all database tables...")
    # This ensures all models are imported before creating tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    # Create a database session
    db = SessionLocal()
    
    # Create default HR user
    hr_user = User(
        email="hr@example.com",
        username="hruser",
        hashed_password=get_password_hash("hruser"),
        role=UserRole.HR,
        is_active=True
    )
    db.add(hr_user)
        
    db.commit()
    print("Default users created successfully")
    
    # Close the session
    db.close()
    print("Database reset successfully")

if __name__ == "__main__":
    reset_database()