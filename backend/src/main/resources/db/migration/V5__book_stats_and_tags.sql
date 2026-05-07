CREATE TABLE IF NOT EXISTS novel_book_stats (
    book_id              BIGINT PRIMARY KEY,
    rating               NUMERIC(3,1) DEFAULT 0,
    rating_count         INT DEFAULT 0,
    reading_count        INT DEFAULT 0,
    favorite_count       INT DEFAULT 0,
    view_count           INT DEFAULT 0,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES novel_book(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS novel_book_tag (
    id         BIGSERIAL PRIMARY KEY,
    book_id    BIGINT NOT NULL,
    tag        VARCHAR(50) NOT NULL,
    sort_order INT DEFAULT 0,
    UNIQUE(book_id, tag),
    FOREIGN KEY (book_id) REFERENCES novel_book(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_novel_book_tag_book ON novel_book_tag(book_id);
