package com.ai.platform.ide.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TerminalExecRequest {
    private Long projectId;
    private String command;
    /** powershell | bash | auto */
    private String shell;
}
