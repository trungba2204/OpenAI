ALTER TABLE messages
    ADD COLUMN attachment_filename VARCHAR(500) NULL,
    ADD COLUMN attachment_mime_type VARCHAR(100) NULL,
    ADD COLUMN attachment_document_id BIGINT NULL;
