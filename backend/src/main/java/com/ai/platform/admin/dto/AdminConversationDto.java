package com.ai.platform.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminConversationDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private String title;
    private String question;
    private String answer;
    private String model;
    private long tokens;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
