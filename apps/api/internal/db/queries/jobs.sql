-- name: CreateJob :one
INSERT INTO jobs (title, source_url, salary, description, requirements, current_status, notes, application_date, created_at, user_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
RETURNING *;

-- name: GetAllJobs :many
SELECT * FROM jobs WHERE user_id = $1 ORDER BY id;

-- name: GetJobById :one
SELECT * FROM jobs WHERE id = $1;

-- name: UpdateJob :one
UPDATE jobs
SET 
	title = $1,
	source_url = $2,
	salary = $3,
	description = $4,
	requirements = $5,
	current_status = $6,
	notes = $7,
	application_date = $8,
	updated_at = NOW()
WHERE id = $9
RETURNING *;

-- name: DeleteJob :execresult
DELETE FROM jobs WHERE id = $1;
