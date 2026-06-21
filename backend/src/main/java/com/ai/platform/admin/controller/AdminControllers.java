package com.ai.platform.admin.controller;

import com.ai.platform.admin.dto.*;
import com.ai.platform.admin.service.AdminService;
import com.ai.platform.auth.service.AuthService;
import com.ai.platform.user.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
class AdminDashboardController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDto> dashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }
}

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
class AdminUserController {

    private final AdminService adminService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<AdminUserDto>> list() {
        return ResponseEntity.ok(adminService.getUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUser(id));
    }

    @PutMapping("/{id}/lock")
    public ResponseEntity<AdminUserDto> lock(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        User actor = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(adminService.lockUser(actor, id, request.getRemoteAddr()));
    }

    @PutMapping("/{id}/unlock")
    public ResponseEntity<AdminUserDto> unlock(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        User actor = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(adminService.unlockUser(actor, id, request.getRemoteAddr()));
    }
}

@RestController
@RequestMapping("/api/admin/usages")
@RequiredArgsConstructor
class AdminUsageController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<AdminUsageDto>> list(
            @RequestParam(required = false) String model,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(adminService.getUsages(model, userId, from, to));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUsageDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUsage(id));
    }
}

@RestController
@RequestMapping("/api/admin/conversations")
@RequiredArgsConstructor
class AdminConversationController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<AdminConversationDto>> list(@RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(adminService.getConversations(keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminConversationDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getConversation(id));
    }
}

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
class AdminAnalyticsController {

    private final AdminService adminService;

    @GetMapping("/models/statistics")
    public ResponseEntity<List<ModelStatisticDto>> modelStatistics() {
        return ResponseEntity.ok(adminService.getModelStatistics());
    }

    @GetMapping("/analytics/tokens")
    public ResponseEntity<TokenAnalyticsDto> tokenAnalytics() {
        return ResponseEntity.ok(adminService.getTokenAnalytics());
    }

    @GetMapping("/analytics/cost")
    public ResponseEntity<CostAnalyticsDto> costAnalytics() {
        return ResponseEntity.ok(adminService.getCostAnalytics());
    }
}
