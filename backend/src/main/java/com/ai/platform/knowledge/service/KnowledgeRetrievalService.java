package com.ai.platform.knowledge.service;

import com.ai.platform.knowledge.config.KnowledgeProperties;
import com.ai.platform.knowledge.entity.KnowledgeChunk;
import com.ai.platform.knowledge.repository.KnowledgeChunkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KnowledgeRetrievalService {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Set<String> STOP_WORDS = Set.of(
            "cho", "toi", "tôi", "ban", "bạn", "la", "là", "gi", "gì", "ve", "về",
            "cua", "của", "dang", "đang", "noi", "nói", "hay", "hãy", "neu", "nêu",
            "the", "and", "what", "does", "this", "file", "tell", "me", "about"
    );

    private final KnowledgeChunkRepository chunkRepository;
    private final KnowledgeProperties properties;

    public record RetrievedChunk(KnowledgeChunk chunk, String fileName, double score) {}

    @Transactional(readOnly = true)
    public List<RetrievedChunk> search(Long knowledgeBaseId, String query) {
        List<KnowledgeChunk> all = chunkRepository.findByKnowledgeBaseId(knowledgeBaseId);
        if (all.isEmpty()) {
            return List.of();
        }

        int limit = isBroadSummaryQuery(query)
                ? Math.min(12, all.size())
                : properties.getTopK();

        if (query == null || query.isBlank()) {
            return toResults(all, limit);
        }

        String[] tokens = tokenize(query);
        List<RetrievedChunk> ranked = all.stream()
                .map(c -> new RetrievedChunk(c, c.getDocument().getFileName(), score(c.getContent(), tokens)))
                .filter(r -> r.score() > 0)
                .sorted(Comparator.comparingDouble(RetrievedChunk::score).reversed())
                .limit(limit)
                .collect(Collectors.toList());

        if (!ranked.isEmpty()) {
            return ranked;
        }

        // Câu hỏi chung ("file nói gì", "tóm tắt") hoặc không khớp từ khóa → lấy chunk đầu
        return toResults(all, limit);
    }

    private List<RetrievedChunk> toResults(List<KnowledgeChunk> chunks, int limit) {
        return chunks.stream()
                .limit(limit)
                .map(c -> new RetrievedChunk(c, c.getDocument().getFileName(), 0))
                .collect(Collectors.toList());
    }

    private boolean isBroadSummaryQuery(String query) {
        String q = normalize(query);
        return q.contains("tom tat")
                || q.contains("noi gi")
                || q.contains("ve gi")
                || q.contains("tai lieu")
                || q.contains("noi dung")
                || q.contains("file dang")
                || q.contains("ban dau")
                || q.contains("summary")
                || q.contains("summarize")
                || q.contains("file");
    }

    private String[] tokenize(String query) {
        return Arrays.stream(normalize(query).split("\\W+"))
                .filter(t -> t.length() >= 2)
                .filter(t -> !STOP_WORDS.contains(t))
                .toArray(String[]::new);
    }

    private String normalize(String text) {
        if (text == null) return "";
        String lower = text.toLowerCase(Locale.ROOT);
        String nfd = Normalizer.normalize(lower, Normalizer.Form.NFD);
        return DIACRITICS.matcher(nfd).replaceAll("");
    }

    private double score(String content, String[] tokens) {
        if (tokens.length == 0) return 0;
        String hay = normalize(content);
        double total = 0;
        for (String token : tokens) {
            if (hay.contains(token)) total += 1;
        }
        return total;
    }
}
