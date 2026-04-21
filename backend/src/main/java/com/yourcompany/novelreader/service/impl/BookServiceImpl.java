package com.yourcompany.novelreader.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yourcompany.novelreader.dto.BookDTO;
import com.yourcompany.novelreader.dto.ChapterDTO;
import com.yourcompany.novelreader.entity.NovelBook;
import com.yourcompany.novelreader.entity.NovelBookshelf;
import com.yourcompany.novelreader.entity.NovelCategory;
import com.yourcompany.novelreader.entity.NovelChapter;
import com.yourcompany.novelreader.exception.BusinessException;
import com.yourcompany.novelreader.mapper.NovelBookMapper;
import com.yourcompany.novelreader.mapper.NovelBookshelfMapper;
import com.yourcompany.novelreader.mapper.NovelCategoryMapper;
import com.yourcompany.novelreader.mapper.NovelChapterMapper;
import com.yourcompany.novelreader.service.BookService;
import com.yourcompany.novelreader.vo.BookDetailVO;
import com.yourcompany.novelreader.vo.ChapterItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final NovelBookMapper bookMapper;
    private final NovelCategoryMapper categoryMapper;
    private final NovelChapterMapper chapterMapper;
    private final NovelBookshelfMapper bookshelfMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public List<NovelBook> recommend(Long categoryId) {
        return list(categoryId, null).stream().limit(12).toList();
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
        return BookDetailVO.builder()
                .book(book)
                .categoryName(category == null ? null : category.getName())
                .inBookshelf(inBookshelf)
                .chapters(chapters(bookId))
                .build();
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
        bookMapper.deleteById(id);
        chapterMapper.delete(new LambdaQueryWrapper<NovelChapter>().eq(NovelChapter::getBookId, id));
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
        }
        bookMapper.updateById(book);
    }

    private void clearBookCache(Long bookId) {
        try {
            redisTemplate.delete("novel:chapters:" + bookId);
        } catch (Exception ignored) {
        }
    }
}
