-- Remove web IDE workspace schema (V11 + V12). Plugin tables are unchanged.

DROP TABLE IF EXISTS ide_agent_runs;
DROP TABLE IF EXISTS git_connections;
DROP TABLE IF EXISTS project_chunks;
DROP TABLE IF EXISTS project_indexes;
DROP TABLE IF EXISTS project_files;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS workspaces;
