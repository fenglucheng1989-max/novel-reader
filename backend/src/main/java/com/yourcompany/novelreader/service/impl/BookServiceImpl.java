package com.yourcompany.novelreader.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yourcompany.novelreader.dto.BookDTO;
import com.yourcompany.novelreader.dto.BookFilterDTO;
import com.yourcompany.novelreader.dto.ChapterDTO;
import com.yourcompany.novelreader.entity.NovelBook;
import com.yourcompany.novelreader.entity.NovelBookStats;
import com.yourcompany.novelreader.entity.NovelBookTag;
import com.yourcompany.novelreader.entity.NovelBookshelf;
import com.yourcompany.novelreader.entity.NovelCategory;
import com.yourcompany.novelreader.entity.NovelChapter;
import com.yourcompany.novelreader.entity.NovelReadingHistory;
import com.yourcompany.novelreader.entity.NovelReadingProgress;
import com.yourcompany.novelreader.exception.BusinessException;
import com.yourcompany.novelreader.mapper.NovelBookMapper;
import com.yourcompany.novelreader.mapper.NovelBookStatsMapper;
import com.yourcompany.novelreader.mapper.NovelBookTagMapper;
import com.yourcompany.novelreader.mapper.NovelBookshelfMapper;
import com.yourcompany.novelreader.mapper.NovelCategoryMapper;
import com.yourcompany.novelreader.mapper.NovelChapterMapper;
import com.yourcompany.novelreader.mapper.NovelReadingHistoryMapper;
import com.yourcompany.novelreader.mapper.NovelReadingProgressMapper;
import com.yourcompany.novelreader.service.BookService;
import com.yourcompany.novelreader.vo.BookDetailVO;
import com.yourcompany.novelreader.vo.ChapterItemVO;
import com.yourcompany.novelreader.vo.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final NovelBookMapper bookMapper;
    private final NovelCategoryMapper categoryMapper;
    private final NovelChapterMapper chapterMapper;
    private final NovelBookshelfMapper bookshelfMapper;
    private final NovelReadingProgressMapper progressMapper;
    private final NovelReadingHistoryMapper historyMapper;
    private final NovelBookStatsMapper statsMapper;
    private final NovelBookTagMapper tagMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public List<NovelBook> recommend(Long categoryId) {
        return list(categoryId, null).stream().limit(12).toList();
    }

    @Override
    public List<NovelBook> rank(Long categoryId, Integer limit) {
        int size = limit == null ? 50 : Math.max(1, Math.min(limit, 100));
        LambdaQueryWrapper<NovelBook> query = new LambdaQueryWrapper<NovelBook>()
                .orderByDesc(NovelBook::getChapterCount)
                .orderByDesc(NovelBook::getWordCount)
                .orderByAsc(NovelBook::getSortOrder)
                .orderByDesc(NovelBook::getUpdatedAt);
        if (categoryId != null) {
            query.eq(NovelBook::getCategoryId, categoryId);
        }
        return bookMapper.selectList(query).stream().limit(size).toList();
    }

    @Override
    public List<NovelBook> list(Long categoryId, String keyword) {
        LambdaQueryWrapper<NovelBook> query = new LambdaQueryWrapper<NovelBook>()
                .orderByAsc(NovelBook::getSortOrder)
                .orderByDesc(NovelBook::getUpdatedAt);
        if (categoryId != null) {
            query.eq(NovelBook::getCategoryId, categoryId);
        }
        if (keyword != null && !keyword.isBlank()) {
            query.and(q -> q.like(NovelBook::getTitle, keyword).or().like(NovelBook::getAuthor, keyword));
        }
        return bookMapper.selectList(query);
    }

    @Override
    public BookDetailVO detail(Long bookId, Long userId) {
        NovelBook book = requireBook(bookId);
        NovelCategory category = book.getCategoryId() == null ? null : categoryMapper.selectById(book.getCategoryId());
        boolean inBookshelf = userId != null && bookshelfMapper.selectCount(new LambdaQueryWrapper<NovelBookshelf>()
                .eq(NovelBookshelf::getUserId, userId)
                .eq(NovelBookshelf::getBookId, bookId)) > 0;
        NovelBookStats stats = statsMapper.selectById(bookId);
        List<String> tags = tagMapper.selectList(new LambdaQueryWrapper<NovelBookTag>()
                .eq(NovelBookTag::getBookId, bookId)
                .orderByAsc(NovelBookTag::getSortOrder))
                .stream().map(NovelBookTag::getTag).toList();
        int estimatedMinutes = estimateReadingMinutes(book.getWordCount());
        return BookDetailVO.builder()
                .book(book)
                .categoryName(category == null ? null : category.getName())
                .inBookshelf(inBookshelf)
                .chapters(chapters(bookId))
                .rating(stats == null ? null : stats.getRating())
                .ratingCount(stats == null ? null : stats.getRatingCount())
                .readingCount(stats == null ? null : stats.getReadingCount())
                .favoriteCount(stats == null ? null : stats.getFavoriteCount())
                .tags(tags)
                .estimatedReadingMinutes(estimatedMinutes)
                .build();
    }

    @Override
    public List<NovelBook> recommendations(Long bookId, Integer limit) {
        NovelBook book = requireBook(bookId);
        int size = limit == null ? 6 : Math.max(1, Math.min(limit, 20));
        return bookMapper.selectList(new LambdaQueryWrapper<NovelBook>()
                .eq(book.getCategoryId() != null, NovelBook::getCategoryId, book.getCategoryId())
                .ne(NovelBook::getId, bookId)
                .orderByDesc(NovelBook::getUpdatedAt))
                .stream().limit(size).toList();
    }

    @Override
    public PageResult<NovelBook> filter(BookFilterDTO filter) {
        int page = Math.max(1, filter.getPage() != null ? filter.getPage() : 1);
        int pageSize = Math.min(100, Math.max(1, filter.getPageSize() != null ? filter.getPageSize() : 20));

        LambdaQueryWrapper<NovelBook> query = new LambdaQueryWrapper<>();
        query.eq(filter.getCategoryId() != null, NovelBook::getCategoryId, filter.getCategoryId());
        query.eq(filter.getStatus() != null && !filter.getStatus().isBlank(),
                NovelBook::getStatus, filter.getStatus());
        query.ge(filter.getMinWordCount() != null, NovelBook::getWordCount, filter.getMinWordCount());
        query.le(filter.getMaxWordCount() != null, NovelBook::getWordCount, filter.getMaxWordCount());
        if (filter.getKeyword() != null && !filter.getKeyword().isBlank()) {
            query.and(q -> q.like(NovelBook::getTitle, filter.getKeyword())
                    .or().like(NovelBook::getAuthor, filter.getKeyword()));
        }

        String sortBy = filter.getSortBy();
        if ("wordCount".equals(sortBy)) {
            query.orderByDesc(NovelBook::getWordCount);
        } else if ("chapterCount".equals(sortBy)) {
            query.orderByDesc(NovelBook::getChapterCount);
        } else {
            query.orderByDesc(NovelBook::getCreatedAt);
        }
        query.orderByAsc(NovelBook::getSortOrder);

        Page<NovelBook> mpPage = new Page<>(page, pageSize);
        Page<NovelBook> result = bookMapper.selectPage(mpPage, query);

        return PageResult.<NovelBook>builder()
                .records(result.getRecords())
                .total(result.getTotal())
                .page(result.getCurrent())
                .pageSize(result.getSize())
                .build();
    }

    @Override
    public List<NovelBook> featured(Integer limit) {
        int size = limit != null ? Math.min(20, Math.max(1, limit)) : 6;
        return bookMapper.selectList(new LambdaQueryWrapper<NovelBook>()
                .orderByDesc(NovelBook::getUpdatedAt)
                .orderByAsc(NovelBook::getSortOrder))
                .stream().limit(size).toList();
    }

    private int estimateReadingMinutes(Integer wordCount) {
        if (wordCount == null || wordCount == 0) return 0;
        return Math.max(1, wordCount / 400);
    }

    @Override
    public List<ChapterItemVO> chapters(Long bookId) {
        return chapterMapper.selectList(new LambdaQueryWrapper<NovelChapter>()
                        .eq(NovelChapter::getBookId, bookId)
                        .orderByAsc(NovelChapter::getChapterNo))
                .stream()
                .map(chapter -> ChapterItemVO.builder()
                        .id(chapter.getId())
                        .bookId(chapter.getBookId())
                        .chapterNo(chapter.getChapterNo())
                        .title(chapter.getTitle())
                        .wordCount(chapter.getWordCount())
                        .build())
                .toList();
    }

    @Override
    public NovelChapter chapter(Long bookId, Integer chapterNo) {
        String key = "novel:chapter:" + bookId + ":" + chapterNo;
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached instanceof NovelChapter novelChapter) {
                return novelChapter;
            }
        } catch (Exception ignored) {
        }
        NovelChapter chapter = chapterMapper.selectOne(new LambdaQueryWrapper<NovelChapter>()
                .eq(NovelChapter::getBookId, bookId)
                .eq(NovelChapter::getChapterNo, chapterNo));
        if (chapter == null) {
            throw new BusinessException(404, "Chapter not found");
        }
        try {
            redisTemplate.opsForValue().set(key, chapter, Duration.ofHours(2));
        } catch (Exception ignored) {
        }
        return chapter;
    }

    @Override
    public List<NovelCategory> categories() {
        return categoryMapper.selectList(new LambdaQueryWrapper<NovelCategory>()
                .orderByAsc(NovelCategory::getSortOrder)
                .orderByAsc(NovelCategory::getId));
    }

    @Override
    public NovelBook createBook(BookDTO dto) {
        NovelBook book = new NovelBook();
        applyBook(book, dto);
        book.setWordCount(0);
        book.setChapterCount(0);
        bookMapper.insert(book);
        return book;
    }

    @Override
    public NovelBook updateBook(Long id, BookDTO dto) {
        NovelBook book = requireBook(id);
        applyBook(book, dto);
        bookMapper.updateById(book);
        clearBookCache(id);
        return book;
    }

    @Override
    public void deleteBook(Long id) {
        requireBook(id);
        bookshelfMapper.delete(new LambdaQueryWrapper<NovelBookshelf>().eq(NovelBookshelf::getBookId, id));
        progressMapper.delete(new LambdaQueryWrapper<NovelReadingProgress>().eq(NovelReadingProgress::getBookId, id));
        historyMapper.delete(new LambdaQueryWrapper<NovelReadingHistory>().eq(NovelReadingHistory::getBookId, id));
        chapterMapper.delete(new LambdaQueryWrapper<NovelChapter>().eq(NovelChapter::getBookId, id));
        bookMapper.deleteById(id);
        clearBookCache(id);
    }

    @Override
    public NovelChapter createChapter(Long bookId, ChapterDTO dto) {
        requireBook(bookId);
        NovelChapter chapter = NovelChapter.builder()
                .bookId(bookId)
                .chapterNo(dto.getChapterNo())
                .title(dto.getTitle())
                .content(dto.getContent())
                .wordCount(countWords(dto.getContent()))
                .build();
        chapterMapper.insert(chapter);
        refreshBookStats(bookId);
        clearBookCache(bookId);
        return chapter;
    }

    @Override
    public NovelChapter updateChapter(Long id, ChapterDTO dto) {
        NovelChapter chapter = chapterMapper.selectById(id);
        if (chapter == null) {
            throw new BusinessException(404, "Chapter not found");
        }
        chapter.setChapterNo(dto.getChapterNo());
        chapter.setTitle(dto.getTitle());
        chapter.setContent(dto.getContent());
        chapter.setWordCount(countWords(dto.getContent()));
        chapterMapper.updateById(chapter);
        refreshBookStats(chapter.getBookId());
        clearBookCache(chapter.getBookId());
        return chapter;
    }

    @Override
    public void deleteChapter(Long id) {
        NovelChapter chapter = chapterMapper.selectById(id);
        if (chapter == null) {
            return;
        }
        chapterMapper.deleteById(id);
        refreshBookStats(chapter.getBookId());
        clearBookCache(chapter.getBookId());
    }

    private NovelBook requireBook(Long id) {
        NovelBook book = bookMapper.selectById(id);
        if (book == null) {
            throw new BusinessException(404, "Book not found");
        }
        return book;
    }

    private void applyBook(NovelBook book, BookDTO dto) {
        book.setTitle(dto.getTitle());
        book.setAuthor(dto.getAuthor());
        book.setCategoryId(dto.getCategoryId());
        book.setDescription(dto.getDescription());
        book.setCoverUrl(dto.getCoverUrl());
        book.setStatus(dto.getStatus() == null ? "ONGOING" : dto.getStatus());
        book.setSourceType(dto.getSourceType() == null ? "MANUAL" : dto.getSourceType());
        book.setSortOrder(dto.getSortOrder() == null ? 0 : dto.getSortOrder());
    }

    private int countWords(String content) {
        return content == null ? 0 : content.replaceAll("\\s+", "").length();
    }

    private void refreshBookStats(Long bookId) {
        List<NovelChapter> chapters = chapterMapper.selectList(new LambdaQueryWrapper<NovelChapter>()
                .eq(NovelChapter::getBookId, bookId)
                .orderByAsc(NovelChapter::getChapterNo));
        NovelBook book = requireBook(bookId);
        book.setChapterCount(chapters.size());
        book.setWordCount(chapters.stream().mapToInt(c -> c.getWordCount() == null ? 0 : c.getWordCount()).sum());
        if (!chapters.isEmpty()) {
            book.setLatestChapterTitle(chapters.get(chapters.size() - 1).getTitle());
        } else {
            book.setLatestChapterTitle(null);
        }
        bookMapper.updateById(book);
    }

    private void clearBookCache(Long bookId) {
        try {
            Set<String> keys = redisTemplate.keys("novel:chapter:" + bookId + ":*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception ignored) {
        }
    }
}
