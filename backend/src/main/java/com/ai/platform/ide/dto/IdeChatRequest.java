package com.ai.platform.ide.dto;

import com.ai.platform.ai.AiModel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IdeChatRequest {
    @NotNull
    private Long projectId;
    private Long fileId;
    @NotBlank
    private String message;
    /** FILE, FOLDER, PROJECT, RAG */
    private String contextScope = "PROJECT";
    private AiModel model;
    /** Khi user bôi đen code — chỉ sửa trong phạm vi này */
    private Integer startLine;
    private Integer endLine;
    private String selectedCode;
    private String selectedFilePath;
}
