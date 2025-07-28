"""merge user preferences and quiz answers branches

Revision ID: c8d61e4a6aee
Revises: 7f123abc1234, add_user_preferences_table
Create Date: 2025-07-28 11:44:44.441062

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8d61e4a6aee'
down_revision: Union[str, None] = ('7f123abc1234', 'add_user_preferences_table')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
