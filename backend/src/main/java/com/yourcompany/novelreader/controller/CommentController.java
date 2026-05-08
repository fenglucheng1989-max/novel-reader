package com.yourcompany.novelreader.controller;

import com.yourcompany.novelreader.dto.CommentDTO;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import com.yourcompany.novelreader.service.CommentService;
import com.yourcompany.novelreader.vo.ApiResponse;
import com.yourcompany.novelreader.vo.CommentVO;
import com.yourcompany.novelreader.vo.PageResult;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class CommentController extends BaseUserController {

    private final CommentService commentService;

    public CommentController(AppUserMapper appUserMapper, CommentService commentService) {
        super(appUserMapper);
        this.commentService = commentService;
    }

    @GetMapping("/books/{id}/comments")
    public ApiResponse<PageResult<CommentVO>> bookComments(@PathVariable Long id,
                                                           @RequestParam(required = false) Integer page,
                                                           @RequestParam(required = false) Integer pageSize) {
        return ApiResponse.success(commentService.getBookComments(id, page, pageSize));
    }

    @GetMapping("/chapters/{chapterId}/comments")
    public ApiResponse<PageResult<CommentVO>> chapterComments(@PathVariable Long chapterId,
                                                              @RequestParam(required = false) Integer page,
                                                              @RequestParam(required = false) Integer pageSize) {
        return ApiResponse.success(commentService.getChapterComments(chapterId, page, pageSize));
    }

    @PostMapping("/comments")
    public ApiResponse<CommentVO> createComment(Authentication authentication,
                                                @RequestBody CommentDTO dto) {
        Long userId = currentUserId(authentication);
        return ApiResponse.success(commentService.createComment(userId, dto));
    }

    @GetMapping("/comments/mine")
    public ApiResponse<PageResult<CommentVO>> myComments(Authentication authentication,
                                                         @RequestParam(required = false) Integer page,
                                                         @RequestParam(required = false) Integer pageSize) {
        Long userId = currentUserId(authentication);
        return ApiResponse.success(commentService.getMyComments(userId, page, pageSize));
    }
}
