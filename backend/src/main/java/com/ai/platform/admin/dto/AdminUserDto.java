package com.ai.platform.admin.dto;

import com.ai.platform.user.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
    private Long id;
    private String email;
    private String fullName;
    private UserStatus status;
    private long totalRequests;
    private long totalTokens;
    private LocalDateTime createdAt;
}
