package com.yourcompany.novelreader.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yourcompany.novelreader.entity.AppUser;
import com.yourcompany.novelreader.exception.BusinessException;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;

@RequiredArgsConstructor
public abstract class BaseUserController {

    private final AppUserMapper appUserMapper;

    protected Long currentUserId(Authentication authentication) {
        return currentUser(authentication).getId();
    }

    protected AppUser currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(401, "Unauthorized");
        }
        AppUser user = appUserMapper.selectOne(new LambdaQueryWrapper<AppUser>()
                .eq(AppUser::getUsername, authentication.getName()));
        if (user == null) {
            throw new BusinessException(401, "Unauthorized");
        }
        return user;
    }

    protected void requireAdmin(Authentication authentication) {
        AppUser user = currentUser(authentication);
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new BusinessException(403, "Admin role required");
        }
    }
}
