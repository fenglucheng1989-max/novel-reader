package com.yourcompany.novelreader.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yourcompany.novelreader.dto.ReaderSettingDTO;
import com.yourcompany.novelreader.dto.ReadingProgressDTO;
import com.yourcompany.novelreader.entity.NovelReaderSetting;
import com.yourcompany.novelreader.entity.NovelReadingHistory;
import com.yourcompany.novelreader.entity.NovelReadingProgress;
import com.yourcompany.novelreader.mapper.NovelReaderSettingMapper;
import com.yourcompany.novelreader.mapper.NovelReadingHistoryMapper;
import com.yourcompany.novelreader.mapper.NovelReadingProgressMapper;
import com.yourcompany.novelreader.service.ReadingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReadingServiceImpl implements ReadingService {

    private final NovelReadingProgressMapper progressMapper;
    private final NovelReadingHistoryMapper historyMapper;
    private final NovelReaderSettingMapper settingMapper;

    @Override
    public NovelReadingProgress getProgress(Long userId, Long bookId) {
        return progressMapper.selectOne(new LambdaQueryWrapper<NovelReadingProgress>()
                .eq(NovelReadingProgress::getUserId, userId)
                .eq(NovelReadingProgress::getBookId, bookId));
    }

    @Override
    public NovelReadingProgress saveProgress(Long userId, Long bookId, ReadingProgressDTO dto) {
        NovelReadingProgress progress = getProgress(userId, bookId);
        if (progress == null) {
            progress = NovelReadingProgress.builder().userId(userId).bookId(bookId).build();
        }
        progress.setChapterId(dto.getChapterId());
        progress.setChapterNo(dto.getChapterNo() == null ? 1 : dto.getChapterNo());
        progress.setPosition(dto.getPosition() == null ? 0 : dto.getPosition());
        progress.setProgressPercent(dto.getProgressPercent() == null ? BigDecimal.ZERO : dto.getProgressPercent());
        progress.setUpdatedAt(LocalDateTime.now());
        if (progress.getId() == null) {
            progressMapper.insert(progress);
        } else {
            progressMapper.updateById(progress);
        }
        if (dto.getChapterId() != null || dto.getDurationSeconds() != null) {
            historyMapper.insert(NovelReadingHistory.builder()
                    .userId(userId)
                    .bookId(bookId)
                    .chapterId(dto.getChapterId())
                    .durationSeconds(dto.getDurationSeconds() == null ? 0 : dto.getDurationSeconds())
                    .readAt(LocalDateTime.now())
                    .build());
        }
        return progress;
    }

    @Override
    public List<NovelReadingHistory> history(Long userId) {
        return historyMapper.selectList(new LambdaQueryWrapper<NovelReadingHistory>()
                .eq(NovelReadingHistory::getUserId, userId)
                .orderByDesc(NovelReadingHistory::getReadAt)
                .last("limit 50"));
    }

    @Override
    public NovelReaderSetting getSetting(Long userId) {
        NovelReaderSetting setting = settingMapper.selectOne(new LambdaQueryWrapper<NovelReaderSetting>()
                .eq(NovelReaderSetting::getUserId, userId));
        if (setting != null) {
            return setting;
        }
        return NovelReaderSetting.builder()
                .userId(userId)
                .fontSize(18)
                .lineHeight(30)
                .theme("DEFAULT")
                .turnMode("SCROLL")
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    public NovelReaderSetting saveSetting(Long userId, ReaderSettingDTO dto) {
        NovelReaderSetting setting = getSetting(userId);
        setting.setFontSize(dto.getFontSize() == null ? setting.getFontSize() : dto.getFontSize());
        setting.setLineHeight(dto.getLineHeight() == null ? setting.getLineHeight() : dto.getLineHeight());
        setting.setTheme(dto.getTheme() == null ? setting.getTheme() : dto.getTheme());
        setting.setTurnMode(dto.getTurnMode() == null ? setting.getTurnMode() : dto.getTurnMode());
        setting.setUpdatedAt(LocalDateTime.now());
        if (setting.getId() == null) {
            settingMapper.insert(setting);
        } else {
            settingMapper.updateById(setting);
        }
        return setting;
    }
}
