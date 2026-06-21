package com.ai.platform.ppt.service;

import com.ai.platform.ai.AiModel;
import com.ai.platform.ai.ModelRouterService;
import com.ai.platform.common.entity.GeneratedFile;
import com.ai.platform.common.exception.ApiException;
import com.ai.platform.common.repository.GeneratedFileRepository;
import com.ai.platform.ppt.dto.PptGenerateRequest;
import com.ai.platform.user.entity.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xslf.usermodel.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.*;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PptGeneratorService {

    private final ModelRouterService modelRouterService;
    private final GeneratedFileRepository generatedFileRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Transactional
    public GeneratedFile generate(User user, PptGenerateRequest request) throws IOException {
        String input = request.getMarkdown() != null ? request.getMarkdown() : request.getRequirement();
        if (input == null || input.isBlank()) {
            throw new ApiException("Markdown or requirement is required", HttpStatus.BAD_REQUEST);
        }

        String outlineJson = modelRouterService.callSimple(
                AiModel.GROQ_LLAMA_8B,
                """
                        Tạo outline cho PowerPoint. Trả về JSON array duy nhất, không markdown fence:
                        [{"title":"Slide title","bullets":["point1","point2"]}]
                        Tối đa 10 slides.""",
                "Tạo outline PPT từ:\n" + input
        );

        outlineJson = outlineJson.replaceAll("```json|```", "").trim();
        List<Map<String, Object>> slides = objectMapper.readValue(outlineJson, new TypeReference<>() {});

        Path outputDir = Paths.get(uploadDir, user.getId().toString(), "generated");
        Files.createDirectories(outputDir);
        String filename = UUID.randomUUID() + ".pptx";
        Path outputPath = outputDir.resolve(filename);

        try (XMLSlideShow ppt = new XMLSlideShow();
             OutputStream out = Files.newOutputStream(outputPath)) {

            ppt.setPageSize(new Dimension(960, 540));

            for (Map<String, Object> slideData : slides) {
                XSLFSlide slide = ppt.createSlide();
                String title = String.valueOf(slideData.get("title"));

                XSLFTextBox titleBox = slide.createTextBox();
                titleBox.setAnchor(new Rectangle(50, 30, 860, 60));
                XSLFTextParagraph titlePara = titleBox.addNewTextParagraph();
                XSLFTextRun titleRun = titlePara.addNewTextRun();
                titleRun.setText(title);
                titleRun.setFontSize(28.0);
                titleRun.setBold(true);

                @SuppressWarnings("unchecked")
                List<String> bullets = (List<String>) slideData.get("bullets");
                if (bullets != null) {
                    XSLFTextBox contentBox = slide.createTextBox();
                    contentBox.setAnchor(new Rectangle(50, 110, 860, 380));
                    for (String bullet : bullets) {
                        XSLFTextParagraph para = contentBox.addNewTextParagraph();
                        para.setBullet(true);
                        XSLFTextRun run = para.addNewTextRun();
                        run.setText(bullet);
                        run.setFontSize(18.0);
                    }
                }
            }

            ppt.write(out);
        }

        GeneratedFile file = GeneratedFile.builder()
                .user(user)
                .type("PPT")
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

    private String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max);
    }
}
