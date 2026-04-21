package com.yourcompany.novelreader.service;

import com.yourcompany.novelreader.vo.BookshelfItemVO;

import java.util.List;

public interface BookshelfService {
    List<BookshelfItemVO> list(Long userId);
    void add(Long userId, Long bookId);
    void remove(Long userId, Long bookId);
}
