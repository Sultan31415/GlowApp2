"""add_progress_tracking_tables

Revision ID: add_progress_tracking_tables
Revises: add_missing_chat_message_columns
Create Date: 2025-01-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_progress_tracking_tables'
down_revision: Union[str, None] = 'add_missing_chat_message_columns'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create habit_completions table
    op.create_table(
        'habit_completions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('assessment_id', sa.Integer(), sa.ForeignKey('user_assessments.id'), nullable=True, index=True),
        sa.Column('daily_plan_id', sa.Integer(), sa.ForeignKey('daily_plans.id'), nullable=True, index=True),
        sa.Column('habit_type', sa.String(50), nullable=False),  # 'morning_routine', 'system_building', 'deep_focus', 'evening_reflection', 'weekly_challenge'
        sa.Column('habit_content', sa.Text(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('day_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.UniqueConstraint('user_id', 'habit_type', 'day_date', name='uq_habit_completion_user_type_date')
    )
    
    # Create indexes for better query performance
    op.create_index('ix_habit_completions_user_date', 'habit_completions', ['user_id', 'day_date'])
    op.create_index('ix_habit_completions_type_date', 'habit_completions', ['habit_type', 'day_date'])
    
    # Create progress_snapshots table
    op.create_table(
        'progress_snapshots',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('assessment_id', sa.Integer(), sa.ForeignKey('user_assessments.id'), nullable=True, index=True),
        sa.Column('snapshot_date', sa.Date(), nullable=False),
        sa.Column('overall_glow_score', sa.Integer(), nullable=True),
        sa.Column('category_scores', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('biological_age', sa.Integer(), nullable=True),
        sa.Column('emotional_age', sa.Integer(), nullable=True),
        sa.Column('chronological_age', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('user_id', 'snapshot_date', name='uq_progress_snapshot_user_date')
    )
    
    # Create indexes for progress snapshots
    op.create_index('ix_progress_snapshots_user_date', 'progress_snapshots', ['user_id', 'snapshot_date'])
    
    print("✅ Progress tracking tables created successfully!")


def downgrade() -> None:
    # Remove indexes
    try:
        op.drop_index('ix_progress_snapshots_user_date', table_name='progress_snapshots')
    except:
        pass
    
    try:
        op.drop_index('ix_habit_completions_type_date', table_name='habit_completions')
    except:
        pass
    
    try:
        op.drop_index('ix_habit_completions_user_date', table_name='habit_completions')
    except:
        pass
    
    # Remove tables
    try:
        op.drop_table('progress_snapshots')
    except:
        pass
    
    try:
        op.drop_table('habit_completions')
    except:
        pass 