package com.ai.platform.project.service;

import com.ai.platform.common.exception.ApiException;
import com.ai.platform.project.dto.ProjectDto;
import com.ai.platform.project.entity.Project;
import com.ai.platform.project.repository.ProjectFileRepository;
import com.ai.platform.project.repository.ProjectRepository;
import com.ai.platform.user.entity.User;
import com.ai.platform.workspace.entity.Workspace;
import com.ai.platform.workspace.repository.WorkspaceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectFileRepository projectFileRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectImportService projectImportService;

    public ProjectService(
            ProjectRepository projectRepository,
            ProjectFileRepository projectFileRepository,
            WorkspaceRepository workspaceRepository,
            ProjectImportService projectImportService) {
        this.projectRepository = projectRepository;
        this.projectFileRepository = projectFileRepository;
        this.workspaceRepository = workspaceRepository;
        this.projectImportService = projectImportService;
    }

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<ProjectDto> listByWorkspace(User user, Long workspaceId) {
        verifyWorkspace(user, workspaceId);
        return projectRepository.findByWorkspaceIdOrderByUpdatedAtDesc(workspaceId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> listAll(User user) {
        return projectRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDto get(User user, Long id) {
        return toDto(getOwned(user, id));
    }

    @Transactional
    public ProjectDto create(User user, Long workspaceId, String name, String description) throws IOException {
        Workspace workspace = verifyWorkspace(user, workspaceId);
        Path root = Paths.get(uploadDir, user.getId().toString(), "projects", String.valueOf(System.currentTimeMillis()));
        Files.createDirectories(root);

        Project project = Project.builder()
                .workspace(workspace)
                .user(user)
                .name(name.trim())
                .description(description)
                .rootPath(root.toString())
                .build();
        project = projectRepository.save(project);

        projectImportService.indexEmptyProject(project);
        return toDto(project);
    }

    @Transactional
    public ProjectDto importFolder(User user, Long workspaceId, List<MultipartFile> files, List<String> paths, String name) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new ApiException("Folder is empty", HttpStatus.BAD_REQUEST);
        }

        Workspace workspace = verifyWorkspace(user, workspaceId);
        String projectName = (name != null && !name.isBlank()) ? name.trim() : deriveFolderName(paths);
        Path root = Paths.get(uploadDir, user.getId().toString(), "projects", String.valueOf(System.currentTimeMillis()));
        Files.createDirectories(root);

        Project project = Project.builder()
                .workspace(workspace)
                .user(user)
                .name(projectName)
                .description("Imported from folder")
                .rootPath(root.toString())
                .build();
        project = projectRepository.save(project);

        projectImportService.importFolder(project, files, paths);
        return toDto(project);
    }

    private String deriveFolderName(List<String> paths) {
        if (paths == null || paths.isEmpty()) return "Imported Project";
        String first = paths.get(0).replace('\\', '/');
        int slash = first.indexOf('/');
        return slash > 0 ? first.substring(0, slash) : "Imported Project";
    }

    @Transactional
    public ProjectDto uploadZip(User user, Long workspaceId, MultipartFile file, String name) throws IOException {
        if (file.isEmpty()) {
            throw new ApiException("ZIP file is empty", HttpStatus.BAD_REQUEST);
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".zip")) {
            throw new ApiException("Only ZIP files are supported", HttpStatus.BAD_REQUEST);
        }

        Workspace workspace = verifyWorkspace(user, workspaceId);
        String projectName = (name != null && !name.isBlank()) ? name.trim() : filename.replace(".zip", "");
        Path root = Paths.get(uploadDir, user.getId().toString(), "projects", String.valueOf(System.currentTimeMillis()));
        Files.createDirectories(root);

        Project project = Project.builder()
                .workspace(workspace)
                .user(user)
                .name(projectName)
                .description("Imported from ZIP")
                .rootPath(root.toString())
                .build();
        project = projectRepository.save(project);

        projectImportService.importZip(project, file);
        return toDto(project);
    }

    @Transactional
    public ProjectDto rename(User user, Long id, String name) {
        Project project = getOwned(user, id);
        project.setName(name.trim());
        return toDto(projectRepository.save(project));
    }

    @Transactional
    public void delete(User user, Long id) throws IOException {
        Project project = getOwned(user, id);
        projectFileRepository.deleteByProjectId(project.getId());
        Path root = Paths.get(project.getRootPath());
        if (Files.exists(root)) {
            deleteRecursively(root);
        }
        projectRepository.delete(project);
    }

    public Project getOwned(User user, Long id) {
        return projectRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException("Project not found", HttpStatus.NOT_FOUND));
    }

    private Workspace verifyWorkspace(User user, Long workspaceId) {
        return workspaceRepository.findByIdAndUserId(workspaceId, user.getId())
                .orElseThrow(() -> new ApiException("Workspace not found", HttpStatus.NOT_FOUND));
    }

    private ProjectDto toDto(Project project) {
        return ProjectDto.builder()
                .id(project.getId())
                .workspaceId(project.getWorkspace().getId())
                .name(project.getName())
                .description(project.getDescription())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private void deleteRecursively(Path path) throws IOException {
        if (Files.isDirectory(path)) {
            try (var stream = Files.list(path)) {
                for (Path child : stream.toList()) {
                    deleteRecursively(child);
                }
            }
        }
        Files.deleteIfExists(path);
    }
}
