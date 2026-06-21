package com.ai.platform.ide.entity;

import com.ai.platform.project.entity.Project;
import com.ai.platform.project.entity.ProjectFile;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_indexes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id")
    private ProjectFile file;

    @Column(name = "file_path", nullable = false, length = 2048)
    private String filePath;

    @Column(name = "symbol_type", nullable = false, length = 50)
    private String symbolType;

    @Column(name = "symbol_name", nullable = false, length = 512)
    private String symbolName;

    @Column(name = "parent_symbol", length = 512)
    private String parentSymbol;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @Column(columnDefinition = "TEXT")
    private String signature;
}
