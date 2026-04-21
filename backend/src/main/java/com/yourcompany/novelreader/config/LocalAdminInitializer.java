package com.yourcompany.novelreader.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yourcompany.novelreader.entity.AppUser;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LocalAdminInitializer implements CommandLineRunner {

    private final AppUserMapper appUserMapper;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.init.enabled:true}")
    private boolean initEnabled;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:admin123456}")
    private String adminPassword;

    @Value("${app.admin.email:admin@local}")
    private String adminEmail;

    @Override
    public void run(String... args) {
        if (!initEnabled) {
            return;
        }
        AppUser existing = appUserMapper.selectOne(
                new LambdaQueryWrapper<AppUser>().eq(AppUser::getUsername, adminUsername));
        if (existing != null) {
            if (!"ADMIN".equalsIgnoreCase(existing.getRole())) {
                existing.setRole("ADMIN");
                appUserMapper.updateById(existing);
            }
            return;
        }
        AppUser admin = AppUser.builder()
                .username(adminUsername)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .email(adminEmail)
                .role("ADMIN")
                .build();
        appUserMapper.insert(admin);
    }
}
