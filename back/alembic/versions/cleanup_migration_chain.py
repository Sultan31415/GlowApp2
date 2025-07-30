"""cleanup_migration_chain

Revision ID: cleanup_migration_chain
Revises: 206ad674720a
Create Date: 2025-07-29 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'cleanup_migration_chain'
down_revision: Union[str, None] = '206ad674720a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This migration is just to clean up the migration chain
    # No database changes needed
    pass


def downgrade() -> None:
    # No database changes needed
    pass 