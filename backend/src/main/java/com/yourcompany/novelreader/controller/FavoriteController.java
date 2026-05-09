package com.yourcompany.novelreader.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yourcompany.novelreader.dto.ReadingHistoryDTO;
import com.yourcompany.novelreader.entity.NovelBook;
import com.yourcompany.novelreader.entity.NovelFavorite;
import com.yourcompany.novelreader.exception.BusinessException;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import com.yourcompany.novelreader.mapper.NovelBookMapper;
import com.yourcompany.novelreader.mapper.NovelFavoriteMapper;
import com.yourcompany.novelreader.vo.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController extends BaseUserController {

    private final NovelFavoriteMapper favoriteMapper;
    private final NovelBookMapper bookMapper;

    public FavoriteController(AppUserMapper appUserMapper, NovelFavoriteMapper favoriteMapper, NovelBookMapper bookMapper) {
        super(appUserMapper);
        this.favoriteMapper = favoriteMapper;
        this.bookMapper = bookMapper;
    }

    @GetMapping
    public ApiResponse<List<ReadingHistoryDTO>> list(Authentication authentication) {
        Long userId = currentUserId(authentication);
        List<NovelFavorite> favs = favoriteMapper.selectList(new LambdaQueryWrapper<NovelFavorite>()
                .eq(NovelFavorite::getUserId, userId)
                .orderByDesc(NovelFavorite::getCreatedAt));
        List<ReadingHistoryDTO> result = favs.stream().map(fav -> {
            NovelBook book = bookMapper.selectById(fav.getBookId());
            if (book == null) return null;
            return ReadingHistoryDTO.builder()
                    .bookId(book.getId())
                    .bookTitle(book.getTitle())
                    .bookAuthor(book.getAuthor())
                    .coverUrl(book.getCoverUrl())
                    .status(book.getStatus())
                    .latestChapterTitle(book.getLatestChapterTitle())
                    .lastReadAt(fav.getCreatedAt())
                    .build();
        }).filter(dto -> dto != null).toList();
        return ApiResponse.success(result);
    }

    @PostMapping("/{bookId}")
    public ApiResponse<Void> add(Authentication authentication, @PathVariable Long bookId) {
        Long userId = currentUserId(authentication);
        if (bookMapper.selectById(bookId) == null) {
            throw new BusinessException(404, "书籍不存在");
        }
        Long count = favoriteMapper.selectCount(new LambdaQueryWrapper<NovelFavorite>()
                .eq(NovelFavorite::getUserId, userId)
                .eq(NovelFavorite::getBookId, bookId));
        if (count > 0) {
            return ApiResponse.success(null);
        }
        favoriteMapper.insert(NovelFavorite.builder()
                .userId(userId)
                .bookId(bookId)
                .createdAt(LocalDateTime.now())
                .build());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{bookId}")
    public ApiResponse<Void> remove(Authentication authentication, @PathVariable Long bookId) {
        Long userId = currentUserId(authentication);
        favoriteMapper.delete(new LambdaQueryWrapper<NovelFavorite>()
                .eq(NovelFavorite::getUserId, userId)
                .eq(NovelFavorite::getBookId, bookId));
        return ApiResponse.success(null);
    }

    @GetMapping("/{bookId}/status")
    public ApiResponse<Boolean> status(Authentication authentication, @PathVariable Long bookId) {
        Long userId = currentUserId(authentication);
        Long count = favoriteMapper.selectCount(new LambdaQueryWrapper<NovelFavorite>()
                .eq(NovelFavorite::getUserId, userId)
                .eq(NovelFavorite::getBookId, bookId));
        return ApiResponse.success(count > 0);
    }
}
