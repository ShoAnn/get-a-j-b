package service

import (
	"context"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
)

type jobService struct {
	repo domain.JobRepository
}

func NewJobService(repo domain.JobRepository) domain.JobService {
	return &jobService{repo: repo}
}

func (s *jobService) CreateJob(ctx context.Context, req *domain.CreateJobRequest) (*domain.Job, error) {
	userID, ok := ctx.Value("user_id").(int)
	if !ok {
		return nil, domain.ErrUnauthorized
	}

	job := &domain.Job{
		UserID:            userID,
		Title:             req.Title,
		Company:           req.Company,
		Location:          req.Location,
		Salary:            req.Salary,
		Description:       "",
		Requirements:      req.Requirements,
		ApplicationStatus: "draft",
		SourceURL:         "",
	}

	if req.Description != nil {
		job.Description = *req.Description
	}
	if req.SourceURL != nil {
		job.SourceURL = *req.SourceURL
	}

	return s.repo.Create(ctx, job)
}

func (s *jobService) ListAllJobs(ctx context.Context) ([]*domain.Job, error) {
	return s.repo.ListAll(ctx)
}

func (s *jobService) GetJobByID(ctx context.Context, id int) (*domain.Job, error) {
	job, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, domain.ErrJobNotFound
	}
	
	// Check ownership
	userID, ok := ctx.Value("user_id").(int)
	if !ok || job.UserID != userID {
		return nil, domain.ErrUnauthorized
	}

	return job, nil
}

func (s *jobService) UpdateJob(ctx context.Context, id int, req *domain.UpdateJobRequest) (*domain.Job, error) {
	job, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, domain.ErrJobNotFound
	}

	// Check ownership
	userID, ok := ctx.Value("user_id").(int)
	if !ok || job.UserID != userID {
		return nil, domain.ErrUnauthorized
	}

	if req.Title != nil {
		job.Title = *req.Title
	}
	if req.Company != nil {
		job.Company = *req.Company
	}
	if req.Location != nil {
		job.Location = *req.Location
	}
	if req.Salary != nil {
		job.Salary = *req.Salary
	}
	if req.Description != nil {
		job.Description = *req.Description
	}
	if req.Requirements != nil {
		job.Requirements = *req.Requirements
	}
	if req.SourceURL != nil {
		job.SourceURL = *req.SourceURL
	}
	if req.ApplicationStatus != nil {
		job.ApplicationStatus = *req.ApplicationStatus
	}
	if req.Notes != nil {
		job.Notes = *req.Notes
	}

	return s.repo.Update(ctx, job)
}

func (s *jobService) DeleteJob(ctx context.Context, id int) error {
	job, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return domain.ErrJobNotFound
	}

	// Check ownership
	userID, ok := ctx.Value("user_id").(int)
	if !ok || job.UserID != userID {
		return domain.ErrUnauthorized
	}

	return s.repo.Delete(ctx, id)
}
