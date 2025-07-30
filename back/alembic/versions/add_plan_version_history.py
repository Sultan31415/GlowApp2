"""add_plan_version_history

Revision ID: add_plan_version_history_001
Revises: f10c765e40a2
Create Date: 2025-07-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_plan_version_history_001'
down_revision: Union[str, None] = 'f10c765e40a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create plan_version_history table
    op.create_table('plan_version_history',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.INTEGER(), nullable=False),
        sa.Column('plan_id', sa.INTEGER(), nullable=False),
        sa.Column('version_number', sa.INTEGER(), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('plan_json', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('plan_type', sa.VARCHAR(length=32), nullable=False),
        sa.Column('change_type', sa.VARCHAR(length=50), nullable=False),
        sa.Column('change_description', sa.TEXT(), nullable=True),
        sa.Column('changed_fields', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('previous_values', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('changed_by', sa.VARCHAR(length=50), nullable=False),
        sa.Column('is_active', sa.INTEGER(), nullable=False),
        sa.ForeignKeyConstraint(['plan_id'], ['daily_plans.id'], name='plan_version_history_plan_id_fkey'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='plan_version_history_user_id_fkey'),
        sa.PrimaryKeyConstraint('id', name='plan_version_history_pkey')
    )
    
    # Create indexes
    op.create_index('ix_plan_version_history_user_id', 'plan_version_history', ['user_id'], unique=False)
    op.create_index('ix_plan_version_history_plan_id', 'plan_version_history', ['plan_id'], unique=False)
    op.create_index('ix_plan_version_history_version_number', 'plan_version_history', ['version_number'], unique=False)
    op.create_index('ix_plan_version_history_created_at', 'plan_version_history', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_plan_version_history_created_at', table_name='plan_version_history')
    op.drop_index('ix_plan_version_history_version_number', table_name='plan_version_history')
    op.drop_index('ix_plan_version_history_plan_id', table_name='plan_version_history')
    op.drop_index('ix_plan_version_history_user_id', table_name='plan_version_history')
    
    # Drop table
    op.drop_table('plan_version_history') 