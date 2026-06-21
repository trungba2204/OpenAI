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
public class TerminalInfoDto {
    private String defaultShell;
    private List<String> availableShells;
    private String cwd;
    /** Danh sách file/thư mục cấp 1 trong project */
    private String directoryListing;
}
