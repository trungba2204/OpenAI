package com.ai.platform.ai;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/models")
public class AiModelController {

    @GetMapping
    public ResponseEntity<List<Map<String, String>>> listModels() {
        List<Map<String, String>> models = Arrays.stream(AiModel.values())
                .map(m -> Map.of(
                        "id", m.name(),
                        "modelId", m.getModelId(),
                        "displayName", m.getDisplayName()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(models);
    }
}
