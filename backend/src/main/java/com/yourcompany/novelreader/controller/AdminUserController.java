package com.yourcompany.novelreader.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yourcompany.novelreader.entity.AppUser;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import com.yourcompany.novelreader.vo.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminUserController extends BaseUserController {

    private final AppUserMapper userMapper;

    public AdminUserController(AppUserMapper appUserMapper) {
        super(appUserMapper);
        this.userMapper = appUserMapper;
    }

    @GetMapping("/users")
    public ApiResponse<Map<String, Object>> users(Authentication authentication,
                                                   @RequestParam(defaultValue = "1") int page,
                                                   @RequestParam(defaultValue = "10") int pageSize,
                                                   @RequestParam(required = false) String keyword) {
        requireAdmin(authentication);
        LambdaQueryWrapper<AppUser> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            wrapper.like(AppUser::getUsername, keyword).or().like(AppUser::getEmail, keyword);
        }
        wrapper.orderByDesc(AppUser::getCreatedAt);
        Page<AppUser> result = userMapper.selectPage(new Page<>(page, pageSize), wrapper);
        return ApiResponse.success(Map.of(
                "records", result.getRecords(),
                "total", result.getTotal(),
                "current", result.getCurrent(),
                "size", result.getSize()
        ));
    }

    @PutMapping("/users/{id}/status")
    public ApiResponse<Void> updateStatus(Authentication authentication,
                                           @PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        requireAdmin(authentication);
        AppUser user = userMapper.selectById(id);
        if (user == null) return ApiResponse.error(404, "User not found");
        user.setStatus(body.get("status"));
        userMapper.updateById(user);
        return ApiResponse.success(null);
    }

    @PutMapping("/users/{id}/role")
    public ApiResponse<Void> updateRole(Authentication authentication,
                                         @PathVariable Long id,
                                         @RequestBody Map<String, String> body) {
        requireAdmin(authentication);
        AppUser user = userMapper.selectById(id);
        if (user == null) return ApiResponse.error(404, "User not found");
        user.setRole(body.get("role"));
        userMapper.updateById(user);
        return ApiResponse.success(null);
    }
}
