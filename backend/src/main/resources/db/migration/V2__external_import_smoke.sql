INSERT INTO novel_category(name, sort_order)
SELECT '外部导入', 99
WHERE NOT EXISTS (SELECT 1 FROM novel_category WHERE name = '外部导入');

INSERT INTO novel_book(
    title,
    author,
    category_id,
    description,
    cover_url,
    status,
    word_count,
    chapter_count,
    latest_chapter_title,
    source_type,
    sort_order
)
SELECT
    '外部导入测试：情色文学百科',
    'xbookcn.net',
    c.id,
    '来源：https://blog.xbookcn.net/2000/01/topbaike.html。本条用于验证外部网页导入链路，仅保存页面标题、来源与经过净化的测试正文，不导入原站露骨正文。',
    '',
    'COMPLETED',
    780,
    1,
    '第一章 导入样本说明',
    'EXTERNAL',
    90
FROM novel_category c
WHERE c.name = '外部导入'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '外部导入测试：情色文学百科');

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT
    b.id,
    1,
    '第一章 导入样本说明',
    780,
    '这是一次外部网页导入链路测试。导入来源为 xbookcn.net 站内的文学百科页面，测试目标不是复刻原文，而是验证我们能从外部网页识别标题、来源地址、分类归属，并将整理后的内容进入书城、详情页、章节目录和阅读器。

实际产品中，外部导入应当经过版权、内容安全和格式清洗三道检查。第一步保留来源 URL、抓取时间、页面标题和解析状态。第二步过滤明显不适合展示的正文内容，避免将露骨、侵权或来源不明的文本直接进入书库。第三步才把安全后的章节写入数据库，并允许用户在阅读器中验证排版、滚动和进度保存。

本章正文为占位说明文本，刻意不包含原页面的大段内容。它用于模拟导入后的长段落阅读体验：段落应正常换行，阅读器应支持滚动，顶部与底部工具栏不应遮挡正文，用户修改字号、行距或主题后，页面布局应保持稳定。后续若要做真正的导入功能，建议新增导入任务表、来源站点配置、解析规则、失败重试和内容审核状态。

本次测试结论可以这样理解：外部来源已经能够被登记为一本书，来源信息进入简介，章节正文进入阅读器。接下来需要做的不是继续扩大抓取范围，而是把导入入口产品化，例如提供 URL 输入、预览解析结果、手动确认分类和章节标题，再由管理员确认入库。'
FROM novel_book b
WHERE b.title = '外部导入测试：情色文学百科'
  AND NOT EXISTS (
      SELECT 1
      FROM novel_chapter c
      WHERE c.book_id = b.id AND c.chapter_no = 1
  );
