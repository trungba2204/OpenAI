package com.ai.platform.ide.service;

import com.ai.platform.common.exception.ApiException;
import com.ai.platform.ide.dto.GitConnectRequest;
import com.ai.platform.ide.dto.GitConnectionDto;
import com.ai.platform.ide.dto.GitRepoSuggestDto;
import com.ai.platform.ide.dto.GitStatusDto;
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
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class GitService {

    private final GitConnectionRepository gitConnectionRepository;
    private final ProjectService projectService;
    private final IdeAiService ideAiService;
    private final GithubApiClient githubApiClient;

    /** Tránh nhiều thao tác git đồng thời trên cùng project (gây config.lock). */
    private final ConcurrentHashMap<String, Object> repoLocks = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public GitRepoSuggestDto suggestRepo(User user, Long projectId) {
        Project project = projectService.getOwned(user, projectId);
        String repoName = resolveRepoName(project, null);
        return GitRepoSuggestDto.builder()
                .projectName(project.getName())
                .repoName(repoName)
                .previewUrl("https://github.com/<username>/" + repoName)
                .build();
    }

    @Transactional(readOnly = true)
    public GitConnectionDto getConnection(User user, Long projectId) {
        projectService.getOwned(user, projectId);
        return gitConnectionRepository.findByProjectId(projectId)
                .map(this::toDto)
                .orElse(GitConnectionDto.builder().projectId(projectId).connected(false).build());
    }

    @Transactional
    public GitStatusDto getStatus(User user, Long projectId) throws IOException {
        projectService.getOwned(user, projectId);
        Optional<GitConnection> connOpt = gitConnectionRepository.findByProjectId(projectId);
        if (connOpt.isEmpty() || connOpt.get().getRemoteUrl() == null || connOpt.get().getRemoteUrl().isBlank()) {
            return GitStatusDto.builder().connected(false).clean(true).build();
        }

        GitConnection conn = connOpt.get();
        Project project = projectService.getOwned(user, projectId);
        Path root = Paths.get(project.getRootPath());
        synchronized (repoLock(root)) {
            ensureRepo(root, conn);
            return buildStatus(root, conn);
        }
    }

    private GitStatusDto buildStatus(Path root, GitConnection conn) throws IOException {
        String branch = readBranch(root, conn.getBranch());
        Set<String> changed = new LinkedHashSet<>();
        Set<String> untracked = new LinkedHashSet<>();

        String porcelain = runGit(root, "status", "--porcelain");
        if (!porcelain.isBlank()) {
            for (String line : porcelain.split("\n")) {
                if (line.length() < 4) continue;
                String path = line.substring(3).trim();
                if (path.contains(" -> ")) {
                    path = path.substring(path.indexOf(" -> ") + 4);
                }
                if (line.startsWith("??")) {
                    untracked.add(path);
                } else {
                    changed.add(path);
                }
            }
        }

        String diffStat = "";
        if (!changed.isEmpty() || !untracked.isEmpty()) {
            diffStat = runGitAllowFail(root, "diff", "--stat", "HEAD");
            if (diffStat.isBlank()) {
                diffStat = runGitAllowFail(root, "diff", "--stat");
            }
        }

        boolean clean = changed.isEmpty() && untracked.isEmpty();
        return GitStatusDto.builder()
                .connected(true)
                .branch(branch)
                .clean(clean)
                .changedFiles(List.copyOf(changed))
                .untrackedFiles(List.copyOf(untracked))
                .diffStat(diffStat.isBlank() ? null : diffStat)
                .lastSyncAt(conn.getLastSyncAt() != null ? conn.getLastSyncAt().toString() : null)
                .build();
    }

    @Transactional
    public GitConnectionDto connect(User user, GitConnectRequest request) throws IOException {
        Project project = projectService.getOwned(user, request.getProjectId());
        if (request.getAccessToken() == null || request.getAccessToken().isBlank()) {
            throw new ApiException("Access Token không được để trống", HttpStatus.BAD_REQUEST);
        }

        String token = request.getAccessToken().trim();
        validateGitHubToken(token);

        boolean autoCreate = request.getAutoCreateRepo() == null || Boolean.TRUE.equals(request.getAutoCreateRepo());
        String remoteUrl = request.getRemoteUrl() != null ? request.getRemoteUrl().trim() : "";

        String githubLogin = request.getUsername() != null && !request.getUsername().isBlank()
                ? request.getUsername().trim()
                : githubApiClient.getAuthenticatedLogin(token);

        if (remoteUrl.isBlank() && autoCreate) {
            String repoName = resolveRepoName(project, request.getRepoName());
            boolean isPrivate = Boolean.TRUE.equals(request.getPrivateRepo());
            remoteUrl = githubApiClient.createRepository(
                    token,
                    githubLogin,
                    repoName,
                    project.getDescription() != null ? project.getDescription() : project.getName(),
                    isPrivate
            );
            log.info("Đã tạo/liên kết GitHub repo {} cho project {}", repoName, project.getId());
        }

        if (remoteUrl.isBlank()) {
            throw new ApiException(
                    "Chưa có Remote URL — bật tự tạo repo hoặc nhập URL thủ công.",
                    HttpStatus.BAD_REQUEST);
        }

        GitConnection conn = gitConnectionRepository.findByProjectId(project.getId())
                .orElse(GitConnection.builder().project(project).build());
        conn.setProvider(request.getProvider() != null ? request.getProvider() : "github");
        conn.setRemoteUrl(normalizeRemoteUrl(remoteUrl));
        conn.setBranch(request.getBranch() != null && !request.getBranch().isBlank() ? request.getBranch().trim() : "main");
        conn.setUsername(githubLogin);
        conn.setAccessToken(token);
        conn = gitConnectionRepository.save(conn);

        Path root = Paths.get(project.getRootPath());
        synchronized (repoLock(root)) {
            ensureRepo(root, conn);
            ensureGitIdentity(root, conn);
            runGit(root, "checkout", "-B", conn.getBranch());
            runGitRemote(root, conn, "ls-remote", "--heads", "origin");
        }

        return toDto(conn);
    }

    private String resolveRepoName(Project project, String override) {
        if (override != null && !override.isBlank()) {
            return sanitizeRepoNameInput(override);
        }
        return GithubApiClient.suggestRepoName(project.getName(), project.getId());
    }

    private String sanitizeRepoNameInput(String name) {
        String trimmed = name.trim().toLowerCase().replaceAll("[^a-z0-9._-]+", "-").replaceAll("^-+|-+$", "");
        if (trimmed.isBlank()) {
            throw new ApiException("Tên repo không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return trimmed.length() > 100 ? trimmed.substring(0, 100) : trimmed;
    }

    private void validateGitHubToken(String token) {
        if (token.contains("@") || token.contains(" ")) {
            throw new ApiException(
                    "Access Token không hợp lệ — dùng Personal Access Token từ GitHub (ghp_ hoặc github_pat_), không dùng mật khẩu.",
                    HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional
    public GitSyncResponse pull(User user, Long projectId) throws IOException {
        Project project = projectService.getOwned(user, projectId);
        GitConnection conn = requireConnection(projectId);
        Path root = Paths.get(project.getRootPath());
        String out;
        synchronized (repoLock(root)) {
            ensureRepo(root, conn);
            ensureGitIdentity(root, conn);
            runGit(root, "checkout", "-B", conn.getBranch());
            out = runGitRemote(root, conn, "pull", "origin", conn.getBranch(), "--rebase");
        }
        conn.setLastSyncAt(LocalDateTime.now());
        gitConnectionRepository.save(conn);
        return GitSyncResponse.builder().success(true).message(out.isBlank() ? "Pull thành công." : out).build();
    }

    @Transactional
    public GitSyncResponse push(User user, Long projectId, String commitMessage) throws IOException {
        Project project = projectService.getOwned(user, projectId);
        GitConnection conn = requireConnection(projectId);
        Path root = Paths.get(project.getRootPath());
        String message;
        synchronized (repoLock(root)) {
            ensureRepo(root, conn);
            ensureGitIdentity(root, conn);
            runGit(root, "checkout", "-B", conn.getBranch());

            GitStatusDto status = buildStatus(root, conn);
            if (status.isClean()) {
                String out = runGitAllowFailRemote(root, conn, "push", "-u", "origin", conn.getBranch());
                conn.setLastSyncAt(LocalDateTime.now());
                gitConnectionRepository.save(conn);
                return GitSyncResponse.builder()
                        .success(true)
                        .message(out.isBlank() ? "Không có thay đổi mới — remote đã cập nhật." : out)
                        .commitMessage(null)
                        .build();
            }

            if (commitMessage == null || commitMessage.isBlank()) {
                String summary = buildChangesSummary(status);
                commitMessage = ideAiService.commitMessage(user, projectId, summary, null).getResponse();
            }
            commitMessage = commitMessage.trim();
            if (commitMessage.isBlank()) {
                commitMessage = "chore: update from IDE";
            }

            runGit(root, "add", "-A");
            String commitOut = runGitAllowFail(root, "commit", "-m", commitMessage);
            String pushOut = runGitRemote(root, conn, "push", "-u", "origin", conn.getBranch());
            message = (commitOut + "\n" + pushOut).trim();
        }

        conn.setLastSyncAt(LocalDateTime.now());
        gitConnectionRepository.save(conn);

        return GitSyncResponse.builder()
                .success(true)
                .message(message.isBlank() ? "Đã commit và push lên GitHub." : message)
                .commitMessage(commitMessage)
                .build();
    }

    private String buildChangesSummary(GitStatusDto status) {
        StringBuilder sb = new StringBuilder();
        if (status.getChangedFiles() != null && !status.getChangedFiles().isEmpty()) {
            sb.append("Modified files:\n");
            status.getChangedFiles().forEach(f -> sb.append("- ").append(f).append('\n'));
        }
        if (status.getUntrackedFiles() != null && !status.getUntrackedFiles().isEmpty()) {
            sb.append("New files:\n");
            status.getUntrackedFiles().forEach(f -> sb.append("- ").append(f).append('\n'));
        }
        if (status.getDiffStat() != null && !status.getDiffStat().isBlank()) {
            sb.append("\n").append(status.getDiffStat());
        }
        return sb.toString().trim();
    }

    private GitConnection requireConnection(Long projectId) {
        GitConnection conn = gitConnectionRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ApiException("Git chưa được kết nối — mở tab Git và kết nối GitHub trước.", HttpStatus.BAD_REQUEST));
        if (conn.getRemoteUrl() == null || conn.getRemoteUrl().isBlank()) {
            throw new ApiException("Chưa cấu hình Remote URL", HttpStatus.BAD_REQUEST);
        }
        if (conn.getAccessToken() == null || conn.getAccessToken().isBlank()) {
            throw new ApiException("Chưa cấu hình Access Token", HttpStatus.BAD_REQUEST);
        }
        return conn;
    }

    private void ensureRepo(Path root, GitConnection conn) throws IOException {
        clearStaleGitLocks(root, false);
        if (!Files.exists(root)) {
            Files.createDirectories(root);
        }
        String cleanUrl = cleanRemoteUrl(conn);
        if (!Files.exists(root.resolve(".git"))) {
            runGit(root, "init");
            runGit(root, "remote", "add", "origin", cleanUrl);
        } else {
            String current = runGitAllowFail(root, "remote", "get-url", "origin");
            if (!cleanUrl.equals(current.trim())) {
                clearStaleGitLocks(root, true);
                runGit(root, "remote", "set-url", "origin", cleanUrl);
            }
        }
    }

    private Object repoLock(Path root) {
        return repoLocks.computeIfAbsent(root.toAbsolutePath().normalize().toString(), k -> new Object());
    }

    private void clearStaleGitLocks(Path root, boolean force) {
        Path gitDir = root.resolve(".git");
        for (String name : List.of("config.lock", "index.lock", "HEAD.lock", "shallow.lock")) {
            Path lock = gitDir.resolve(name);
            try {
                if (!Files.exists(lock)) {
                    continue;
                }
                if (force) {
                    Files.delete(lock);
                    log.info("Đã xóa git lock (force): {}", lock.getFileName());
                    continue;
                }
                long ageMs = System.currentTimeMillis() - Files.getLastModifiedTime(lock).toMillis();
                if (ageMs > 60_000) {
                    Files.delete(lock);
                    log.info("Đã xóa git lock cũ: {}", lock.getFileName());
                }
            } catch (IOException e) {
                log.warn("Không xóa được git lock {}: {}", lock, e.getMessage());
            }
        }
    }

    private String cleanRemoteUrl(GitConnection conn) {
        return normalizeRemoteUrl(conn.getRemoteUrl());
    }

    private void ensureGitIdentity(Path root, GitConnection conn) throws IOException {
        String name = resolveGitDisplayName(conn);
        String email = resolveGitEmail(conn);
        runGitAllowFail(root, "config", "user.name", name);
        runGitAllowFail(root, "config", "user.email", email);
    }

    private String resolveGitDisplayName(GitConnection conn) {
        String user = conn.getUsername();
        if (user == null || user.isBlank()) {
            return "IDE User";
        }
        if (user.contains("@")) {
            return user.substring(0, user.indexOf('@'));
        }
        return user;
    }

    private String resolveGitEmail(GitConnection conn) {
        String user = conn.getUsername();
        if (user != null && user.contains("@")) {
            return user;
        }
        if (user != null && !user.isBlank()) {
            return user + "@users.noreply.github.com";
        }
        return "ide@local.dev";
    }

    private void validateGitHubCredentials(GitConnection conn) {
        validateGitHubToken(conn.getAccessToken());
        if (!conn.getAccessToken().startsWith("ghp_") && !conn.getAccessToken().startsWith("github_pat_") && !conn.getAccessToken().startsWith("gho_")) {
            log.warn("Git token không giống định dạng GitHub PAT — user={}", conn.getUsername());
        }
    }

    private String normalizeRemoteUrl(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ApiException("Remote URL không được để trống", HttpStatus.BAD_REQUEST);
        }
        String url = stripUserInfoFromUrl(raw.trim());
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url.replaceAll("^/+", "");
        }

        String withoutProtocol = url.replaceFirst("^https?://", "");
        int slash = withoutProtocol.indexOf('/');
        String host = slash >= 0 ? withoutProtocol.substring(0, slash) : withoutProtocol;
        String path = slash >= 0 ? withoutProtocol.substring(slash + 1) : "";

        if (!"github.com".equalsIgnoreCase(host)) {
            throw new ApiException(
                    "Remote URL phải trỏ tới github.com, ví dụ: https://github.com/ten-ban/ten-repo",
                    HttpStatus.BAD_REQUEST);
        }

        path = path.replaceAll("/+$", "").replaceAll("^/+", "");
        if (path.isBlank()) {
            throw new ApiException(
                    "Remote URL thiếu tên user/repo — nhập đầy đủ: https://github.com/<ten-ban>/<ten-repo>",
                    HttpStatus.BAD_REQUEST);
        }

        String[] parts = path.split("/");
        if (parts.length < 2 || parts[0].isBlank() || parts[1].isBlank()) {
            throw new ApiException(
                    "Remote URL phải có dạng https://github.com/<ten-ban>/<ten-repo>",
                    HttpStatus.BAD_REQUEST);
        }

        String owner = parts[0].trim();
        String repo = parts[1].trim();
        if (repo.endsWith(".git")) {
            repo = repo.substring(0, repo.length() - 4);
        }
        if (owner.isBlank() || repo.isBlank()) {
            throw new ApiException(
                    "Remote URL không hợp lệ — cần cả tên GitHub user và tên repo.",
                    HttpStatus.BAD_REQUEST);
        }

        return "https://github.com/" + owner + "/" + repo + ".git";
    }

    private String stripUserInfoFromUrl(String url) {
        return url.replaceFirst("^https://[^@/]+@", "https://")
                .replaceFirst("^http://[^@/]+@", "http://");
    }

    private String readBranch(Path root, String fallback) throws IOException {
        String branch = runGitAllowFail(root, "rev-parse", "--abbrev-ref", "HEAD");
        if (branch.isBlank() || "HEAD".equals(branch)) {
            return fallback != null ? fallback : "main";
        }
        return branch;
    }

    private String runGit(Path cwd, String... args) throws IOException {
        return runGitInternal(cwd, null, false, true, args);
    }

    private String runGitRemote(Path cwd, GitConnection conn, String... args) throws IOException {
        return runGitInternal(cwd, conn, true, true, args);
    }

    private String runGitAllowFail(Path cwd, String... args) throws IOException {
        return runGitInternal(cwd, null, false, false, args);
    }

    private String runGitAllowFailRemote(Path cwd, GitConnection conn, String... args) throws IOException {
        return runGitInternal(cwd, conn, true, false, args);
    }

    private String runGitInternal(Path cwd, GitConnection conn, boolean withAuth, boolean failOnError, String... args)
            throws IOException {
        clearStaleGitLocks(cwd, false);
        for (int attempt = 0; attempt < 3; attempt++) {
            GitResult result = execGit(cwd, conn, withAuth, args);
            String output = sanitizeGitOutput(result.output().trim());
            if (result.exitCode() == 0 || isBenignGitOutput(output)) {
                return output;
            }
            if (output.contains("could not lock config file") && attempt < 2) {
                clearStaleGitLocks(cwd, true);
                continue;
            }
            if (failOnError) {
                if (output.toLowerCase().contains("authentication failed")
                        || output.toLowerCase().contains("invalid credentials")) {
                    throw new ApiException(
                            "GitHub từ chối đăng nhập — token hết hạn hoặc không đúng. Vào tab Git → Cài đặt nâng cao → nhập token mới (quyền repo) → Cập nhật kết nối.",
                            HttpStatus.UNAUTHORIZED);
                }
                throw new ApiException("Git lỗi: " + output, HttpStatus.BAD_REQUEST);
            }
            return output;
        }
        throw new ApiException("Git lỗi: không ghi được cấu hình — thử lại sau vài giây.", HttpStatus.BAD_REQUEST);
    }

    private GitResult execGit(Path cwd, GitConnection conn, boolean withAuth, String... args) throws IOException {
        List<String> cmd = new ArrayList<>();
        cmd.add("git");
        if (withAuth && conn != null && conn.getAccessToken() != null && !conn.getAccessToken().isBlank()) {
            addGitHubAuth(cmd, conn);
        }
        cmd.addAll(List.of(args));
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(cwd.toFile());
        pb.redirectErrorStream(true);
        pb.environment().put("GIT_TERMINAL_PROMPT", "0");
        try {
            Process p = pb.start();
            StringBuilder sb = new StringBuilder();
            try (var reader = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) sb.append(line).append("\n");
            }
            if (!p.waitFor(120, TimeUnit.SECONDS)) {
                p.destroyForcibly();
                throw new ApiException("Git timeout — kiểm tra git đã cài trên server", HttpStatus.REQUEST_TIMEOUT);
            }
            return new GitResult(p.exitValue(), sb.toString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException("Git bị gián đoạn", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (IOException e) {
            throw new ApiException("Không chạy được git — cần cài Git trên server", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GitHub HTTPS: PAT classic (ghp_) dùng Basic auth — username + token.
     * Bearer thường không hoạt động với git push/pull.
     */
    private void addGitHubAuth(List<String> cmd, GitConnection conn) {
        String token = conn.getAccessToken().trim();
        String user = conn.getUsername() != null && !conn.getUsername().isBlank()
                ? conn.getUsername().trim()
                : "x-access-token";
        String basic = Base64.getEncoder().encodeToString(
                (user + ":" + token).getBytes(StandardCharsets.UTF_8));

        cmd.add("-c");
        cmd.add("credential.helper=");
        cmd.add("-c");
        cmd.add("http.https://github.com/.extraheader=Authorization: Basic " + basic);
    }

    private String sanitizeGitOutput(String output) {
        if (output == null || output.isBlank()) {
            return "";
        }
        return output
                .replaceAll("ghp_[A-Za-z0-9]+", "ghp_***")
                .replaceAll("github_pat_[A-Za-z0-9_]+", "github_pat_***")
                .replaceAll("gho_[A-Za-z0-9]+", "gho_***")
                .replaceAll("https://[^@\\s/]+@", "https://***@")
                .replaceAll("(?i)Authorization: Bearer [^\\s\"']+", "Authorization: Bearer ***")
                .replaceAll("(?i)Authorization: Basic [A-Za-z0-9+/=]+", "Authorization: Basic ***");
    }

    private boolean isBenignGitOutput(String output) {
        return output.contains("Already up to date")
                || output.contains("nothing to commit")
                || output.contains("nothing added to commit");
    }

    private GitConnectionDto toDto(GitConnection c) {
        String remote = c.getRemoteUrl();
        String repoName = extractRepoName(remote);
        return GitConnectionDto.builder()
                .id(c.getId())
                .projectId(c.getProject().getId())
                .provider(c.getProvider())
                .remoteUrl(remote)
                .branch(c.getBranch())
                .username(c.getUsername())
                .repoName(repoName)
                .connected(remote != null && !remote.isBlank())
                .lastSyncAt(c.getLastSyncAt() != null ? c.getLastSyncAt().toString() : null)
                .build();
    }

    private String extractRepoName(String remoteUrl) {
        if (remoteUrl == null || remoteUrl.isBlank()) return null;
        try {
            String path = normalizeRemoteUrl(remoteUrl)
                    .replaceFirst("^https://github\\.com/", "")
                    .replaceFirst("\\.git$", "");
            int slash = path.indexOf('/');
            return slash >= 0 ? path.substring(slash + 1) : path;
        } catch (Exception e) {
            return null;
        }
    }

    private record GitResult(int exitCode, String output) {}
}
