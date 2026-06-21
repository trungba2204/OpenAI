package com.ai.platform.chat.dto;

import com.ai.platform.ai.AiModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDto {
    private Long id;
    private String title;
    private AiModel model;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
