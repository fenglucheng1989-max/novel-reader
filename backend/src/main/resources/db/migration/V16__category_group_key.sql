ALTER TABLE novel_category ADD COLUMN IF NOT EXISTS group_key VARCHAR(20);

UPDATE novel_category SET group_key = 'male' WHERE name IN ('玄幻','都市','科幻','历史','仙侠','异能','武侠','悬疑');
UPDATE novel_category SET group_key = 'female' WHERE name = '言情';

INSERT INTO novel_category(name, parent_id, sort_order, group_key)
SELECT '听书', 0, 10, 'audio'
WHERE NOT EXISTS (SELECT 1 FROM novel_category WHERE name = '听书');

INSERT INTO novel_category(name, parent_id, sort_order, group_key)
SELECT '短剧', 0, 11, 'short'
WHERE NOT EXISTS (SELECT 1 FROM novel_category WHERE name = '短剧');
