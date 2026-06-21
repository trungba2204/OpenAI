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
public class GitStatusDto {
    private boolean connected;
    private String branch;
    private boolean clean;
    private List<String> changedFiles;
    private List<String> untrackedFiles;
    private String diffStat;
    private String lastSyncAt;
}
