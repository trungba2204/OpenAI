package com.ai.platform.ide.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdeSearchResultDto {
    private String filePath;
    private int lineNumber;
    private String symbolName;
    private String symbolType;
    private String snippet;
    private double score;
}
