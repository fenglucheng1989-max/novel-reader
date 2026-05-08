package com.yourcompany.novelreader.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yourcompany.novelreader.dto.CommentDTO;
import com.yourcompany.novelreader.entity.AppUser;
import com.yourcompany.novelreader.entity.NovelBook;
import com.yourcompany.novelreader.entity.NovelChapter;
import com.yourcompany.novelreader.entity.NovelComment;
import com.yourcompany.novelreader.exception.BusinessException;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import com.yourcompany.novelreader.mapper.CommentMapper;
import com.yourcompany.novelreader.mapper.NovelBookMapper;
import com.yourcompany.novelreader.mapper.NovelChapterMapper;
import com.yourcompany.novelreader.service.CommentService;
import com.yourcompany.novelreader.vo.CommentVO;
import com.yourcompany.novelreader.vo.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentMapper commentMapper;
    private final AppUserMapper appUserMapper;
    private final NovelChapterMapper chapterMapper;
    private final NovelBookMapper bookMapper;

    @Override
    public PageResult<CommentVO> getBookComments(Long bookId, Integer page, Integer pageSize) {
        int p = Math.max(1, page != null ? page : 1);
        int ps = Math.min(50, Math.max(1, pageSize != null ? pageSize : 10));

        Page<NovelComment> mpPage = new Page<>(p, ps);
        Page<NovelComment> result = commentMapper.selectPage(mpPage,
                new LambdaQueryWrapper<NovelComment>()
                        .eq(NovelComment::getBookId, bookId)
                        .eq(NovelComment::getStatus, "NORMAL")
                        .eq(NovelComment::getCommentType, "REVIEW")
                        .orderByDesc(NovelComment::getLikeCount)
                        .orderByDesc(NovelComment::getCreatedAt));

        List<CommentVO> vos = toCommentVOs(result.getRecords());

        return PageResult.<CommentVO>builder()
                .records(vos)
                .total(result.getTotal())
                .page(result.getCurrent())
                .pageSize(result.getSize())
                .build();
    }

    @Override
    public PageResult<CommentVO> getChapterComments(Long chapterId, Integer page, Integer pageSize) {
        int p = Math.max(1, page != null ? page : 1);
        int ps = Math.min(50, Math.max(1, pageSize != null ? pageSize : 10));

        Page<NovelComment> mpPage = new Page<>(p, ps);
        Page<NovelComment> result = commentMapper.selectPage(mpPage,
                new LambdaQueryWrapper<NovelComment>()
                        .eq(NovelComment::getChapterId, chapterId)
                        .eq(NovelComment::getStatus, "NORMAL")
                        .ne(NovelComment::getCommentType, "TYPO")
                        .orderByDesc(NovelComment::getCreatedAt));

        List<CommentVO> vos = toCommentVOs(result.getRecords());

        return PageResult.<CommentVO>builder()
                .records(vos)
                .total(result.getTotal())
                .page(result.getCurrent())
                .pageSize(result.getSize())
                .build();
    }

    @Override
    public PageResult<CommentVO> getMyComments(Long userId, Integer page, Integer pageSize) {
        int p = Math.max(1, page != null ? page : 1);
        int ps = Math.min(50, Math.max(1, pageSize != null ? pageSize : 20));

        Page<NovelComment> mpPage = new Page<>(p, ps);
        Page<NovelComment> result = commentMapper.selectPage(mpPage,
                new LambdaQueryWrapper<NovelComment>()
                        .eq(NovelComment::getUserId, userId)
                        .eq(NovelComment::getStatus, "NORMAL")
                        .ne(NovelComment::getCommentType, "TYPO")
                        .orderByDesc(NovelComment::getCreatedAt));

        return PageResult.<CommentVO>builder()
                .records(toCommentVOs(result.getRecords()))
                .total(result.getTotal())
                .page(result.getCurrent())
                .pageSize(result.getSize())
                .build();
    }

    @Override
    public CommentVO createComment(Long userId, CommentDTO dto) {
        if (dto.getContent() == null || dto.getContent().isBlank()) {
            throw new BusinessException(400, "Comment content is required");
        }
        if (dto.getBookId() == null) {
            throw new BusinessException(400, "Book ID is required");
        }
        String commentType = normalizeCommentType(dto.getCommentType());
        NovelComment comment = NovelComment.builder()
                .userId(userId)
                .bookId(dto.getBookId())
                .chapterId(dto.getChapterId())
                .content(dto.getContent().trim())
                .commentType(commentType)
                .paragraphIndex(dto.getParagraphIndex())
                .quoteText(trimToLimit(dto.getQuoteText(), 500))
                .likeCount(0)
                .status("NORMAL")
                .build();
        commentMapper.insert(comment);

        AppUser user = appUserMapper.selectById(userId);
        String chapterTitle = null;
        if (dto.getChapterId() != null) {
            NovelChapter chapter = chapterMapper.selectById(dto.getChapterId());
            if (chapter != null) {
                chapterTitle = chapter.getTitle();
            }
        }
        NovelBook book = bookMapper.selectById(comment.getBookId());
        return CommentVO.builder()
                .id(comment.getId())
                .userId(userId)
                .username(user != null ? user.getUsername() : null)
                .bookId(comment.getBookId())
                .bookTitle(book == null ? null : book.getTitle())
                .chapterId(comment.getChapterId())
                .chapterTitle(chapterTitle)
                .content(comment.getContent())
                .commentType(comment.getCommentType())
                .paragraphIndex(comment.getParagraphIndex())
                .quoteText(comment.getQuoteText())
                .likeCount(comment.getLikeCount())
                .status(comment.getStatus())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private String normalizeCommentType(String type) {
        if (type == null || type.isBlank()) return "REVIEW";
        String normalized = type.trim().toUpperCase();
        if (normalized.equals("REVIEW") || normalized.equals("PARAGRAPH") || normalized.equals("TYPO")) {
            return normalized;
        }
        return "REVIEW";
    }

    private String trimToLimit(String text, int limit) {
        if (text == null) return null;
        String trimmed = text.trim();
        if (trimmed.length() <= limit) return trimmed;
        return trimmed.substring(0, limit);
    }

    private List<CommentVO> toCommentVOs(List<NovelComment> comments) {
        if (comments.isEmpty()) return List.of();

        List<Long> userIds = comments.stream()
                .map(NovelComment::getUserId)
                .distinct()
                .toList();
        Map<Long, String> usernameMap = appUserMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(AppUser::getId, AppUser::getUsername));

        List<Long> bookIds = comments.stream()
                .map(NovelComment::getBookId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<Long, String> bookTitleMap = bookIds.isEmpty() ? Map.of() :
                bookMapper.selectBatchIds(bookIds).stream()
                        .collect(Collectors.toMap(NovelBook::getId, NovelBook::getTitle));

        List<Long> chapterIds = comments.stream()
                .map(NovelComment::getChapterId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<Long, String> chapterTitleMap = chapterIds.isEmpty() ? Map.of() :
                chapterMapper.selectBatchIds(chapterIds).stream()
                        .collect(Collectors.toMap(NovelChapter::getId, NovelChapter::getTitle));

        return comments.stream()
                .map(c -> CommentVO.builder()
                        .id(c.getId())
                        .userId(c.getUserId())
                        .username(usernameMap.getOrDefault(c.getUserId(), null))
                        .bookId(c.getBookId())
                        .bookTitle(c.getBookId() != null ? bookTitleMap.getOrDefault(c.getBookId(), null) : null)
                        .chapterId(c.getChapterId())
                        .chapterTitle(c.getChapterId() != null ? chapterTitleMap.getOrDefault(c.getChapterId(), null) : null)
                        .content(c.getContent())
                        .commentType(c.getCommentType())
                        .paragraphIndex(c.getParagraphIndex())
                        .quoteText(c.getQuoteText())
                        .likeCount(c.getLikeCount())
                        .status(c.getStatus())
                        .createdAt(c.getCreatedAt())
                        .build())
                .toList();
    }
}
