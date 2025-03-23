from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.auth import get_password_hash
from app.models.user import User, UserRole

def init_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if HR user exists
        hr_user = db.query(User).filter(User.username == "hruser").first()
        if not hr_user:
            # Create HR user with predefined credentials
            hr_user = User(
                email="hr@example.com",
                username="hruser",
                hashed_password=get_password_hash("hruser"),
                role=UserRole.HR
            )
            db.add(hr_user)
            print("HR user created with username 'hruser' and password 'hruser'")
        
        # Check if employee user exists - using a known employee ID from the dataset
        # This assumes your dataset contains an employee with ID "EMP0048"
        emp_user = db.query(User).filter(User.username == "emp0048").first()
        if not emp_user:
            # Create employee user
            emp_user = User(
                email="employee@example.com",
                username="emp0048",
                hashed_password=get_password_hash("emp0048"),
                role=UserRole.EMPLOYEE,
                employee_id="EMP0048"  # This links to the actual employee in the dataset
            )
            db.add(emp_user)
            print("Employee user created with username 'emp0048' and password 'emp0048'")
        
        db.commit()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()