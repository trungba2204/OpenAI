package com.ai.platform.markdown.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.common.entity.GeneratedFile;
import com.ai.platform.markdown.dto.MarkdownGenerateRequest;
import com.ai.platform.markdown.service.MarkdownGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/generate/markdown")
@RequiredArgsConstructor
public class MarkdownController {

    private final MarkdownGeneratorService markdownGeneratorService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> generate(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody MarkdownGenerateRequest request
    ) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        GeneratedFile file = markdownGeneratorService.generate(user, request);
        return ResponseEntity.ok(Map.of("id", file.getId(), "type", file.getType()));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        byte[] content = markdownGeneratorService.download(user, id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=document.md")
                .contentType(MediaType.TEXT_PLAIN)
                .body(content);
    }
}
