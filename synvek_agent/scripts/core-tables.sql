CREATE TABLE "folder"
(
    "folder_id"    INTEGER NOT NULL UNIQUE,
    "folder_name"  TEXT    NOT NULL,
    "parent_id"    INTEGER,
    "updated_date" INTEGER,
    "created_date" INTEGER,
    PRIMARY KEY ("folder_id" AUTOINCREMENT)
);

CREATE INDEX folder_idx_1 on folder (parent_id, folder_id);
CREATE INDEX folder_idx_2 on folder (folder_name);

CREATE TABLE "conversion"
(
    "conversion_id"   INTEGER NOT NULL UNIQUE,
    "conversion_name" TEXT,
    "folder_id"       INTEGER,
    "updated_date"    INTEGER,
    "created_date"    INTEGER,
    PRIMARY KEY ("conversion_id" AUTOINCREMENT)
);

CREATE INDEX conversion_idx_1 on conversion (folder_id, conversion_id);
CREATE INDEX conversion_idx_2 on conversion (folder_id, conversion_name);

CREATE TABLE "chat"
(
    "chat_id"             INTEGER NOT NULL UNIQUE,
    "chat_name"           TEXT,
    "chat_content"        TEXT,
    "conversion_id"       INTEGER,
    "chat_type"           TEXT,
    "chat_key"            TEXT,
    "from_user"           INTEGER,
    "chat_time"           INTEGER,
    "model_name"          TEXT,
    "thinking_start_time" INTEGER,
    "thinking_end_time"   INTEGER,
    "finish_reason"       TEXT,
    "system_fingerprint"  TEXT,
    "input_tokens"        INTEGER,
    "output_tokens"       INTEGER,
    "tool_calls"          TEXT,
    "tool_call_chunks"    TEXT,
    "invalid_tool_calls"  TEXT,
    "source_type"         TEXT,
    "success"             INTEGER,
    "total_tokens"        INTEGER,
    "updated_date"        INTEGER,
    "created_date"        INTEGER,
    PRIMARY KEY ("chat_id" AUTOINCREMENT)
);

CREATE INDEX chat_idx_1 on chat (conversion_id, chat_id);
CREATE INDEX chat_idx_2 on chat (conversion_id, chat_time);
CREATE UNIQUE INDEX chat_idx_3 on chat (chat_key);

CREATE TABLE "attachment"
(
    "attachment_id"      INTEGER NOT NULL UNIQUE,
    "attachment_name"    TEXT    NOT NULL,
    "chat_id"            INTEGER NOT NULL,
    "attachment_content" TEXT,
    "attachment_type"    TEXT,
    "updated_date"       INTEGER,
    "created_date"       INTEGER,
    PRIMARY KEY ("attachment_id" AUTOINCREMENT)
);

CREATE INDEX attachment_idx_1 on attachment (chat_id, attachment_id);

CREATE TABLE "generation"
(
    "generation_id"      INTEGER NOT NULL UNIQUE,
    "generation_type"    TEXT,
    "generation_prompt"  TEXT,
    "generation_context" TEXT,
    "generation_key"     TEXT,
    "generation_content" TEXT,
    "generation_summary" TEXT,
    "generation_time"    INTEGER,
    "model_name"         TEXT,
    "finish_reason"      TEXT,
    "system_fingerprint" TEXT,
    "input_tokens"       INTEGER,
    "output_tokens"      INTEGER,
    "total_tokens"       INTEGER,
    "updated_date"       INTEGER,
    "created_date"       INTEGER,
    PRIMARY KEY ("generation_id" AUTOINCREMENT)
);

CREATE INDEX generation_idx_1 on generation (generation_type, generation_key, generation_id);
