package com.yourcompany.novelreader.service;

import com.yourcompany.novelreader.dto.CommentDTO;
import com.yourcompany.novelreader.vo.CommentVO;
import com.yourcompany.novelreader.vo.PageResult;

public interface CommentService {
    PageResult<CommentVO> getBookComments(Long bookId, Integer page, Integer pageSize);
    PageResult<CommentVO> getChapterComments(Long chapterId, Integer page, Integer pageSize);
    PageResult<CommentVO> getMyComments(Long userId, Integer page, Integer pageSize);
    CommentVO createComment(Long userId, CommentDTO dto);
}
