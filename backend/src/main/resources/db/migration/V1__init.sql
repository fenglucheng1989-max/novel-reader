CREATE TABLE app_user (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email         VARCHAR(100),
    avatar_url    VARCHAR(255),
    role          VARCHAR(20) DEFAULT 'USER',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE novel_category (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    parent_id  BIGINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE novel_book (
    id                   BIGSERIAL PRIMARY KEY,
    title                VARCHAR(200) NOT NULL,
    author               VARCHAR(100),
    category_id          BIGINT,
    description          TEXT,
    cover_url            VARCHAR(500),
    status               VARCHAR(20) DEFAULT 'ONGOING',
    word_count           INT DEFAULT 0,
    chapter_count        INT DEFAULT 0,
    latest_chapter_title VARCHAR(200),
    source_type          VARCHAR(20) DEFAULT 'MANUAL',
    sort_order           INT DEFAULT 0,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE novel_chapter (
    id         BIGSERIAL PRIMARY KEY,
    book_id    BIGINT NOT NULL,
    chapter_no INT NOT NULL,
    title      VARCHAR(200) NOT NULL,
    word_count INT DEFAULT 0,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, chapter_no)
);

CREATE TABLE novel_bookshelf (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    book_id    BIGINT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

CREATE TABLE novel_reading_progress (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    book_id          BIGINT NOT NULL,
    chapter_id       BIGINT,
    chapter_no       INT DEFAULT 1,
    position         INT DEFAULT 0,
    progress_percent DECIMAL(5,2) DEFAULT 0,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

CREATE TABLE novel_reading_history (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    book_id          BIGINT NOT NULL,
    chapter_id       BIGINT,
    duration_seconds INT DEFAULT 0,
    read_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE novel_reader_setting (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE,
    font_size   INT DEFAULT 18,
    line_height INT DEFAULT 30,
    theme       VARCHAR(20) DEFAULT 'DEFAULT',
    turn_mode   VARCHAR(20) DEFAULT 'SCROLL',
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_novel_book_title ON novel_book(title);
CREATE INDEX idx_novel_book_author ON novel_book(author);
CREATE INDEX idx_novel_book_category ON novel_book(category_id, sort_order);
CREATE INDEX idx_novel_chapter_book_no ON novel_chapter(book_id, chapter_no);
CREATE INDEX idx_novel_bookshelf_user ON novel_bookshelf(user_id, sort_order);
CREATE INDEX idx_novel_progress_user_book ON novel_reading_progress(user_id, book_id);

INSERT INTO novel_category(name, sort_order) VALUES
('玄幻', 1),
('都市', 2),
('科幻', 3),
('历史', 4);

INSERT INTO novel_book(title, author, category_id, description, cover_url, status, word_count, chapter_count, latest_chapter_title, source_type, sort_order)
VALUES
('星河旧梦', '林间灯', 3, '一个维修师在废弃星港里发现旧时代的航行日志，由此卷入横跨星河的失落计划。', '', 'ONGOING', 1000, 2, '第二章 风从舱门来', 'MANUAL', 1),
('长街有雨', '南桥', 2, '雨夜重逢之后，两个普通人在城市缝隙里重新寻找生活的方向。', '', 'ONGOING', 920, 2, '第二章 便利店灯光', 'MANUAL', 2),
('山海小札', '青石', 1, '少年背着一本会自己翻页的古札，走进山海之间的奇异世界。', '', 'ONGOING', 900, 2, '第二章 会说话的石头', 'MANUAL', 3),
('雾港来信', '迟舟', 4, '一名档案修复师收到来自旧港的无署名长信，信中记录着一座城市被雾吞没前后的秘密。长篇测试文本，用于验证阅读器在长章节下的滚动、排版和进度保存效果。', '', 'ONGOING', 12000, 3, '第三章 灯塔仍在', 'MANUAL', 4);

INSERT INTO novel_chapter(book_id, chapter_no, title, word_count, content) VALUES
(1, 1, '第一章 废弃星港', 500, '星港已经沉睡了很多年。灰尘落在控制台上，像一层薄雪。陆沉拧开维修灯，白色光束划过墙面，照出一行几乎褪色的编号。这里本该没有电，也不该有任何正在运行的设备。可在最深处的导航室里，有一台旧终端仍在低声震动。屏幕亮起时，他看见一句话：返航协议尚未完成。陆沉以为那只是系统残留的误报，直到终端吐出一枚银色存储芯片。芯片表面刻着他父亲的名字。'),
(1, 2, '第二章 风从舱门来', 500, '舱门打开的一瞬间，风从黑暗里涌了出来。那不是星港通风管道里的风，而像是某个遥远星球的夜色，带着潮湿、盐味和陌生植物的气息。陆沉握紧芯片，听见身后的警报声逐层响起。旧终端上的星图开始自动展开，一条被隐藏了二十年的航线缓慢浮现。航线尽头没有编号，只有一个被手写标注的名字：归墟。'),
(2, 1, '第一章 雨夜重逢', 460, '雨下得很突然。陈安在地铁口停住脚步，发现自己没有带伞。人群从身边涌过，每个人都急着回到自己的灯火里。她低头看手机时，听见有人叫她的名字。那个声音隔着雨幕，熟悉得让她一瞬间忘了回应。许知远站在街对面，手里拿着一把黑伞，像从很多年前的某个傍晚走来。'),
(2, 2, '第二章 便利店灯光', 460, '他们最后躲进街角的便利店。暖黄灯光照着玻璃上的雨痕，也照着彼此有些生疏的表情。许知远买了两杯热咖啡，陈安接过时说了声谢谢。寒暄比想象中更难，沉默却并不尴尬。很多年没见的人，原来不必急着解释所有错过。有些话可以慢慢说，像雨慢慢停。'),
(3, 1, '第一章 会翻页的书', 450, '沈砚第一次发现那本古札不对劲，是在祖父离开的第三天。夜里窗没开，书页却自己翻动起来，停在一幅山势图上。图中的山并不属于任何已知地界，山脚画着一间小茶铺，旁边写着四个小字：明日启程。第二天清晨，镇外真的多了一条陌生山路。'),
(3, 2, '第二章 会说话的石头', 450, '山路尽头有块青石。沈砚刚坐上去歇脚，石头便叹了口气，说年轻人不要压着别人的帽子。他吓得跳起来，才发现石面上竟浮出一张皱巴巴的脸。青石说自己守路三百年，最烦两种人：问路不给礼的，和带着山海札却假装普通人的。沈砚低头看向怀里的古札，书页正微微发光。'),
(4, 1, '第一章 退潮后的信', 4000, '港口退潮是在凌晨四点。雾从海面上抬起来，先遮住灯塔，再遮住仓库的屋顶，最后像一只温柔而固执的手，按住整条老街。岑微在档案馆地下室值夜，窗外看不见海，只能听见远处船铃一声接一声地响。那声音并不急促，却让她想起很多年前祖母讲过的故事：雾港的船从不在夜里靠岸，除非船上载着不该回来的人。她把手里的破损报纸摊平，用镊子夹起一片薄得几乎透明的纸角。报纸日期是一九八七年十月十四日，标题只剩半行，墨迹被潮气泡开，像一场没有留下姓名的雨。
地下室的灯忽然闪了一下。岑微抬头，看见门缝下多出一只牛皮纸信封。信封很旧，边角被海水泡过，却没有地址，也没有邮票，正面只写着她的名字。那三个字写得端正克制，像一个很久以前学会隐藏情绪的人。她打开信封，里面是一叠厚厚的手写纸。第一张纸上写着：如果你读到这封信，说明灯塔还没有熄灭，也说明他们又开始寻找那本港务日志。
岑微站在原地，听见自己的呼吸在安静里被放大。档案馆没有人知道她祖父曾经是雾港最后一任灯塔守夜人。那是家里很少提起的往事。祖父在她出生前就失踪了，官方记录写着海难，祖母却始终不肯领那份抚恤金。她说海难该有尸骨，该有船板，该有从浪里漂回来的东西。可是祖父什么都没有留下，只在衣柜最深处藏着一枚铜钥匙。钥匙已经生了绿锈，柄上刻着一个很小的数字：17。
信的第二页开始叙述一场撤离。写信的人说，雾港并不是突然被遗弃的。最初只是海雾变厚，航道标识失灵，外来的船在近岸打转，像被看不见的线牵住。随后镇上的钟表开始慢下来，先是每天慢五分钟，再是十分钟，到第七天，所有钟都停在凌晨四点十七分。有人说那是灯塔的故障，有人说是地下矿脉影响磁场，更多的人选择闭嘴，因为闭嘴至少能让日子看起来还在继续。
岑微翻到第三页，纸上夹着一张黑白照片。照片里是一群人站在灯塔前，背景是浓得发白的雾。她一眼认出年轻时的祖父。他站在人群边缘，怀里抱着一本厚账册，脸色很沉。照片背面写着：不要相信第十七号仓库的封条。不要在雾里回答自己的名字。不要让后来的人以为我们只是搬走了。
地下室的通风口传来一阵细微的风声。岑微把信放进防潮盒，转身去查馆藏目录。雾港旧档案在二十年前完成过一次数字化，但她知道有些东西从未进入系统。档案馆的老主任曾经说，纸质档案最诚实，也最容易撒谎。它们可以被烧毁、裁剪、换页、重装订，甚至可以用一种很温和的方式消失：被放错到一个无人会找的位置。
她输入关键词雾港、灯塔、十七号仓库。系统返回零条。她又输入祖父的名字，仍然是零条。最后，她试着输入照片背面的时间：四点十七分。屏幕停顿了几秒，跳出一条灰色记录。记录没有标题，馆藏位置显示为：地下二层，盐损档案柜，C-17。
岑微拿起钥匙，忽然明白祖母为什么在临终前把它交给自己。老人那时已经很少清醒，却紧紧攥着她的手说，雾不是天气，雾是有人不愿被看见的过去。你要是听见船铃，就把灯打开。'),
(4, 2, '第二章 盐损档案柜', 4100, '盐损档案柜在地下二层尽头。那一片区域常年没有访客，空气里有潮木、旧胶水和金属锈蚀混在一起的味道。岑微沿着狭窄走道往前走，感应灯一盏接一盏亮起，又在她身后安静地熄灭。C 区的柜门比其他柜子更旧，漆面剥落，编号牌歪斜地挂着。她把祖父留下的铜钥匙插进 C-17 的锁孔，钥匙转动时发出很轻的咔哒声，像有人在黑暗里终于点了头。
柜子里没有她想象中的账册，只有一个封存的铁盒。铁盒盖上贴着发黄的纸条：港务日志副本，未经许可不得启封。纸条下面还有一行更小的字，像后来补上去的：许可人已不存在。岑微把铁盒抱到工作台，戴上手套，小心揭开封条。盒内是一摞被油纸包住的记录，最上面那本封皮发黑，边缘起盐霜。她翻开第一页，看见熟悉的笔迹。那是祖父的字。
日志第一段写于一九八七年十月七日。祖父记录说，雾从北防波堤外升起，能见度不足二十米，灯塔光束无法穿透雾层。下午三点，巡逻船白鹭号报告在外港听见返航汽笛，但雷达没有目标。傍晚六点，镇医院接收第一名失语者。失语者是码头搬运工，只反复写同一句话：他们从雾里借路。
第二天，失语者增加到七人。所有人都曾在凌晨四点十七分到过码头附近。他们没有外伤，体温偏低，衣服上附着细盐。有人在掌心发现相同的压痕，像握过一把带棱的钥匙。祖父在日志里写：镇政厅要求淡化此事，称其为集体癔症。但灯塔设备没有故障，雾层内部存在周期性反光，似乎有另一组灯源正在回应我们。
岑微看到这里，手指停了很久。另一组灯源。她想起小时候祖母总在台风夜拉紧窗帘，不让她看海。老人说海上有些灯不是给活人看的。那时岑微只觉得这是吓小孩的话，如今却在祖父的日志里看见类似的记录，一笔一画，冷静得让人不安。
日志越往后越混乱。十月十一日，镇上的人开始撤离。官方通报称近海化工船泄漏，需要临时疏散居民。可祖父写道，没有化工船，只有一艘不在船籍册上的黑色客轮停在雾里。它没有靠岸，却每天向码头送来一只木箱。木箱里装的不是货物，而是一封封写给镇民的信。信里准确说出收信人的旧事、悔意和秘密，诱使他们在凌晨前往码头。
第十七号仓库第一次出现是在十月十二日。祖父写，那间仓库原本存放废弃缆绳和航标灯，已经封了三年。可当晚，有人听见仓库里传出宴席声。碗筷、笑语、老唱片，还有一个女人反复唱同一段曲子。守卫打开门时，里面空空荡荡，地面却铺着一层湿盐，盐上有许多脚印。那些脚印从仓库中央走向墙壁，然后消失在墙里。
岑微翻到最后几页，发现有几张被人撕掉了，只剩毛边。紧接着是一张夹页，纸质与日志不同，像是匆忙塞进去的。夹页上只有一句话：如果后来的人找到这里，请不要修复缺失页。缺失不是损坏，是我们留给你的门。'),
(4, 3, '第三章 灯塔仍在', 3900, '夜里十一点，档案馆外下起细雨。雨水落在台阶上，没有声音，像整座城市都被蒙上一层旧布。岑微把港务日志副本放进背包，离开前回头看了一眼地下室。感应灯已经熄灭，走道尽头的 C-17 档案柜隐在黑暗里，柜门却像没有关严，露出一线很窄的缝。她没有回去确认。人在某些时刻会本能地知道，多看一眼，就会被某件事记住。
回到家时，客厅窗户开着。她明明记得自己出门前关好了窗。海风吹动桌上的信纸，第一封来信被翻到最后一页。那一页原本是空白，现在却多了几行湿漉漉的字：你已经打开 C-17。明天凌晨四点十七分，到旧港灯塔。一个人来。不要带日志。不要相信与你同名的人。
岑微站在窗前，望向城市尽头。这里离旧港很远，隔着新修的高架、商业街和一片被填海造出来的住宅区。可她忽然看见远处有一道光闪了一下。不是霓虹，不是车灯，而是缓慢、稳定、带着弧度扫过夜空的灯塔光。祖父失踪后，旧港灯塔早就废弃，官方甚至拆除了灯室设备。那道光不该存在。
她一夜没睡。三点半，她换上防水外套，把铜钥匙挂在脖子上，背包里只放了一只手电和手机。日志被她锁进书柜，但临出门前，她还是撕下夹页复印件，折好塞进口袋。街上没有车。导航显示旧港灯塔距离她十二公里，预计二十六分钟。可她叫不到网约车，公交停运，连共享单车软件都显示附近无车。最后，她在路口看见一辆老式出租车。
司机没有问目的地，只说，去旧港吧。岑微坐进后排，闻到车里有淡淡的海盐味。司机是个头发花白的男人，侧脸在后视镜里模糊不清。他把收音机打开，里面传出一段沙沙的老歌。岑微听不清歌词，却认出旋律。那正是日志里第十七号仓库传出的曲子。她握紧口袋里的纸，问司机以前是不是在港口工作过。司机笑了笑，说，雾港的人，谁没在港口等过人呢。
车窗外的城市渐渐变旧。高楼退去，路灯变矮，柏油路变成带裂缝的石板路。岑微低头看手机，发现时间停在四点十七分，信号栏空白。等她再抬头，出租车已经停在灯塔脚下。雨停了，雾却很厚。灯塔顶部亮着光，光束扫过海面，照出一艘停在雾中的黑色客轮。它没有靠岸，却像已经在那里等了很多年。
司机替她打开车门，说，你祖父当年也是这样来的。岑微转身想问更多，车却不见了。石板路上只有一串湿脚印，从她身边延伸到灯塔门口。门上挂着一把旧锁，锁孔编号十七。她取下脖子上的铜钥匙，插进去，轻轻一转。门开了。灯塔内部传来纸页翻动的声音，像有人正在读一本很厚的日志。');
