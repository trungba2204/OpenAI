package com.ai.platform.plugin.entity;

import com.ai.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "plugin_installations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PluginInstallation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "editor_type", nullable = false, length = 32)
    private PluginEditorType editorType;

    @Column(length = 64)
    private String version;

    @CreationTimestamp
    @Column(name = "installed_at", nullable = false, updatable = false)
    private LocalDateTime installedAt;
}
