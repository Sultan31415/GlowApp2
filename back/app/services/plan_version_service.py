"""
Plan Version History Service
Handles version control for daily plans with backup, tracking, and restoration capabilities.
"""

import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from app.models.future_projection import DailyPlan, PlanVersionHistory


class PlanVersionService:
    """Service for managing plan version history and change tracking"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_version_backup(
        self,
        user_id: int,
        plan_id: int,
        plan_json: Dict[str, Any],
        plan_type: str,
        change_type: str,
        change_description: str,
        changed_fields: Optional[Dict[str, Any]] = None,
        previous_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        changed_by: str = "leo"
    ) -> PlanVersionHistory:
        """
        Create a backup version before making changes to a plan
        """
        try:
            # Get the next version number for this plan
            latest_version = self.db.query(PlanVersionHistory).filter(
                and_(
                    PlanVersionHistory.plan_id == plan_id,
                    PlanVersionHistory.is_active == 1
                )
            ).order_by(desc(PlanVersionHistory.version_number)).first()
            
            next_version = (latest_version.version_number + 1) if latest_version else 1
            
            # Create the version backup
            version_backup = PlanVersionHistory(
                user_id=user_id,
                plan_id=plan_id,
                version_number=next_version,
                plan_json=plan_json,
                plan_type=plan_type,
                change_type=change_type,
                change_description=change_description,
                changed_fields=changed_fields,
                previous_values=previous_values,
                new_values=new_values,
                changed_by=changed_by,
                is_active=1
            )
            
            self.db.add(version_backup)
            self.db.commit()
            self.db.refresh(version_backup)
            
            print(f"[PlanVersionService] ✅ Created version backup v{next_version} for plan {plan_id}")
            return version_backup
            
        except Exception as e:
            print(f"[PlanVersionService] ❌ Error creating version backup: {str(e)}")
            self.db.rollback()
            raise
    
    def get_version_history(
        self,
        user_id: int,
        plan_id: Optional[int] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get version history for a user's plans
        """
        try:
            query = self.db.query(PlanVersionHistory).filter(
                and_(
                    PlanVersionHistory.user_id == user_id,
                    PlanVersionHistory.is_active == 1
                )
            )
            
            if plan_id:
                query = query.filter(PlanVersionHistory.plan_id == plan_id)
            
            versions = query.order_by(desc(PlanVersionHistory.created_at)).limit(limit).all()
            
            history = []
            for version in versions:
                history.append({
                    "id": version.id,
                    "plan_id": version.plan_id,
                    "version_number": version.version_number,
                    "created_at": version.created_at.isoformat(),
                    "change_type": version.change_type,
                    "change_description": version.change_description,
                    "changed_fields": version.changed_fields,
                    "changed_by": version.changed_by,
                    "plan_type": version.plan_type
                })
            
            return history
            
        except Exception as e:
            print(f"[PlanVersionService] ❌ Error getting version history: {str(e)}")
            return []
    
    def get_version_details(
        self,
        version_id: int,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific version
        """
        try:
            version = self.db.query(PlanVersionHistory).filter(
                and_(
                    PlanVersionHistory.id == version_id,
                    PlanVersionHistory.user_id == user_id,
                    PlanVersionHistory.is_active == 1
                )
            ).first()
            
            if not version:
                return None
            
            return {
                "id": version.id,
                "plan_id": version.plan_id,
                "version_number": version.version_number,
                "created_at": version.created_at.isoformat(),
                "plan_json": version.plan_json,
                "plan_type": version.plan_type,
                "change_type": version.change_type,
                "change_description": version.change_description,
                "changed_fields": version.changed_fields,
                "previous_values": version.previous_values,
                "new_values": version.new_values,
                "changed_by": version.changed_by
            }
            
        except Exception as e:
            print(f"[PlanVersionService] ❌ Error getting version details: {str(e)}")
            return None
    
    def restore_version(
        self,
        version_id: int,
        user_id: int
    ) -> Tuple[bool, str]:
        """
        Restore a plan to a previous version
        """
        try:
            # Get the version to restore
            version = self.db.query(PlanVersionHistory).filter(
                and_(
                    PlanVersionHistory.id == version_id,
                    PlanVersionHistory.user_id == user_id,
                    PlanVersionHistory.is_active == 1
                )
            ).first()
            
            if not version:
                return False, "Version not found"
            
            # Get the current plan
            current_plan = self.db.query(DailyPlan).filter(
                and_(
                    DailyPlan.id == version.plan_id,
                    DailyPlan.user_id == user_id
                )
            ).first()
            
            if not current_plan:
                return False, "Current plan not found"
            
            # Create a backup of the current plan before restoring
            self.create_version_backup(
                user_id=user_id,
                plan_id=current_plan.id,
                plan_json=current_plan.plan_json,
                plan_type=current_plan.plan_type,
                change_type="restore_backup",
                change_description=f"Backup created before restoring to version {version.version_number}",
                changed_by="system"
            )
            
            # Restore the plan to the previous version
            current_plan.plan_json = version.plan_json
            current_plan.plan_type = version.plan_type
            
            self.db.commit()
            
            print(f"[PlanVersionService] ✅ Restored plan {current_plan.id} to version {version.version_number}")
            return True, f"Successfully restored to version {version.version_number}"
            
        except Exception as e:
            print(f"[PlanVersionService] ❌ Error restoring version: {str(e)}")
            self.db.rollback()
            return False, f"Error restoring version: {str(e)}"
    
    def compare_versions(
        self,
        version1_id: int,
        version2_id: int,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Compare two versions and show differences
        """
        try:
            # Get both versions
            version1 = self.db.query(PlanVersionHistory).filter(
                and_(
                    PlanVersionHistory.id == version1_id,
                    PlanVersionHistory.user_id == user_id,
                    PlanVersionHistory.is_active == 1
                )
            ).first()
            
            version2 = self.db.query(PlanVersionHistory).filter(
                and_(
                    PlanVersionHistory.id == version2_id,
                    PlanVersionHistory.user_id == user_id,
                    PlanVersionHistory.is_active == 1
                )
            ).first()
            
            if not version1 or not version2:
                return None
            
            # Compare the plans
            plan1 = version1.plan_json
            plan2 = version2.plan_json
            
            differences = self._compare_plan_structures(plan1, plan2)
            
            return {
                "version1": {
                    "id": version1.id,
                    "version_number": version1.version_number,
                    "created_at": version1.created_at.isoformat(),
                    "change_description": version1.change_description
                },
                "version2": {
                    "id": version2.id,
                    "version_number": version2.version_number,
                    "created_at": version2.created_at.isoformat(),
                    "change_description": version2.change_description
                },
                "differences": differences
            }
            
        except Exception as e:
            print(f"[PlanVersionService] ❌ Error comparing versions: {str(e)}")
            return None
    
    def _compare_plan_structures(
        self,
        plan1: Dict[str, Any],
        plan2: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compare two plan structures and identify differences
        """
        differences = {
            "morning_routine_changed": False,
            "daily_plans_changed": False,
            "weekly_challenges_changed": False,
            "specific_changes": []
        }
        
        # Compare morning routine
        morning1 = plan1.get("morningLaunchpad", [])
        morning2 = plan2.get("morningLaunchpad", [])
        if morning1 != morning2:
            differences["morning_routine_changed"] = True
            differences["specific_changes"].append({
                "type": "morning_routine",
                "description": f"Morning routine changed from {len(morning1)} items to {len(morning2)} items"
            })
        
        # Compare daily plans
        days1 = plan1.get("days", [])
        days2 = plan2.get("days", [])
        if days1 != days2:
            differences["daily_plans_changed"] = True
            
            # Find specific day changes
            for i, (day1, day2) in enumerate(zip(days1, days2)):
                if day1 != day2:
                    day_number = i + 1
                    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                    day_name = day_names[i] if i < 7 else f"Day {day_number}"
                    
                    differences["specific_changes"].append({
                        "type": "daily_plan",
                        "day": day_number,
                        "day_name": day_name,
                        "description": f"Changes made to {day_name}'s plan"
                    })
        
        # Compare weekly challenges
        challenges1 = plan1.get("challenges", [])
        challenges2 = plan2.get("challenges", [])
        if challenges1 != challenges2:
            differences["weekly_challenges_changed"] = True
            differences["specific_changes"].append({
                "type": "weekly_challenges",
                "description": f"Weekly challenges changed from {len(challenges1)} to {len(challenges2)} challenges"
            })
        
        return differences
    
    def get_change_summary(
        self,
        user_id: int,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get a summary of recent plan changes
        """
        try:
            from datetime import timedelta
            cutoff_date = datetime.now() - timedelta(days=days)
            
            recent_changes = self.db.query(PlanVersionHistory).filter(
                and_(
                    PlanVersionHistory.user_id == user_id,
                    PlanVersionHistory.created_at >= cutoff_date,
                    PlanVersionHistory.is_active == 1
                )
            ).order_by(desc(PlanVersionHistory.created_at)).all()
            
            summary = {
                "total_changes": len(recent_changes),
                "change_types": {},
                "recent_activity": []
            }
            
            for change in recent_changes:
                # Count change types
                change_type = change.change_type
                summary["change_types"][change_type] = summary["change_types"].get(change_type, 0) + 1
                
                # Add to recent activity
                summary["recent_activity"].append({
                    "id": change.id,
                    "version_number": change.version_number,
                    "created_at": change.created_at.isoformat(),
                    "change_type": change.change_type,
                    "change_description": change.change_description,
                    "changed_by": change.changed_by
                })
            
            return summary
            
        except Exception as e:
            print(f"[PlanVersionService] ❌ Error getting change summary: {str(e)}")
            return {"total_changes": 0, "change_types": {}, "recent_activity": []} 