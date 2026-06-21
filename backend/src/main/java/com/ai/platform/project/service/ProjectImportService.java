package com.ai.platform.project.service;

import com.ai.platform.project.entity.Project;
import com.ai.platform.project.entity.ProjectFile;
import com.ai.platform.project.repository.ProjectFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectImportService {

    private final ProjectFileRepository projectFileRepository;

    @Value("${app.ide.import.max-files:20000}")
    private int maxEntries;

    @Value("${app.ide.import.max-total-mb:500}")
    private long maxTotalMb;

    @Transactional
    public void indexEmptyProject(Project project) {
        ProjectFile root = ProjectFile.builder()
                .project(project)
                .parent(null)
                .name(project.getName())
                .path("")
                .directory(true)
                .sizeBytes(0)
                .build();
        projectFileRepository.save(root);
    }

    @Transactional
    public void importFolder(Project project, List<MultipartFile> files, List<String> paths) throws IOException {
        if (files.isEmpty()) {
            throw new IllegalArgumentException("No files to import");
        }
        if (files.size() != paths.size()) {
            throw new IllegalArgumentException("Files and paths count mismatch");
        }

        projectFileRepository.deleteByProjectId(project.getId());
        Path root = Paths.get(project.getRootPath());
        Files.createDirectories(root);

        Map<String, ProjectFile> pathToEntity = new HashMap<>();
        ProjectFile rootDir = ProjectFile.builder()
                .project(project)
                .parent(null)
                .name(project.getName())
                .path("")
                .directory(true)
                .sizeBytes(0)
                .build();
        rootDir = projectFileRepository.save(rootDir);
        pathToEntity.put("", rootDir);

        String rootPrefix = commonRootPrefix(paths);
        int entries = 0;
        long totalBytes = 0;

        for (int i = 0; i < files.size(); i++) {
            if (++entries > maxEntries) {
                log.warn("Folder import truncated: too many entries (max {})", maxEntries);
                break;
            }
            MultipartFile file = files.get(i);
            String rawPath = paths.get(i).replace('\\', '/');
            if (rootPrefix != null && rawPath.startsWith(rootPrefix)) {
                rawPath = rawPath.substring(rootPrefix.length());
            }
            if (shouldSkip(rawPath)) continue;

            String normalized = normalizePath(rawPath);
            if (normalized.isEmpty()) continue;

            byte[] data = file.getBytes();
            totalBytes += data.length;
            long maxTotalBytes = maxTotalMb * 1024L * 1024L;
            if (totalBytes > maxTotalBytes) {
                log.warn("Folder import truncated: size limit {} MB", maxTotalMb);
                break;
            }

            Path diskPath = root.resolve(normalized);
            Files.createDirectories(diskPath.getParent());
            Files.write(diskPath, data);
            ensureParentDirs(project, pathToEntity, normalized);
            indexFile(project, pathToEntity, normalized, data.length);
        }
        log.info("Imported folder for project {}: {} files written", project.getId(), entries);
    }

    private String commonRootPrefix(List<String> paths) {
        if (paths.isEmpty()) return null;
        String first = normalizePath(paths.get(0).replace('\\', '/'));
        int slash = first.indexOf('/');
        if (slash < 0) return null;
        String prefix = first.substring(0, slash + 1);
        boolean allMatch = paths.stream()
                .map(p -> normalizePath(p.replace('\\', '/')))
                .allMatch(p -> p.startsWith(prefix));
        return allMatch ? prefix : null;
    }

    @Transactional
    public void importZip(Project project, MultipartFile zipFile) throws IOException {
        projectFileRepository.deleteByProjectId(project.getId());
        Path root = Paths.get(project.getRootPath());
        Files.createDirectories(root);

        Map<String, ProjectFile> pathToEntity = new HashMap<>();
        ProjectFile rootDir = ProjectFile.builder()
                .project(project)
                .parent(null)
                .name(project.getName())
                .path("")
                .directory(true)
                .sizeBytes(0)
                .build();
        rootDir = projectFileRepository.save(rootDir);
        pathToEntity.put("", rootDir);

        int entries = 0;
        long totalBytes = 0;
        long maxTotalBytes = maxTotalMb * 1024L * 1024L;

        try (InputStream is = zipFile.getInputStream(); ZipInputStream zis = new ZipInputStream(is)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (++entries > maxEntries) {
                    log.warn("ZIP import truncated: too many entries (max {})", maxEntries);
                    break;
                }
                String rawPath = entry.getName().replace('\\', '/');
                if (shouldSkip(rawPath)) {
                    zis.closeEntry();
                    continue;
                }

                String normalized = normalizePath(rawPath);
                if (normalized.isEmpty()) {
                    zis.closeEntry();
                    continue;
                }

                Path diskPath = root.resolve(normalized);
                if (entry.isDirectory()) {
                    Files.createDirectories(diskPath);
                    ensureDirInIndex(project, pathToEntity, normalized);
                } else {
                    Files.createDirectories(diskPath.getParent());
                    byte[] data = zis.readAllBytes();
                    totalBytes += data.length;
                    if (totalBytes > maxTotalBytes) {
                        log.warn("ZIP import truncated: size limit {} MB", maxTotalMb);
                        break;
                    }
                    Files.write(diskPath, data);
                    ensureParentDirs(project, pathToEntity, normalized);
                    indexFile(project, pathToEntity, normalized, data.length);
                }
                zis.closeEntry();
            }
        }
    }

    private boolean shouldSkip(String path) {
        return path.startsWith("__MACOSX/")
                || path.contains("/.")
                || path.startsWith(".")
                || path.contains("/node_modules/")
                || path.contains("/.git/")
                || path.contains("/target/")
                || path.contains("/dist/")
                || path.contains("/build/");
    }

    private String normalizePath(String path) {
        while (path.startsWith("/")) path = path.substring(1);
        if (path.endsWith("/")) path = path.substring(0, path.length() - 1);
        return path;
    }

    private void ensureParentDirs(Project project, Map<String, ProjectFile> pathToEntity, String filePath) {
        int lastSlash = filePath.lastIndexOf('/');
        if (lastSlash < 0) return;
        String dirPath = filePath.substring(0, lastSlash);
        ensureDirInIndex(project, pathToEntity, dirPath);
    }

    private void ensureDirInIndex(Project project, Map<String, ProjectFile> pathToEntity, String dirPath) {
        if (pathToEntity.containsKey(dirPath)) return;

        String parentPath = "";
        ProjectFile parent = pathToEntity.get("");
        int lastSlash = dirPath.lastIndexOf('/');
        String name;
        if (lastSlash >= 0) {
            parentPath = dirPath.substring(0, lastSlash);
            name = dirPath.substring(lastSlash + 1);
            ensureDirInIndex(project, pathToEntity, parentPath);
            parent = pathToEntity.get(parentPath);
        } else {
            name = dirPath;
        }

        ProjectFile dir = ProjectFile.builder()
                .project(project)
                .parent(parent)
                .name(name)
                .path(dirPath)
                .directory(true)
                .sizeBytes(0)
                .build();
        dir = projectFileRepository.save(dir);
        pathToEntity.put(dirPath, dir);
    }

    private void indexFile(Project project, Map<String, ProjectFile> pathToEntity, String filePath, long size) {
        if (pathToEntity.containsKey(filePath)) return;
        int lastSlash = filePath.lastIndexOf('/');
        String parentPath = lastSlash >= 0 ? filePath.substring(0, lastSlash) : "";
        String name = lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath;
        ProjectFile parent = pathToEntity.get(parentPath);

        ProjectFile file = ProjectFile.builder()
                .project(project)
                .parent(parent)
                .name(name)
                .path(filePath)
                .directory(false)
                .mimeType(ProjectFileService.guessMimeType(name))
                .sizeBytes(size)
                .build();
        file = projectFileRepository.save(file);
        pathToEntity.put(filePath, file);
    }
}
