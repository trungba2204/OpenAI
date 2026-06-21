package com.ai.platform.ide.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.ide.dto.GitConnectRequest;
import com.ai.platform.ide.dto.GitConnectionDto;
import com.ai.platform.ide.dto.GitRepoSuggestDto;
import com.ai.platform.ide.dto.GitStatusDto;
import com.ai.platform.ide.dto.GitSyncResponse;
import com.ai.platform.ide.service.GitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/git")
@RequiredArgsConstructor
public class GitController {

    private final GitService gitService;
    private final AuthService authService;

    @GetMapping("/{projectId}")
    public ResponseEntity<GitConnectionDto> get(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(gitService.getConnection(user, projectId));
    }

    @GetMapping("/{projectId}/status")
    public ResponseEntity<GitStatusDto> status(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(gitService.getStatus(user, projectId));
    }

    @GetMapping("/{projectId}/suggest")
    public ResponseEntity<GitRepoSuggestDto> suggest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(gitService.suggestRepo(user, projectId));
    }

    @PostMapping("/connect")
    public ResponseEntity<GitConnectionDto> connect(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody GitConnectRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(gitService.connect(user, request));
    }

    @PostMapping("/pull")
    public ResponseEntity<GitSyncResponse> pull(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Long> body) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(gitService.pull(user, body.get("projectId")));
    }

    @PostMapping("/push")
    public ResponseEntity<GitSyncResponse> push(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        Long projectId = Long.valueOf(body.get("projectId").toString());
        String msg = body.containsKey("commitMessage") ? String.valueOf(body.get("commitMessage")) : null;
        return ResponseEntity.ok(gitService.push(user, projectId, msg));
    }
}
