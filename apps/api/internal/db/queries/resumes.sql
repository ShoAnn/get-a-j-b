-- name: CreateResume :one
INSERT INTO ats_resumes (label, content, created_at, user_id)
VALUES ($1, $2, NOW(), $3)
RETURNING *;

-- name: GetAllResumes :many
SELECT * FROM ats_resumes WHERE user_id = $1 ORDER BY id;

-- name: GetResumeById :one
SELECT * FROM ats_resumes WHERE id = $1;

-- name: UpdateResume :one
UPDATE ats_resumes
SET 
	label = $1,
	content = $2,
	updated_at = NOW()
WHERE id = $3
RETURNING *;

-- name: DeleteResume :execresult
DELETE FROM ats_resumes WHERE id = $1;
