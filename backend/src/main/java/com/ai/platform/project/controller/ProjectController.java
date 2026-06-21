package com.ai.platform.project.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.ide.service.ProjectIndexService;
import com.ai.platform.project.dto.ProjectDto;
import com.ai.platform.project.service.ProjectService;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectIndexService projectIndexService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<ProjectDto>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Long workspaceId) {
        var user = authService.getUserEntity(userDetails.getUsername());
        if (workspaceId != null) {
            return ResponseEntity.ok(projectService.listByWorkspace(user, workspaceId));
        }
        return ResponseEntity.ok(projectService.listAll(user));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ProjectDto> get(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(projectService.get(user, id));
    }

    @PostMapping("/import-folder")
    public ResponseEntity<ProjectDto> importFolder(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long workspaceId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "paths", required = false) List<String> paths,
            @RequestParam(required = false) String name) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        List<String> resolvedPaths = resolveImportPaths(files, paths);
        ProjectDto project = projectService.importFolder(user, workspaceId, files, resolvedPaths, name);
        indexSafely(user, project.getId());
        return ResponseEntity.ok(project);
    }

    @PostMapping
    public ResponseEntity<ProjectDto> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        Long workspaceId = Long.valueOf(body.get("workspaceId").toString());
        String name = body.get("name").toString();
        String description = body.containsKey("description") ? String.valueOf(body.get("description")) : null;
        ProjectDto project = projectService.create(user, workspaceId, name, description);
        indexSafely(user, project.getId());
        return ResponseEntity.ok(project);
    }

    private List<String> resolveImportPaths(List<MultipartFile> files, List<String> paths) {
        if (paths != null && paths.size() == files.size()) {
            return paths;
        }
        return files.stream()
                .map(f -> f.getOriginalFilename() != null ? f.getOriginalFilename().replace('\\', '/') : f.getName())
                .toList();
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProjectDto> upload(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long workspaceId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String name) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        ProjectDto project = projectService.uploadZip(user, workspaceId, file, name);
        indexSafely(user, project.getId());
        return ResponseEntity.ok(project);
    }

    private void indexSafely(User user, Long projectId) {
        try {
            projectIndexService.indexProject(user, projectId);
        } catch (Exception e) {
            log.warn("Post-import index failed for project {}: {}", projectId, e.getMessage());
        }
    }

    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ProjectDto> rename(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(projectService.rename(user, id, body.get("name")));
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        projectService.delete(user, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/index")
    public ResponseEntity<Map<String, String>> reindex(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        projectIndexService.indexProject(user, id);
        return ResponseEntity.ok(Map.of("message", "Indexed successfully"));
    }
}
