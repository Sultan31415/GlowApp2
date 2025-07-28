from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from app.models.progress_tracking import HabitCompletion, ProgressSnapshot
from app.models.assessment import UserAssessment
from app.models.future_projection import DailyPlan
from app.models.progress_schemas import HabitStreak, DailyProgressResponse, WeeklyProgressResponse


class ProgressTrackingService:
    """Service for managing progress tracking functionality"""
    
    def __init__(self):
        pass
    
    def complete_habit(
        self, 
        db: Session, 
        user_id: int, 
        habit_type: str, 
        habit_content: str, 
        day_date: date = None,
        notes: str = None,
        assessment_id: int = None,
        daily_plan_id: int = None
    ) -> HabitCompletion:
        """Mark a habit as completed for a specific date"""
        if day_date is None:
            day_date = date.today()
        
        # Check if habit already completed for this date
        existing = db.query(HabitCompletion).filter(
            and_(
                HabitCompletion.user_id == user_id,
                HabitCompletion.habit_type == habit_type,
                HabitCompletion.day_date == day_date
            )
        ).first()
        
        if existing:
            # Update existing completion
            existing.habit_content = habit_content
            existing.notes = notes
            existing.completed_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
        
        # Create new completion
        completion = HabitCompletion(
            user_id=user_id,
            habit_type=habit_type,
            habit_content=habit_content,
            day_date=day_date,
            notes=notes,
            assessment_id=assessment_id,
            daily_plan_id=daily_plan_id
        )
        db.add(completion)
        db.commit()
        db.refresh(completion)
        return completion
    
    def get_habit_completions(
        self, 
        db: Session, 
        user_id: int, 
        start_date: date = None, 
        end_date: date = None,
        habit_type: str = None
    ) -> List[HabitCompletion]:
        """Get habit completions for a user within a date range"""
        query = db.query(HabitCompletion).filter(HabitCompletion.user_id == user_id)
        
        if start_date:
            query = query.filter(HabitCompletion.day_date >= start_date)
        if end_date:
            query = query.filter(HabitCompletion.day_date <= end_date)
        if habit_type:
            query = query.filter(HabitCompletion.habit_type == habit_type)
        
        return query.order_by(HabitCompletion.day_date.desc()).all()
    
    def calculate_habit_streaks(self, db: Session, user_id: int) -> List[HabitStreak]:
        """Calculate current and longest streaks for each habit type"""
        habit_types = ['morning_routine', 'system_building', 'deep_focus', 'evening_reflection', 'weekly_challenge']
        streaks = []
        
        for habit_type in habit_types:
            # Get all completions for this habit type, ordered by date
            completions = db.query(HabitCompletion).filter(
                and_(
                    HabitCompletion.user_id == user_id,
                    HabitCompletion.habit_type == habit_type
                )
            ).order_by(HabitCompletion.day_date.desc()).all()
            
            if not completions:
                streaks.append(HabitStreak(
                    habit_type=habit_type,
                    current_streak=0,
                    longest_streak=0,
                    total_completions=0,
                    last_completion_date=None
                ))
                continue
            
            # Calculate current streak
            current_streak = 0
            current_date = date.today()
            
            for completion in completions:
                if completion.day_date == current_date:
                    current_streak += 1
                    current_date -= timedelta(days=1)
                else:
                    break
            
            # Calculate longest streak
            longest_streak = 0
            temp_streak = 0
            prev_date = None
            
            for completion in sorted(completions, key=lambda x: x.day_date):
                if prev_date is None or (completion.day_date - prev_date).days == 1:
                    temp_streak += 1
                else:
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 1
                prev_date = completion.day_date
            
            longest_streak = max(longest_streak, temp_streak)
            
            streaks.append(HabitStreak(
                habit_type=habit_type,
                current_streak=current_streak,
                longest_streak=longest_streak,
                total_completions=len(completions),
                last_completion_date=completions[0].day_date if completions else None
            ))
        
        return streaks
    
    def create_progress_snapshot(
        self, 
        db: Session, 
        user_id: int, 
        snapshot_date: date = None,
        notes: str = None
    ) -> ProgressSnapshot:
        """Create a progress snapshot for a user"""
        if snapshot_date is None:
            snapshot_date = date.today()
        
        # Check if snapshot already exists for this date
        existing = db.query(ProgressSnapshot).filter(
            and_(
                ProgressSnapshot.user_id == user_id,
                ProgressSnapshot.snapshot_date == snapshot_date
            )
        ).first()
        
        if existing:
            return existing
        
        # Get latest assessment for reference
        latest_assessment = db.query(UserAssessment).filter(
            UserAssessment.user_id == user_id
        ).order_by(UserAssessment.created_at.desc()).first()
        
        snapshot = ProgressSnapshot(
            user_id=user_id,
            snapshot_date=snapshot_date,
            notes=notes,
            assessment_id=latest_assessment.id if latest_assessment else None
        )
        
        # If we have assessment data, copy relevant fields
        if latest_assessment:
            snapshot.overall_glow_score = latest_assessment.overall_glow_score
            snapshot.category_scores = latest_assessment.category_scores
            snapshot.biological_age = latest_assessment.biological_age
            snapshot.emotional_age = latest_assessment.emotional_age
            snapshot.chronological_age = latest_assessment.chronological_age
        
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        return snapshot
    
    def get_progress_snapshots(
        self, 
        db: Session, 
        user_id: int, 
        start_date: date = None, 
        end_date: date = None
    ) -> List[ProgressSnapshot]:
        """Get progress snapshots for a user within a date range"""
        query = db.query(ProgressSnapshot).filter(ProgressSnapshot.user_id == user_id)
        
        if start_date:
            query = query.filter(ProgressSnapshot.snapshot_date >= start_date)
        if end_date:
            query = query.filter(ProgressSnapshot.snapshot_date <= end_date)
        
        return query.order_by(ProgressSnapshot.snapshot_date.desc()).all()
    
    def get_daily_progress(
        self, 
        db: Session, 
        user_id: int, 
        target_date: date = None
    ) -> DailyProgressResponse:
        """Get comprehensive daily progress for a specific date"""
        if target_date is None:
            target_date = date.today()
        
        # Get completed habits for the day
        completed_habits = self.get_habit_completions(db, user_id, target_date, target_date)
        
        # Get available habits from daily plan (if exists)
        daily_plan = db.query(DailyPlan).filter(
            and_(
                DailyPlan.user_id == user_id,
                DailyPlan.created_at >= datetime.combine(target_date, datetime.min.time())
            )
        ).order_by(DailyPlan.created_at.desc()).first()
        
        total_habits_available = 0
        if daily_plan and daily_plan.plan_json:
            # Count available habits from daily plan
            plan_data = daily_plan.plan_json
            if 'days' in plan_data:
                # Find the day that corresponds to target_date
                day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday
                if day_of_week < len(plan_data['days']):
                    day_data = plan_data['days'][day_of_week]
                    # Count different habit types
                    if 'systemBuilding' in day_data:
                        total_habits_available += 1
                    if 'deepFocus' in day_data:
                        total_habits_available += 1
                    if 'eveningReflection' in day_data:
                        total_habits_available += 1
            
            # Add morning routine and weekly challenges
            if 'morningLaunchpad' in plan_data:
                total_habits_available += 1
            if 'challenges' in plan_data:
                total_habits_available += len(plan_data['challenges'])
        
        completion_rate = len(completed_habits) / max(total_habits_available, 1)
        
        # Get streak info
        streaks = self.calculate_habit_streaks(db, user_id)
        streak_info = {streak.habit_type: streak.current_streak for streak in streaks}
        
        return DailyProgressResponse(
            date=target_date,
            completed_habits=completed_habits,
            total_habits_available=total_habits_available,
            completion_rate=completion_rate,
            streak_info=streak_info
        )
    
    def get_weekly_progress(
        self, 
        db: Session, 
        user_id: int, 
        week_start: date = None
    ) -> WeeklyProgressResponse:
        """Get comprehensive weekly progress"""
        if week_start is None:
            # Start of current week (Monday)
            today = date.today()
            week_start = today - timedelta(days=today.weekday())
        
        week_end = week_start + timedelta(days=6)
        
        # Get daily progress for each day of the week
        daily_progress = []
        total_completions = 0
        total_available = 0
        
        for i in range(7):
            current_date = week_start + timedelta(days=i)
            daily = self.get_daily_progress(db, user_id, current_date)
            daily_progress.append(daily)
            total_completions += len(daily.completed_habits)
            total_available += daily.total_habits_available
        
        weekly_completion_rate = total_completions / max(total_available, 1)
        
        # Calculate streak improvements
        start_streaks = self.calculate_habit_streaks(db, user_id)
        # Note: This is simplified - in a real implementation you'd compare with previous week
        
        return WeeklyProgressResponse(
            week_start=week_start,
            week_end=week_end,
            daily_progress=daily_progress,
            weekly_completion_rate=weekly_completion_rate,
            weekly_goals_met=total_completions,
            weekly_goals_total=total_available,
            streak_improvements={}  # Would be calculated by comparing with previous week
        )
    
    def get_completion_stats(self, db: Session, user_id: int, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive completion statistics"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        completions = self.get_habit_completions(db, user_id, start_date, end_date)
        streaks = self.calculate_habit_streaks(db, user_id)
        
        # Calculate completion rates by habit type
        habit_type_counts = {}
        for completion in completions:
            habit_type_counts[completion.habit_type] = habit_type_counts.get(completion.habit_type, 0) + 1
        
        # Calculate daily completion rates
        daily_completion_rates = {}
        for i in range(days):
            current_date = end_date - timedelta(days=i)
            daily_completions = [c for c in completions if c.day_date == current_date]
            daily_completion_rates[current_date.isoformat()] = len(daily_completions)
        
        return {
            "total_completions": len(completions),
            "completion_rate_overall": len(completions) / max(days, 1),
            "habit_type_counts": habit_type_counts,
            "daily_completion_rates": daily_completion_rates,
            "current_streaks": {streak.habit_type: streak.current_streak for streak in streaks},
            "longest_streaks": {streak.habit_type: streak.longest_streak for streak in streaks},
            "most_consistent_habit": max(streaks, key=lambda x: x.current_streak).habit_type if streaks else None
        } 