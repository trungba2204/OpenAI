package com.ai.platform.knowledge.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.knowledge.dto.KnowledgeChatRequest;
import com.ai.platform.knowledge.dto.KnowledgeChatResponse;
import com.ai.platform.knowledge.service.KnowledgeRagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/knowledge-bases/{knowledgeBaseId}/chat")
@RequiredArgsConstructor
public class KnowledgeChatController {

    private final KnowledgeRagService ragService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<KnowledgeChatResponse> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long knowledgeBaseId,
            @Valid @RequestBody KnowledgeChatRequest request) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(ragService.chat(user, knowledgeBaseId, request));
    }
}
