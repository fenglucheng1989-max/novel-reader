package com.yourcompany.novelreader.service;

import com.yourcompany.novelreader.dto.ReaderSettingDTO;
import com.yourcompany.novelreader.dto.ReadingProgressDTO;
import com.yourcompany.novelreader.entity.NovelReaderSetting;
import com.yourcompany.novelreader.entity.NovelReadingHistory;
import com.yourcompany.novelreader.entity.NovelReadingProgress;

import java.util.List;

public interface ReadingService {
    NovelReadingProgress getProgress(Long userId, Long bookId);
    NovelReadingProgress saveProgress(Long userId, Long bookId, ReadingProgressDTO dto);
    List<NovelReadingHistory> history(Long userId);
    NovelReaderSetting getSetting(Long userId);
    NovelReaderSetting saveSetting(Long userId, ReaderSettingDTO dto);
}
