package com.ai.platform.agent.tool;

import com.ai.platform.common.exception.ApiException;
import com.ai.platform.document.entity.Document;
import com.ai.platform.document.repository.DocumentRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.FileInputStream;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AgentTools {

    private static final Pattern SELECT_ONLY = Pattern.compile("^\\s*SELECT\\s+", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern FORBIDDEN = Pattern.compile(
            "\\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private final JdbcTemplate jdbcTemplate;
    private final DocumentRepository documentRepository;
    private final RestClient restClient = RestClient.create();

    @org.springframework.ai.tool.annotation.Tool(description = "Truy vấn dữ liệu từ database. Chỉ cho phép câu lệnh SELECT.")
    public String queryDatabase(
            @org.springframework.ai.tool.annotation.ToolParam(description = "Câu lệnh SQL SELECT") String sql,
            Long userId
    ) {
        validateSelectSql(sql);
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            if (rows.isEmpty()) return "Không có dữ liệu.";
            return rows.stream()
                    .map(row -> row.entrySet().stream()
                            .map(e -> e.getKey() + "=" + e.getValue())
                            .collect(Collectors.joining(", ")))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "Lỗi truy vấn: " + e.getMessage();
        }
    }

    @org.springframework.ai.tool.annotation.Tool(description = "Gọi REST API bên ngoài và trả về response.")
    public String callApi(
            @org.springframework.ai.tool.annotation.ToolParam(description = "URL API cần gọi") String url
    ) {
        try {
            return restClient.get().uri(url).retrieve().body(String.class);
        } catch (Exception e) {
            return "Lỗi gọi API: " + e.getMessage();
        }
    }

    @org.springframework.ai.tool.annotation.Tool(description = "Đọc nội dung file Excel/CSV đã upload.")
    public String readSpreadsheet(
            @org.springframework.ai.tool.annotation.ToolParam(description = "ID của document") Long docId,
            Long userId
    ) {
        Document doc = documentRepository.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ApiException("Document not found", HttpStatus.NOT_FOUND));

        if (doc.getExtractedText() != null && !doc.getExtractedText().isBlank()) {
            return doc.getExtractedText();
        }

        try (FileInputStream fis = new FileInputStream(doc.getFilePath());
             Workbook workbook = new XSSFWorkbook(fis)) {
            StringBuilder sb = new StringBuilder();
            Sheet sheet = workbook.getSheetAt(0);
            for (Row row : sheet) {
                for (Cell cell : row) {
                    sb.append(getCellValue(cell)).append("\t");
                }
                sb.append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi đọc file: " + e.getMessage();
        }
    }

    private void validateSelectSql(String sql) {
        if (sql == null || sql.isBlank()) {
            throw new ApiException("SQL cannot be empty", HttpStatus.BAD_REQUEST);
        }
        if (!SELECT_ONLY.matcher(sql).find()) {
            throw new ApiException("Only SELECT queries allowed", HttpStatus.BAD_REQUEST);
        }
        if (FORBIDDEN.matcher(sql.toUpperCase(Locale.ROOT)).find()) {
            throw new ApiException("Forbidden SQL operation", HttpStatus.BAD_REQUEST);
        }
    }

    private String getCellValue(Cell cell) {
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }
}
