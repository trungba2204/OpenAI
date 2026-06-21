package com.ai.platform.ide.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdeMultiEditResponse {
    private String summary;
    private List<IdeFileEditDto> edits;
}
