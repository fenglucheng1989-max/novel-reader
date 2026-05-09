package com.yourcompany.novelreader.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yourcompany.novelreader.entity.NovelComment;
import com.yourcompany.novelreader.mapper.NovelCommentMapper;
import com.yourcompany.novelreader.vo.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminCommentController extends BaseUserController {

    private final NovelCommentMapper commentMapper;

    public AdminCommentController(com.yourcompany.novelreader.mapper.AppUserMapper appUserMapper,
                                   NovelCommentMapper commentMapper) {
        super(appUserMapper);
        this.commentMapper = commentMapper;
    }

    @GetMapping("/comments")
    public ApiResponse<Map<String, Object>> comments(Authentication authentication,
                                                      @RequestParam(defaultValue = "1") int page,
                                                      @RequestParam(defaultValue = "10") int pageSize,
                                                      @RequestParam(required = false) String status,
                                                      @RequestParam(required = false) String commentType) {
        requireAdmin(authentication);
        LambdaQueryWrapper<NovelComment> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isBlank()) {
            wrapper.eq(NovelComment::getStatus, status);
        }
        if (commentType != null && !commentType.isBlank()) {
            wrapper.eq(NovelComment::getCommentType, commentType);
        }
        wrapper.orderByDesc(NovelComment::getCreatedAt);
        Page<NovelComment> result = commentMapper.selectPage(new Page<>(page, pageSize), wrapper);
        return ApiResponse.success(Map.of(
                "records", result.getRecords(),
                "total", result.getTotal(),
                "current", result.getCurrent(),
                "size", result.getSize()
        ));
    }

    @PutMapping("/comments/{id}/status")
    public ApiResponse<Void> updateStatus(Authentication authentication,
                                           @PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        requireAdmin(authentication);
        NovelComment comment = commentMapper.selectById(id);
        if (comment == null) return ApiResponse.error(404, "Comment not found");
        comment.setStatus(body.get("status"));
        commentMapper.updateById(comment);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/comments/{id}")
    public ApiResponse<Void> delete(Authentication authentication, @PathVariable Long id) {
        requireAdmin(authentication);
        commentMapper.deleteById(id);
        return ApiResponse.success(null);
    }
}
