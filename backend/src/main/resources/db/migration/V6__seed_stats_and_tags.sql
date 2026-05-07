-- Seed stats and tags for existing books so detail page shows real data
-- Uses WHERE EXISTS to be idempotent and skip missing books

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.2, 128, 3500, 892, 12800
FROM novel_book b
WHERE b.title = '星河旧梦'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.5, 256, 6200, 1530, 21500
FROM novel_book b
WHERE b.title = '长街有雨'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.7, 489, 12800, 3200, 38000
FROM novel_book b
WHERE b.title = '山海小札'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.3, 78, 1800, 420, 6200
FROM novel_book b
WHERE b.title = '雾港来信'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 0, 0, 0, 0, 0
FROM novel_book b
WHERE b.title = '翻页测试：长夜行'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 0, 0, 0, 0, 0
FROM novel_book b
WHERE b.title = '外部导入测试：情色文学百科'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

-- Tags for 星河旧梦
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '科幻', 1 FROM novel_book b WHERE b.title = '星河旧梦'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '科幻');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '星际', 2 FROM novel_book b WHERE b.title = '星河旧梦'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '星际');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '冒险', 3 FROM novel_book b WHERE b.title = '星河旧梦'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '冒险');

-- Tags for 长街有雨
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '都市', 1 FROM novel_book b WHERE b.title = '长街有雨'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '都市');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '治愈', 2 FROM novel_book b WHERE b.title = '长街有雨'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '治愈');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '重逢', 3 FROM novel_book b WHERE b.title = '长街有雨'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '重逢');

-- Tags for 山海小札
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '玄幻', 1 FROM novel_book b WHERE b.title = '山海小札'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '玄幻');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '少年', 2 FROM novel_book b WHERE b.title = '山海小札'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '少年');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '热血', 3 FROM novel_book b WHERE b.title = '山海小札'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '热血');

-- Tags for 雾港来信
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '悬疑', 1 FROM novel_book b WHERE b.title = '雾港来信'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '悬疑');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '历史', 2 FROM novel_book b WHERE b.title = '雾港来信'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '历史');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '档案', 3 FROM novel_book b WHERE b.title = '雾港来信'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '档案');
