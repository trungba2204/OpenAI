package com.ai.platform.knowledge.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "knowledge_embeddings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chunk_id", nullable = false)
    private KnowledgeChunk chunk;

    @Column(name = "vector_id", length = 255)
    private String vectorId;
}
