package com.ai.platform.prompt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromptTemplateDto {
    private Long id;
    private String title;
    private String content;
    private String category;
    private boolean isPublic;
    private boolean owned;
    private LocalDateTime createdAt;
}
