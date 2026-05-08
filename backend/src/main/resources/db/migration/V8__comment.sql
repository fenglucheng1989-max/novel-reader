CREATE TABLE IF NOT EXISTS novel_comment (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    book_id    BIGINT NOT NULL,
    chapter_id BIGINT,
    content    VARCHAR(1000) NOT NULL,
    like_count INT DEFAULT 0,
    status     VARCHAR(20) DEFAULT 'NORMAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES novel_book(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES novel_chapter(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_comment_book ON novel_comment(book_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_chapter ON novel_comment(chapter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_user ON novel_comment(user_id);
