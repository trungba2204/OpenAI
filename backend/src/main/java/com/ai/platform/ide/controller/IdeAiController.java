package com.ai.platform.ide.controller;

import com.ai.platform.ai.AiModel;
import com.ai.platform.auth.service.AuthService;
import com.ai.platform.ide.dto.*;
import com.ai.platform.ide.service.IdeAiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class IdeAiController {

    private final IdeAiService ideAiService;
    private final AuthService authService;

    @PostMapping("/chat")
    public ResponseEntity<IdeChatResponse> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody IdeChatRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(ideAiService.chat(user, request));
    }

    @PostMapping("/inline")
    public ResponseEntity<IdeChatResponse> inline(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody IdeInlineRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(ideAiService.inline(user, request));
    }

    @PostMapping("/generate")
    public ResponseEntity<IdeChatResponse> generate(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody IdePromptRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(ideAiService.generate(user, request));
    }

    @PostMapping("/refactor")
    public ResponseEntity<IdeChatResponse> refactor(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody IdePromptRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(ideAiService.refactor(user, request));
    }

    @PostMapping("/multi-edit")
    public ResponseEntity<IdeMultiEditResponse> multiEdit(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody IdePromptRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(ideAiService.multiEdit(user, request));
    }

    @PostMapping("/auto-fix")
    public ResponseEntity<IdeMultiEditResponse> autoFix(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody IdeChatRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(ideAiService.autoFix(user, request));
    }

    @GetMapping("/search")
    public ResponseEntity<IdeSearchResponse> search(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long projectId,
            @RequestParam String q,
            @RequestParam(required = false) AiModel model) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(ideAiService.search(user, projectId, q, model));
    }

    @PostMapping("/review")
    public ResponseEntity<IdeChatResponse> review(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody IdePromptRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(ideAiService.review(user, request));
    }

    @GetMapping("/architecture")
    public ResponseEntity<IdeChatResponse> architecture(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long projectId,
            @RequestParam(required = false) AiModel model) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(ideAiService.architecture(user, projectId, model));
    }

    @PostMapping("/agent")
    public ResponseEntity<IdeAgentResponse> agent(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody IdePromptRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(ideAiService.agent(user, request));
    }

    @PostMapping("/commit-message")
    public ResponseEntity<IdeChatResponse> commitMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        Long projectId = Long.valueOf(body.get("projectId").toString());
        String summary = body.containsKey("summary") ? String.valueOf(body.get("summary")) : null;
        AiModel model = body.containsKey("model") ? AiModel.valueOf(String.valueOf(body.get("model"))) : null;
        return ResponseEntity.ok(ideAiService.commitMessage(user, projectId, summary, model));
    }
}
