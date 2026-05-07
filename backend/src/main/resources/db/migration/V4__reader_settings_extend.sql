ALTER TABLE novel_reader_setting ADD COLUMN IF NOT EXISTS margin_x INT DEFAULT 22;
ALTER TABLE novel_reader_setting ADD COLUMN IF NOT EXISTS margin_y INT DEFAULT 28;
ALTER TABLE novel_reader_setting ADD COLUMN IF NOT EXISTS paragraph_spacing INT DEFAULT 0;
ALTER TABLE novel_reader_setting ADD COLUMN IF NOT EXISTS auto_page_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE novel_reader_setting ADD COLUMN IF NOT EXISTS auto_page_interval INT DEFAULT 15;
