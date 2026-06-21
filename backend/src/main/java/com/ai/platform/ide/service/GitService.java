package com.ai.platform.ide.service;

import com.ai.platform.common.exception.ApiException;
import com.ai.platform.ide.dto.GitConnectRequest;
import com.ai.platform.ide.dto.GitConnectionDto;
import com.ai.platform.ide.dto.GitSyncResponse;
import com.ai.platform.ide.entity.GitConnection;
import com.ai.platform.ide.repository.GitConnectionRepository;
import com.ai.platform.project.entity.Project;
import com.ai.platform.project.service.ProjectService;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class GitService {

    private final GitConnectionRepository gitConnectionRepository;
    private final ProjectService projectService;
    private final IdeAiService ideAiService;

    @Transactional(readOnly = true)
    public GitConnectionDto getConnection(User user, Long projectId) {
        projectService.getOwned(user, projectId);
        return gitConnectionRepository.findByProjectId(projectId)
                .map(this::toDto)
                .orElse(GitConnectionDto.builder().projectId(projectId).connected(false).build());
    }

    @Transactional
    public GitConnectionDto connect(User user, GitConnectRequest request) {
        Project project = projectService.getOwned(user, request.getProjectId());
        GitConnection conn = gitConnectionRepository.findByProjectId(project.getId())
                .orElse(GitConnection.builder().project(project).build());
        conn.setProvider(request.getProvider() != null ? request.getProvider() : "github");
        conn.setRemoteUrl(request.getRemoteUrl());
        conn.setBranch(request.getBranch() != null ? request.getBranch() : "main");
        conn.setUsername(request.getUsername());
        conn.setAccessToken(request.getAccessToken());
        return toDto(gitConnectionRepository.save(conn));
    }

    @Transactional
    public GitSyncResponse pull(User user, Long projectId) throws IOException {
        Project project = projectService.getOwned(user, projectId);
        GitConnection conn = requireConnection(projectId);
        Path root = Paths.get(project.getRootPath());
        ensureRepo(root, conn);
        String out = runGit(root, "pull", "origin", conn.getBranch());
        conn.setLastSyncAt(LocalDateTime.now());
        gitConnectionRepository.save(conn);
        return GitSyncResponse.builder().success(true).message(out).build();
    }

    @Transactional
    public GitSyncResponse push(User user, Long projectId, String commitMessage) throws IOException {
        Project project = projectService.getOwned(user, projectId);
        GitConnection conn = requireConnection(projectId);
        Path root = Paths.get(project.getRootPath());
        ensureRepo(root, conn);

        if (commitMessage == null || commitMessage.isBlank()) {
            commitMessage = ideAiService.commitMessage(user, projectId, "IDE changes", null).getResponse();
        }
        runGit(root, "add", "-A");
        runGit(root, "commit", "-m", commitMessage);
        String out = runGit(root, "push", "-u", "origin", conn.getBranch());
        conn.setLastSyncAt(LocalDateTime.now());
        gitConnectionRepository.save(conn);
        return GitSyncResponse.builder().success(true).message(out).commitMessage(commitMessage).build();
    }

    private GitConnection requireConnection(Long projectId) {
        return gitConnectionRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ApiException("Git chưa được kết nối", HttpStatus.BAD_REQUEST));
    }

    private void ensureRepo(Path root, GitConnection conn) throws IOException {
        if (!Files.exists(root.resolve(".git"))) {
            runGit(root, "init");
            runGit(root, "remote", "add", "origin", authUrl(conn));
        } else {
            runGit(root, "remote", "set-url", "origin", authUrl(conn));
        }
    }

    private String authUrl(GitConnection conn) {
        String url = conn.getRemoteUrl();
        if (conn.getAccessToken() != null && !conn.getAccessToken().isBlank() && url.startsWith("https://")) {
            String user = conn.getUsername() != null ? conn.getUsername() : "oauth2";
            return url.replace("https://", "https://" + user + ":" + conn.getAccessToken() + "@");
        }
        return url;
    }

    private String runGit(Path cwd, String... args) throws IOException {
        List<String> cmd = new ArrayList<>();
        cmd.add("git");
        cmd.addAll(List.of(args));
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(cwd.toFile());
        pb.redirectErrorStream(true);
        try {
            Process p = pb.start();
            StringBuilder sb = new StringBuilder();
            try (var reader = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) sb.append(line).append("\n");
            }
            if (!p.waitFor(120, TimeUnit.SECONDS)) {
                p.destroyForcibly();
                throw new ApiException("Git timeout — kiểm tra git đã cài trên server", HttpStatus.REQUEST_TIMEOUT);
            }
            String output = sb.toString().trim();
            if (p.exitValue() != 0 && !output.contains("Already up to date") && !output.contains("nothing to commit")) {
                throw new ApiException("Git lỗi: " + output, HttpStatus.BAD_REQUEST);
            }
            return output;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException("Git bị gián đoạn", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (IOException e) {
            throw new ApiException("Không chạy được git — cần cài Git trên server", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private GitConnectionDto toDto(GitConnection c) {
        return GitConnectionDto.builder()
                .id(c.getId())
                .projectId(c.getProject().getId())
                .provider(c.getProvider())
                .remoteUrl(c.getRemoteUrl())
                .branch(c.getBranch())
                .username(c.getUsername())
                .connected(true)
                .lastSyncAt(c.getLastSyncAt() != null ? c.getLastSyncAt().toString() : null)
                .build();
    }
}
