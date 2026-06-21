package com.ai.platform.ai;

import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class AiErrorMapper {

    private static final Pattern HTTP_STATUS = Pattern.compile("\\b([45]\\d{2})\\b");

    private AiErrorMapper() {
    }

    public static boolean isRateLimited(Throwable e) {
        return statusCode(e) == 429;
    }

    public static boolean isRetryable(Throwable e) {
        if (isNetworkError(e)) {
            return true;
        }
        int code = statusCode(e);
        return code == 429 || code == 500 || code == 502 || code == 503 || code == 529;
    }

    public static boolean isNetworkError(Throwable e) {
        Throwable cur = e;
        while (cur != null) {
            String className = cur.getClass().getName();
            String msg = cur.getMessage() != null ? cur.getMessage().toLowerCase() : "";
            if (cur instanceof java.net.SocketTimeoutException
                    || cur instanceof java.net.ConnectException
                    || className.contains("SSLHandshakeException")
                    || className.contains("CertPathBuilderException")
                    || msg.contains("operation timed out")
                    || msg.contains("pkix path building failed")
                    || msg.contains("unable to find valid certification path")
                    || msg.contains("connection reset")
                    || msg.contains("connection refused")
                    || msg.contains("no route to host")) {
                return true;
            }
            cur = cur.getCause();
        }
        return false;
    }

    public static int statusCode(Throwable e) {
        Throwable cur = e;
        while (cur != null) {
            if (cur instanceof WebClientResponseException w) {
                return w.getStatusCode().value();
            }
            int code = parseStatus(cur.getMessage());
            if (code > 0) {
                return code;
            }
            cur = cur.getCause();
        }
        return -1;
    }

    private static int parseStatus(String message) {
        if (message == null || message.isBlank()) {
            return -1;
        }
        String lower = message.toLowerCase();
        if (lower.contains("too many requests") || lower.contains("resource_exhausted") || lower.contains("rate limit")) {
            return 429;
        }
        if (lower.contains("unauthenticated") || lower.contains("invalid api key")) {
            return 401;
        }
        if (lower.contains("permission_denied") || lower.contains("access denied")) {
            return 403;
        }
        if (lower.contains("not found")) {
            return 404;
        }
        Matcher matcher = HTTP_STATUS.matcher(message);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return -1;
    }

    public static HttpStatus toHttpStatus(Throwable e) {
        int code = statusCode(e);
        if (code > 0) {
            try {
                return HttpStatus.valueOf(code);
            } catch (IllegalArgumentException ignored) {
                return HttpStatus.BAD_GATEWAY;
            }
        }
        return HttpStatus.BAD_GATEWAY;
    }

    public static String toUserMessage(Throwable e) {
        int code = statusCode(e);
        return switch (code) {
            case 429 -> "⚠️ **Vượt giới hạn API free (429)**\n\n"
                    + "Hệ thống đã thử chuyển sang provider khác. Hãy:\n"
                    + "- Đợi **1–2 phút** rồi thử lại\n"
                    + "- Thêm **Groq API key** miễn phí tại [console.groq.com](https://console.groq.com)\n"
                    + "- Hoặc thêm **OpenRouter API key** tại [openrouter.ai](https://openrouter.ai)";
            case 401, 403 -> "⚠️ **API key không hợp lệ**\n\n"
                    + "Cấu hình trong `application-local.yml`:\n"
                    + "- Groq: `app.ai.providers.groq.api-key` (dạng `gsk_...`)\n"
                    + "- OpenRouter: `app.ai.providers.openrouter.api-key` (dạng `sk-or-v1_...`)";
            case 404 -> "⚠️ **Model không khả dụng**\n\nThử đổi model khác trong dropdown chat.";
            default -> {
                if (isNetworkError(e)) {
                    yield "⚠️ **Lỗi kết nối mạng/SSL tới AI provider**\n\n"
                            + "Hệ thống đã thử chuyển sang provider dự phòng. Nếu vẫn lỗi:\n"
                            + "- Tắt VPN/proxy rồi thử lại\n"
                            + "- Kiểm tra mạng có chặn `api.groq.com` không\n"
                            + "- Thử đổi sang model **OpenRouter** trong dropdown chat";
                }
                if (code > 0) {
                    yield "⚠️ **Lỗi AI (HTTP " + code + ")** — thử lại sau hoặc đổi model.";
                }
                String msg = e.getMessage();
                yield "⚠️ **Không thể kết nối AI:** " + (msg != null ? msg : "Lỗi không xác định");
            }
        };
    }
}
