package com.ai.platform.ide.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitConnectRequest {
    private Long projectId;
    private String provider;
    /** Bỏ trống khi autoCreateRepo=true — IDE tự tạo repo trên GitHub */
    private String remoteUrl;
    private String branch;
    /** Bỏ trống — lấy từ GitHub API theo token */
    private String username;
    private String accessToken;
    /** true = tự tạo repo GitHub theo tên project (mặc định) */
    private Boolean autoCreateRepo;
    /** Ghi đè tên repo; mặc định slug từ tên project */
    private String repoName;
    private Boolean privateRepo;
}
