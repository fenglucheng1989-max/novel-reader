package com.yourcompany.novelreader.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yourcompany.novelreader.entity.NovelBook;
import com.yourcompany.novelreader.entity.NovelBookshelf;
import com.yourcompany.novelreader.entity.NovelReadingProgress;
import com.yourcompany.novelreader.exception.BusinessException;
import com.yourcompany.novelreader.mapper.NovelBookMapper;
import com.yourcompany.novelreader.mapper.NovelBookshelfMapper;
import com.yourcompany.novelreader.mapper.NovelReadingProgressMapper;
import com.yourcompany.novelreader.service.BookshelfService;
import com.yourcompany.novelreader.vo.BookshelfItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookshelfServiceImpl implements BookshelfService {

    private final NovelBookshelfMapper bookshelfMapper;
    private final NovelBookMapper bookMapper;
    private final NovelReadingProgressMapper progressMapper;

    @Override
    public List<BookshelfItemVO> list(Long userId) {
        return bookshelfMapper.selectList(new LambdaQueryWrapper<NovelBookshelf>()
                        .eq(NovelBookshelf::getUserId, userId)
                        .orderByAsc(NovelBookshelf::getSortOrder)
                        .orderByDesc(NovelBookshelf::getUpdatedAt))
                .stream()
                .map(shelf -> {
                    NovelBook book = bookMapper.selectById(shelf.getBookId());
                    NovelReadingProgress progress = progressMapper.selectOne(new LambdaQueryWrapper<NovelReadingProgress>()
                            .eq(NovelReadingProgress::getUserId, userId)
                            .eq(NovelReadingProgress::getBookId, shelf.getBookId()));
                    return BookshelfItemVO.builder().shelfId(shelf.getId()).book(book).progress(progress).build();
                })
                .filter(item -> item.getBook() != null)
                .toList();
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
                .sortOrder(0)
                .build());
    }

    @Override
    public void remove(Long userId, Long bookId) {
        bookshelfMapper.delete(new LambdaQueryWrapper<NovelBookshelf>()
                .eq(NovelBookshelf::getUserId, userId)
                .eq(NovelBookshelf::getBookId, bookId));
    }
}
