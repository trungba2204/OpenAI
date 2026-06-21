package com.ai.platform.markdown.service;

import com.ai.platform.ai.AiModel;
import com.ai.platform.ai.ModelRouterService;
import com.ai.platform.common.entity.GeneratedFile;
import com.ai.platform.common.exception.ApiException;
import com.ai.platform.common.repository.GeneratedFileRepository;
import com.ai.platform.document.entity.Document;
import com.ai.platform.document.service.DocumentService;
import com.ai.platform.markdown.dto.MarkdownGenerateRequest;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MarkdownGeneratorService {

    private final ModelRouterService modelRouterService;
    private final DocumentService documentService;
    private final GeneratedFileRepository generatedFileRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Transactional
    public GeneratedFile generate(User user, MarkdownGenerateRequest request) throws IOException {
        String input = resolveInput(user, request);

        String markdown = modelRouterService.callSimple(
                AiModel.GROQ_LLAMA_8B,
                """
                        Bạn là chuyên gia viết tài liệu kỹ thuật. Hãy tạo nội dung Markdown có cấu trúc rõ ràng
                        với các heading (#, ##, ###), danh sách, bảng khi cần. Chỉ trả về Markdown thuần, không bọc code fence.""",
                "Tạo tài liệu Markdown từ nội dung sau:\n\n" + input
        );

        Path outputDir = Paths.get(uploadDir, user.getId().toString(), "generated");
        Files.createDirectories(outputDir);
        String filename = UUID.randomUUID() + ".md";
        Path outputPath = outputDir.resolve(filename);
        Files.writeString(outputPath, markdown);

        GeneratedFile file = GeneratedFile.builder()
                .user(user)
                .type("MARKDOWN")
                .sourceInput(truncate(input, 5000))
                .outputPath(outputPath.toString())
                .build();
        return generatedFileRepository.save(file);
    }

    @Transactional(readOnly = true)
    public byte[] download(User user, Long id) throws IOException {
        GeneratedFile file = generatedFileRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException("File not found", HttpStatus.NOT_FOUND));
        return Files.readAllBytes(Paths.get(file.getOutputPath()));
    }

    private String resolveInput(User user, MarkdownGenerateRequest request) {
        if ("document".equalsIgnoreCase(request.getSource()) && request.getDocumentId() != null) {
            Document doc = documentService.getDocument(user, request.getDocumentId());
            return doc.getExtractedText() != null ? doc.getExtractedText() : doc.getFilename();
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new ApiException("Content is required", HttpStatus.BAD_REQUEST);
        }
        return request.getContent();
    }

    private String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max);
    }
}
