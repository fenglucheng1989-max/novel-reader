package com.yourcompany.novelreader.controller;

import com.yourcompany.novelreader.entity.NovelBook;
import com.yourcompany.novelreader.entity.NovelCategory;
import com.yourcompany.novelreader.entity.NovelChapter;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import com.yourcompany.novelreader.service.BookService;
import com.yourcompany.novelreader.vo.ApiResponse;
import com.yourcompany.novelreader.vo.BookDetailVO;
import com.yourcompany.novelreader.vo.ChapterItemVO;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class BookController extends BaseUserController {

    private final BookService bookService;

    public BookController(AppUserMapper appUserMapper, BookService bookService) {
        super(appUserMapper);
        this.bookService = bookService;
    }

    @GetMapping("/books/recommend")
    public ApiResponse<List<NovelBook>> recommend(@RequestParam(required = false) Long categoryId) {
        return ApiResponse.success(bookService.recommend(categoryId));
    }

    @GetMapping("/books/rank")
    public ApiResponse<List<NovelBook>> rank(@RequestParam(required = false) Long categoryId,
                                             @RequestParam(required = false) Integer limit) {
        return ApiResponse.success(bookService.rank(categoryId, limit));
    }

    @GetMapping("/books")
    public ApiResponse<List<NovelBook>> list(@RequestParam(required = false) Long categoryId,
                                             @RequestParam(required = false) String keyword) {
        return ApiResponse.success(bookService.list(categoryId, keyword));
    }

    @GetMapping("/books/{id}")
    public ApiResponse<BookDetailVO> detail(@PathVariable Long id, Authentication authentication) {
        Long userId = isRealUser(authentication) ? currentUserId(authentication) : null;
        return ApiResponse.success(bookService.detail(id, userId));
    }

    @GetMapping("/books/{id}/chapters")
    public ApiResponse<List<ChapterItemVO>> chapters(@PathVariable Long id) {
        return ApiResponse.success(bookService.chapters(id));
    }

    @GetMapping("/books/{id}/chapters/{chapterNo}")
    public ApiResponse<NovelChapter> chapter(@PathVariable Long id, @PathVariable Integer chapterNo) {
        return ApiResponse.success(bookService.chapter(id, chapterNo));
    }

    @GetMapping("/categories")
    public ApiResponse<List<NovelCategory>> categories() {
        return ApiResponse.success(bookService.categories());
    }

    @GetMapping("/search/books")
    public ApiResponse<List<NovelBook>> search(@RequestParam String keyword) {
        return ApiResponse.success(bookService.list(null, keyword));
    }

    private boolean isRealUser(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }
}
