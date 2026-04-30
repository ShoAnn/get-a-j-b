-- name: CreateUser :one
INSERT INTO users (username, email, password, role, created_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING *;

-- name: GetAllUsers :many
SELECT * FROM users WHERE deleted = FALSE;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 AND deleted = FALSE LIMIT 1;

-- name: GetUserById :one
SELECT * FROM users WHERE id = $1 AND deleted = FALSE LIMIT 1;

-- name: ExistsUserByEmail :one
SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND deleted = FALSE);

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
