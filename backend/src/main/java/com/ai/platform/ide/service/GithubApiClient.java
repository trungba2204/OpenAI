package com.ai.platform.ide.service;

import com.ai.platform.common.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class GithubApiClient {

    private static final String API_BASE = "https://api.github.com";
    private static final Pattern REPO_NAME_PATTERN = Pattern.compile("^[a-zA-Z0-9._-]+$");

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public String getAuthenticatedLogin(String token) throws IOException {
        JsonNode user = get("/user", token);
        String login = user.path("login").asText(null);
        if (login == null || login.isBlank()) {
            throw new ApiException("Không lấy được tên GitHub từ token — kiểm tra quyền repo.", HttpStatus.BAD_REQUEST);
        }
        return login;
    }

    /**
     * Tạo repo mới trên GitHub. Nếu tên đã tồn tại, trả về URL repo hiện có.
     */
    public String createRepository(String token, String owner, String name, String description, boolean isPrivate)
            throws IOException {
        validateRepoName(name);

        ObjectNode body = objectMapper.createObjectNode();
        body.put("name", name);
        body.put("private", isPrivate);
        body.put("auto_init", false);
        if (description != null && !description.isBlank()) {
            body.put("description", description.length() > 350 ? description.substring(0, 350) : description);
        }

        try {
            JsonNode resp = post("/user/repos", token, body);
            String cloneUrl = resp.path("clone_url").asText(null);
            if (cloneUrl == null || cloneUrl.isBlank()) {
                throw new ApiException("GitHub không trả về URL repo.", HttpStatus.BAD_GATEWAY);
            }
            return cloneUrl;
        } catch (ApiException e) {
            if (isRepoAlreadyExists(e)) {
                log.info("GitHub repo {} đã tồn tại — dùng repo hiện có", name);
                return "https://github.com/" + owner + "/" + name + ".git";
            }
            throw e;
        }
    }

    public static String suggestRepoName(String projectName, Long projectId) {
        String slug = slugify(projectName);
        if (slug.isBlank()) {
            slug = "project";
        }
        if (slug.length() > 60) {
            slug = slug.substring(0, 60).replaceAll("-+$", "");
        }
        return slug + "-" + projectId;
    }

    public static String slugify(String input) {
        if (input == null) return "";
        return input.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }

    private static void validateRepoName(String name) {
        if (name == null || name.isBlank()) {
            throw new ApiException("Tên repo không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (name.length() > 100) {
            throw new ApiException("Tên repo quá dài (tối đa 100 ký tự)", HttpStatus.BAD_REQUEST);
        }
        if (!REPO_NAME_PATTERN.matcher(name).matches()) {
            throw new ApiException(
                    "Tên repo chỉ được chứa chữ, số, dấu - _ .",
                    HttpStatus.BAD_REQUEST);
        }
    }

    private boolean isRepoAlreadyExists(ApiException e) {
        String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        return msg.contains("already exists") || msg.contains("name already exists") || msg.contains("\"custom_error\"");
    }

    private JsonNode get(String path, String token) throws IOException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + path))
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "Bearer " + token)
                .header("Accept", "application/vnd.github+json")
                .header("X-GitHub-Api-Version", "2022-11-28")
                .GET()
                .build();
        return execute(request);
    }

    private JsonNode post(String path, String token, ObjectNode body) throws IOException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + path))
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "Bearer " + token)
                .header("Accept", "application/vnd.github+json")
                .header("X-GitHub-Api-Version", "2022-11-28")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();
        return execute(request);
    }

    private JsonNode execute(HttpRequest request) throws IOException {
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int code = response.statusCode();
            String body = response.body() != null ? response.body() : "";

            if (code >= 200 && code < 300) {
                if (body.isBlank()) {
                    return objectMapper.createObjectNode();
                }
                return objectMapper.readTree(body);
            }

            String message = parseGithubError(body, code);
            if (code == 401) {
                throw new ApiException("Token GitHub không hợp lệ hoặc hết hạn.", HttpStatus.UNAUTHORIZED);
            }
            if (code == 403) {
                throw new ApiException("Token thiếu quyền — cần quyền repo khi tạo repository.", HttpStatus.FORBIDDEN);
            }
            throw new ApiException("GitHub API lỗi (" + code + "): " + message, HttpStatus.BAD_REQUEST);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException("Gọi GitHub API bị gián đoạn", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String parseGithubError(String body, int code) {
        try {
            JsonNode node = objectMapper.readTree(body);
            if (node.has("message")) {
                String msg = node.get("message").asText();
                if (node.has("errors") && node.get("errors").isArray()) {
                    StringBuilder sb = new StringBuilder(msg);
                    for (JsonNode err : node.get("errors")) {
                        if (err.has("message")) {
                            sb.append(" — ").append(err.get("message").asText());
                        }
                    }
                    return sb.toString();
                }
                return msg;
            }
        } catch (Exception ignored) {
            // fall through
        }
        return body.isBlank() ? "HTTP " + code : body;
    }
}
