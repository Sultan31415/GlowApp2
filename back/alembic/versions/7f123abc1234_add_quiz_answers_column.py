from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '7f123abc1234'
down_revision = 'add_missing_chat_message_columns'  # merge with main branch
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('user_assessments', sa.Column('quiz_answers', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('user_assessments', 'quiz_answers') 