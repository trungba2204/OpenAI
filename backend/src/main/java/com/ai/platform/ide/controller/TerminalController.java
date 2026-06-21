package com.ai.platform.ide.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.ide.dto.TerminalExecRequest;
import com.ai.platform.ide.dto.TerminalExecResponse;
import com.ai.platform.ide.dto.TerminalInfoDto;
import com.ai.platform.ide.service.TerminalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/terminal")
@RequiredArgsConstructor
public class TerminalController {

    private final TerminalService terminalService;
    private final AuthService authService;

    @GetMapping("/{projectId}")
    public ResponseEntity<TerminalInfoDto> info(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(terminalService.getInfo(user, projectId));
    }

    @PostMapping("/exec")
    public ResponseEntity<TerminalExecResponse> exec(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody TerminalExecRequest request) throws IOException {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(terminalService.exec(
                user,
                request.getProjectId(),
                request.getCommand(),
                request.getShell()));
    }
}
