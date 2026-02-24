package domain

import "context"

type Job struct {
	ID            int    `json:"id"`
	UserID        int    `json:"user_id"`
	Title         string `json:"title"`
	Company       string `json:"company"`
	Location      string `json:"location"`
	Salary        int    `json:"salary"`
	Description   string `json:"description"`
	Requirements  string `json:"requirements"`
	CurrentStatus string `json:"current_status"`
	Notes         string `json:"notes"`
	SourceURL     string `json:"source_url"`
	AppliedAt     string `json:"applied_at"`
}

type CreateJobRequest struct {
	Title        string  `json:"title" validate:"required"`
	Company      string  `json:"company" validate:"required"`
	Location     string  `json:"location" validate:"required"`
	Salary       int     `json:"salary" validate:"required"`
	Description  *string `json:"description"`
	Requirements string  `json:"requirements" validate:"required"`
	SourceURL    *string `json:"source_url"`
}

type UpdateJobRequest struct {
	Title         *string `json:"title"`
	Company       *string `json:"company"`
	Location      *string `json:"location"`
	Salary        *int    `json:"salary"`
	Description   *string `json:"description"`
	Requirements  *string `json:"requirements"`
	SourceURL     *string `json:"source_url"`
	CurrentStatus *string `json:"current_status"`
	Notes         *string `json:"notes"`
}

type JobRepository interface {
	Create(ctx context.Context, job *Job) (*Job, error)
	ListAll(ctx context.Context) ([]*Job, error)
	GetByID(ctx context.Context, id int) (*Job, error)
	Update(ctx context.Context, job *Job) (*Job, error)
	Delete(ctx context.Context, id int) error
}

type JobService interface {
	CreateJob(ctx context.Context, req *CreateJobRequest) (*Job, error)
	ListAllJobs(ctx context.Context) ([]*Job, error)
	GetJobByID(ctx context.Context, id int) (*Job, error)
	UpdateJob(ctx context.Context, id int, req *UpdateJobRequest) (*Job, error)
	DeleteJob(ctx context.Context, id int) error
}
