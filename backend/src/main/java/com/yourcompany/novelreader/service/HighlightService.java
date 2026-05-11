package com.yourcompany.novelreader.service;

import com.yourcompany.novelreader.dto.HighlightCreateDTO;
import com.yourcompany.novelreader.vo.HighlightVO;

import java.util.List;

public interface HighlightService {
    HighlightVO create(Long userId, HighlightCreateDTO dto);
    void delete(Long userId, Long highlightId);
    List<HighlightVO> listByUser(Long userId);
    List<HighlightVO> listByBook(Long userId, Long bookId);
    List<HighlightVO> listByChapter(Long userId, Long bookId, Integer chapterNo);
}
