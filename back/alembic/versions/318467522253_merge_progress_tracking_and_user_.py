"""merge_progress_tracking_and_user_preferences

Revision ID: 318467522253
Revises: add_progress_tracking_tables, add_user_preferences_fields
Create Date: 2025-07-28 11:59:07.150578

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '318467522253'
down_revision: Union[str, None] = ('add_progress_tracking_tables', 'add_user_preferences_fields')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
