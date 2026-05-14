package service

import (
	"context"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/ShoAnn/get-a-j-b/api/internal/middleware"
)

type resumeService struct {
	repo domain.ResumeRepository
}

func NewResumeService(repo domain.ResumeRepository) domain.ResumeService {
	return &resumeService{repo: repo}
}

func (s *resumeService) CreateResume(ctx context.Context, userID int, req *domain.CreateResumeRequest) (*domain.Resume, error) {
	resume := &domain.Resume{
		UserID:  userID,
		Label:   req.Label,
		FileUrl: req.FileUrl,
	}

	return s.repo.Create(ctx, resume)
}

func (s *resumeService) GetAllResumes(ctx context.Context, userID int) ([]*domain.Resume, error) {
	claims, err := middleware.GetClaimsFromContext(ctx)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}
	if claims.UserID != userID {
		return nil, domain.ErrForbidden
	}

	return s.repo.GetAll(ctx, userID)
}

func (s *resumeService) GetByID(ctx context.Context, resumeID int, userID int) (*domain.Resume, error) {
	resume, err := s.repo.GetByID(ctx, resumeID)
	if err != nil {
		return nil, domain.ErrResumeNotFound
	}
	if resume.UserID != userID {
		return nil, domain.ErrForbidden
	}

	return resume, nil
}

func (s *resumeService) UpdateResume(ctx context.Context, resumeID int, userID int, req *domain.UpdateResumeRequest) (*domain.Resume, error) {
	resume, err := s.repo.GetByID(ctx, resumeID)
	if err != nil {
		return nil, domain.ErrResumeNotFound
	}
	claims, err := middleware.GetClaimsFromContext(ctx)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}
	if claims.UserID != resume.UserID {
		return nil, domain.ErrForbidden
	}

	if req.Label != nil {
		resume.Label = *req.Label
	}
	if req.FileUrl != nil {
		resume.FileUrl = *req.FileUrl
	}

	return s.repo.Update(ctx, resume)
}

func (s *resumeService) DeleteResume(ctx context.Context, resumeID int, userID int) error {
	resume, err := s.repo.GetByID(ctx, resumeID)
	if err != nil {
		return domain.ErrResumeNotFound
	}
	claims, err := middleware.GetClaimsFromContext(ctx)
	if err != nil {
		return domain.ErrUnauthorized
	}
	if claims.UserID != resume.UserID {
		return domain.ErrForbidden
	}

	return s.repo.Delete(ctx, resumeID)
}
