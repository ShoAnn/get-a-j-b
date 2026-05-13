-- name: CreateJob :one
INSERT INTO jobs (
    user_id,
    title, 
    company, 
    location, 
    salary, 
    description, 
    requirements, 
    application_status,
    notes, 
    source_url, 
    created_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
RETURNING *;

-- name: GetAllJobs :many
SELECT * FROM jobs WHERE user_id = $1 ORDER BY id;

-- name: GetJobById :one
SELECT * FROM jobs WHERE id = $1;

-- name: UpdateJob :one
UPDATE jobs
SET 
    title = $1,
    company = $2,
    location = $3,
    salary = $4,
    description = $5,
    requirements = $6,
    application_status = $7,
	status_changed_at = CASE 
		WHEN application_status != $7 THEN NOW() 
		ELSE status_changed_at 
	END,
    notes = $8,
    source_url = $9,
    updated_at = NOW()
WHERE id = $10
RETURNING *;

-- name: DeleteJob :execresult
DELETE FROM jobs WHERE id = $1;
