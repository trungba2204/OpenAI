package com.ai.platform.document.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.document.dto.DocumentDto;
import com.ai.platform.document.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final AuthService authService;

    @PostMapping("/upload")
    public ResponseEntity<DocumentDto> upload(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "conversationId", required = false) Long conversationId
    ) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(documentService.upload(user, file, conversationId));
    }

    @GetMapping
    public ResponseEntity<List<DocumentDto>> list(@AuthenticationPrincipal UserDetails userDetails) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(documentService.listByUser(user));
    }
}
