package com.ai.platform.project.service;

import com.ai.platform.common.exception.ApiException;
import com.ai.platform.project.dto.FileContentDto;
import com.ai.platform.project.dto.FileRequest;
import com.ai.platform.project.dto.FileTreeNodeDto;
import com.ai.platform.project.dto.FileUpdateRequest;
import com.ai.platform.project.entity.Project;
import com.ai.platform.project.entity.ProjectFile;
import com.ai.platform.project.repository.ProjectFileRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectFileService {

    private static final int MAX_TEXT_BYTES = 512 * 1024;
    private static final Set<String> TEXT_EXTENSIONS = Set.of(
            "java", "ts", "tsx", "js", "jsx", "html", "css", "scss", "json", "md", "txt",
            "xml", "yml", "yaml", "sql", "py", "go", "cs", "properties", "gradle", "kt"
    );

    private final ProjectFileRepository projectFileRepository;
    private final ProjectService projectService;

    @Transactional(readOnly = true)
    public List<FileTreeNodeDto> getTree(User user, Long projectId) {
        Project project = projectService.getOwned(user, projectId);
        List<ProjectFile> files = projectFileRepository.findByProjectIdOrderByPathAsc(project.getId());
        return buildTree(files);
    }

    @Transactional(readOnly = true)
    public FileContentDto getContent(User user, Long fileId) throws IOException {
        ProjectFile file = getFileForUser(user, fileId);
        if (file.isDirectory()) {
            throw new ApiException("Cannot read directory as file", HttpStatus.BAD_REQUEST);
        }
        Path diskPath = resolveDiskPath(file);
        String content = "";
        if (Files.exists(diskPath) && isTextFile(file.getName())) {
            byte[] bytes = Files.readAllBytes(diskPath);
            if (bytes.length > MAX_TEXT_BYTES) {
                content = new String(bytes, 0, MAX_TEXT_BYTES, StandardCharsets.UTF_8) + "\n\n... (truncated)";
            } else {
                content = new String(bytes, StandardCharsets.UTF_8);
            }
        }
        return FileContentDto.builder()
                .id(file.getId())
                .name(file.getName())
                .path(file.getPath())
                .content(content)
                .mimeType(file.getMimeType())
                .build();
    }

    @Transactional
    public FileTreeNodeDto create(User user, FileRequest request) throws IOException {
        Project project = projectService.getOwned(user, request.getProjectId());
        ProjectFile parent = null;
        String parentPath = "";
        if (request.getParentId() != null) {
            parent = projectFileRepository.findByIdAndProjectId(request.getParentId(), project.getId())
                    .orElseThrow(() -> new ApiException("Parent folder not found", HttpStatus.NOT_FOUND));
            if (!parent.isDirectory()) {
                throw new ApiException("Parent must be a directory", HttpStatus.BAD_REQUEST);
            }
            parentPath = parent.getPath();
        }

        String path = parentPath.isEmpty() ? request.getName() : parentPath + "/" + request.getName();
        if (projectFileRepository.findByProjectIdAndPath(project.getId(), path).isPresent()) {
            throw new ApiException("Path already exists", HttpStatus.CONFLICT);
        }

        Path diskPath = Paths.get(project.getRootPath(), path.split("/"));
        if (request.isDirectory()) {
            Files.createDirectories(diskPath);
        } else {
            Files.createDirectories(diskPath.getParent());
            String content = request.getContent() != null ? request.getContent() : "";
            Files.writeString(diskPath, content, StandardCharsets.UTF_8);
        }

        ProjectFile entity = ProjectFile.builder()
                .project(project)
                .parent(parent)
                .name(request.getName())
                .path(path)
                .directory(request.isDirectory())
                .mimeType(request.isDirectory() ? null : guessMimeType(request.getName()))
                .sizeBytes(request.isDirectory() ? 0 : (request.getContent() != null ? request.getContent().getBytes(StandardCharsets.UTF_8).length : 0))
                .build();
        entity = projectFileRepository.save(entity);
        return toNode(entity);
    }

    @Transactional
    public FileContentDto update(User user, Long fileId, FileUpdateRequest request) throws IOException {
        ProjectFile file = getFileForUser(user, fileId);
        if (file.isDirectory()) {
            throw new ApiException("Cannot update directory content", HttpStatus.BAD_REQUEST);
        }

        Path diskPath = resolveDiskPath(file);
        if (request.getContent() != null) {
            Files.writeString(diskPath, request.getContent(), StandardCharsets.UTF_8);
            file.setSizeBytes(request.getContent().getBytes(StandardCharsets.UTF_8).length);
        }

        if (request.getName() != null && !request.getName().isBlank() && !request.getName().equals(file.getName())) {
            renameFile(file, request.getName().trim());
        }

        projectFileRepository.save(file);
        String content = request.getContent() != null ? request.getContent() : "";
        return FileContentDto.builder()
                .id(file.getId())
                .name(file.getName())
                .path(file.getPath())
                .content(content)
                .mimeType(file.getMimeType())
                .build();
    }

    @Transactional
    public void delete(User user, Long fileId) throws IOException {
        ProjectFile file = getFileForUser(user, fileId);
        deleteFileRecursive(file);
    }

    private void deleteFileRecursive(ProjectFile file) throws IOException {
        if (file.isDirectory()) {
            List<ProjectFile> children = projectFileRepository.findByProjectIdOrderByPathAsc(file.getProject().getId())
                    .stream()
                    .filter(f -> f.getPath().startsWith(file.getPath() + "/"))
                    .sorted(Comparator.comparing(ProjectFile::getPath).reversed())
                    .collect(Collectors.toList());
            for (ProjectFile child : children) {
                projectFileRepository.delete(child);
            }
        }
        Path diskPath = resolveDiskPath(file);
        if (Files.exists(diskPath)) {
            if (file.isDirectory()) {
                deleteDirectory(diskPath);
            } else {
                Files.delete(diskPath);
            }
        }
        projectFileRepository.delete(file);
    }

    private void renameFile(ProjectFile file, String newName) throws IOException {
        String oldPath = file.getPath();
        int slash = oldPath.lastIndexOf('/');
        String newPath = slash >= 0 ? oldPath.substring(0, slash + 1) + newName : newName;

        Path oldDisk = resolveDiskPath(file);
        Path newDisk = Paths.get(file.getProject().getRootPath(), newPath.split("/"));
        if (Files.exists(oldDisk)) {
            Files.createDirectories(newDisk.getParent());
            Files.move(oldDisk, newDisk);
        }

        List<ProjectFile> descendants = projectFileRepository.findByProjectIdOrderByPathAsc(file.getProject().getId())
                .stream()
                .filter(f -> f.getPath().startsWith(oldPath + "/"))
                .collect(Collectors.toList());

        file.setName(newName);
        file.setPath(newPath);
        for (ProjectFile desc : descendants) {
            desc.setPath(newPath + desc.getPath().substring(oldPath.length()));
            projectFileRepository.save(desc);
        }
    }

    ProjectFile getFileForUser(User user, Long fileId) {
        ProjectFile file = projectFileRepository.findById(fileId)
                .orElseThrow(() -> new ApiException("File not found", HttpStatus.NOT_FOUND));
        projectService.getOwned(user, file.getProject().getId());
        return file;
    }

    public Path resolveDiskPath(ProjectFile file) {
        return Paths.get(file.getProject().getRootPath(), file.getPath().split("/"));
    }

    List<FileTreeNodeDto> buildTree(List<ProjectFile> files) {
        Map<Long, FileTreeNodeDto> nodes = new LinkedHashMap<>();
        List<FileTreeNodeDto> roots = new ArrayList<>();
        for (ProjectFile f : files) {
            nodes.put(f.getId(), toNode(f));
        }
        for (ProjectFile f : files) {
            FileTreeNodeDto node = nodes.get(f.getId());
            if (f.getParent() == null) {
                roots.add(node);
            } else {
                FileTreeNodeDto parent = nodes.get(f.getParent().getId());
                if (parent != null) {
                    parent.getChildren().add(node);
                } else {
                    roots.add(node);
                }
            }
        }
        return roots;
    }

    private FileTreeNodeDto toNode(ProjectFile f) {
        return FileTreeNodeDto.builder()
                .id(f.getId())
                .name(f.getName())
                .path(f.getPath())
                .directory(f.isDirectory())
                .mimeType(f.getMimeType())
                .sizeBytes(f.getSizeBytes())
                .build();
    }

    public static boolean isTextFile(String name) {
        int dot = name.lastIndexOf('.');
        if (dot < 0) return false;
        return TEXT_EXTENSIONS.contains(name.substring(dot + 1).toLowerCase());
    }

    static String guessMimeType(String name) {
        if (!isTextFile(name)) return "application/octet-stream";
        String ext = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
        return switch (ext) {
            case "java" -> "text/x-java";
            case "ts", "tsx" -> "text/typescript";
            case "js", "jsx" -> "text/javascript";
            case "html" -> "text/html";
            case "css", "scss" -> "text/css";
            case "json" -> "application/json";
            case "md" -> "text/markdown";
            case "sql" -> "text/sql";
            case "py" -> "text/x-python";
            case "yaml", "yml" -> "text/yaml";
            default -> "text/plain";
        };
    }

    private void deleteDirectory(Path dir) throws IOException {
        if (!Files.exists(dir)) return;
        try (var stream = Files.walk(dir)) {
            stream.sorted(Comparator.reverseOrder()).forEach(p -> {
                try { Files.deleteIfExists(p); } catch (IOException ignored) {}
            });
        }
    }
}
