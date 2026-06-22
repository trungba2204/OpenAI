package com.ai.platform.knowledge.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.knowledge.dto.KnowledgeBaseDto;
import com.ai.platform.knowledge.dto.KnowledgeBaseRequest;
import com.ai.platform.knowledge.dto.KnowledgePromptRequest;
import com.ai.platform.knowledge.service.KnowledgeBaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/knowledge-bases")
@RequiredArgsConstructor
public class KnowledgeBaseController {

    private final KnowledgeBaseService knowledgeBaseService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<KnowledgeBaseDto>> list(@AuthenticationPrincipal UserDetails userDetails) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(knowledgeBaseService.list(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<KnowledgeBaseDto> get(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(knowledgeBaseService.get(user, id));
    }

    @PostMapping
    public ResponseEntity<KnowledgeBaseDto> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody KnowledgeBaseRequest request) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(knowledgeBaseService.create(user, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<KnowledgeBaseDto> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody KnowledgeBaseRequest request) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(knowledgeBaseService.update(user, id, request));
    }

    @PutMapping("/{id}/prompt")
    public ResponseEntity<KnowledgeBaseDto> updatePrompt(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody KnowledgePromptRequest request) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(knowledgeBaseService.updatePrompt(user, id, request.getSystemPrompt()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        var user = authService.getUserEntity(userDetails.getUsername());
        knowledgeBaseService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
