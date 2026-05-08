ALTER TABLE novel_comment ADD COLUMN IF NOT EXISTS comment_type VARCHAR(20) DEFAULT 'REVIEW';
ALTER TABLE novel_comment ADD COLUMN IF NOT EXISTS paragraph_index INT;
ALTER TABLE novel_comment ADD COLUMN IF NOT EXISTS quote_text VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_comment_type ON novel_comment(comment_type);
