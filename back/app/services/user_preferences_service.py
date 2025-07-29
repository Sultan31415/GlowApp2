from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.user_preferences import UserPreferences, CustomHabit
from app.models.user import User
from datetime import datetime

class UserPreferencesService:
    """Service for managing user preferences and custom habits"""
    
    def __init__(self):
        pass
    
    def get_user_preferences(self, db: Session, user_id: int) -> Optional[UserPreferences]:
        """Get user preferences"""
        return db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
    
    def create_or_update_preferences(self, db: Session, user_id: int, preferences_data: Dict[str, Any]) -> UserPreferences:
        """Create or update user preferences"""
        existing = self.get_user_preferences(db, user_id)
        
        if existing:
            # Update existing preferences
            for key, value in preferences_data.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Create new preferences
            preferences = UserPreferences(
                user_id=user_id,
                **preferences_data
            )
            db.add(preferences)
            db.commit()
            db.refresh(preferences)
            return preferences
    
    def get_custom_habits(self, db: Session, user_id: int, active_only: bool = True) -> List[CustomHabit]:
        """Get user's custom habits"""
        query = db.query(CustomHabit).filter(CustomHabit.user_id == user_id)
        if active_only:
            query = query.filter(CustomHabit.is_active == "active")
        return query.order_by(CustomHabit.created_at.desc()).all()
    
    def create_custom_habit(self, db: Session, user_id: int, habit_data: Dict[str, Any]) -> CustomHabit:
        """Create a new custom habit"""
        habit = CustomHabit(
            user_id=user_id,
            **habit_data
        )
        db.add(habit)
        db.commit()
        db.refresh(habit)
        return habit
    
    def update_custom_habit(self, db: Session, habit_id: int, user_id: int, habit_data: Dict[str, Any]) -> Optional[CustomHabit]:
        """Update an existing custom habit"""
        habit = db.query(CustomHabit).filter(
            CustomHabit.id == habit_id,
            CustomHabit.user_id == user_id
        ).first()
        
        if not habit:
            return None
        
        for key, value in habit_data.items():
            if hasattr(habit, key):
                setattr(habit, key, value)
        
        habit.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(habit)
        return habit
    
    def delete_custom_habit(self, db: Session, habit_id: int, user_id: int) -> bool:
        """Delete a custom habit (soft delete by setting to inactive)"""
        habit = db.query(CustomHabit).filter(
            CustomHabit.id == habit_id,
            CustomHabit.user_id == user_id
        ).first()
        
        if not habit:
            return False
        
        habit.is_active = "inactive"
        habit.updated_at = datetime.utcnow()
        db.commit()
        return True
    
    def complete_custom_habit(self, db: Session, habit_id: int, user_id: int) -> Optional[CustomHabit]:
        """Mark a custom habit as completed"""
        habit = db.query(CustomHabit).filter(
            CustomHabit.id == habit_id,
            CustomHabit.user_id == user_id
        ).first()
        
        if not habit:
            return None
        
        habit.last_completed = datetime.utcnow()
        habit.completion_count += 1
        habit.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(habit)
        return habit
    
    def get_user_context_for_planning(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get comprehensive user context for plan generation"""
        context = {
            "preferences": {},
            "custom_habits": [],
            "custom_routines": {},
            "lifestyle_context": {}
        }
        
        # Get user preferences
        preferences = self.get_user_preferences(db, user_id)
        if preferences:
            context["preferences"] = {
                "preferred_wake_time": preferences.preferred_wake_time,
                "preferred_sleep_time": preferences.preferred_sleep_time,
                "preferred_exercise_time": preferences.preferred_exercise_time,
                "preferred_exercise_intensity": preferences.preferred_exercise_intensity,
                "work_schedule": preferences.work_schedule,
                "family_obligations": preferences.family_obligations,
                "dietary_preferences": preferences.dietary_preferences,
                "cultural_context": preferences.cultural_context,
                "primary_goals": preferences.primary_goals,
                "focus_areas": preferences.focus_areas,
                "avoid_areas": preferences.avoid_areas,
                "preferred_motivation_style": preferences.preferred_motivation_style,
                "preferred_planning_style": preferences.preferred_planning_style
            }
            
            # Get custom routines
            context["custom_routines"] = {
                "morning_routine": preferences.custom_morning_routine or [],
                "evening_routine": preferences.custom_evening_routine or [],
                "custom_habits": preferences.custom_habits or []
            }
        
        # Get active custom habits
        custom_habits = self.get_custom_habits(db, user_id, active_only=True)
        context["custom_habits"] = [
            {
                "id": habit.id,
                "name": habit.name,
                "description": habit.description,
                "category": habit.category,
                "trigger": habit.trigger,
                "action": habit.action,
                "reward": habit.reward,
                "difficulty_level": habit.difficulty_level,
                "frequency": habit.frequency,
                "estimated_duration": habit.estimated_duration,
                "completion_count": habit.completion_count,
                "last_completed": habit.last_completed.isoformat() if habit.last_completed else None
            }
            for habit in custom_habits
        ]
        
        # Get user basic info
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            context["lifestyle_context"] = {
                "name": user.first_name,
                "member_since_days": (datetime.utcnow() - user.created_at).days if user.created_at else 0
            }
        
        return context
    
    def suggest_habit_improvements(self, db: Session, user_id: int, current_habits: List[str]) -> List[Dict[str, Any]]:
        """Suggest improvements to user's current habits based on their preferences and patterns"""
        suggestions = []
        
        # Get user preferences
        preferences = self.get_user_preferences(db, user_id)
        if not preferences:
            return suggestions
        
        # Analyze current habits and suggest improvements
        for habit in current_habits:
            suggestion = {
                "original_habit": habit,
                "suggested_improvement": None,
                "rationale": None,
                "difficulty_increase": None
            }
            
            # Example improvements based on user preferences
            if "wake up" in habit.lower():
                if preferences.preferred_wake_time:
                    suggestion["suggested_improvement"] = f"Wake up at {preferences.preferred_wake_time}"
                    suggestion["rationale"] = "Based on your preferred wake time"
            
            elif "exercise" in habit.lower() or "workout" in habit.lower():
                if preferences.preferred_exercise_time and preferences.preferred_exercise_intensity:
                    suggestion["suggested_improvement"] = f"Schedule {preferences.preferred_exercise_intensity} exercise during {preferences.preferred_exercise_time}"
                    suggestion["rationale"] = f"Matches your preferred exercise time and intensity level"
            
            elif "sleep" in habit.lower():
                if preferences.preferred_sleep_time:
                    suggestion["suggested_improvement"] = f"Go to bed by {preferences.preferred_sleep_time}"
                    suggestion["rationale"] = "Based on your preferred sleep schedule"
            
            if suggestion["suggested_improvement"]:
                suggestions.append(suggestion)
        
        return suggestions
    
    def create_habit_from_preference(self, db: Session, user_id: int, habit_name: str, category: str, **kwargs) -> CustomHabit:
        """Create a custom habit from user preference"""
        habit_data = {
            "name": habit_name,
            "category": category,
            "description": kwargs.get("description", ""),
            "trigger": kwargs.get("trigger", ""),
            "action": kwargs.get("action", habit_name),
            "reward": kwargs.get("reward", ""),
            "difficulty_level": kwargs.get("difficulty_level", "medium"),
            "frequency": kwargs.get("frequency", "daily"),
            "estimated_duration": kwargs.get("estimated_duration", "5 minutes")
        }
        
        return self.create_custom_habit(db, user_id, habit_data) 