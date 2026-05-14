package service

import (
	"context"
	"testing"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/stretchr/testify/assert"
)

func TestJobService_CreateJob(t *testing.T) {
	repo := &mockJobRepository{}
	svc := NewJobService(repo)

	ctx := context.Background()
	userID := 1
	req := &domain.CreateJobRequest{
		Title:        "Software Engineer",
		Company:      "Google",
		Location:     "Mountain View",
		Salary:       200000,
		Requirements: "Go, Kubernetes",
	}

	job, err := svc.CreateJob(ctx, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, job)
	assert.Equal(t, userID, job.UserID)
	assert.Equal(t, req.Title, job.Title)
	assert.Equal(t, "draft", job.ApplicationStatus)
}

func TestJobService_ListAllJobs(t *testing.T) {
	repo := &mockJobRepository{
		jobs: map[int]*domain.Job{
			1: {ID: 1, UserID: 1, Title: "Job 1"},
			2: {ID: 2, UserID: 1, Title: "Job 2"},
			3: {ID: 3, UserID: 2, Title: "Job 3"},
		},
	}
	svc := NewJobService(repo)

	ctx := context.Background()
	jobs, err := svc.ListAllJobs(ctx, 1)

	assert.NoError(t, err)
	assert.Len(t, jobs, 2)
}

func TestJobService_GetJobByID(t *testing.T) {
	repo := &mockJobRepository{
		jobs: map[int]*domain.Job{
			1: {ID: 1, UserID: 1, Title: "Job 1"},
		},
	}
	svc := NewJobService(repo)

	t.Run("Success", func(t *testing.T) {
		job, err := svc.GetJobByID(context.Background(), 1, 1)
		assert.NoError(t, err)
		assert.Equal(t, 1, job.ID)
	})

	t.Run("NotFound", func(t *testing.T) {
		job, err := svc.GetJobByID(context.Background(), 99, 1)
		assert.Error(t, err)
		assert.Equal(t, domain.ErrJobNotFound, err)
		assert.Nil(t, job)
	})

	t.Run("Forbidden", func(t *testing.T) {
		job, err := svc.GetJobByID(context.Background(), 1, 2)
		assert.Error(t, err)
		assert.Equal(t, domain.ErrForbidden, err)
		assert.Nil(t, job)
	})
}

func TestJobService_UpdateJob(t *testing.T) {
	repo := &mockJobRepository{
		jobs: map[int]*domain.Job{
			1: {ID: 1, UserID: 1, Title: "Old Title"},
		},
	}
	svc := NewJobService(repo)

	t.Run("Success", func(t *testing.T) {
		newTitle := "New Title"
		req := &domain.UpdateJobRequest{Title: &newTitle}
		job, err := svc.UpdateJob(context.Background(), 1, 1, req)
		assert.NoError(t, err)
		assert.Equal(t, newTitle, job.Title)
	})

	t.Run("Unauthorized", func(t *testing.T) {
		req := &domain.UpdateJobRequest{}
		job, err := svc.UpdateJob(context.Background(), 1, 2, req)
		assert.Error(t, err)
		assert.Equal(t, domain.ErrUnauthorized, err)
		assert.Nil(t, job)
	})
}

func TestJobService_DeleteJob(t *testing.T) {
	repo := &mockJobRepository{
		jobs: map[int]*domain.Job{
			1: {ID: 1, UserID: 1, Title: "Job 1"},
		},
	}
	svc := NewJobService(repo)

	t.Run("Success", func(t *testing.T) {
		err := svc.DeleteJob(context.Background(), 1, 1)
		assert.NoError(t, err)
		assert.NotContains(t, repo.jobs, 1)
	})

	t.Run("Unauthorized", func(t *testing.T) {
		repo.jobs[1] = &domain.Job{ID: 1, UserID: 1, Title: "Job 1"}
		err := svc.DeleteJob(context.Background(), 1, 2)
		assert.Error(t, err)
		assert.Equal(t, domain.ErrUnauthorized, err)
	})
}
