package com.ai.platform.workspace.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.workspace.dto.WorkspaceDto;
import com.ai.platform.workspace.dto.WorkspaceRequest;
import com.ai.platform.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<WorkspaceDto>> list(@AuthenticationPrincipal UserDetails userDetails) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(workspaceService.list(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceDto> get(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(workspaceService.get(user, id));
    }

    @PostMapping
    public ResponseEntity<WorkspaceDto> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody WorkspaceRequest request) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(workspaceService.create(user, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkspaceDto> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody WorkspaceRequest request) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(workspaceService.update(user, id, request));
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<WorkspaceDto> clone(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(workspaceService.clone(user, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        var user = authService.getUserEntity(userDetails.getUsername());
        workspaceService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
