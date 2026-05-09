CREATE TABLE IF NOT EXISTS novel_favorite (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_book_favorite UNIQUE (user_id, book_id)
);

ALTER TABLE app_user ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'NORMAL';

INSERT INTO app_user(username, password_hash, email, role, status)
SELECT 'admin', '{noop}admin123', 'admin@yuedu.com', 'ADMIN', 'NORMAL'
WHERE NOT EXISTS (SELECT 1 FROM app_user WHERE username = 'admin');
