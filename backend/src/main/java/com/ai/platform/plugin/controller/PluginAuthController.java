package com.ai.platform.plugin.controller;

import com.ai.platform.auth.dto.AuthResponse;
import com.ai.platform.auth.dto.LoginRequest;
import com.ai.platform.auth.dto.RefreshTokenRequest;
import com.ai.platform.auth.service.AuthService;
import com.ai.platform.plugin.dto.PluginDeviceCodeResponse;
import com.ai.platform.plugin.dto.PluginDeviceCodeStatusDto;
import com.ai.platform.plugin.service.PluginAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/plugin/auth")
@RequiredArgsConstructor
public class PluginAuthController {

    private final PluginAuthService pluginAuthService;
    private final AuthService authService;

    @PostMapping("/device")
    public ResponseEntity<PluginDeviceCodeResponse> createDeviceCode(
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(pluginAuthService.createDeviceCode(user));
    }

    @GetMapping("/device/status")
    public ResponseEntity<PluginDeviceCodeStatusDto> deviceCodeStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String code) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(pluginAuthService.getDeviceCodeStatus(user, code));
    }

    @PostMapping("/device/poll")
    public ResponseEntity<AuthResponse> pollDeviceCode(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        return ResponseEntity.ok(pluginAuthService.pollDeviceCode(code));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(pluginAuthService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(pluginAuthService.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody RefreshTokenRequest request) {
        pluginAuthService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }
}
