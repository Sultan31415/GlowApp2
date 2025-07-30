"""merge_multiple_heads

Revision ID: 48c046bb5ebc
Revises: add_user_preferences_tables, 7f123abc1234, cleanup_migration_chain
Create Date: 2025-07-29 18:49:09.893019

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '48c046bb5ebc'
down_revision: Union[str, None] = ('add_user_preferences_tables', '7f123abc1234', 'cleanup_migration_chain')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
