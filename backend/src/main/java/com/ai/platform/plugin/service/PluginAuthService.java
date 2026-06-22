package com.ai.platform.plugin.service;

import com.ai.platform.auth.dto.AuthResponse;
import com.ai.platform.auth.dto.LoginRequest;
import com.ai.platform.auth.dto.RefreshTokenRequest;
import com.ai.platform.auth.service.AuthService;
import com.ai.platform.common.exception.ApiException;
import com.ai.platform.plugin.dto.PluginDeviceCodeResponse;
import com.ai.platform.plugin.entity.PluginDeviceCode;
import com.ai.platform.plugin.repository.PluginDeviceCodeRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PluginAuthService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final int CODE_TTL_MINUTES = 10;

    private final AuthService authService;
    private final PluginDeviceCodeRepository deviceCodeRepository;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public PluginDeviceCodeResponse createDeviceCode(User user) {
        deviceCodeRepository.findAll().stream()
                .filter(c -> c.getUser().getId().equals(user.getId()) && !c.isConsumed()
                        && c.getExpiresAt().isAfter(LocalDateTime.now()))
                .forEach(c -> {
                    c.setConsumed(true);
                    deviceCodeRepository.save(c);
                });

        String code = generateCode();
        LocalDateTime expires = LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES);
        deviceCodeRepository.save(PluginDeviceCode.builder()
                .code(code)
                .user(user)
                .expiresAt(expires)
                .consumed(false)
                .build());

        return PluginDeviceCodeResponse.builder()
                .code(code)
                .expiresAt(expires)
                .build();
    }

    @Transactional
    public AuthResponse pollDeviceCode(String code) {
        PluginDeviceCode deviceCode = deviceCodeRepository.findByCodeAndConsumedFalse(code.toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ApiException("Invalid or expired code", HttpStatus.UNAUTHORIZED));

        if (deviceCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException("Code expired", HttpStatus.UNAUTHORIZED);
        }

        deviceCode.setConsumed(true);
        deviceCodeRepository.save(deviceCode);

        return authService.buildAuthResponseForUser(deviceCode.getUser());
    }

    public AuthResponse login(LoginRequest request) {
        return authService.login(request);
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    public void logout(String refreshToken) {
        authService.logout(refreshToken);
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }
}
