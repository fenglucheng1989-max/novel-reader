-- Add new categories (idempotent via WHERE NOT EXISTS for H2 + PostgreSQL compatibility)
INSERT INTO novel_category(id, name, sort_order)
SELECT 6, '仙侠', 5 WHERE NOT EXISTS (SELECT 1 FROM novel_category WHERE id = 6);
INSERT INTO novel_category(id, name, sort_order)
SELECT 7, '异能', 6 WHERE NOT EXISTS (SELECT 1 FROM novel_category WHERE id = 7);
INSERT INTO novel_category(id, name, sort_order)
SELECT 8, '言情', 7 WHERE NOT EXISTS (SELECT 1 FROM novel_category WHERE id = 8);
INSERT INTO novel_category(id, name, sort_order)
SELECT 9, '武侠', 8 WHERE NOT EXISTS (SELECT 1 FROM novel_category WHERE id = 9);
INSERT INTO novel_category(id, name, sort_order)
SELECT 10, '悬疑', 9 WHERE NOT EXISTS (SELECT 1 FROM novel_category WHERE id = 10);

-- Update existing books with real cover images
UPDATE novel_book SET cover_url = 'https://picsum.photos/seed/star-dream/360/520' WHERE title = '星河旧梦' AND (cover_url IS NULL OR cover_url = '' OR cover_url LIKE '/static/covers/%');
UPDATE novel_book SET cover_url = 'https://picsum.photos/seed/rain-street/360/520' WHERE title = '长街有雨' AND (cover_url IS NULL OR cover_url = '' OR cover_url LIKE '/static/covers/%');
UPDATE novel_book SET cover_url = 'https://picsum.photos/seed/mountain-sea/360/520' WHERE title = '山海小札' AND (cover_url IS NULL OR cover_url = '' OR cover_url LIKE '/static/covers/%');
UPDATE novel_book SET cover_url = 'https://picsum.photos/seed/fog-harbor/360/520' WHERE title = '雾港来信' AND (cover_url IS NULL OR cover_url = '' OR cover_url LIKE '/static/covers/%');
UPDATE novel_book SET cover_url = 'https://picsum.photos/seed/night-walk/360/520' WHERE title = '翻页测试：长夜行' AND (cover_url IS NULL OR cover_url = '' OR cover_url LIKE '/static/covers/%');

-- ============================================================
-- 仙侠 (Xianxia)
-- ============================================================

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '剑道长生', '青衫客', c.id,
  '山村少年陆尘偶然得到一柄断剑，剑中有残魂传他无上剑诀。从此凡尘俗世难困真龙，九天十地任我纵横。且看一介凡人如何以剑为笔，在天地间写下属于自己的长生传说。',
  'https://picsum.photos/seed/sword-path/360/520',
  'ONGOING', 58000, 3, '第三章 剑意初成', 'MANUAL', 10
FROM novel_category c WHERE c.name = '仙侠'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '剑道长生');

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '仙门九重', '紫霄散人', c.id,
  '修仙界有九重仙门，每推开一重便得一道天赐神通。少女苏九音天生经脉尽断，却在第十六年觉醒了一双能看穿仙门玄机的眼眸。那些高高在上的仙门天骄不知道，被他们视为废人的女孩，正在一扇扇推开他们推不开的门。',
  'https://picsum.photos/seed/immortal-gate/360/520',
  'ONGOING', 42000, 2, '第二章 第一重门', 'MANUAL', 11
FROM novel_category c WHERE c.name = '仙侠'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '仙门九重');

-- ============================================================
-- 玄幻 (Xuanhuan)
-- ============================================================

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '万界神皇', '墨白', c.id,
  '少年林凡身怀神秘血脉，在一场意外中觉醒上古神皇传承。万界争锋，群雄逐鹿，他从最底层一步步踏上诸天巅峰。神皇之路，尸骨铺就；万界之上，唯我独尊。',
  'https://picsum.photos/seed/myriad-realms/360/520',
  'ONGOING', 65000, 3, '第三章 血脉觉醒', 'MANUAL', 12
FROM novel_category c WHERE c.name = '玄幻'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '万界神皇');

-- ============================================================
-- 异能 (Superpower)
-- ============================================================

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '时间猎手', '钟离', c.id,
  '刑警陈默在一次追捕中头部受伤，醒来后发现自己每次触碰案发现场的物品，都能回溯看见七分钟前发生的事情。七分钟，足够凶手逃离，也足够他找到破绽。但有些秘密藏在时间深处，触碰的次数越多，他越感觉到有什么东西正在时间的另一头凝视着他。',
  'https://picsum.photos/seed/time-hunter/360/520',
  'ONGOING', 38000, 2, '第二章 七分钟的秘密', 'MANUAL', 13
FROM novel_category c WHERE c.name = '异能'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '时间猎手');

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '读心者', '白夜', c.id,
  '大二学生林溪在某天清晨醒来，忽然能听见别人心里的声音。一开始只是零散的词句，后来是完整的念头和记忆。她以为这是一种幸运，直到她听见室友心里正在反复策划一起谋杀。而被谋杀的对象，就是她自己。',
  'https://picsum.photos/seed/mind-reader/360/520',
  'ONGOING', 31000, 2, '第二章 室友的秘密', 'MANUAL', 14
FROM novel_category c WHERE c.name = '异能'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '读心者');

-- ============================================================
-- 言情 (Romance)
-- ============================================================

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '南风知我意', '苏晚', c.id,
  '顾南风是律所最年轻的合伙人，冷静理智得不像凡人。乔意是花店里笨手笨脚的店主，每天最大的烦恼是记不住花的拉丁文名。他们隔着一条街做了三年陌生人，直到一场突如其来的暴雨，把他推进了她的花店。从此顾律师多了一个客户：一个永远听不懂法律术语的花店姑娘。',
  'https://picsum.photos/seed/southern-wind/360/520',
  'COMPLETED', 24000, 2, '第二章 第三种可能（完）', 'MANUAL', 15
FROM novel_category c WHERE c.name = '言情'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '南风知我意');

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '余生漫漫', '沉舟', c.id,
  '季迢迢因为一次体检误诊，决定在"最后三个月"里把没敢做的事全做一遍。她辞了职，买了机票，在机场遇到同样逃了十年的男人。两个人都以为这是终点，没想到命运给了他们一个最荒唐的转折——体检报告错了。于是他们必须面对一个比死亡更难的问题：接下来怎么活。',
  'https://picsum.photos/seed/long-life/360/520',
  'COMPLETED', 29000, 2, '第二章 后来（完）', 'MANUAL', 16
FROM novel_category c WHERE c.name = '言情'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '余生漫漫');

-- ============================================================
-- 武侠 (Wuxia)
-- ============================================================

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '江湖夜雨', '江南雪', c.id,
  '武林盟主谢长渊在巅峰之夜坠崖失踪，十年后江湖上多了一个卖馄饨的中年人。他煮馄饨的手法平凡，用刀的方式却不平凡。当旧日仇敌一个个出现在小镇上，他才发现十年前那场围攻背后藏着一个江湖最大的谎言。桃李春风一杯酒，江湖夜雨十年灯。',
  'https://picsum.photos/seed/night-rain/360/520',
  'ONGOING', 36000, 2, '第二章 馄饨铺的秘密', 'MANUAL', 17
FROM novel_category c WHERE c.name = '武侠'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '江湖夜雨');

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '剑出天山', '顾北', c.id,
  '天山剑派覆灭那天，掌门幼女叶寒霜被一名老仆抱进密道逃出生天。十五年后，她背着师父传下的残缺剑谱走出深山，却发现当年灭门的凶手们个个都已位高权重。她只有一把剑、半本剑谱，和一句师父临终前的话：剑出天山，莫问归途。从此她踏上了一条注定孤独的复仇之路，从西域大漠到江南水乡，从江湖草莽到朝堂之上，她遇到了形形色色的人——有人对她伸出援手，有人对她暗藏杀机，更有人在暗中默默守护。她的剑法在血与火的淬炼中愈发凌厉，但她也逐渐发现，当年的灭门惨案背后隐藏着一个远比复仇更加深重的阴谋。这个阴谋牵涉到整个武林的命运，甚至关乎天下苍生的存亡。当真相一层层剥开，她必须在仇恨与大义之间做出抉择。',
  'https://picsum.photos/seed/tian-shan-sword/360/520',
  'ONGOING', 41000, 2, '第二章 长安故人', 'MANUAL', 18
FROM novel_category c WHERE c.name = '武侠'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '剑出天山');

-- ============================================================
-- 悬疑 (Suspense)
-- ============================================================

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '第十二夜', '暗泉', c.id,
  '心理医生沈渡接到一个特殊病人。病人声称自己连续十一个夜晚做了同一个梦：梦见自己杀了同一个人。第十二天，梦里的受害者真的死了。沈渡翻看病人的治疗记录时发现了一行被反复涂改的字：医生的名字也在梦里。',
  'https://picsum.photos/seed/twelfth-night/360/520',
  'ONGOING', 26000, 2, '第二章 沈渡的梦', 'MANUAL', 19
FROM novel_category c WHERE c.name = '悬疑'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '第十二夜');

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '失踪者', '左岸', c.id,
  '滨城市连续失踪了七个人。他们年龄不同、职业不同、社会关系毫无交集。唯一共同点是：每个人失踪前三天，都在社交媒体上发过同一句诗——"我听见有人在喊我的名字"。刑警江寻在追查时偶然发现，所有失踪者手机里最后的GPS定位都指向同一个地点：一座已经废弃了二十年的小学。而他是那所小学最后一届毕业生。',
  'https://picsum.photos/seed/missing-one/360/520',
  'ONGOING', 34000, 2, '第二章 废弃教室', 'MANUAL', 20
FROM novel_category c WHERE c.name = '悬疑'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '失踪者');

-- ============================================================
-- 都市 (Urban) - extra
-- ============================================================

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
SELECT '逆光者', '九笙', c.id,
  '退役消防员程远在一场火灾后患上了光敏症，从此只能在夜间出门。白天他是一家小便利店的夜班店员，夜晚他是城市里最熟悉黑暗的人。某天凌晨，一个满身血迹的女孩冲进便利店，身后追来的人正好站在路灯下。程远关掉店里最后一盏灯，在黑暗中说：这里不欢迎光。',
  'https://picsum.photos/seed/against-light/360/520',
  'ONGOING', 30000, 2, '第二章 夜班守则', 'MANUAL', 21
FROM novel_category c WHERE c.name = '都市'
  AND NOT EXISTS (SELECT 1 FROM novel_book WHERE title = '逆光者');

-- ============================================================
-- Chapters for 剑道长生
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 断剑', 600,
  '青牛村坐落在落霞山脚下，村里人世代种田打猎，日子平淡如水。陆尘今年十六岁，在村中铁匠铺做学徒。这天傍晚，他去后山捡柴时踩塌了一处荒坟，整个人摔进地洞里。洞里有张石台，台上横放一柄断剑，剑身锈迹斑斑，剑柄却隐隐发烫。陆尘伸手触到剑柄时，一道苍老的声音在他脑中轰然响起："三千年了，终于有人来了。"他吓得跌坐在地，手中却不知何时已经握紧了剑柄。断剑内封着一缕残魂，自称青冥剑尊。剑尊说他当年一剑斩断天劫，却被仇家暗算，残魂寄于断剑等候传人。陆尘本想扔掉断剑逃回家，剑尊却说了句让他停住脚步的话："你想不想知道，你爹当年是怎么死的？"'
FROM novel_book b WHERE b.title = '剑道长生'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 引气入体', 600,
  '剑尊告诉陆尘，他父亲陆远山并非死于山崩，而是被修仙宗门青云谷的修士所杀。当年陆远山外出经商时无意间捡到一块天外陨铁，正是铸造青冥剑的关键材料。青云谷的人追查而来，陆远山宁死不肯交出陨铁的位置。陆尘听完沉默了很久，然后问剑尊修道的第一个境界是什么。引气入体。剑尊教他第一层口诀，让他在月出时分坐在村后溪边，以意念感应天地灵气。陆尘盘膝坐了一夜，直到晨光初现时，指尖终于泛起一丝微弱的青光。剑尊在识海中哈哈大笑："天资不错。三年之内，我要你踏入青云谷大门。"'
FROM novel_book b WHERE b.title = '剑道长生'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 3, '第三章 剑意初成', 600,
  '三月之后，陆尘体内灵气已成小溪。剑尊开始教他青冥剑诀第一式——破风。剑诀不在招式，在剑意。剑尊说真正的剑修从不拘泥于剑招，一招鲜吃遍天。陆尘在溪边挥剑三千次，直到手臂失去知觉，断剑上终于浮现出一道肉眼可见的青色剑芒。剑芒只有三寸长，却削铁如泥。剑尊满意地说可以了，再练下去就不是练剑，是练傻。第二天清晨，陆尘告别村中众人，背着一柄断剑踏上了通往青云山脉的官道。走了三里路，他回头看了一眼炊烟袅袅的青牛村，然后转身，再也没有回头。'
FROM novel_book b WHERE b.title = '剑道长生'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 3);

-- ============================================================
-- Chapters for 仙门九重
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 废脉少女', 550,
  '天元大陆，人人修炼。灵根是天生的，经脉是天赐的。苏九音出生在修仙世家苏家，却天生经脉尽断。她不能引气入体，不能修炼任何功法，甚至连最基本的聚灵阵都无法驱动。十六年来她受尽了族人的冷眼和嘲笑，父母也在一次外出后下落不明。族中长辈将她安置在最偏僻的后院，名义上是照顾，实际上是不想让她出现在会客场合丢了苏家的脸。苏九音每天做的事就是扫院子、洗衣裳、给外门弟子的灵兽喂食。偶尔，她会爬上后院最高的那棵梧桐树，眺望云层中隐隐浮动的仙门幻影。仙门九重，传说每推开一重便能得到一种天赐神通。她知道自己连第一重门的边都摸不到。直到那天夜里，梧桐树无风自动，树顶的叶子忽然全部指向同一个方向。苏九音低头，看见自己的手心浮现出了一道门形的纹路。门在发光。'
FROM novel_book b WHERE b.title = '仙门九重'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 第一重门', 550,
  '手心光芒散去后，苏九音的眼前出现了另一重景象。世界还是那个世界，但她能看见所有仙门的位置了。苏家祠堂后面的枯井底下有一扇，落霞峰半山腰的石壁里有一扇，甚至她每天喂食的那只三尾灵猫体内也封印着一扇未激活的门。更让她震惊的是，她能看见每个人体内灵气的走向——像一张透明的经脉图，哪里有阻塞，哪里流转不畅，都一目了然。这就是第一重门赐给她的神通：洞察。苏九音试着运转了一遍苏家最基础的引气诀，那些灵气在经过她断裂的经脉时本该消散，可不知道为什么，掌心的门纹竟然自动吸住了灵气，强行将它们"粘"回体内。虽然只能留住极少一丝，但这意味着她可以开始修炼了。苏九音站在梧桐树下，握紧拳头，手心的门纹静静发着光。'
FROM novel_book b WHERE b.title = '仙门九重'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

-- ============================================================
-- Chapters for 万界神皇
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 废材少年', 550,
  '天澜城林家是城中三大家族之一。林凡作为家主林震的独子，本该锦衣玉食，可自从三年前修炼天赋测试为零级后，他便成了整个林家的笑话。同族子弟叫他废物，连下人看他的眼神都带着怜悯。只有母亲每晚偷偷塞给他疗伤药——那是白天他在练武场被同族"切磋"时落下的伤。林凡不在乎这些。他在乎的是父亲两年前进入天渊秘境后再也没有回来。所有人都说林震已经陨落，只有他不信。他每晚都做梦，梦见一尊看不清面容的金色身影坐在王座上，王座下面是无数跪拜的星辰。金色身影每次都会对他说同一句话：你的血，不是凡人的血。这天，林凡在家族藏书阁的暗格里发现了一枚黑色戒指。戒指触手冰凉，表面刻着一行他不认识的古文字。当他戴上戒指的瞬间，金色身影第一次在白天出现了。'
FROM novel_book b WHERE b.title = '万界神皇'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 神皇戒', 550,
  '黑色戒指融入林凡的血肉，化成一道纹身绕在他的食指上。他的脑海中涌入了一股庞大的信息——万界神皇诀。这门功法不属于天澜城已知的任何修炼体系。修炼它不需要天赋灵根，只需要一个条件：神皇血脉。林凡体内的血脉在这一刻彻底苏醒。他感觉自己的骨骼像被重新锻造了一遍，经脉中流淌的不再是平凡的血液，而是一种带着金色微光的力量。书房中的灵气疯狂涌入他的身体，练气一层、二层、三层——短短一刻钟，他连续突破了三个境界。等他睁开眼时，书房的四面墙壁上出现了细密的裂纹。窗外，天澜城上空的云层不知何时变成了一种不祥的暗金色。'
FROM novel_book b WHERE b.title = '万界神皇'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 3, '第三章 血脉觉醒', 550,
  '天澜城外的妖兽森林中，林凡正在进行第一次真正的实战。神皇诀的修炼方式与众不同——它不是打坐吸收灵气，而是通过战斗来淬炼肉身和神魂。每一场生死之间的战斗都能让他的实力跳跃式提升。剑尊残魂说这叫"以战养战"，当年神皇就是靠这一手打穿了万界。林凡在森林中猎杀了一头三级妖兽铁背苍狼，浑身浴血地坐在狼尸旁感受着体内新增长的力量。练气五层。三天前他还是个零级废物，现在已经可以和族中核心子弟比肩了。但他知道这远远不够。天渊秘境三年后才会重新开启，他必须在那之前变得足够强。戒指里的金色身影再次浮现，这一次它说了一句让他血液凝固的话："你父亲还活着。但留给你救他的时间不多了。"'
FROM novel_book b WHERE b.title = '万界神皇'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 3);

-- ============================================================
-- Chapters for 时间猎手
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 第七分钟', 550,
  '陈默办案十一年，从没见过这么奇怪的现场。死者是滨城一家画廊的老板，死在自家客厅里，没有外伤，没有中毒迹象，法医初步判断是心脏骤停。但陈默注意到两个细节：死者的右手紧紧握拳，掰开后掌心有一张揉皱的纸条，上面写着一个时间——23:17。而墙上的挂钟正好停在二十三点十七分。同事说这是巧合，陈默说不信邪。他蹲下身，手指无意间碰到了死者手腕上的表带。下一瞬间，他的视野剧烈晃动，客厅变成了七分钟前的模样。死者还活着，正坐在沙发上翻一本画册。门口传来脚步声，有人正在推门。陈默想看清来人的脸，画面却消失了。他低头看表，自己只在幻觉中停留了不到一秒，现实中的秒针连一格都没跳完。'
FROM novel_book b WHERE b.title = '时间猎手'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 七分钟的秘密', 550,
  '法医走后，陈默独自留在现场试了第二次。这一次他主动触摸死者手边的咖啡杯。画面再次出现。七分钟前，一个穿着灰色连帽衫的人走进了客厅。来人没有摘帽，陈默看不清楚脸，但他注意到来人的右手手背上有一道陈旧的烧伤疤痕——和死者年轻时在部队留下的伤疤一模一样。死者看到来人时站了起来，脸上的表情不是恐惧，而是深深的愧疚。来人开口说了一句话，画面在此时静止。陈默能看清口型，读出来是：哥，你还记得那场火吗。陈默睁开眼，大口喘气。他知道这件案子不是心脏骤停那么简单了。'
FROM novel_book b WHERE b.title = '时间猎手'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

-- ============================================================
-- Chapters for 读心者
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 我能听见', 550,
  '事情是从一个普通的周二开始的。林溪在宿舍醒来时听见室友周婷的声音："今天早上吃什么？"她正要回答，却发现周婷根本没有开口。声音像从周婷的方向飘过来，没有经过耳朵，而是直接出现在脑子里。接下来整个上午，林溪经历了人生中最混乱的几个小时。食堂阿姨在递包子时心里想的是"这姑娘怎么每天穿同一件外套"，老师在点名时偷偷骂了后排打游戏的同学，连路过她身边的猫都在想"这个人类看起来不好惹"。林溪捂住耳朵，但声音不是从耳朵进来的，捂住也没用。她在图书馆角落里缩了一下午，终于摸出了一个规律：她只能听见视线范围内的人的心声。只要不看着对方，声音就消失了。这个发现让她稍微松了口气。然后室友周婷推开了图书馆的玻璃门，林溪下意识抬头，听见了周婷心里的第一句话：把尸体处理干净之后，下一个就是林溪。'
FROM novel_book b WHERE b.title = '读心者'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 室友的秘密', 550,
  '林溪攥紧手机，强迫自己继续看书，假装什么都没听见。周婷在她对面坐下，脸上挂着和平时一样温和的笑容。她主动问林溪晚饭吃了没有，最近学习累不累，还从书包里掏出一袋零食推过来。林溪笑着接过，听见周婷心里在盘算：明天下午五点，她会去天台收被子，那时候人很少。林溪低头撕开零食袋，手指却微微发抖。周婷是她的室友，两人住了两年，关系一直很好。周婷性格温和，成绩好，在系里人缘极佳。这样的人，心里怎么会想着杀人？而且杀的不是别人，是她林溪自己。她必须弄清楚周婷为什么要杀她，以及周婷已经在心中策划了多久。宿舍，今晚睡前，她知道周婷有关灯后刷手机的习惯。也许那时她能听到更多。'
FROM novel_book b WHERE b.title = '读心者'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

-- ============================================================
-- Chapters for 南风知我意
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 雨天的花店', 550,
  '雨是从下午三点开始下的，到六点还没有要停的意思。顾南风刚走出律所大楼，雨势忽然变大。他站在门廊下看了一眼手机上的天气——暴雨预警，预计持续到晚上十点。他决定冲过去，结果跑出不到十米就被浇了个透。西装里的文件保住了，但整个人看起来像被从河里捞出来。他下意识推开路边最近的一扇门，门里是一间花店。铃铛响了。他抬头看见一个女孩正蹲在地上给花换水，头发随便夹在脑后，围裙上沾着几片花瓣。她看见他时愣了一秒，然后笑了："躲雨吗？随便坐。那边有纸巾。"那是乔意第一次见到顾南风。后来她跟朋友形容那天的顾律师：一身几千块的西装，湿得像街边五毛钱一斤的废纸，站在花店里打了个喷嚏，然后很小声地说了一句"不好意思"。'
FROM novel_book b WHERE b.title = '南风知我意'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 第三种可能（完）', 550,
  '花店躲雨之后，顾南风开始以各种匪夷所思的借口光顾那家花店。今天来取"昨天不小心落在店里"的钢笔，明天来问"这种花能不能净化甲醛"。乔意后来跟他说，你就算再来一百次，我也认不出这些花叫上面名字。顾南风沉默片刻："那我可以用一百次来教你。"他们的关系从笨拙的开场慢慢变成了彼此最好的习惯。顾南风学会了认识至少十种花的拉丁文名，乔意也学会了在合同上签名前先看最后一页。一年后的同一个雨夜，顾南风在花店门口撑开一把伞，对正在关门的乔意说：我今天来不是因为下雨。然后他从公文包里掏出一个丝绒盒子，在满屋花香和门外的雨声中，问了一个乔意一直偷偷期待的问题。乔意把答案说得很轻，但很肯定。隔着雨幕，南风暖暖地吹。'
FROM novel_book b WHERE b.title = '南风知我意'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

-- ============================================================
-- Chapters for 余生漫漫
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 误诊之后', 550,
  '季迢迢在拿到体检报告那天，给自己买了一双很贵的鞋。她今年二十八岁，在一家广告公司做策划，每天加班到十点，存了一笔不大不小的钱。报告上写着疑似恶性肿瘤，建议进一步检查。她看完就折好放进包里，没有哭，也没有告诉任何人。第二天她交了辞职信，在主管惊讶的目光中说了一句"世界很大我想去看看"，然后买了一周后飞往冰岛的机票。同事都以为她开玩笑，季迢迢自己也觉得好笑——她这辈子最像电影女主角的时刻，居然是收到一张假的死亡通知书。机场里人群来去匆匆，季迢迢拉着行李箱站在咖啡柜台前犹豫要不要加糖。旁边一个男人用温和的声音替她选了："今天买一送一，建议加双份糖，比较划算。"她转头，看见一个穿着旧军靴的男人正对她笑。'
FROM novel_book b WHERE b.title = '余生漫漫'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 后来（完）', 550,
  '季迢迢和那个男人——他叫陆行舟——在冰岛一起看了极光。陆行舟是个流浪摄影师，十年前从部队退伍，从此一直在路上。他们都以为这只是一场短暂的相遇。季迢迢甚至想好了告别的方式：在机场登机口回头对他说谢谢，然后各奔天涯。但命运没有按她的剧本走。回国后她去医院做进一步检查，医生推了推眼镜说：第一份报告是错的，你很健康。季迢迢坐在医院的塑料椅子上，拿着正确的报告，发现自己这辈子最好的一段日子，竟然是在以为快死的时候过的。两个月后，她在云南一家小客栈的留言墙上找到一行字：迢迢，我到丽江了。如果你还活着，来找我吧。如果你死了，我也替你活着。季迢迢站在墙前哭了很久，把旁边的旅客都看傻了。然后她买了下一班机票。'
FROM novel_book b WHERE b.title = '余生漫漫'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

-- ============================================================
-- Chapters for 江湖夜雨
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 卖馄饨的人', 550,
  '渡口镇不大，镇上的人都知道老谢馄饨。老谢本人四十出头，寡言少语，从不多收一文钱。他的馄饨皮薄馅大，汤里只放虾皮紫菜，却鲜得让人想起小时候。镇上没人知道老谢从哪里来，问起他就笑，说从南边。直到那天傍晚，三个骑马的人停在馄饨摊前。他们没有点单，而是盯着老谢手里的菜刀看了很久。为首那人缓缓摘下斗笠，露出一张刀疤横贯半张脸的面孔。"谢长渊，"他说，声音粗粝得像磨刀石，"你这刀工还是这么好。一把菜刀能剁馄饨馅，也能剁人头。"老谢没有停下捞馄饨的手。他把煮好的馄饨端给旁边的老头，然后抬头看向来人。眼神平静，像结了冰的湖面。"秦烈，十年不见。要打架等收摊。别耽误我做生意。"'
FROM novel_book b WHERE b.title = '江湖夜雨'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 馄饨铺的秘密', 550,
  '秦烈没有动手。他在渡口镇住了下来，每天来老谢的摊子吃一碗馄饨。两人之间的气氛很奇怪，不像仇人，也不像故友。镇上的人看出不对，私下里议论纷纷。老谢不理这些，照常早上四更起来和面，五更出摊。这天深夜，秦烈独自走进老谢的馄饨铺。案板上放着那把菜刀，刀刃沾着面粉。秦烈伸手拿起刀，入手极沉。他翻转刀身，在接近刀柄的位置看到了一行细小到几乎不可见的刻字：武林盟主令，谢长渊监制。秦烈的手抖了一下。他知道这把刀。十年前谢长渊在武林大会上击败所有对手，成为史上最年轻的武林盟主。盟主佩刀是天下第一工匠专门打造，刀身刻字永不磨灭。可他从来没见过这把刀的真貌，因为谢长渊当选第二天就坠崖了。秦烈放下刀，看着铺子后门黑暗中的那个人影，问出了藏了十年的问题："你当年为什么自己跳下去？"'
FROM novel_book b WHERE b.title = '江湖夜雨'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

-- ============================================================
-- Chapters for 剑出天山
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 深山十五年', 550,
  '叶寒霜对父母的记忆只剩下一些碎片。父亲教她认过剑，母亲给她梳过头，窗外的雪很厚，屋里的炉火烧得很旺。然后是火。到处都是火。老仆叶伯抱着她跌跌撞撞地跑进密道，身后的惨叫声和兵器碰撞声越来越远。等他们从密道另一头爬出来时，天山剑派已经烧了大半夜。十五年后，叶寒霜站在深山的茅屋前，背上系着一柄黑布包裹的长剑。叶伯去年冬天走了，走之前把一本被水浸过的剑谱放在她手里。他吃力地说完最后一番话：当年灭天山剑派的凶手已经查清，一共五个人，分别是如今镇守西南的镇南将军萧定，武林第一大派沧浪阁阁主洛行书，还有三个人身份不明。叶寒霜对着叶伯的坟磕了三个头，然后转身走出深山。剑谱第一页有一行被水晕开的小字：剑出天山，莫问归途。'
FROM novel_book b WHERE b.title = '剑出天山'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 长安故人', 550,
  '长安城。叶寒霜从小在山中长大，第一次见到这样的繁华。她找了个便宜的客栈住下，然后去打听镇南将军府的位置。萧定。剑谱上的第一个名字。她在将军府外面的茶摊上坐了三天，摸清了守卫轮班的时间和萧定的出行规律。萧定每天辰时出门，酉时回府，身边常随着六名亲卫。第四天，叶寒霜看到一个中年男人被几名武官簇拥着从府门中走出。那人身着锦袍，腰悬金刀，脸上带着一种她形容不出来的表情。不是嚣张，而是疲惫。叶寒霜按住了剑。也就在这时，一个头发花白的老人忽然在她对面坐下，倒了杯茶，开口说了一句让她浑身发冷的话："你长得像你娘。尤其是眼睛。"叶寒霜看向老人，认出他是沧浪阁阁主——洛行书。老人却接着说："别急着拔剑。你娘当年是我亲手送走的。我是你舅舅。"'
FROM novel_book b WHERE b.title = '剑出天山'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

-- ============================================================
-- Chapters for 第十二夜
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 十一个梦', 550,
  '病人姓周，名片上写着周诚，某科技公司的技术总监。他坐在沈渡诊疗室沙发上的姿势很僵硬，像一只误入陌生领地的猫。沈渡照例问他最近睡眠怎么样，有没有什么想聊的。周诚沉默了很久才开口。"我连续十一个晚上做了同一个梦。"他的声音很平稳，手指却一直在膝盖上反复摩擦。"梦里我在杀一个人。同一个人。每个晚上。"沈渡在笔记本上记录，没有打断。周诚说梦境细节极度逼真：刀的手感、血液的温度、受害者的表情，醒来后全部记得清清楚楚。更诡异的是每晚的杀人方式都不一样。第一天是绳索，第二天是毒药，第三天是推落高楼——他对自己说这一定是压力太大了。直到今天早上他在新闻推送里看到一张照片。照片上的女人叫许如清，一名独立调查记者，昨夜被发现死于家中。周诚说他不认识这个女人。但她的脸，和他梦里杀了十一次的人，一模一样。'
FROM novel_book b WHERE b.title = '第十二夜'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 沈渡的梦', 550,
  '沈渡送走周诚后，在诊疗室里坐了很长时间。作为心理医生，他倾向于用科学解释一切。连续做同一个梦并不罕见，叫做"重复性梦境"，通常与未解决的创伤或持续的高压有关。梦里见到陌生人脸也很常见——人类无法在梦中创造新面孔，但可以将现实中匆匆一瞥的脸重组。但周诚提到的记者许如清确实是真实存在的。沈渡查了新闻，许如清前天夜里被发现死在自己公寓中，死因是窒息。警方初步判断为他杀，目前无嫌疑人。沈渡关掉电脑去睡觉。那天夜里，他做了个梦。梦里他站在一个昏暗的房间里，周诚坐在他对面，像白天一样说个没完。沈渡低头，发现自己手里握着一把刀。周诚还在说话，声音忽然变得很平静："沈医生，第十一夜是你。第十二夜该我了。"他的胸口插着那把刀，脸上却带着笑。沈渡从梦中惊醒，凌晨四点十七分。'
FROM novel_book b WHERE b.title = '第十二夜'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

-- ============================================================
-- Chapters for 失踪者
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 七个失踪者', 550,
  '第一个失踪的叫王海，四十二岁，出租车司机。他在某个周五晚上收工后没有回家，车停在路边，钥匙还在车上。第二个叫孙蓉，二十七岁，幼儿园老师。她下班后和同事说了声明天见，第二天没有出现在教室。两个毫无交集的人在同一个月消失，滨城警方最初没有联系起来。直到失踪人数增加到七个。江寻是刑警队副队长，主办此案。他在梳理七名失踪者的社交媒体时发现了那条诗——"我听见有人在喊我的名字"。一样的字，一样的标点，七个人在失踪前三天内都发布了这句话。技术科的人说是巧合，这年头文艺句子到处复制粘贴。江寻让他们查IP。七条动态来自七个不同的IP，七个不同的时间段。但所有定位数据指向了同一个地点：滨城第四小学。废弃二十年，整个校区只剩下三栋空楼和一片杂草丛生的操场。江寻站在废弃小学门口，觉得自己脊背在发凉——他在这里读完了六年小学。'
FROM novel_book b WHERE b.title = '失踪者'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 废弃教室', 550,
  '江寻带了两个同事进入废弃小学。操场的草长到腰那么高，篮球架锈成了红褐色，滑梯被藤蔓缠得只剩一半。主教学楼的门没有锁，或者说锁早就烂掉了。走廊里到处是碎玻璃和发霉的课桌，墙上还贴着褪色的拼音表。他在三楼找到自己小时候的教室。四年级三班。黑板上居然还有粉笔字，歪歪扭扭写着一句话：江寻，老师叫你回家。他盯着那些粉笔字，确认自己没有眼花。字迹很新，粉笔灰落在黑板下方的槽里，没有积尘。同事老刘碰了碰他的胳膊，说这楼里还有别人。江寻拔出枪，沿着走廊一间间教室搜。在最尽头的音乐教室里，他看见了八张课桌被摆成一个圆圈。七张桌上各放着一张照片——正好是七个失踪者的证件照。第八张桌子上没有照片，只放了一面镜子。江寻走到镜前，看到了自己的脸。'
FROM novel_book b WHERE b.title = '失踪者'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

-- ============================================================
-- Chapters for 逆光者
-- ============================================================

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 1, '第一章 夜间便利店', 550,
  '零点过三分，便利店的自动门滑开，冷风灌进来，带着外面街道上潮湿的沥青味。程远头也不抬地说了声欢迎光临，继续擦他的货架。他在这家二十四小时便利店做了半年夜班，已经习惯了凌晨的客流——失眠的学生、送外卖的骑手、刚下夜班的护士，还有偶尔进来买打火机的醉汉。今晚的第三个顾客是个女孩。她推门进来时脚步很重，像跑了很远的路。程远抬头，看见她光着脚，左脚底的白色袜子被血染红了一大片。她的眼神不是害怕，而是一种濒临崩溃后的强撑着的清醒。她开口说话前，门外传来另一阵脚步声。几个人的脚步，不急不慢，像在找人。程远看了她一眼，伸手关掉了收银台上方的最后一盏灯。整个便利店陷入黑暗。他说："别出声。"然后在黑暗中绕过货架，站在了门口。路灯下面站着三个男人。'
FROM novel_book b WHERE b.title = '逆光者'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 1);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content)
SELECT b.id, 2, '第二章 夜班守则', 550,
  '三个人在路灯下站了一会儿，其中一个往便利店这边走了两步，脸贴在玻璃上往里看。黑暗中程远能看清他的表情——那是一种笃定的从容，像猎人知道猎物跑不远。女孩在黑暗里攥着程远的衣角，手指冰凉。等三人走远，程远打开一盏小夜灯，从员工柜里翻出一双拖鞋放在女孩面前。他没有问她名字，没有问为什么被人追，只说了句先穿鞋。女孩忽然开口，声音很小："你不问我为什么吗？"程远拿了一瓶水放在她面前。"夜里跑进便利店的人，要么没地方去，要么有人在追。你属于第三种——两样都有。这是夜班守则第一条：不问为什么。"女孩低头看着水，问第二条是什么。程远走回收银台坐下，说第二条是如果那些人再回来，后门在仓库最里面。'
FROM novel_book b WHERE b.title = '逆光者'
  AND NOT EXISTS (SELECT 1 FROM novel_chapter WHERE book_id = b.id AND chapter_no = 2);

-- ============================================================
-- Book Stats
-- ============================================================

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.6, 342, 8500, 2100, 32000
FROM novel_book b WHERE b.title = '剑道长生'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.3, 186, 4200, 980, 16500
FROM novel_book b WHERE b.title = '仙门九重'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.8, 528, 15200, 4200, 52000
FROM novel_book b WHERE b.title = '万界神皇'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.5, 267, 6100, 1500, 21000
FROM novel_book b WHERE b.title = '时间猎手'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.4, 198, 4800, 1120, 17800
FROM novel_book b WHERE b.title = '读心者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.7, 456, 11200, 3800, 45000
FROM novel_book b WHERE b.title = '南风知我意'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.2, 134, 3200, 760, 12800
FROM novel_book b WHERE b.title = '余生漫漫'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.9, 612, 18600, 5200, 68000
FROM novel_book b WHERE b.title = '江湖夜雨'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.4, 289, 7200, 1680, 25000
FROM novel_book b WHERE b.title = '剑出天山'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.6, 378, 9500, 2400, 38000
FROM novel_book b WHERE b.title = '第十二夜'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.5, 312, 8100, 1950, 29000
FROM novel_book b WHERE b.title = '失踪者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

INSERT INTO novel_book_stats(book_id, rating, rating_count, reading_count, favorite_count, view_count)
SELECT b.id, 4.3, 156, 3800, 890, 14200
FROM novel_book b WHERE b.title = '逆光者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_stats s WHERE s.book_id = b.id);

-- ============================================================
-- Book Tags
-- ============================================================

-- 剑道长生 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '仙侠', 1 FROM novel_book b WHERE b.title = '剑道长生'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '仙侠');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '剑修', 2 FROM novel_book b WHERE b.title = '剑道长生'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '剑修');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '热血', 3 FROM novel_book b WHERE b.title = '剑道长生'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '热血');

-- 仙门九重 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '仙侠', 1 FROM novel_book b WHERE b.title = '仙门九重'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '仙侠');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '女强', 2 FROM novel_book b WHERE b.title = '仙门九重'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '女强');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '逆袭', 3 FROM novel_book b WHERE b.title = '仙门九重'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '逆袭');

-- 万界神皇 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '玄幻', 1 FROM novel_book b WHERE b.title = '万界神皇'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '玄幻');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '热血', 2 FROM novel_book b WHERE b.title = '万界神皇'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '热血');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '升级', 3 FROM novel_book b WHERE b.title = '万界神皇'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '升级');

-- 时间猎手 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '异能', 1 FROM novel_book b WHERE b.title = '时间猎手'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '异能');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '悬疑', 2 FROM novel_book b WHERE b.title = '时间猎手'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '悬疑');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '刑侦', 3 FROM novel_book b WHERE b.title = '时间猎手'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '刑侦');

-- 读心者 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '异能', 1 FROM novel_book b WHERE b.title = '读心者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '异能');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '校园', 2 FROM novel_book b WHERE b.title = '读心者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '校园');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '悬疑', 3 FROM novel_book b WHERE b.title = '读心者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '悬疑');

-- 南风知我意 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '言情', 1 FROM novel_book b WHERE b.title = '南风知我意'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '言情');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '都市', 2 FROM novel_book b WHERE b.title = '南风知我意'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '都市');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '治愈', 3 FROM novel_book b WHERE b.title = '南风知我意'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '治愈');

-- 余生漫漫 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '言情', 1 FROM novel_book b WHERE b.title = '余生漫漫'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '言情');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '治愈', 2 FROM novel_book b WHERE b.title = '余生漫漫'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '治愈');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '旅行', 3 FROM novel_book b WHERE b.title = '余生漫漫'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '旅行');

-- 江湖夜雨 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '武侠', 1 FROM novel_book b WHERE b.title = '江湖夜雨'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '武侠');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '权谋', 2 FROM novel_book b WHERE b.title = '江湖夜雨'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '权谋');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '复仇', 3 FROM novel_book b WHERE b.title = '江湖夜雨'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '复仇');

-- 剑出天山 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '武侠', 1 FROM novel_book b WHERE b.title = '剑出天山'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '武侠');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '复仇', 2 FROM novel_book b WHERE b.title = '剑出天山'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '复仇');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '女侠', 3 FROM novel_book b WHERE b.title = '剑出天山'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '女侠');

-- 第十二夜 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '悬疑', 1 FROM novel_book b WHERE b.title = '第十二夜'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '悬疑');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '心理', 2 FROM novel_book b WHERE b.title = '第十二夜'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '心理');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '反转', 3 FROM novel_book b WHERE b.title = '第十二夜'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '反转');

-- 失踪者 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '悬疑', 1 FROM novel_book b WHERE b.title = '失踪者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '悬疑');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '刑侦', 2 FROM novel_book b WHERE b.title = '失踪者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '刑侦');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '都市', 3 FROM novel_book b WHERE b.title = '失踪者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '都市');

-- 逆光者 tags
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '都市', 1 FROM novel_book b WHERE b.title = '逆光者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '都市');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '治愈', 2 FROM novel_book b WHERE b.title = '逆光者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '治愈');
INSERT INTO novel_book_tag(book_id, tag, sort_order)
SELECT b.id, '悬疑', 3 FROM novel_book b WHERE b.title = '逆光者'
  AND NOT EXISTS (SELECT 1 FROM novel_book_tag t WHERE t.book_id = b.id AND t.tag = '悬疑');
