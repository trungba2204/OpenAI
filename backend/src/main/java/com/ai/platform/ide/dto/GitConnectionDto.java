package com.ai.platform.ide.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitConnectionDto {
    private Long id;
    private Long projectId;
    private String provider;
    private String remoteUrl;
    private String branch;
    private String username;
    private boolean connected;
    private String lastSyncAt;
}
