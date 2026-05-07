package com.yourcompany.novelreader.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yourcompany.novelreader.entity.NovelBook;
import com.yourcompany.novelreader.entity.NovelBookshelf;
import com.yourcompany.novelreader.entity.NovelReadingHistory;
import com.yourcompany.novelreader.entity.NovelReadingProgress;
import com.yourcompany.novelreader.exception.BusinessException;
import com.yourcompany.novelreader.mapper.NovelBookMapper;
import com.yourcompany.novelreader.mapper.NovelBookshelfMapper;
import com.yourcompany.novelreader.mapper.NovelReadingHistoryMapper;
import com.yourcompany.novelreader.mapper.NovelReadingProgressMapper;
import com.yourcompany.novelreader.service.BookshelfService;
import com.yourcompany.novelreader.vo.BookshelfItemVO;
import com.yourcompany.novelreader.vo.BookshelfStatsVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookshelfServiceImpl implements BookshelfService {

    private final NovelBookshelfMapper bookshelfMapper;
    private final NovelBookMapper bookMapper;
    private final NovelReadingProgressMapper progressMapper;
    private final NovelReadingHistoryMapper historyMapper;

    @Override
    public List<BookshelfItemVO> list(Long userId) {
        return bookshelfMapper.selectList(new LambdaQueryWrapper<NovelBookshelf>()
                        .eq(NovelBookshelf::getUserId, userId)
                        .orderByDesc(NovelBookshelf::getPinned)
                        .orderByAsc(NovelBookshelf::getSortOrder)
                        .orderByDesc(NovelBookshelf::getLastReadAt)
                        .orderByDesc(NovelBookshelf::getUpdatedAt))
                .stream()
                .map(shelf -> {
                    NovelBook book = bookMapper.selectById(shelf.getBookId());
                    NovelReadingProgress progress = progressMapper.selectOne(new LambdaQueryWrapper<NovelReadingProgress>()
                            .eq(NovelReadingProgress::getUserId, userId)
                            .eq(NovelReadingProgress::getBookId, shelf.getBookId()));
                    return BookshelfItemVO.builder()
                            .shelfId(shelf.getId())
                            .book(book)
                            .progress(progress)
                            .pinned(Boolean.TRUE.equals(shelf.getPinned()))
                            .sortOrder(shelf.getSortOrder())
                            .lastReadAt(shelf.getLastReadAt())
                            .build();
                })
                .filter(item -> item.getBook() != null)
                .toList();
    }

    @Override
    public BookshelfStatsVO stats(Long userId) {
        List<BookshelfItemVO> items = list(userId);
        LocalDate today = LocalDate.now();
        List<NovelReadingHistory> histories = historyMapper.selectList(new LambdaQueryWrapper<NovelReadingHistory>()
                .eq(NovelReadingHistory::getUserId, userId)
                .orderByDesc(NovelReadingHistory::getReadAt));

        int todaySeconds = histories.stream()
                .filter(history -> history.getReadAt() != null && today.equals(history.getReadAt().toLocalDate()))
                .mapToInt(history -> history.getDurationSeconds() == null ? 0 : history.getDurationSeconds())
                .sum();
        int updateCount = items.stream()
                .filter(item -> item.getBook() != null)
                .filter(item -> {
                    int total = item.getBook().getChapterCount() == null ? 0 : item.getBook().getChapterCount();
                    int chapterNo = item.getProgress() == null || item.getProgress().getChapterNo() == null
                            ? 1
                            : item.getProgress().getChapterNo();
                    return total > chapterNo;
                })
                .mapToInt(item -> 1)
                .sum();
        BookshelfItemVO latest = items.stream()
                .filter(item -> item.getLastReadAt() != null || item.getProgress() != null)
                .max(Comparator.comparing(this::latestReadTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(items.isEmpty() ? null : items.get(0));

        return BookshelfStatsVO.builder()
                .totalBooks(items.size())
                .todayMinutes(Math.max(0, todaySeconds / 60))
                .streakDays(countStreakDays(histories))
                .updateCount(updateCount)
                .latestBookId(latest == null || latest.getBook() == null ? null : latest.getBook().getId())
                .latestBookTitle(latest == null || latest.getBook() == null ? null : latest.getBook().getTitle())
                .build();
    }

    @Override
    public void add(Long userId, Long bookId) {
        if (bookMapper.selectById(bookId) == null) {
            throw new BusinessException(404, "Book not found");
        }
        Long count = bookshelfMapper.selectCount(new LambdaQueryWrapper<NovelBookshelf>()
                .eq(NovelBookshelf::getUserId, userId)
                .eq(NovelBookshelf::getBookId, bookId));
        if (count > 0) {
            return;
        }
        bookshelfMapper.insert(NovelBookshelf.builder()
                .userId(userId)
                .bookId(bookId)
                .pinned(false)
                .sortOrder(0)
                .build());
    }

    @Override
    public void remove(Long userId, Long bookId) {
        bookshelfMapper.delete(new LambdaQueryWrapper<NovelBookshelf>()
                .eq(NovelBookshelf::getUserId, userId)
                .eq(NovelBookshelf::getBookId, bookId));
    }

    @Override
    public void sort(Long userId, List<Long> bookIds) {
        if (bookIds == null || bookIds.isEmpty()) {
            return;
        }
        for (int i = 0; i < bookIds.size(); i++) {
            NovelBookshelf shelf = bookshelfMapper.selectOne(new LambdaQueryWrapper<NovelBookshelf>()
                    .eq(NovelBookshelf::getUserId, userId)
                    .eq(NovelBookshelf::getBookId, bookIds.get(i)));
            if (shelf != null && !Objects.equals(shelf.getSortOrder(), i)) {
                shelf.setSortOrder(i);
                bookshelfMapper.updateById(shelf);
            }
        }
    }

    @Override
    public void pin(Long userId, Long bookId, boolean pinned) {
        NovelBookshelf shelf = bookshelfMapper.selectOne(new LambdaQueryWrapper<NovelBookshelf>()
                .eq(NovelBookshelf::getUserId, userId)
                .eq(NovelBookshelf::getBookId, bookId));
        if (shelf == null) {
            throw new BusinessException(404, "Bookshelf item not found");
        }
        shelf.setPinned(pinned);
        bookshelfMapper.updateById(shelf);
    }

    private LocalDateTime latestReadTime(BookshelfItemVO item) {
        if (item.getLastReadAt() != null) {
            return item.getLastReadAt();
        }
        return item.getProgress() == null ? null : item.getProgress().getUpdatedAt();
    }

    private int countStreakDays(List<NovelReadingHistory> histories) {
        Set<LocalDate> readDays = histories.stream()
                .map(NovelReadingHistory::getReadAt)
                .filter(Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .collect(Collectors.toSet());
        LocalDate cursor = LocalDate.now();
        int streak = 0;
        while (readDays.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }
}
