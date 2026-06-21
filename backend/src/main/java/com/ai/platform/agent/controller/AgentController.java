package com.ai.platform.agent.controller;

import com.ai.platform.agent.dto.AgentChatRequest;
import com.ai.platform.agent.dto.AgentRunDto;
import com.ai.platform.agent.service.AgentService;
import com.ai.platform.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;
    private final AuthService authService;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody AgentChatRequest request
    ) {
        var user = authService.getUserEntity(userDetails.getUsername());
        String response = agentService.agentChat(user, request);
        return ResponseEntity.ok(Map.of("content", response));
    }

    @GetMapping("/runs")
    public ResponseEntity<List<AgentRunDto>> getRuns(@AuthenticationPrincipal UserDetails userDetails) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(agentService.getAgentRuns(user));
    }
}
