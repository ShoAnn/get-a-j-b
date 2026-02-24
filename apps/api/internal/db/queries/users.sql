-- name: CreateUser :one
INSERT INTO users (username, email, created_at)
VALUES ($1, $2, NOW())
RETURNING *;

-- name: GetUserById :one
SELECT * FROM users WHERE id = $1 AND deleted = FALSE LIMIT 1;

-- name: UpdateUser :one
UPDATE users
SET
	username = $2,
	email = $3,
	updated_at = NOW()
WHERE id = $1 AND deleted = FALSE
RETURNING *;

-- name: SoftDeleteUser :execresult
UPDATE users
SET deleted = TRUE
WHERE id = $1 AND deleted = FALSE;
