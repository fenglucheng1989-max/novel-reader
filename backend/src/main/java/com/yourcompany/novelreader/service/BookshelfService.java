package com.yourcompany.novelreader.service;

import com.yourcompany.novelreader.vo.BookshelfItemVO;
import com.yourcompany.novelreader.vo.BookshelfStatsVO;

import java.util.List;

public interface BookshelfService {
    List<BookshelfItemVO> list(Long userId);
    BookshelfStatsVO stats(Long userId);
    void add(Long userId, Long bookId);
    void remove(Long userId, Long bookId);
    void pin(Long userId, Long bookId, boolean pinned);
    void sort(Long userId, List<Long> bookIds);
}
