ALTER TABLE novel_bookshelf ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE novel_bookshelf ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP;

UPDATE novel_bookshelf bs
SET last_read_at = rp.updated_at
FROM novel_reading_progress rp
WHERE bs.user_id = rp.user_id
  AND bs.book_id = rp.book_id
  AND bs.last_read_at IS NULL;
