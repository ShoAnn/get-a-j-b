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
			Content: "# Resume\nMarkdown content here",
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
		if foundResume.Content != resume.Content {
			t.Errorf("expected content %s, got %s", resume.Content, foundResume.Content)
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
			Content: "# Resume 1\nContent 1",
		})
		_, _ = resumeRepo.Create(ctx, &domain.Resume{
			UserID:  user.ID,
			Label:   "Resume 2",
			Content: "# Resume 2\nContent 2",
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
			Content: "old markdown",
		})

		resume.Label = "New Label"
		resume.Content = "new markdown"

		updatedResume, err := resumeRepo.Update(ctx, resume)
		if err != nil {
			t.Fatalf("failed to update resume: %v", err)
		}

		if updatedResume.Label != "New Label" {
			t.Errorf("expected new label, got %s", updatedResume.Label)
		}
		if updatedResume.Content != "new markdown" {
			t.Errorf("expected new content, got %s", updatedResume.Content)
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
			Content: "# Delete Me\nGone content",
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
