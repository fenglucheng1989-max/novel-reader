CREATE TABLE IF NOT EXISTS legal_document (
    id              BIGSERIAL PRIMARY KEY,
    doc_type        VARCHAR(20) NOT NULL,
    title           VARCHAR(100) NOT NULL,
    version         VARCHAR(30) NOT NULL,
    effective_date  DATE NOT NULL,
    content         TEXT NOT NULL,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doc_type, version)
);

CREATE INDEX IF NOT EXISTS idx_legal_document_type_enabled
    ON legal_document(doc_type, enabled, effective_date DESC, id DESC);

-- Seed TERMS
INSERT INTO legal_document (doc_type, title, version, effective_date, content, enabled) VALUES
('TERMS', '用户协议', '2026.05.01', '2026-05-01',
'欢迎使用悦读
感谢您使用悦读。悦读是一款个人阅读管理工具，帮助您记录阅读进度、管理书架和发现好书。

服务说明
悦读为您提供书籍浏览、书架管理、阅读进度同步、评论和摘录等功能。您可以免费使用悦读的基本功能。

账号与安全
您需要注册账号以使用书架同步功能。请妥善保管您的账号和密码，不要在公共设备上保存登录状态。如发现账号异常，请及时联系我们。

用户行为规范
您在使用悦读时应遵守相关法律法规。不得利用悦读发布违法、侵权或不当内容。悦读有权对违规内容进行处理。

知识产权
悦读中的书籍内容归原作者或版权方所有。悦读不主张对所展示书籍内容拥有任何权利。未经授权，请勿复制、传播或商业化使用悦读中的内容。

免责声明
悦读按现状提供服务，不对服务的可用性、准确性和完整性做任何明示或暗示的保证。因不可抗力、系统维护或第三方原因导致的服务中断，悦读不承担责任。

协议更新
悦读可能根据需要更新本协议。协议更新后，我们会通过应用内通知的方式告知您。继续使用悦读即表示您同意更新后的协议。

联系我们
如对本协议有任何疑问，请联系我们：yuedu@example.com',
TRUE);

-- Seed PRIVACY
INSERT INTO legal_document (doc_type, title, version, effective_date, content, enabled) VALUES
('PRIVACY', '隐私政策', '2026.05.01', '2026-05-01',
'信息收集
悦读重视您的隐私。我们仅收集提供阅读服务所必需的信息：您注册时提供的用户名和邮箱，您使用悦读时产生的书架数据、阅读进度和评论摘录内容。

信息使用
我们使用您提供的信息来创建和管理您的账号、同步您的阅读数据、展示您的阅读统计和个性化推荐。我们不会将您的信息用于其他目的。

信息存储
您的数据存储在安全的服务器上。我们采取合理的技术和管理措施保护您的信息安全。但我们无法保证互联网传输的绝对安全。

信息共享
我们不会将您的个人信息出售或分享给第三方。除非法律要求或为了遵守法律程序，我们不会在未经您同意的情况下披露您的信息。

Cookie 与缓存
悦读可能在本地存储必要的缓存和偏好设置，以提升阅读体验。这些数据仅存储在您的设备上，不会上传至服务器。

用户权利
您可以随时查看、修改或删除您的账号信息。您也可以导出您的阅读数据。如需完全删除账号，请在设置中选择退出登录并联系管理员。

儿童隐私
悦读不面向13岁以下的儿童。我们不会故意收集儿童的个人信息。如果您发现儿童向我们提供了信息，请联系我们。

政策更新
我们可能根据需要更新本隐私政策。更新后，我们会通过应用内通知告知您。继续使用悦读即表示您同意更新后的隐私政策。

联系我们
如对本隐私政策有任何疑问，请联系我们：yuedu@example.com',
TRUE);
