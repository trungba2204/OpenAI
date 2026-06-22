package com.ai.platform.knowledge.service;

import com.ai.platform.document.service.PdfReaderService;
import com.ai.platform.document.service.WordReaderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentParserService {

    private static final Set<String> ALLOWED_MIME = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
            "text/csv",
            "application/csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    private final PdfReaderService pdfReaderService;
    private final WordReaderService wordReaderService;

    public boolean isAllowedMime(String mimeType) {
        return mimeType != null && ALLOWED_MIME.contains(mimeType);
    }

    public String resolveMimeType(String originalFilename, String contentType) {
        if (contentType != null && !contentType.isBlank() && !"application/octet-stream".equals(contentType)) {
            return contentType;
        }
        if (originalFilename == null) return "text/plain";
        String lower = originalFilename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (lower.endsWith(".csv")) return "text/csv";
        if (lower.endsWith(".md")) return "text/markdown";
        return "text/plain";
    }

    public String extractFromPath(Path filePath, String mimeType) throws IOException {
        try (InputStream in = Files.newInputStream(filePath)) {
            return extract(mimeType, in);
        }
    }

    public String extract(String mimeType, InputStream inputStream) throws IOException {
        return switch (mimeType) {
            case "application/pdf" -> pdfReaderService.extractText(inputStream);
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ->
                    wordReaderService.extractText(inputStream);
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ->
                    extractSpreadsheet(inputStream);
            case "text/csv", "application/csv" -> new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            case "text/plain", "text/markdown" -> new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            default -> "";
        };
    }

    private String extractSpreadsheet(InputStream inputStream) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                Sheet sheet = workbook.getSheetAt(s);
                sb.append("Sheet: ").append(sheet.getSheetName()).append("\n");
                for (Row row : sheet) {
                    for (Cell cell : row) {
                        sb.append(getCellValue(cell)).append("\t");
                    }
                    sb.append("\n");
                }
            }
        }
        return sb.toString();
    }

    private String getCellValue(Cell cell) {
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                    ? cell.getLocalDateTimeCellValue().toString()
                    : String.valueOf(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> "";
        };
    }
}
