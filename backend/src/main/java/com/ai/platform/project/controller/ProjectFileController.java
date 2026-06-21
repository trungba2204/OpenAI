package com.ai.platform.project.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.project.dto.*;
import com.ai.platform.project.service.ProjectFileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ProjectFileController {

    private final ProjectFileService projectFileService;
    private final AuthService authService;

    @GetMapping("/api/projects/{projectId}/tree")
    public ResponseEntity<List<FileTreeNodeDto>> getTree(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(projectFileService.getTree(user, projectId));
    }

    @GetMapping("/api/files/{id}")
    public ResponseEntity<FileContentDto> getContent(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(projectFileService.getContent(user, id));
    }

    @PostMapping("/api/files")
    public ResponseEntity<FileTreeNodeDto> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FileRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(projectFileService.create(user, request));
    }

    @PutMapping("/api/files/{id}")
    public ResponseEntity<FileContentDto> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody FileUpdateRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(projectFileService.update(user, id, request));
    }

    @DeleteMapping("/api/files/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        projectFileService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
