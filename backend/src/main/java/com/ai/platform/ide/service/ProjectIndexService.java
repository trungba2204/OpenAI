package com.ai.platform.ide.service;

import com.ai.platform.ide.entity.ProjectChunk;
import com.ai.platform.ide.entity.ProjectIndex;
import com.ai.platform.ide.repository.ProjectChunkRepository;
import com.ai.platform.ide.repository.ProjectIndexRepository;
import com.ai.platform.project.entity.Project;
import com.ai.platform.project.entity.ProjectFile;
import com.ai.platform.project.repository.ProjectFileRepository;
import com.ai.platform.project.service.ProjectFileService;
import com.ai.platform.project.service.ProjectService;
import com.ai.platform.user.entity.User;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectIndexService {

    private static final int CHUNK_SIZE = 800;
    private static final Pattern JAVA_CLASS = Pattern.compile("^(?:public\\s+)?(?:class|interface|enum|record)\\s+(\\w+)", Pattern.MULTILINE);
    private static final Pattern JAVA_METHOD = Pattern.compile("^(?:\\s*)(?:public|private|protected|static|final|synchronized|native|abstract|[\\w<>,\\[\\]\\s])+\\s+(\\w+)\\s*\\([^;]*\\)\\s*(?:throws\\s+[\\w,\\s]+)?\\s*\\{", Pattern.MULTILINE);
    private static final Pattern TS_SYMBOL = Pattern.compile("^(?:export\\s+)?(?:async\\s+)?(?:function|class|interface|type|const|let|var)\\s+(\\w+)", Pattern.MULTILINE);

    private final ProjectIndexRepository projectIndexRepository;
    private final ProjectChunkRepository projectChunkRepository;
    private final ProjectFileRepository projectFileRepository;
    private final ProjectService projectService;
    private final EntityManager entityManager;

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = false)
    public void indexProject(User user, Long projectId) throws IOException {
        Project project = projectService.getOwned(user, projectId);
        projectIndexRepository.deleteByProject_Id(projectId);
        projectChunkRepository.deleteByProject_Id(projectId);
        entityManager.flush();
        entityManager.clear();

        List<ProjectFile> files = projectFileRepository.findByProjectIdOrderByPathAsc(projectId)
                .stream()
                .filter(f -> !f.isDirectory())
                .filter(f -> ProjectFileService.isTextFile(f.getName()))
                .collect(Collectors.toList());

        for (ProjectFile file : files) {
            String content = readFileContent(project, file);
            if (content.isBlank()) continue;
            indexSymbols(project, file, content);
            indexChunks(project, file, content);
        }
        log.info("Indexed project {} with {} files", projectId, files.size());
    }

    @Transactional(readOnly = true)
    public List<ProjectIndex> searchSymbols(Long projectId, String query) {
        if (query == null || query.isBlank()) {
            return projectIndexRepository.findByProjectId(projectId).stream().limit(50).collect(Collectors.toList());
        }
        return projectIndexRepository.search(projectId, query.trim()).stream().limit(30).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectChunk> searchChunks(Long projectId, String query) {
        if (query == null || query.isBlank()) {
            return projectChunkRepository.findByProjectId(projectId).stream().limit(20).collect(Collectors.toList());
        }
        List<ProjectChunk> direct = projectChunkRepository.search(projectId, query.trim());
        if (!direct.isEmpty()) return direct.stream().limit(15).collect(Collectors.toList());

        String[] tokens = query.toLowerCase().split("\\W+");
        return projectChunkRepository.findByProjectId(projectId).stream()
                .map(c -> new AbstractMap.SimpleEntry<>(c, scoreChunk(c, tokens)))
                .filter(e -> e.getValue() > 0)
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(15)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private double scoreChunk(ProjectChunk chunk, String[] tokens) {
        String hay = (chunk.getContent() + " " + chunk.getKeywords() + " " + chunk.getFilePath()).toLowerCase();
        double score = 0;
        for (String t : tokens) {
            if (t.length() < 2) continue;
            if (hay.contains(t)) score += 1;
        }
        return score;
    }

    private void indexSymbols(Project project, ProjectFile file, String content) {
        String path = file.getPath();
        String ext = extension(file.getName());

        if ("java".equals(ext)) {
            indexJavaSymbols(project, file, path, content);
        } else if (Set.of("ts", "tsx", "js", "jsx").contains(ext)) {
            indexTsSymbols(project, file, path, content);
        } else {
            projectIndexRepository.save(ProjectIndex.builder()
                    .project(project)
                    .file(file)
                    .filePath(path)
                    .symbolType("file")
                    .symbolName(file.getName())
                    .lineNumber(1)
                    .signature(path)
                    .build());
        }
    }

    private void indexJavaSymbols(Project project, ProjectFile file, String path, String content) {
        Matcher classMatcher = JAVA_CLASS.matcher(content);
        while (classMatcher.find()) {
            int line = lineNumber(content, classMatcher.start());
            projectIndexRepository.save(ProjectIndex.builder()
                    .project(project).file(file).filePath(path)
                    .symbolType("class").symbolName(classMatcher.group(1))
                    .lineNumber(line).signature(classMatcher.group().trim())
                    .build());
        }
        Matcher methodMatcher = JAVA_METHOD.matcher(content);
        while (methodMatcher.find()) {
            int line = lineNumber(content, methodMatcher.start());
            projectIndexRepository.save(ProjectIndex.builder()
                    .project(project).file(file).filePath(path)
                    .symbolType("method").symbolName(methodMatcher.group(1))
                    .lineNumber(line).signature(truncate(methodMatcher.group().trim(), 500))
                    .build());
        }
    }

    private void indexTsSymbols(Project project, ProjectFile file, String path, String content) {
        Matcher m = TS_SYMBOL.matcher(content);
        while (m.find()) {
            int line = lineNumber(content, m.start());
            projectIndexRepository.save(ProjectIndex.builder()
                    .project(project).file(file).filePath(path)
                    .symbolType("symbol").symbolName(m.group(1))
                    .lineNumber(line).signature(truncate(m.group().trim(), 500))
                    .build());
        }
    }

    private void indexChunks(Project project, ProjectFile file, String content) {
        String path = file.getPath();
        String keywords = extractKeywords(content);
        int idx = 0;
        for (int start = 0; start < content.length(); start += CHUNK_SIZE) {
            String chunk = content.substring(start, Math.min(content.length(), start + CHUNK_SIZE));
            projectChunkRepository.save(ProjectChunk.builder()
                    .project(project)
                    .file(file)
                    .filePath(path)
                    .chunkIndex(idx++)
                    .content(chunk)
                    .keywords(keywords)
                    .build());
        }
    }

    private String readFileContent(Project project, ProjectFile file) throws IOException {
        Path disk = Paths.get(project.getRootPath(), file.getPath().split("/"));
        if (!Files.exists(disk)) return "";
        byte[] bytes = Files.readAllBytes(disk);
        if (bytes.length > 256 * 1024) {
            return new String(bytes, 0, 256 * 1024, StandardCharsets.UTF_8);
        }
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private String extractKeywords(String content) {
        return Arrays.stream(content.split("\\W+"))
                .filter(w -> w.length() > 3)
                .map(String::toLowerCase)
                .distinct()
                .limit(100)
                .collect(Collectors.joining(" "));
    }

    private int lineNumber(String content, int offset) {
        return content.substring(0, offset).split("\n", -1).length;
    }

    private String extension(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase();
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
