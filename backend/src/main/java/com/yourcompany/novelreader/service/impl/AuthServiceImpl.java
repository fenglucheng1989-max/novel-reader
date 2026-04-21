package com.yourcompany.novelreader.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yourcompany.novelreader.dto.AuthLoginDTO;
import com.yourcompany.novelreader.dto.AuthRegisterDTO;
import com.yourcompany.novelreader.entity.AppUser;
import com.yourcompany.novelreader.exception.BusinessException;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import com.yourcompany.novelreader.security.JwtUtils;
import com.yourcompany.novelreader.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AppUserMapper appUserMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Override
    public String register(AuthRegisterDTO dto) {
        AppUser existing = appUserMapper.selectOne(
                new LambdaQueryWrapper<AppUser>().eq(AppUser::getUsername, dto.getUsername()));
        if (existing != null) {
            throw new BusinessException("Username already exists");
        }

        AppUser user = AppUser.builder()
                .username(dto.getUsername())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .email(dto.getEmail())
                .role("USER")
                .build();

        appUserMapper.insert(user);

        return jwtUtils.generateToken(user.getUsername(), user.getId());
    }

    @Override
    public String login(AuthLoginDTO dto) {
        AppUser user = appUserMapper.selectOne(
                new LambdaQueryWrapper<AppUser>().eq(AppUser::getUsername, dto.getUsername()));

        if (user == null || !passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(401, "Invalid username or password");
        }

        return jwtUtils.generateToken(user.getUsername(), user.getId());
    }
}
