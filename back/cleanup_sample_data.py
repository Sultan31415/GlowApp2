#!/usr/bin/env python3
"""
Script to remove all sample contribution data from the database.
This will clean up the test data created by test_contributions.py
"""

import sys
import os
from sqlalchemy.orm import Session

# Add the back directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.session import SessionLocal
from app.models.progress_tracking import HabitCompletion
from app.models.user import User

def cleanup_sample_data():
    """Remove all sample contribution data from the database"""
    db = SessionLocal()
    
    try:
        # Get the first user
        user = db.query(User).first()
        if not user:
            print("No users found in database.")
            return
        
        print(f"Cleaning up sample data for user: {user.first_name} {user.last_name}")
        
        # Count existing habit completions
        existing_count = db.query(HabitCompletion).filter(
            HabitCompletion.user_id == user.id
        ).count()
        
        print(f"Found {existing_count} habit completions to remove...")
        
        # Remove all habit completions for this user
        deleted_count = db.query(HabitCompletion).filter(
            HabitCompletion.user_id == user.id
        ).delete()
        
        db.commit()
        
        print(f"✅ Successfully removed {deleted_count} habit completions")
        print(f"🗑️ Database cleaned up for user: {user.first_name}")
        
    except Exception as e:
        print(f"Error cleaning up sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_sample_data() 