package com.yourcompany.novelreader.controller;

import com.yourcompany.novelreader.dto.HighlightCreateDTO;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import com.yourcompany.novelreader.service.HighlightService;
import com.yourcompany.novelreader.vo.ApiResponse;
import com.yourcompany.novelreader.vo.HighlightVO;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/highlights")
public class HighlightController extends BaseUserController {

    private final HighlightService highlightService;

    public HighlightController(AppUserMapper appUserMapper, HighlightService highlightService) {
        super(appUserMapper);
        this.highlightService = highlightService;
    }

    @GetMapping
    public ApiResponse<List<HighlightVO>> list(Authentication authentication,
                                                @RequestParam(required = false) Long bookId,
                                                @RequestParam(required = false) Integer chapterNo) {
        Long userId = currentUserId(authentication);
        if (bookId != null && chapterNo != null) {
            return ApiResponse.success(highlightService.listByChapter(userId, bookId, chapterNo));
        }
        if (bookId != null) {
            return ApiResponse.success(highlightService.listByBook(userId, bookId));
        }
        return ApiResponse.success(highlightService.listByUser(userId));
    }

    @PostMapping
    public ApiResponse<HighlightVO> create(Authentication authentication,
                                           @RequestBody HighlightCreateDTO dto) {
        Long userId = currentUserId(authentication);
        return ApiResponse.success(highlightService.create(userId, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(Authentication authentication, @PathVariable Long id) {
        Long userId = currentUserId(authentication);
        highlightService.delete(userId, id);
        return ApiResponse.success(null);
    }
}
