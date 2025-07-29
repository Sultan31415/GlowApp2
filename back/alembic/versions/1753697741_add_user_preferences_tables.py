"""Add user preferences and custom habits tables

Revision ID: add_user_preferences_tables
Revises: f10c765e40a2
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_user_preferences_tables'
down_revision = 'f10c765e40a2'
branch_labels = None
depends_on = None


def upgrade():
    # Create user_preferences table
    op.create_table('user_preferences',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.INTEGER(), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('custom_morning_routine', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('custom_evening_routine', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('custom_habits', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('preferred_wake_time', sa.VARCHAR(length=10), nullable=True),
        sa.Column('preferred_sleep_time', sa.VARCHAR(length=10), nullable=True),
        sa.Column('preferred_exercise_time', sa.VARCHAR(length=20), nullable=True),
        sa.Column('preferred_exercise_intensity', sa.VARCHAR(length=20), nullable=True),
        sa.Column('work_schedule', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('family_obligations', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('dietary_preferences', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('cultural_context', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('primary_goals', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('focus_areas', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('avoid_areas', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('preferred_motivation_style', sa.VARCHAR(length=20), nullable=True),
        sa.Column('preferred_planning_style', sa.VARCHAR(length=20), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='user_preferences_user_id_fkey'),
        sa.PrimaryKeyConstraint('id', name='user_preferences_pkey')
    )
    op.create_index('ix_user_preferences_id', 'user_preferences', ['id'], unique=False)
    op.create_index('ix_user_preferences_user_id', 'user_preferences', ['user_id'], unique=False)

    # Create custom_habits table
    op.create_table('custom_habits',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.INTEGER(), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('name', sa.VARCHAR(length=100), nullable=False),
        sa.Column('description', sa.VARCHAR(length=500), nullable=True),
        sa.Column('category', sa.VARCHAR(length=50), nullable=False),
        sa.Column('trigger', sa.VARCHAR(length=200), nullable=True),
        sa.Column('action', sa.VARCHAR(length=200), nullable=False),
        sa.Column('reward', sa.VARCHAR(length=200), nullable=True),
        sa.Column('difficulty_level', sa.VARCHAR(length=20), nullable=True),
        sa.Column('frequency', sa.VARCHAR(length=20), nullable=True),
        sa.Column('estimated_duration', sa.VARCHAR(length=20), nullable=True),
        sa.Column('is_active', sa.VARCHAR(length=10), nullable=False),
        sa.Column('last_completed', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('completion_count', sa.INTEGER(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='custom_habits_user_id_fkey'),
        sa.PrimaryKeyConstraint('id', name='custom_habits_pkey')
    )
    op.create_index('ix_custom_habits_id', 'custom_habits', ['id'], unique=False)
    op.create_index('ix_custom_habits_user_id', 'custom_habits', ['user_id'], unique=False)


def downgrade():
    op.drop_index('ix_custom_habits_user_id', table_name='custom_habits')
    op.drop_index('ix_custom_habits_id', table_name='custom_habits')
    op.drop_table('custom_habits')
    op.drop_index('ix_user_preferences_user_id', table_name='user_preferences')
    op.drop_index('ix_user_preferences_id', table_name='user_preferences')
    op.drop_table('user_preferences') 