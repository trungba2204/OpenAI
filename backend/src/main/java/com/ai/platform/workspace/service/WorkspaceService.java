package com.ai.platform.workspace.service;

import com.ai.platform.common.exception.ApiException;
import com.ai.platform.project.repository.ProjectRepository;
import com.ai.platform.user.entity.User;
import com.ai.platform.workspace.dto.WorkspaceDto;
import com.ai.platform.workspace.dto.WorkspaceRequest;
import com.ai.platform.workspace.entity.Workspace;
import com.ai.platform.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<WorkspaceDto> list(User user) {
        return workspaceRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(w -> toDto(w))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkspaceDto get(User user, Long id) {
        return toDto(getOwned(user, id));
    }

    @Transactional
    public WorkspaceDto create(User user, WorkspaceRequest request) {
        Workspace workspace = Workspace.builder()
                .user(user)
                .name(request.getName().trim())
                .build();
        return toDto(workspaceRepository.save(workspace));
    }

    @Transactional
    public WorkspaceDto update(User user, Long id, WorkspaceRequest request) {
        Workspace workspace = getOwned(user, id);
        workspace.setName(request.getName().trim());
        return toDto(workspaceRepository.save(workspace));
    }

    @Transactional
    public WorkspaceDto clone(User user, Long id) {
        Workspace source = getOwned(user, id);
        Workspace clone = Workspace.builder()
                .user(user)
                .name(source.getName() + " (Copy)")
                .build();
        return toDto(workspaceRepository.save(clone));
    }

    @Transactional
    public void delete(User user, Long id) {
        Workspace workspace = getOwned(user, id);
        workspaceRepository.delete(workspace);
    }

    private Workspace getOwned(User user, Long id) {
        return workspaceRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException("Workspace not found", HttpStatus.NOT_FOUND));
    }

    private WorkspaceDto toDto(Workspace workspace) {
        int count = projectRepository.findByWorkspaceIdOrderByUpdatedAtDesc(workspace.getId()).size();
        return WorkspaceDto.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .projectCount(count)
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }
}
