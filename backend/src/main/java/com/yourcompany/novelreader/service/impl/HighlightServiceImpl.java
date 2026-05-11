package com.yourcompany.novelreader.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yourcompany.novelreader.dto.HighlightCreateDTO;
import com.yourcompany.novelreader.entity.NovelHighlight;
import com.yourcompany.novelreader.exception.BusinessException;
import com.yourcompany.novelreader.mapper.NovelHighlightMapper;
import com.yourcompany.novelreader.service.HighlightService;
import com.yourcompany.novelreader.vo.HighlightVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HighlightServiceImpl implements HighlightService {

    private final NovelHighlightMapper highlightMapper;

    @Override
    public HighlightVO create(Long userId, HighlightCreateDTO dto) {
        NovelHighlight entity = NovelHighlight.builder()
                .userId(userId)
                .bookId(dto.getBookId())
                .bookTitle(dto.getBookTitle())
                .chapterNo(dto.getChapterNo())
                .paragraphIndex(dto.getParagraphIndex() != null ? dto.getParagraphIndex() : 0)
                .quoteText(dto.getQuoteText())
                .color(dto.getColor() != null ? dto.getColor() : "#FFEB3B")
                .createdAt(LocalDateTime.now())
                .build();
        highlightMapper.insert(entity);
        return toVO(entity);
    }

    @Override
    public void delete(Long userId, Long highlightId) {
        NovelHighlight entity = highlightMapper.selectById(highlightId);
        if (entity == null || !entity.getUserId().equals(userId)) {
            throw new BusinessException("摘录不存在");
        }
        highlightMapper.deleteById(highlightId);
    }

    @Override
    public List<HighlightVO> listByUser(Long userId) {
        List<NovelHighlight> list = highlightMapper.selectList(
                new LambdaQueryWrapper<NovelHighlight>()
                        .eq(NovelHighlight::getUserId, userId)
                        .orderByDesc(NovelHighlight::getCreatedAt));
        return list.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public List<HighlightVO> listByBook(Long userId, Long bookId) {
        List<NovelHighlight> list = highlightMapper.selectList(
                new LambdaQueryWrapper<NovelHighlight>()
                        .eq(NovelHighlight::getUserId, userId)
                        .eq(NovelHighlight::getBookId, bookId)
                        .orderByAsc(NovelHighlight::getChapterNo));
        return list.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public List<HighlightVO> listByChapter(Long userId, Long bookId, Integer chapterNo) {
        List<NovelHighlight> list = highlightMapper.selectList(
                new LambdaQueryWrapper<NovelHighlight>()
                        .eq(NovelHighlight::getUserId, userId)
                        .eq(NovelHighlight::getBookId, bookId)
                        .eq(NovelHighlight::getChapterNo, chapterNo)
                        .orderByAsc(NovelHighlight::getParagraphIndex));
        return list.stream().map(this::toVO).collect(Collectors.toList());
    }

    private HighlightVO toVO(NovelHighlight entity) {
        return HighlightVO.builder()
                .id(entity.getId())
                .bookId(entity.getBookId())
                .bookTitle(entity.getBookTitle())
                .chapterNo(entity.getChapterNo())
                .paragraphIndex(entity.getParagraphIndex())
                .quoteText(entity.getQuoteText())
                .color(entity.getColor())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
