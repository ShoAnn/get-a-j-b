package service

import (
	"context"
	"testing"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/stretchr/testify/assert"
)

func TestResumeService_CreateResume(t *testing.T) {
	repo := &mockResumeRepository{}
	svc := NewResumeService(repo)

	ctx := context.Background()
	userID := 1
	req := &domain.CreateResumeRequest{
		Label:   "My Resume",
		FileUrl: "http://example.com/resume.pdf",
	}

	resume, err := svc.CreateResume(ctx, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, resume)
	assert.Equal(t, userID, resume.UserID)
	assert.Equal(t, req.Label, resume.Label)
	assert.Equal(t, req.FileUrl, resume.FileUrl)
}

func TestResumeService_GetAllResumes(t *testing.T) {
	repo := &mockResumeRepository{
		resumes: map[int]*domain.Resume{
			1: {ID: 1, UserID: 1, Label: "R1"},
			2: {ID: 2, UserID: 1, Label: "R2"},
			3: {ID: 3, UserID: 2, Label: "R3"},
		},
	}
	svc := NewResumeService(repo)

	t.Run("Success", func(t *testing.T) {
		ctx := context.WithValue(context.Background(), domain.ContextKeyClaims, &domain.Claims{UserID: 1})
		resumes, err := svc.GetAllResumes(ctx, 1)
		assert.NoError(t, err)
		assert.Len(t, resumes, 2)
	})

	t.Run("Unauthorized", func(t *testing.T) {
		ctx := context.Background()
		resumes, err := svc.GetAllResumes(ctx, 1)
		assert.Error(t, err)
		assert.Equal(t, domain.ErrUnauthorized, err)
		assert.Nil(t, resumes)
	})

	t.Run("Forbidden", func(t *testing.T) {
		ctx := context.WithValue(context.Background(), domain.ContextKeyClaims, &domain.Claims{UserID: 2})
		resumes, err := svc.GetAllResumes(ctx, 1)
		assert.Error(t, err)
		assert.Equal(t, domain.ErrForbidden, err)
		assert.Nil(t, resumes)
	})
}

func TestResumeService_GetByID(t *testing.T) {
	repo := &mockResumeRepository{
		resumes: map[int]*domain.Resume{
			1: {ID: 1, UserID: 1, Label: "R1"},
		},
	}
	svc := NewResumeService(repo)

	t.Run("Success", func(t *testing.T) {
		resume, err := svc.GetByID(context.Background(), 1, 1)
		assert.NoError(t, err)
		assert.Equal(t, 1, resume.ID)
	})

	t.Run("NotFound", func(t *testing.T) {
		resume, err := svc.GetByID(context.Background(), 99, 1)
		assert.Error(t, err)
		assert.Equal(t, domain.ErrResumeNotFound, err)
		assert.Nil(t, resume)
	})

	t.Run("Forbidden", func(t *testing.T) {
		resume, err := svc.GetByID(context.Background(), 1, 2)
		assert.Error(t, err)
		assert.Equal(t, domain.ErrForbidden, err)
		assert.Nil(t, resume)
	})
}

func TestResumeService_UpdateResume(t *testing.T) {
	repo := &mockResumeRepository{
		resumes: map[int]*domain.Resume{
			1: {ID: 1, UserID: 1, Label: "Old Label", FileUrl: "old.url"},
		},
	}
	svc := NewResumeService(repo)

	t.Run("Success", func(t *testing.T) {
		ctx := context.WithValue(context.Background(), domain.ContextKeyClaims, &domain.Claims{UserID: 1})
		newLabel := "New Label"
		req := &domain.UpdateResumeRequest{Label: &newLabel}
		resume, err := svc.UpdateResume(ctx, 1, 1, req)
		assert.NoError(t, err)
		assert.Equal(t, newLabel, resume.Label)
	})

	t.Run("Unauthorized", func(t *testing.T) {
		ctx := context.Background()
		req := &domain.UpdateResumeRequest{}
		resume, err := svc.UpdateResume(ctx, 1, 1, req)
		assert.Error(t, err)
		assert.Equal(t, domain.ErrUnauthorized, err)
		assert.Nil(t, resume)
	})

	t.Run("Forbidden", func(t *testing.T) {
		ctx := context.WithValue(context.Background(), domain.ContextKeyClaims, &domain.Claims{UserID: 2})
		req := &domain.UpdateResumeRequest{}
		resume, err := svc.UpdateResume(ctx, 1, 1, req)
		assert.Error(t, err)
		assert.Equal(t, domain.ErrForbidden, err)
		assert.Nil(t, resume)
	})
}

func TestResumeService_DeleteResume(t *testing.T) {
	repo := &mockResumeRepository{
		resumes: map[int]*domain.Resume{
			1: {ID: 1, UserID: 1, Label: "R1"},
		},
	}
	svc := NewResumeService(repo)

	t.Run("Success", func(t *testing.T) {
		ctx := context.WithValue(context.Background(), domain.ContextKeyClaims, &domain.Claims{UserID: 1})
		err := svc.DeleteResume(ctx, 1, 1)
		assert.NoError(t, err)
		assert.NotContains(t, repo.resumes, 1)
	})

	t.Run("NotFound", func(t *testing.T) {
		ctx := context.WithValue(context.Background(), domain.ContextKeyClaims, &domain.Claims{UserID: 1})
		err := svc.DeleteResume(ctx, 99, 1)
		assert.Error(t, err)
		assert.Equal(t, domain.ErrResumeNotFound, err)
	})
}
