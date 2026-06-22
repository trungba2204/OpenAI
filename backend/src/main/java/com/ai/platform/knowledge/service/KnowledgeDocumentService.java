package com.ai.platform.knowledge.service;

import com.ai.platform.common.exception.ApiException;
import com.ai.platform.knowledge.dto.KnowledgeDocumentDto;
import com.ai.platform.knowledge.entity.KnowledgeBase;
import com.ai.platform.knowledge.entity.KnowledgeDocument;
import com.ai.platform.knowledge.entity.KnowledgeDocumentStatus;
import com.ai.platform.knowledge.repository.KnowledgeChunkRepository;
import com.ai.platform.knowledge.repository.KnowledgeDocumentRepository;
import com.ai.platform.knowledge.repository.KnowledgeEmbeddingRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
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
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KnowledgeDocumentService {

    private final KnowledgeBaseService knowledgeBaseService;
    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final KnowledgeEmbeddingRepository embeddingRepository;
    private final DocumentParserService documentParserService;
    private final KnowledgeIngestionService ingestionService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<KnowledgeDocumentDto> list(User user, Long knowledgeBaseId) {
        knowledgeBaseService.getOwned(user, knowledgeBaseId);
        return documentRepository.findByKnowledgeBaseIdOrderByUploadedAtDesc(knowledgeBaseId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public KnowledgeDocumentDto upload(User user, Long knowledgeBaseId, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new ApiException("File is empty", HttpStatus.BAD_REQUEST);
        }

        KnowledgeBase kb = knowledgeBaseService.getOwned(user, knowledgeBaseId);
        String mimeType = documentParserService.resolveMimeType(file.getOriginalFilename(), file.getContentType());
        if (!documentParserService.isAllowedMime(mimeType)) {
            throw new ApiException("Unsupported file type. Allowed: PDF, DOCX, TXT, MD, CSV, XLSX", HttpStatus.BAD_REQUEST);
        }

        Path dir = Paths.get(uploadDir, "knowledge", user.getId().toString(), knowledgeBaseId.toString());
        Files.createDirectories(dir);

        String storedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = dir.resolve(storedName);
        Files.copy(file.getInputStream(), filePath);

        String extracted = "";
        try {
            extracted = documentParserService.extract(mimeType, Files.newInputStream(filePath));
        } catch (Exception ignored) {
            // ingestion will retry
        }

        KnowledgeDocument doc = KnowledgeDocument.builder()
                .knowledgeBase(kb)
                .fileName(file.getOriginalFilename())
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .mimeType(mimeType)
                .status(KnowledgeDocumentStatus.UPLOADED)
                .extractedText(extracted)
                .build();
        doc = documentRepository.save(doc);

        ingestionService.processDocumentAsync(doc.getId());

        return toDto(doc);
    }

    @Transactional
    public void delete(User user, Long knowledgeBaseId, Long documentId) throws IOException {
        knowledgeBaseService.getOwned(user, knowledgeBaseId);
        KnowledgeDocument doc = documentRepository.findByIdAndKnowledgeBaseId(documentId, knowledgeBaseId)
                .orElseThrow(() -> new ApiException("Document not found", HttpStatus.NOT_FOUND));

        embeddingRepository.deleteByDocumentId(documentId);
        chunkRepository.deleteByDocumentId(documentId);
        documentRepository.delete(doc);

        try {
            Files.deleteIfExists(Paths.get(doc.getFilePath()));
        } catch (IOException ignored) {
        }
    }

    private KnowledgeDocumentDto toDto(KnowledgeDocument doc) {
        return KnowledgeDocumentDto.builder()
                .id(doc.getId())
                .knowledgeBaseId(doc.getKnowledgeBase().getId())
                .fileName(doc.getFileName())
                .fileSize(doc.getFileSize())
                .mimeType(doc.getMimeType())
                .status(doc.getStatus())
                .errorMessage(doc.getErrorMessage())
                .uploadedAt(doc.getUploadedAt())
                .build();
    }
}
