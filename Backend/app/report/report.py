from typing import List
from sqlalchemy.orm import Session, sessionmaker
import pandas as pd
# from app.models import Employee, ActivityTracker, LeaveTracker, OnboardingTracker, PerformanceTracker, RewardsTracker, VibeMeter
from app.models.activity import ActivityTracker
from app.models.employee import Employee
from app.models.leave import LeaveTracker
from app.models.onboarding import OnboardingTracker
from app.models.performance import PerformanceTracker
from app.models.rewards import RewardsTracker
from app.models.user import User, UserRole
from app.models.vibemeter import VibeMeter

def generate_individual_report(db: Session, employee_id: str):
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        return {"error": f"No data found for Employee ID {employee_id}"}

    activities = db.query(ActivityTracker).filter(ActivityTracker.employee_id == employee_id).all()
    leaves = db.query(LeaveTracker).filter(LeaveTracker.employee_id == employee_id).all()
    onboarding = db.query(OnboardingTracker).filter(OnboardingTracker.employee_id == employee_id).first()
    performance = db.query(PerformanceTracker).filter(PerformanceTracker.employee_id == employee_id).order_by(PerformanceTracker.review_date.desc()).first()
    rewards = db.query(RewardsTracker).filter(RewardsTracker.employee_id == employee_id).order_by(RewardsTracker.date.desc()).all()
    vibe = db.query(VibeMeter).filter(VibeMeter.employee_id == employee_id).order_by(VibeMeter.date.desc()).first()
    
    activity_df = pd.DataFrame([a.__dict__ for a in activities])
    total_messages = activity_df['teams_messages_sent'].sum() if not activity_df.empty else 0
    total_emails = int(activity_df['emails_sent'].sum()) if not activity_df.empty else 0
    total_meetings = int(activity_df['meetings_attended'].sum()) if not activity_df.empty else 0
    total_work_hours = activity_df['work_hours'].sum() if not activity_df.empty else 0

    total_leaves = len(leaves)
    
    onboarding_feedback = onboarding.onboarding_feedback if onboarding else "N/A"
    training_completed = onboarding.initial_training_completed if onboarding else "No"
    
    last_rating = performance.rating if performance else "N/A"
    manager_feedback = performance.comments if performance else "No feedback available"
    
    total_rewards = len(rewards)
    recent_reward = {
        "Date": rewards[0].date.strftime("%Y-%m-%d") if rewards else "N/A",
        "Type": rewards[0].type if rewards else "N/A",
        "Points": rewards[0].points if rewards else 0
    }
    
    recent_mood_score = vibe.mood_score if vibe else "N/A"
    mood_comment = vibe.comments if vibe else "No comments"
    
    report = {
        "Employee ID": employee.employee_id,
        "Name": employee.name,
        "Department": employee.department,
        "Position": employee.position,
        "Manager ID": employee.manager_id,
        "Joining Date": employee.join_date.strftime("%Y-%m-%d") if employee.join_date else "N/A",
        "Total Messages Sent": total_messages,
        "Total Emails Sent": total_emails,
        "Total Meetings Attended": total_meetings,
        "Total Work Hours": total_work_hours,
        "Total Leaves Taken": total_leaves,
        "Onboarding Feedback": onboarding_feedback,
        "Initial Training Completed": training_completed,
        "Last Performance Rating": last_rating,
        "Manager Feedback": manager_feedback,
        "Total Rewards Earned": total_rewards,
        "Recent Reward": recent_reward,
        "Recent Mood Score": recent_mood_score,
        "Mood Comment": mood_comment
    }
    
    return report

def generate_collective_report(db: Session):
    employees = db.query(Employee).all()
    activities = db.query(ActivityTracker).all()
    leaves = db.query(LeaveTracker).all()
    onboarding = db.query(OnboardingTracker).all()
    performance = db.query(PerformanceTracker).all()
    rewards = db.query(RewardsTracker).all()
    vibes = db.query(VibeMeter).all()
    
    total_employees = len(employees)
    activity_df = pd.DataFrame([a.__dict__ for a in activities])
    avg_work_hours = activity_df.groupby('employee_id')['work_hours'].sum().mean() if not activity_df.empty else 0
    total_messages = activity_df['teams_messages_sent'].sum() if not activity_df.empty else 0
    total_emails = int(activity_df['emails_sent'].sum()) if not activity_df.empty else 0
    total_meetings = int(activity_df['meetings_attended'].sum()) if not activity_df.empty else 0
    total_leaves = len(leaves)
    
    onboarding_moods = [o.onboarding_feedback for o in onboarding if o.onboarding_feedback is not None]
    
    mood_counts = {
        "Poor": 0,
        "Average": 0,
        "Good": 0,
        "Excellent": 0,
        "Total": len(onboarding_moods)
    }
    
    for mood in onboarding_moods:
        if mood in mood_counts:
            mood_counts[mood] += 1
        
    performance_scores = [p.rating for p in performance if p.rating is not None]
    avg_performance_rating = sum(performance_scores) / len(performance_scores) if performance_scores else "N/A"
    
    total_rewards_given = len(rewards)
    reward_types = [r.reward_type for r in rewards]
    most_common_reward = max(set(reward_types), key=reward_types.count) if reward_types else "N/A"
    
    mood_scores = [v.mood_score for v in vibes if v.mood_score is not None]
    avg_mood_score = sum(mood_scores) / len(mood_scores) if mood_scores else "N/A"
    mood_comments = [v.comments for v in vibes if v.comments]
    
    report = {
        "Total Employees": total_employees,
        "Average Work Hours Per Employee": avg_work_hours,
        "Total Messages Sent": total_messages,
        "Total Emails Sent": total_emails,
        "Total Meetings Attended": total_meetings,
        "Total Leaves Taken": total_leaves,
        "Onboarding Moods": mood_counts,
        "Average Performance Rating": avg_performance_rating,
        "Total Rewards Given": total_rewards_given,
        "Most Common Reward Type": most_common_reward,
        "Overall Mood Score": avg_mood_score,
        "Frequent Mood Comments": mood_comments[:5]
    }
    
    return report

def generate_selective_report(db: Session, employee_ids: List[str]):
    activities = db.query(ActivityTracker).filter(ActivityTracker.employee_id.in_(employee_ids)).all()
    leaves = db.query(LeaveTracker).filter(LeaveTracker.employee_id.in_(employee_ids)).all()
    onboarding = db.query(OnboardingTracker).filter(OnboardingTracker.employee_id.in_(employee_ids)).all()
    performance = db.query(PerformanceTracker).filter(PerformanceTracker.employee_id.in_(employee_ids)).all()
    rewards = db.query(RewardsTracker).filter(RewardsTracker.employee_id.in_(employee_ids)).all()
    vibes = db.query(VibeMeter).filter(VibeMeter.employee_id.in_(employee_ids)).all()

    
    total_employees = len(employee_ids)
    activity_df = pd.DataFrame([a.__dict__ for a in activities])
    avg_work_hours = activity_df.groupby('employee_id')['work_hours'].sum().mean() if not activity_df.empty else 0
    total_messages = activity_df['teams_messages_sent'].sum() if not activity_df.empty else 0
    total_emails = int(activity_df['emails_sent'].sum()) if not activity_df.empty else 0
    total_meetings = int(activity_df['meetings_attended'].sum()) if not activity_df.empty else 0
    total_leaves = len(leaves)
    
    onboarding_moods = [o.onboarding_feedback for o in onboarding if o.onboarding_feedback is not None]
    
    mood_counts = {
        "Poor": 0,
        "Average": 0,
        "Good": 0,
        "Excellent": 0,
        "Total": len(onboarding_moods)
    }
    
    for mood in onboarding_moods:
        if mood in mood_counts:
            mood_counts[mood] += 1

    
    performance_scores = [p.rating for p in performance if p.rating is not None]
    avg_performance_rating = sum(performance_scores) / len(performance_scores) if performance_scores else "N/A"
    
    total_rewards_given = len(rewards)
    reward_types = [r.reward_type for r in rewards]
    most_common_reward = max(set(reward_types), key=reward_types.count) if reward_types else "N/A"
    
    mood_scores = [v.mood_score for v in vibes if v.mood_score is not None]
    avg_mood_score = sum(mood_scores) / len(mood_scores) if mood_scores else "N/A"
    mood_comments = [v.comments for v in vibes if v.comments]
    
    report = {
        "Total Employees": total_employees,
        "Average Work Hours Per Employee": avg_work_hours,
        "Total Messages Sent": total_messages,
        "Total Emails Sent": total_emails,
        "Total Meetings Attended": total_meetings,
        "Total Leaves Taken": total_leaves,
        "Onboarding Moods": mood_counts,
        "Average Performance Rating": avg_performance_rating,
        "Total Rewards Given": total_rewards_given,
        "Most Common Reward Type": most_common_reward,
        "Overall Mood Score": avg_mood_score,
        "Frequent Mood Comments": mood_comments[:5]
    }
    
    return report

def report_test1():
    from sqlalchemy import create_engine

    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/vibemeter"
    engine = create_engine(DATABASE_URL, echo=True)

    SessionLocal = sessionmaker(bind=engine)  # Bind session to the engine
    session = SessionLocal()  # Create a new session instance

    print(generate_individual_report(session, 'EMP0048'))
    print(generate_collective_report(session))