from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '7f123abc1234'
down_revision = '206ad674720a'  # reference the vector migration
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('user_assessments', sa.Column('quiz_answers', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('user_assessments', 'quiz_answers') 