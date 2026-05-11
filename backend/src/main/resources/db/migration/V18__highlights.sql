CREATE TABLE novel_highlight (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    book_id         BIGINT NOT NULL,
    book_title      VARCHAR(200),
    chapter_no      INT NOT NULL,
    paragraph_index INT NOT NULL DEFAULT 0,
    quote_text      TEXT NOT NULL,
    color           VARCHAR(20) DEFAULT '#FFEB3B',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_novel_highlight_user ON novel_highlight(user_id);
CREATE INDEX idx_novel_highlight_user_book ON novel_highlight(user_id, book_id);
