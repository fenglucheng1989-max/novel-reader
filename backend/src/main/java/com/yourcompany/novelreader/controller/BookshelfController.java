package com.yourcompany.novelreader.controller;

import com.yourcompany.novelreader.mapper.AppUserMapper;
import com.yourcompany.novelreader.service.BookshelfService;
import com.yourcompany.novelreader.vo.ApiResponse;
import com.yourcompany.novelreader.vo.BookshelfItemVO;
import com.yourcompany.novelreader.vo.BookshelfSortRequest;
import com.yourcompany.novelreader.vo.BookshelfStatsVO;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookshelf")
public class BookshelfController extends BaseUserController {

    private final BookshelfService bookshelfService;

    public BookshelfController(AppUserMapper appUserMapper, BookshelfService bookshelfService) {
        super(appUserMapper);
        this.bookshelfService = bookshelfService;
    }

    @GetMapping
    public ApiResponse<List<BookshelfItemVO>> list(Authentication authentication) {
        return ApiResponse.success(bookshelfService.list(currentUserId(authentication)));
    }

    @GetMapping("/stats")
    public ApiResponse<BookshelfStatsVO> stats(Authentication authentication) {
        return ApiResponse.success(bookshelfService.stats(currentUserId(authentication)));
    }

    @PostMapping("/{bookId}")
    public ApiResponse<Void> add(Authentication authentication, @PathVariable Long bookId) {
        bookshelfService.add(currentUserId(authentication), bookId);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{bookId}")
    public ApiResponse<Void> remove(Authentication authentication, @PathVariable Long bookId) {
        bookshelfService.remove(currentUserId(authentication), bookId);
        return ApiResponse.success(null);
    }

    @PutMapping("/{bookId}/pin")
    public ApiResponse<Void> pin(Authentication authentication, @PathVariable Long bookId) {
        bookshelfService.pin(currentUserId(authentication), bookId, true);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{bookId}/pin")
    public ApiResponse<Void> unpin(Authentication authentication, @PathVariable Long bookId) {
        bookshelfService.pin(currentUserId(authentication), bookId, false);
        return ApiResponse.success(null);
    }

    @PutMapping("/sort")
    public ApiResponse<Void> sort(Authentication authentication, @RequestBody BookshelfSortRequest request) {
        bookshelfService.sort(currentUserId(authentication), request.getBookIds());
        return ApiResponse.success(null);
    }
}
