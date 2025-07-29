#!/usr/bin/env python3
"""
Test script to create sample contribution data for the new 4-activity tracking system.
This will help verify that the GitHub-style contribution graph works correctly.
"""

import sys
import os
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

# Add the back directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.progress_tracking import HabitCompletion
from app.models.assessment import UserAssessment
from app.services.progress_tracking_service import ProgressTrackingService

def create_sample_contributions():
    """Create sample contribution data for testing the new 4-activity tracking system"""
    db = SessionLocal()
    
    try:
        # Get the first user (or create one if needed)
        user = db.query(User).first()
        if not user:
            print("No users found in database. Please create a user first.")
            return
        
        print(f"Adding sample contributions for user: {user.first_name} {user.last_name}")
        
        # Get or create an assessment for the user
        assessment = db.query(UserAssessment).filter(UserAssessment.user_id == user.id).first()
        if not assessment:
            print("No assessment found for user. Please complete an assessment first.")
            return
        
        # Clear existing habit completions for this user
        db.query(HabitCompletion).filter(HabitCompletion.user_id == user.id).delete()
        db.commit()
        
        # Create sample data for the last 30 days
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        # Define the 4 activity types
        activity_types = [
            'morning_routine',
            'system_building', 
            'deep_focus',
            'evening_reflection'
        ]
        
        # Sample activity content for each type
        activity_content = {
            'morning_routine': 'Morning Routine - 5 minutes of stretching and meditation',
            'system_building': 'System Building - Review and adjust daily habits',
            'deep_focus': 'Deep Focus - 30 minutes of concentrated work',
            'evening_reflection': 'Evening Reflection - Journal about the day'
        }
        
        # Create sample completions with varying patterns
        current_date = start_date
        while current_date <= end_date:
            # Create different completion patterns
            day_of_week = current_date.weekday()
            
            # Pattern 1: Perfect days (all 4 activities) on weekends
            if day_of_week >= 5:  # Saturday and Sunday
                for activity_type in activity_types:
                    completion = HabitCompletion(
                        user_id=user.id,
                        assessment_id=assessment.id,
                        habit_type=activity_type,
                        habit_content=activity_content[activity_type],
                        day_date=current_date,
                        completed_at=datetime.utcnow()
                    )
                    db.add(completion)
            
            # Pattern 2: Good days (3 activities) on Tuesdays and Thursdays
            elif day_of_week in [1, 3]:  # Tuesday and Thursday
                for activity_type in activity_types[:3]:  # First 3 activities
                    completion = HabitCompletion(
                        user_id=user.id,
                        assessment_id=assessment.id,
                        habit_type=activity_type,
                        habit_content=activity_content[activity_type],
                        day_date=current_date,
                        completed_at=datetime.utcnow()
                    )
                    db.add(completion)
            
            # Pattern 3: Okay days (2 activities) on Mondays and Wednesdays
            elif day_of_week in [0, 2]:  # Monday and Wednesday
                for activity_type in activity_types[:2]:  # First 2 activities
                    completion = HabitCompletion(
                        user_id=user.id,
                        assessment_id=assessment.id,
                        habit_type=activity_type,
                        habit_content=activity_content[activity_type],
                        day_date=current_date,
                        completed_at=datetime.utcnow()
                    )
                    db.add(completion)
            
            # Pattern 4: Poor days (1 activity) on Fridays
            elif day_of_week == 4:  # Friday
                completion = HabitCompletion(
                    user_id=user.id,
                    assessment_id=assessment.id,
                    habit_type=activity_types[0],  # Only morning routine
                    habit_content=activity_content[activity_types[0]],
                    day_date=current_date,
                    completed_at=datetime.utcnow()
                )
                db.add(completion)
            
            # Pattern 5: Empty days (no activities) - skip some days randomly
            # (This will happen naturally for days not covered above)
            
            current_date += timedelta(days=1)
        
        db.commit()
        print(f"✅ Created sample contribution data for {user.first_name}")
        print(f"📊 Data covers {start_date} to {end_date}")
        print(f"🎯 Activity types tracked: {', '.join(activity_types)}")
        
        # Test the contribution data generation
        progress_service = ProgressTrackingService()
        contributions = progress_service.get_github_style_contributions(db, user.id, datetime.now().year)
        
        # Count different completion levels
        level_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}
        for day in contributions:
            if day['date'] >= start_date.isoformat() and day['date'] <= end_date.isoformat():
                level_counts[day['level']] += 1
        
        print(f"\n📈 Sample data breakdown:")
        print(f"   Perfect days (4 activities): {level_counts[4]}")
        print(f"   Good days (3 activities): {level_counts[3]}")
        print(f"   Okay days (2 activities): {level_counts[2]}")
        print(f"   Poor days (1 activity): {level_counts[1]}")
        print(f"   Empty days (0 activities): {level_counts[0]}")
        
    except Exception as e:
        print(f"Error creating sample contributions: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_contributions() 