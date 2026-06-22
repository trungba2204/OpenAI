package com.ai.platform.plugin.dto;

import com.ai.platform.plugin.entity.PluginEditorType;
import lombok.Data;

import java.util.List;

@Data
public class PluginContextPayload {
    private PluginEditorType editorType = PluginEditorType.VSCODE;
    private String projectName;
    private String activeFile;
    private String language;
    private PluginSelectionDto selection;
    private List<String> openFiles;
    private String fileTree;
    private String activeFileContent;
    private String extensionVersion;
}
