package com.ai.platform.ppt.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.common.entity.GeneratedFile;
import com.ai.platform.ppt.dto.PptGenerateRequest;
import com.ai.platform.ppt.service.PptGeneratorService;
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
@RequestMapping("/api/generate/ppt")
@RequiredArgsConstructor
public class PptController {

    private final PptGeneratorService pptGeneratorService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> generate(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PptGenerateRequest request
    ) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        GeneratedFile file = pptGeneratorService.generate(user, request);
        return ResponseEntity.ok(Map.of("id", file.getId(), "type", file.getType()));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        byte[] content = pptGeneratorService.download(user, id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=presentation.pptx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.presentationml.presentation"))
                .body(content);
    }
}
