package com.yourcompany.novelreader.service;

import com.yourcompany.novelreader.dto.BookDTO;
import com.yourcompany.novelreader.dto.ChapterDTO;
import com.yourcompany.novelreader.entity.NovelBook;
import com.yourcompany.novelreader.entity.NovelCategory;
import com.yourcompany.novelreader.entity.NovelChapter;
import com.yourcompany.novelreader.vo.BookDetailVO;
import com.yourcompany.novelreader.vo.ChapterItemVO;

import java.util.List;

public interface BookService {
    List<NovelBook> recommend(Long categoryId);
    List<NovelBook> rank(Long categoryId, Integer limit);
    List<NovelBook> list(Long categoryId, String keyword);
    BookDetailVO detail(Long bookId, Long userId);
    List<ChapterItemVO> chapters(Long bookId);
    NovelChapter chapter(Long bookId, Integer chapterNo);
    List<NovelCategory> categories();
    NovelBook createBook(BookDTO dto);
    NovelBook updateBook(Long id, BookDTO dto);
    void deleteBook(Long id);
    NovelChapter createChapter(Long bookId, ChapterDTO dto);
    NovelChapter updateChapter(Long id, ChapterDTO dto);
    void deleteChapter(Long id);
}
