package com.ai.platform.ide.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdeFileEditDto {
    private String path;
    private String content;
    private boolean create;
    /** true = content chỉ là đoạn thay thế, merge theo startLine/endLine */
    private boolean partial;
    private Integer startLine;
    private Integer endLine;
}
