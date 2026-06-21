package com.ai.platform.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private Long id;
    private String role;
    private String content;
    private String attachmentFilename;
    private String attachmentMimeType;
    private Long attachmentDocumentId;
    private LocalDateTime createdAt;
}
