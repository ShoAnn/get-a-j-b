package domain

import "context"

type Resume struct {
	ID      int    `json:"id"`
	Label   string `json:"label"`
	UserID  int    `json:"user_id"`
	FileUrl string `json:"file_url"`
}

type CreateResumeRequest struct {
	Label   string `json:"label" validate:"required"`
	FileUrl string `json:"content" validate:"required"`
}

type UpdateResumeRequest struct {
	Label   *string `json:"label"`
	FileUrl *string `json:"file_url"`
}

type ResumeRepository interface {
	Create(ctx context.Context, resume *Resume) (*Resume, error)
	GetByID(ctx context.Context, id int) (*Resume, error)
	Update(ctx context.Context, resume *Resume) (*Resume, error)
	Delete(ctx context.Context, id int) error
}

type ResumeService interface {
	CreateResume(ctx context.Context, req *CreateResumeRequest) (*Resume, error)
	GetByID(ctx context.Context, id int) (*Resume, error)
	UpdateResume(ctx context.Context, id int, req *UpdateResumeRequest) (*Resume, error)
	DeleteResume(ctx context.Context, id int) error
}
