package com.yourcompany.novelreader.controller;

import com.yourcompany.novelreader.dto.ChangePasswordDTO;
import com.yourcompany.novelreader.dto.UpdateProfileDTO;
import com.yourcompany.novelreader.entity.AppUser;
import com.yourcompany.novelreader.exception.BusinessException;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import com.yourcompany.novelreader.vo.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
public class UserController extends BaseUserController {

    private final PasswordEncoder passwordEncoder;

    public UserController(AppUserMapper appUserMapper, PasswordEncoder passwordEncoder) {
        super(appUserMapper);
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/profile")
    public ApiResponse<Map<String, Object>> getProfile(Authentication authentication) {
        AppUser user = currentUser(authentication);
        return ApiResponse.success(toProfile(user));
    }

    @PutMapping("/profile")
    public ApiResponse<Map<String, Object>> updateProfile(Authentication authentication,
                                                          @RequestBody UpdateProfileDTO dto) {
        AppUser user = currentUser(authentication);
        if (dto.getAvatarUrl() != null) {
            user.setAvatarUrl(dto.getAvatarUrl().trim());
        }
        if (dto.getUsername() != null && !dto.getUsername().trim().isEmpty()) {
            user.setUsername(dto.getUsername().trim());
        }
        if (dto.getEmail() != null) {
            user.setEmail(dto.getEmail().trim());
        }
        appUserMapper.updateById(user);
        return ApiResponse.success(toProfile(user));
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(Authentication authentication,
                                            @RequestBody ChangePasswordDTO dto) {
        AppUser user = currentUser(authentication);
        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPasswordHash())) {
            throw new BusinessException("原密码错误");
        }
        if (dto.getNewPassword() == null || dto.getNewPassword().length() < 6) {
            throw new BusinessException("新密码至少6位");
        }
        user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        appUserMapper.updateById(user);
        return ApiResponse.success(null);
    }

    private Map<String, Object> toProfile(AppUser user) {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("avatarUrl", user.getAvatarUrl());
        profile.put("createdAt", user.getCreatedAt());
        return profile;
    }
}
