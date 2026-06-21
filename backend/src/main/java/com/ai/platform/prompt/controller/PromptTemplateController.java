package com.ai.platform.prompt.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.prompt.dto.PromptTemplateDto;
import com.ai.platform.prompt.dto.PromptTemplateRequest;
import com.ai.platform.prompt.service.PromptTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prompts")
@RequiredArgsConstructor
public class PromptTemplateController {

    private final PromptTemplateService promptTemplateService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<PromptTemplateDto>> list(@AuthenticationPrincipal UserDetails userDetails) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(promptTemplateService.listAccessible(user));
    }

    @PostMapping
    public ResponseEntity<PromptTemplateDto> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PromptTemplateRequest request
    ) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(promptTemplateService.create(user, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PromptTemplateDto> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody PromptTemplateRequest request
    ) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(promptTemplateService.update(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        var user = authService.getUserEntity(userDetails.getUsername());
        promptTemplateService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
