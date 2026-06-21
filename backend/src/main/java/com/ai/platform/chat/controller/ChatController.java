package com.ai.platform.chat.controller;

import com.ai.platform.auth.service.AuthService;
import com.ai.platform.chat.dto.*;
import com.ai.platform.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final AuthService authService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> getConversations(@AuthenticationPrincipal UserDetails userDetails) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(chatService.getConversations(user));
    }

    @PostMapping("/conversations")
    public ResponseEntity<ConversationDto> createConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) CreateConversationRequest request
    ) {
        var user = authService.getUserEntity(userDetails.getUsername());
        if (request == null) request = new CreateConversationRequest();
        return ResponseEntity.ok(chatService.createConversation(user, request));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<MessageDto>> getMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(chatService.getMessages(user, id));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        var user = authService.getUserEntity(userDetails.getUsername());
        chatService.deleteConversation(user, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/chat")
    public ResponseEntity<MessageDto> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChatRequest request
    ) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return ResponseEntity.ok(chatService.chat(user, request));
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_PLAIN_VALUE)
    public Flux<String> chatStream(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ChatRequest request
    ) {
        var user = authService.getUserEntity(userDetails.getUsername());
        return chatService.chatStream(user, request);
    }
}
