package com.yourcompany.novelreader.service;

import com.yourcompany.novelreader.dto.AuthLoginDTO;
import com.yourcompany.novelreader.dto.AuthRegisterDTO;

public interface AuthService {

    String register(AuthRegisterDTO dto);

    String login(AuthLoginDTO dto);
}
