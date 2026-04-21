package com.yourcompany.novelreader.controller;

import com.yourcompany.novelreader.dto.ReaderSettingDTO;
import com.yourcompany.novelreader.dto.ReadingProgressDTO;
import com.yourcompany.novelreader.entity.NovelReaderSetting;
import com.yourcompany.novelreader.entity.NovelReadingHistory;
import com.yourcompany.novelreader.entity.NovelReadingProgress;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import com.yourcompany.novelreader.service.ReadingService;
import com.yourcompany.novelreader.vo.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reading")
public class ReadingController extends BaseUserController {

    private final ReadingService readingService;

    public ReadingController(AppUserMapper appUserMapper, ReadingService readingService) {
        super(appUserMapper);
        this.readingService = readingService;
    }

    @GetMapping("/progress/{bookId}")
    public ApiResponse<NovelReadingProgress> progress(Authentication authentication, @PathVariable Long bookId) {
        return ApiResponse.success(readingService.getProgress(currentUserId(authentication), bookId));
    }

    @PutMapping("/progress/{bookId}")
    public ApiResponse<NovelReadingProgress> saveProgress(Authentication authentication,
                                                          @PathVariable Long bookId,
                                                          @RequestBody ReadingProgressDTO dto) {
        return ApiResponse.success(readingService.saveProgress(currentUserId(authentication), bookId, dto));
    }

    @GetMapping("/history")
    public ApiResponse<List<NovelReadingHistory>> history(Authentication authentication) {
        return ApiResponse.success(readingService.history(currentUserId(authentication)));
    }

    @GetMapping("/setting")
    public ApiResponse<NovelReaderSetting> setting(Authentication authentication) {
        return ApiResponse.success(readingService.getSetting(currentUserId(authentication)));
    }

    @PutMapping("/setting")
    public ApiResponse<NovelReaderSetting> saveSetting(Authentication authentication,
                                                       @RequestBody ReaderSettingDTO dto) {
        return ApiResponse.success(readingService.saveSetting(currentUserId(authentication), dto));
    }
}
