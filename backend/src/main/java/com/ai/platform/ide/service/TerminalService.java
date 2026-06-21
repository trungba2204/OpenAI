package com.ai.platform.ide.service;

import com.ai.platform.common.exception.ApiException;
import com.ai.platform.ide.dto.TerminalExecResponse;
import com.ai.platform.ide.dto.TerminalInfoDto;
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
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class TerminalService {

    private static final int MAX_OUTPUT_CHARS = 120_000;
    private static final int TIMEOUT_SECONDS = 120;

    private final ProjectService projectService;

    @Transactional(readOnly = true)
    public TerminalInfoDto getInfo(User user, Long projectId) {
        Project project = projectService.getOwned(user, projectId);
        Path root = Paths.get(project.getRootPath()).toAbsolutePath().normalize();
        List<String> shells = detectAvailableShells();
        String defaultShell = shells.contains("powershell") ? "powershell" : shells.get(0);
        return TerminalInfoDto.builder()
                .defaultShell(defaultShell)
                .availableShells(shells)
                .cwd(root.toString())
                .directoryListing(buildDirectoryListing(root))
                .build();
    }

    private String buildDirectoryListing(Path root) {
        if (!Files.exists(root)) {
            return "(thư mục project chưa tồn tại)";
        }
        if (!Files.isDirectory(root)) {
            return "(không phải thư mục)";
        }
        try (Stream<Path> entries = Files.list(root)) {
            String listing = entries
                    .sorted(Comparator
                            .comparing((Path p) -> !Files.isDirectory(p))
                            .thenComparing(p -> p.getFileName().toString().toLowerCase(Locale.ROOT)))
                    .map(this::formatDirectoryEntry)
                    .collect(Collectors.joining("\n"));
            return listing.isBlank() ? "(trống)" : listing;
        } catch (IOException e) {
            log.warn("Không đọc được thư mục {}: {}", root, e.getMessage());
            return "(không đọc được danh sách file)";
        }
    }

    private String formatDirectoryEntry(Path path) {
        String name = path.getFileName().toString();
        if (Files.isDirectory(path)) {
            return "📁 " + name + "/";
        }
        try {
            long bytes = Files.size(path);
            return "📄 " + name + "  (" + formatSize(bytes) + ")";
        } catch (IOException e) {
            return "📄 " + name;
        }
    }

    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format(Locale.ROOT, "%.1f KB", bytes / 1024.0);
        return String.format(Locale.ROOT, "%.1f MB", bytes / (1024.0 * 1024));
    }

    @Transactional(readOnly = true)
    public TerminalExecResponse exec(User user, Long projectId, String command, String shell) throws IOException {
        if (command == null || command.isBlank()) {
            throw new ApiException("Lệnh không được để trống", HttpStatus.BAD_REQUEST);
        }
        String trimmed = command.trim();
        if (trimmed.length() > 4000) {
            throw new ApiException("Lệnh quá dài", HttpStatus.BAD_REQUEST);
        }

        Project project = projectService.getOwned(user, projectId);
        Path root = Paths.get(project.getRootPath()).toAbsolutePath().normalize();
        if (!Files.isDirectory(root)) {
            Files.createDirectories(root);
        }

        String resolvedShell = resolveShell(shell);
        List<String> cmd = buildCommand(resolvedShell, root, trimmed);
        ExecResult result = runProcess(cmd, root);

        return TerminalExecResponse.builder()
                .output(truncate(result.output()))
                .exitCode(result.exitCode())
                .cwd(root.toString())
                .shell(resolvedShell)
                .build();
    }

    private List<String> detectAvailableShells() {
        Set<String> shells = new LinkedHashSet<>();
        if (isExecutableAvailable("pwsh")) {
            shells.add("powershell");
        } else if (isWindows() && isExecutableAvailable("powershell")) {
            shells.add("powershell");
        }
        if (isExecutableAvailable("bash")) {
            shells.add("bash");
        }
        if (shells.isEmpty()) {
            shells.add("bash");
        }
        return List.copyOf(shells);
    }

    private String resolveShell(String shell) {
        List<String> available = detectAvailableShells();
        if (shell == null || shell.isBlank() || "auto".equalsIgnoreCase(shell)) {
            return available.get(0);
        }
        String normalized = shell.toLowerCase(Locale.ROOT);
        if (normalized.equals("pwsh") || normalized.equals("ps")) {
            normalized = "powershell";
        }
        if (!available.contains(normalized)) {
            throw new ApiException("Shell không khả dụng trên server: " + shell, HttpStatus.BAD_REQUEST);
        }
        return normalized;
    }

    private List<String> buildCommand(String shell, Path root, String userCommand) {
        if ("powershell".equals(shell)) {
            String exe = isExecutableAvailable("pwsh") ? "pwsh" : "powershell";
            String psPath = root.toString().replace("'", "''");
            String psScript = "Set-Location -LiteralPath '" + psPath + "'; " + userCommand;
            return List.of(exe, "-NoLogo", "-NoProfile", "-Command", psScript);
        }
        String bashPath = root.toString().replace("'", "'\\''");
        String bashScript = "cd '" + bashPath + "' && " + userCommand;
        return List.of("bash", "-lc", bashScript);
    }

    private ExecResult runProcess(List<String> cmd, Path cwd) throws IOException {
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(cwd.toFile());
        pb.redirectErrorStream(true);
        pb.environment().put("GIT_TERMINAL_PROMPT", "0");
        pb.environment().put("TERM", "xterm-256color");

        try {
            Process p = pb.start();
            StringBuilder sb = new StringBuilder();
            try (var reader = new BufferedReader(
                    new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append('\n');
                }
            }
            if (!p.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
                p.destroyForcibly();
                throw new ApiException("Lệnh quá thời gian chờ (" + TIMEOUT_SECONDS + "s)", HttpStatus.REQUEST_TIMEOUT);
            }
            return new ExecResult(p.exitValue(), sb.toString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException("Lệnh bị gián đoạn", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private boolean isExecutableAvailable(String name) {
        try {
            ProcessBuilder pb = new ProcessBuilder(name, "--version");
            if ("powershell".equals(name)) {
                pb = new ProcessBuilder(name, "-NoProfile", "-Command", "$PSVersionTable.PSVersion");
            }
            Process p = pb.start();
            if (!p.waitFor(5, TimeUnit.SECONDS)) {
                p.destroyForcibly();
                return false;
            }
            return p.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isWindows() {
        return System.getProperty("os.name", "").toLowerCase(Locale.ROOT).contains("win");
    }

    private String truncate(String output) {
        if (output == null) {
            return "";
        }
        if (output.length() <= MAX_OUTPUT_CHARS) {
            return output;
        }
        return output.substring(0, MAX_OUTPUT_CHARS) + "\n... (đã cắt bớt output)";
    }

    private record ExecResult(int exitCode, String output) {}
}
