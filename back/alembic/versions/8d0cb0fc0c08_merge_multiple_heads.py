"""merge_multiple_heads

Revision ID: 8d0cb0fc0c08
Revises: 48c046bb5ebc, add_plan_version_history_001
Create Date: 2025-07-30 17:49:45.532239

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d0cb0fc0c08'
down_revision: Union[str, None] = ('48c046bb5ebc', 'add_plan_version_history_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
