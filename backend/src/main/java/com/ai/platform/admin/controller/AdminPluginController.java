package com.ai.platform.admin.controller;

import com.ai.platform.admin.dto.*;
import com.ai.platform.admin.service.AdminPluginService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/plugins")
@RequiredArgsConstructor
public class AdminPluginController {

    private final AdminPluginService adminPluginService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminPluginDashboardDto> dashboard() {
        return ResponseEntity.ok(adminPluginService.getDashboard());
    }

    @GetMapping("/usages")
    public ResponseEntity<List<AdminPluginUsageDto>> usages(
            @RequestParam(required = false) String editorType,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String endpoint,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(adminPluginService.getUsages(editorType, userId, endpoint, from, to));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<AdminPluginSessionDto>> sessions() {
        return ResponseEntity.ok(adminPluginService.getSessions());
    }

    @GetMapping("/installations")
    public ResponseEntity<List<AdminPluginInstallationDto>> installations() {
        return ResponseEntity.ok(adminPluginService.getInstallations());
    }
}
