package com.ai.platform.plugin.controller;

import com.ai.platform.ai.AiModel;
import com.ai.platform.auth.service.AuthService;
import com.ai.platform.plugin.dto.*;
import com.ai.platform.plugin.service.PluginAiService;
import com.ai.platform.plugin.service.PluginSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/plugin")
@RequiredArgsConstructor
public class PluginGatewayController {

    private final PluginAiService pluginAiService;
    private final PluginSessionService sessionService;
    private final AuthService authService;

    @GetMapping("/models")
    public ResponseEntity<List<Map<String, String>>> models() {
        List<Map<String, String>> models = Arrays.stream(AiModel.values())
                .map(m -> Map.of(
                        "id", m.name(),
                        "modelId", m.getModelId(),
                        "displayName", m.getDisplayName()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(models);
    }

    @PostMapping("/context")
    public ResponseEntity<Void> context(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PluginContextPayload context) {
        var user = authService.getUserEntity(userDetails.getUsername());
        pluginAiService.registerContext(user, context);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/chat")
    public ResponseEntity<PluginChatResponse> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PluginChatRequest request) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(pluginAiService.chat(user, request));
    }

    @PostMapping("/inline")
    public ResponseEntity<PluginInlineResponse> inline(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PluginInlineRequest request) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(pluginAiService.inline(user, request));
    }

    @PostMapping("/completion")
    public ResponseEntity<PluginCompletionResponse> completion(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PluginCompletionRequest request) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(pluginAiService.completion(user, request));
    }

    @PostMapping("/edit")
    public ResponseEntity<PluginInlineResponse> edit(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PluginInlineRequest request) {
        request.setAction("EDIT");
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(pluginAiService.inline(user, request));
    }

    @PostMapping("/multi-edit")
    public ResponseEntity<PluginChatResponse> multiEdit(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PluginChatRequest request) {
        request.setMessage("Multi-file edit: " + request.getMessage());
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(pluginAiService.agent(user, request));
    }

    @PostMapping("/agent")
    public ResponseEntity<PluginChatResponse> agent(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PluginChatRequest request) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(pluginAiService.agent(user, request));
    }

    @PostMapping("/knowledge-chat")
    public ResponseEntity<PluginChatResponse> knowledgeChat(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PluginChatRequest request) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(pluginAiService.chat(user, request));
    }

    @PostMapping("/terminal")
    public ResponseEntity<PluginInlineResponse> terminal(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        var user = authService.getUserEntity(userDetails.getUsername());
        String command = String.valueOf(body.getOrDefault("command", ""));
        PluginContextPayload ctx = null;
        return ResponseEntity.ok(pluginAiService.terminal(user, command, ctx));
    }

    @GetMapping("/usage")
    public ResponseEntity<PluginUsageSummaryDto> usage(
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(pluginAiService.usageSummary(user));
    }

    @GetMapping("/connection")
    public ResponseEntity<PluginConnectionStatusDto> connection(
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(sessionService.getConnectionStatus(user));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<PluginSessionDto>> sessions(
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(sessionService.listSessions(user));
    }
}
