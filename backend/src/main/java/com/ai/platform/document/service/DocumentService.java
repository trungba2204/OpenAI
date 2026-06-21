package com.ai.platform.document.service;

import com.ai.platform.chat.entity.Conversation;
import com.ai.platform.chat.repository.ConversationRepository;
import com.ai.platform.common.exception.ApiException;
import com.ai.platform.document.dto.DocumentDto;
import com.ai.platform.document.entity.Document;
import com.ai.platform.document.repository.DocumentRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    private final DocumentRepository documentRepository;
    private final ConversationRepository conversationRepository;
    private final PdfReaderService pdfReaderService;
    private final WordReaderService wordReaderService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Transactional
    public DocumentDto upload(User user, MultipartFile file, Long conversationId) throws IOException {
        if (file.isEmpty()) {
            throw new ApiException("File is empty", HttpStatus.BAD_REQUEST);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new ApiException("Unsupported file type. Allowed: PDF, DOCX, TXT, XLSX", HttpStatus.BAD_REQUEST);
        }

        Path userDir = Paths.get(uploadDir, user.getId().toString());
        Files.createDirectories(userDir);

        String storedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = userDir.resolve(storedName);
        Files.copy(file.getInputStream(), filePath);

        String extractedText = extractText(contentType, file);

        Document document = Document.builder()
                .user(user)
                .filename(file.getOriginalFilename())
                .mimeType(contentType)
                .filePath(filePath.toString())
                .extractedText(extractedText)
                .build();
        document = documentRepository.save(document);

        if (conversationId != null) {
            Conversation conversation = conversationRepository.findByIdAndUserId(conversationId, user.getId())
                    .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND));
            conversation.getDocuments().add(document);
            conversationRepository.save(conversation);
        }

        return toDto(document);
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> listByUser(User user) {
        return documentRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Document getDocument(User user, Long id) {
        return documentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException("Document not found", HttpStatus.NOT_FOUND));
    }

    private String extractText(String contentType, MultipartFile file) {
        try {
            return switch (contentType) {
                case "application/pdf" -> pdfReaderService.extractText(file.getInputStream());
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ->
                        wordReaderService.extractText(file.getInputStream());
                case "text/plain" -> new String(file.getBytes());
                default -> "";
            };
        } catch (Exception e) {
            log.warn("Failed to extract text from {}: {}", file.getOriginalFilename(), e.getMessage());
            return "";
        }
    }

    private DocumentDto toDto(Document doc) {
        String preview = doc.getExtractedText();
        if (preview != null && preview.length() > 200) {
            preview = preview.substring(0, 200) + "...";
        }
        return DocumentDto.builder()
                .id(doc.getId())
                .filename(doc.getFilename())
                .mimeType(doc.getMimeType())
                .extractedTextPreview(preview)
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
