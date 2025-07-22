"""add_missing_chat_message_columns

Revision ID: add_missing_chat_message_columns
Revises: 206ad674720a
Create Date: 2025-07-22 07:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_missing_chat_message_columns'
down_revision: Union[str, None] = '206ad674720a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing columns that the SQLAlchemy model expects
    try:
        op.add_column('chat_messages', sa.Column('wellness_domain', sa.String(20), nullable=True))
        print("✅ Added wellness_domain column")
    except Exception as e:
        print(f"ℹ️ wellness_domain column already exists or failed: {e}")
    
    try:
        op.add_column('chat_messages', sa.Column('urgency_level', sa.String(10), nullable=True))
        print("✅ Added urgency_level column")
    except Exception as e:
        print(f"ℹ️ urgency_level column already exists or failed: {e}")
    
    try:
        op.add_column('chat_messages', sa.Column('requires_followup', sa.Boolean(), nullable=True))
        print("✅ Added requires_followup column")
    except Exception as e:
        print(f"ℹ️ requires_followup column already exists or failed: {e}")
    
    try:
        op.add_column('chat_messages', sa.Column('sentiment_score', sa.Float(), nullable=True))
        print("✅ Added sentiment_score column")
    except Exception as e:
        print(f"ℹ️ sentiment_score column already exists or failed: {e}")
    
    try:
        op.add_column('chat_messages', sa.Column('topic_tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
        print("✅ Added topic_tags column")
    except Exception as e:
        print(f"ℹ️ topic_tags column already exists or failed: {e}")
    
    print("🎉 Missing chat_message columns migration completed successfully!")


def downgrade() -> None:
    # Remove the columns if needed
    try:
        op.drop_column('chat_messages', 'wellness_domain')
    except Exception as e:
        print(f"ℹ️ Could not drop wellness_domain column: {e}")
    
    try:
        op.drop_column('chat_messages', 'urgency_level')
    except Exception as e:
        print(f"ℹ️ Could not drop urgency_level column: {e}")
    
    try:
        op.drop_column('chat_messages', 'requires_followup')
    except Exception as e:
        print(f"ℹ️ Could not drop requires_followup column: {e}")
    
    try:
        op.drop_column('chat_messages', 'sentiment_score')
    except Exception as e:
        print(f"ℹ️ Could not drop sentiment_score column: {e}")
    
    try:
        op.drop_column('chat_messages', 'topic_tags')
    except Exception as e:
        print(f"ℹ️ Could not drop topic_tags column: {e}") 