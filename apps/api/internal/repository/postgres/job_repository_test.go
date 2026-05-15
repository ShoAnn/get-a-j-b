package repository

import (
	"context"
	"testing"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
)

func TestPostgresJobRepository(t *testing.T) {
	ctx := context.Background()

	t.Run("CreateAndGet", func(t *testing.T) {
		tx, err := testPool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		userRepo := NewUserRepository(tx)
		jobRepo := NewJobRepository(tx)

		user, _ := userRepo.Create(ctx, &domain.CreateUserRequest{
			Username: "jobuser",
			Email:    "job@example.com",
			Password: "password",
		})

		job := &domain.Job{
			UserID:            user.ID,
			Title:             "Software Engineer",
			Company:           "Tech Corp",
			Location:          "Remote",
			Salary:            100000,
			Description:       "Exciting role",
			Requirements:      "Go, Postgres",
			ApplicationStatus: "Applied",
			SourceURL:         "https://example.com/job",
		}

		createdJob, err := jobRepo.Create(ctx, job)
		if err != nil {
			t.Fatalf("failed to create job: %v", err)
		}

		if createdJob.Title != job.Title {
			t.Errorf("expected title %s, got %s", job.Title, createdJob.Title)
		}

		foundJob, err := jobRepo.GetByID(ctx, createdJob.ID)
		if err != nil {
			t.Fatalf("failed to get job by ID: %v", err)
		}
		if foundJob.Company != job.Company {
			t.Errorf("expected company %s, got %s", job.Company, foundJob.Company)
		}
	})

	t.Run("ListAll", func(t *testing.T) {
		tx, err := testPool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		userRepo := NewUserRepository(tx)
		jobRepo := NewJobRepository(tx)

		user, _ := userRepo.Create(ctx, &domain.CreateUserRequest{
			Username: "listuser",
			Email:    "list@example.com",
			Password: "password",
		})

		_, _ = jobRepo.Create(ctx, &domain.Job{
			UserID:  user.ID,
			Title:   "Job 1",
			Company: "Co 1",
		})
		_, _ = jobRepo.Create(ctx, &domain.Job{
			UserID:  user.ID,
			Title:   "Job 2",
			Company: "Co 2",
		})

		jobs, err := jobRepo.ListAll(ctx, user.ID)
		if err != nil {
			t.Fatalf("failed to list jobs: %v", err)
		}

		if len(jobs) != 2 {
			t.Errorf("expected 2 jobs, got %d", len(jobs))
		}
	})

	t.Run("Update", func(t *testing.T) {
		tx, err := testPool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		userRepo := NewUserRepository(tx)
		jobRepo := NewJobRepository(tx)

		user, _ := userRepo.Create(ctx, &domain.CreateUserRequest{
			Username: "updateuser",
			Email:    "update@example.com",
			Password: "password",
		})

		job, _ := jobRepo.Create(ctx, &domain.Job{
			UserID:  user.ID,
			Title:   "Old Title",
			Company: "Old Co",
		})

		job.Title = "New Title"
		job.Company = "New Co"

		updatedJob, err := jobRepo.Update(ctx, job)
		if err != nil {
			t.Fatalf("failed to update job: %v", err)
		}

		if updatedJob.Title != "New Title" {
			t.Errorf("expected new title, got %s", updatedJob.Title)
		}
		if updatedJob.Company != "New Co" {
			t.Errorf("expected new company, got %s", updatedJob.Company)
		}
	})

	t.Run("Delete", func(t *testing.T) {
		tx, err := testPool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		userRepo := NewUserRepository(tx)
		jobRepo := NewJobRepository(tx)

		user, _ := userRepo.Create(ctx, &domain.CreateUserRequest{
			Username: "deleteuser",
			Email:    "deletejob@example.com",
			Password: "password",
		})

		job, _ := jobRepo.Create(ctx, &domain.Job{
			UserID:  user.ID,
			Title:   "Delete Me",
			Company: "Gone",
		})

		err = jobRepo.Delete(ctx, job.ID)
		if err != nil {
			t.Fatalf("failed to delete job: %v", err)
		}

		_, err = jobRepo.GetByID(ctx, job.ID)
		if err == nil {
			t.Error("expected error when getting deleted job")
		}
	})
}
