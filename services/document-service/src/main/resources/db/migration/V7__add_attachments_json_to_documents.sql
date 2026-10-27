-- Add attachments_json column to store multi-file bundle metadata (fileName, fileExtension, fileSizeBytes, ipfsCid, fileUrl)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS attachments_json TEXT;
