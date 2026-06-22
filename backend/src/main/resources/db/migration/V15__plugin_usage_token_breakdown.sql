ALTER TABLE plugin_usage
    ADD COLUMN input_tokens INT NOT NULL DEFAULT 0,
    ADD COLUMN output_tokens INT NOT NULL DEFAULT 0;
