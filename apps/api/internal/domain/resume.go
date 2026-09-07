package domain

import "context"

type Resume struct {
	ID      int    `json:"id"`
	Label   string `json:"label"`
	UserID  int    `json:"user_id"`
	Content string `json:"content"`
}

type CreateResumeRequest struct {
	Label   string `json:"label" validate:"required"`
	Content string `json:"content" validate:"required"`
}

type UpdateResumeRequest struct {
	Label   *string `json:"label"`
	Content *string `json:"content"`
}

type ResumeRepository interface {
	Create(ctx context.Context, resume *Resume) (*Resume, error)
	GetAll(ctx context.Context, userID int) ([]*Resume, error)
	GetByID(ctx context.Context, id int) (*Resume, error)
	Update(ctx context.Context, resume *Resume) (*Resume, error)
	Delete(ctx context.Context, id int) error
}

type ResumeService interface {
	CreateResume(ctx context.Context, userID int, req *CreateResumeRequest) (*Resume, error)
	GetAllResumes(ctx context.Context, userID int) ([]*Resume, error)
	GetByID(ctx context.Context, resumeID int, userID int) (*Resume, error)
	UpdateResume(ctx context.Context, resumeID int, userID int, req *UpdateResumeRequest) (*Resume, error)
	DeleteResume(ctx context.Context, resumeID int, userID int) error
}
