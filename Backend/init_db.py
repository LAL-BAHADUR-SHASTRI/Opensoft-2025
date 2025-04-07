from app.core.database import engine, Base, SessionLocal
from app.models.activity import ActivityTracker
from app.models.vibemeter import VibeMeter
from app.models.leave import LeaveTracker
from app.models.performance import PerformanceTracker
from app.models.rewards import RewardsTracker
from app.models.employee import Employee
from app.models.onboarding import OnboardingTracker
from app.models.user import User, UserRole
from app.core.auth import get_password_hash
from sqlalchemy.orm import Session

def setup_database():
    print("Creating all database tables...")
    # This ensures all models are imported before creating tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    # Create a database session
    db = SessionLocal()
    
    # Check if HR user already exists
    existing_hr = db.query(User).filter(User.username == "hruser").first()
    if not existing_hr:
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
        print("HR user created with username 'hruser' and password 'hruser'")
    else:
        print("HR user already exists")
        
    # Close the session
    db.close()
    print("Database initialized successfully")

if __name__ == "__main__":
    setup_database()