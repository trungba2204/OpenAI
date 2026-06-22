package com.ai.platform.knowledge.service;

import com.ai.platform.knowledge.config.KnowledgeProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChunkingService {

    private final KnowledgeProperties properties;

    public List<String> chunk(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        int size = properties.getChunkSize();
        int overlap = properties.getChunkOverlap();
        int step = Math.max(1, size - overlap);

        List<String> chunks = new ArrayList<>();
        for (int start = 0; start < text.length(); start += step) {
            int end = Math.min(text.length(), start + size);
            String piece = text.substring(start, end).trim();
            if (!piece.isBlank()) {
                chunks.add(piece);
            }
            if (end >= text.length()) break;
        }
        return chunks;
    }
}
