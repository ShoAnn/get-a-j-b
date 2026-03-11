CREATE TABLE refresh_tokens (
	id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id     INT REFERENCES users(id) ON DELETE CASCADE,
	token       VARCHAR(255) UNIQUE NOT NULL,
	created_at  TIMESTAMP DEFAULT now(),
	expires_at  TIMESTAMP NOT NULL,
	revoked_at  TIMESTAMP
);
