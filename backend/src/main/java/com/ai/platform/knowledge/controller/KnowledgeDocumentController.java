package com.ai.platform.knowledge.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.knowledge.dto.KnowledgeDocumentDto;
import com.ai.platform.knowledge.service.KnowledgeDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/knowledge-bases/{knowledgeBaseId}/documents")
@RequiredArgsConstructor
public class KnowledgeDocumentController {

    private final KnowledgeDocumentService documentService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<KnowledgeDocumentDto>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long knowledgeBaseId) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(documentService.list(user, knowledgeBaseId));
    }

    @PostMapping
    public ResponseEntity<KnowledgeDocumentDto> upload(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long knowledgeBaseId,
            @RequestParam("file") MultipartFile file) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(documentService.upload(user, knowledgeBaseId, file));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long knowledgeBaseId,
            @PathVariable Long documentId) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        documentService.delete(user, knowledgeBaseId, documentId);
        return ResponseEntity.noContent().build();
    }
}
