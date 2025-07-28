"""merge_heads

Revision ID: 750939ba8628
Revises: 318467522253, c8d61e4a6aee
Create Date: 2025-07-28 14:26:20.313764

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '750939ba8628'
down_revision: Union[str, None] = ('318467522253', 'c8d61e4a6aee')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
