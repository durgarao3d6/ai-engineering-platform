ALTER TABLE users ADD COLUMN github_user_id bigint UNIQUE CHECK (github_user_id > 0);
