package com.ai.platform.knowledge.dto;

import com.ai.platform.knowledge.entity.KnowledgeStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class KnowledgeBaseRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 2000)
    private String description;

    private String systemPrompt;

    @Size(max = 500)
    private String persona;
}
