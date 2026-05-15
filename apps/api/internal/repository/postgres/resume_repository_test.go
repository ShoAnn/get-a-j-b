package repository

import (
	"context"
	"testing"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
)

func TestPostgresResumeRepository(t *testing.T) {
	ctx := context.Background()

	t.Run("CreateAndGet", func(t *testing.T) {
		tx, err := testPool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		userRepo := NewUserRepository(tx)
		resumeRepo := NewResumeRepository(tx)

		user, _ := userRepo.Create(ctx, &domain.CreateUserRequest{
			Username: "resumeuser",
			Email:    "resume@example.com",
			Password: "password",
		})

		resume := &domain.Resume{
			UserID:  user.ID,
			Label:   "Software Engineer Resume",
			FileUrl: "https://example.com/resume.pdf",
		}

		createdResume, err := resumeRepo.Create(ctx, resume)
		if err != nil {
			t.Fatalf("failed to create resume: %v", err)
		}

		if createdResume.Label != resume.Label {
			t.Errorf("expected label %s, got %s", resume.Label, createdResume.Label)
		}

		foundResume, err := resumeRepo.GetByID(ctx, createdResume.ID)
		if err != nil {
			t.Fatalf("failed to get resume by ID: %v", err)
		}
		if foundResume.FileUrl != resume.FileUrl {
			t.Errorf("expected file url %s, got %s", resume.FileUrl, foundResume.FileUrl)
		}
	})

	t.Run("GetAll", func(t *testing.T) {
		tx, err := testPool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		userRepo := NewUserRepository(tx)
		resumeRepo := NewResumeRepository(tx)

		user, _ := userRepo.Create(ctx, &domain.CreateUserRequest{
			Username: "getalluser",
			Email:    "getall@example.com",
			Password: "password",
		})

		_, _ = resumeRepo.Create(ctx, &domain.Resume{
			UserID:  user.ID,
			Label:   "Resume 1",
			FileUrl: "url1",
		})
		_, _ = resumeRepo.Create(ctx, &domain.Resume{
			UserID:  user.ID,
			Label:   "Resume 2",
			FileUrl: "url2",
		})

		resumes, err := resumeRepo.GetAll(ctx, user.ID)
		if err != nil {
			t.Fatalf("failed to get all resumes: %v", err)
		}

		if len(resumes) != 2 {
			t.Errorf("expected 2 resumes, got %d", len(resumes))
		}
	})

	t.Run("Update", func(t *testing.T) {
		tx, err := testPool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		userRepo := NewUserRepository(tx)
		resumeRepo := NewResumeRepository(tx)

		user, _ := userRepo.Create(ctx, &domain.CreateUserRequest{
			Username: "updateresumeuser",
			Email:    "updateresume@example.com",
			Password: "password",
		})

		resume, _ := resumeRepo.Create(ctx, &domain.Resume{
			UserID:  user.ID,
			Label:   "Old Label",
			FileUrl: "old_url",
		})

		resume.Label = "New Label"
		resume.FileUrl = "new_url"

		updatedResume, err := resumeRepo.Update(ctx, resume)
		if err != nil {
			t.Fatalf("failed to update resume: %v", err)
		}

		if updatedResume.Label != "New Label" {
			t.Errorf("expected new label, got %s", updatedResume.Label)
		}
		if updatedResume.FileUrl != "new_url" {
			t.Errorf("expected new file url, got %s", updatedResume.FileUrl)
		}
	})

	t.Run("Delete", func(t *testing.T) {
		tx, err := testPool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		userRepo := NewUserRepository(tx)
		resumeRepo := NewResumeRepository(tx)

		user, _ := userRepo.Create(ctx, &domain.CreateUserRequest{
			Username: "deleteresumeuser",
			Email:    "deleteresume@example.com",
			Password: "password",
		})

		resume, _ := resumeRepo.Create(ctx, &domain.Resume{
			UserID:  user.ID,
			Label:   "Delete Me",
			FileUrl: "gone_url",
		})

		err = resumeRepo.Delete(ctx, resume.ID)
		if err != nil {
			t.Fatalf("failed to delete resume: %v", err)
		}

		_, err = resumeRepo.GetByID(ctx, resume.ID)
		if err == nil {
			t.Error("expected error when getting deleted resume")
		}
	})
}
