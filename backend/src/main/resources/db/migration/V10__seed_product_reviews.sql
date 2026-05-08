INSERT INTO app_user(username, password_hash, email)
SELECT '清风读者', '{noop}reader123', 'reader01@example.com'
WHERE NOT EXISTS (SELECT 1 FROM app_user WHERE username = '清风读者');

INSERT INTO app_user(username, password_hash, email)
SELECT '港口来信', '{noop}reader123', 'reader02@example.com'
WHERE NOT EXISTS (SELECT 1 FROM app_user WHERE username = '港口来信');

INSERT INTO app_user(username, password_hash, email)
SELECT '错字猎手', '{noop}reader123', 'reader03@example.com'
WHERE NOT EXISTS (SELECT 1 FROM app_user WHERE username = '错字猎手');

INSERT INTO novel_comment(user_id, book_id, chapter_id, content, comment_type, paragraph_index, quote_text, like_count, status)
SELECT u.id, 4, NULL, '雾港的设定很稳，档案修复师这个职业一出来就有悬疑感，读起来像拆一封被海雾泡软的旧信。', 'REVIEW', NULL, NULL, 126, 'NORMAL'
FROM app_user u
WHERE u.username = '清风读者'
  AND EXISTS (SELECT 1 FROM novel_book WHERE id = 4)
  AND NOT EXISTS (SELECT 1 FROM novel_comment WHERE book_id = 4 AND content LIKE '雾港的设定很稳%');

INSERT INTO novel_comment(user_id, book_id, chapter_id, content, comment_type, paragraph_index, quote_text, like_count, status)
SELECT u.id, 4, NULL, '第二章开始节奏更紧了，盐损档案柜这个意象很有画面，适合做主推书评。', 'REVIEW', NULL, NULL, 84, 'NORMAL'
FROM app_user u
WHERE u.username = '港口来信'
  AND EXISTS (SELECT 1 FROM novel_book WHERE id = 4)
  AND NOT EXISTS (SELECT 1 FROM novel_comment WHERE book_id = 4 AND content LIKE '第二章开始节奏更紧了%');

INSERT INTO novel_comment(user_id, book_id, chapter_id, content, comment_type, paragraph_index, quote_text, like_count, status)
SELECT u.id, 4, 8, '这里的环境描写很抓人，海雾、档案柜和旧港气味都连上了。', 'PARAGRAPH', 0, '盐损档案柜在地下二层尽头。', 32, 'NORMAL'
FROM app_user u
WHERE u.username = '清风读者'
  AND EXISTS (SELECT 1 FROM novel_chapter WHERE id = 8)
  AND NOT EXISTS (SELECT 1 FROM novel_comment WHERE chapter_id = 8 AND comment_type = 'PARAGRAPH' AND paragraph_index = 0);

INSERT INTO novel_comment(user_id, book_id, chapter_id, content, comment_type, paragraph_index, quote_text, like_count, status)
SELECT u.id, 4, 8, '疑似错字反馈：这里可以检查一下“盐损”前后的标点是否统一。', 'TYPO', 1, '钥匙转动时发出很轻的咔哒声', 0, 'NORMAL'
FROM app_user u
WHERE u.username = '错字猎手'
  AND EXISTS (SELECT 1 FROM novel_chapter WHERE id = 8)
  AND NOT EXISTS (SELECT 1 FROM novel_comment WHERE chapter_id = 8 AND comment_type = 'TYPO' AND paragraph_index = 1);
