-- name: CreateResume :one
INSERT INTO resumes (label, file_url, created_at, user_id)
VALUES ($1, $2, NOW(), $3)
RETURNING *;

-- name: GetAllResumes :many
SELECT * FROM resumes WHERE user_id = $1 ORDER BY id;

-- name: GetResumeById :one
SELECT * FROM resumes WHERE id = $1;

-- name: UpdateResume :one
UPDATE resumes
SET 
	label = $1,
	file_url = $2,
	updated_at = NOW()
WHERE id = $3
RETURNING *;

-- name: DeleteResume :execresult
DELETE FROM resumes WHERE id = $1;
