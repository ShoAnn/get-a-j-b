package repository

import (
	"context"
	"os"
	"testing"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestPostgresUserRepository(t *testing.T) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("Skipping integration test: DATABASE_URL not set")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		t.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	t.Run("CreateAndGet", func(t *testing.T) {
		tx, err := pool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		repo := NewUserRepository(tx)
		req := &domain.CreateUserRequest{
			Username: "testuser_int",
			Email:    "test_int@example.com",
			Password: "hashedpassword",
		}

		user, err := repo.Create(ctx, req)
		if err != nil {
			t.Fatalf("failed to create user: %v", err)
		}

		if user.Username != req.Username {
			t.Errorf("expected username %s, got %s", req.Username, user.Username)
		}

		foundUser, err := repo.GetByID(ctx, user.ID)
		if err != nil {
			t.Fatalf("failed to get user by ID: %v", err)
		}
		if foundUser.Email != req.Email {
			t.Errorf("expected email %s, got %s", req.Email, foundUser.Email)
		}
	})

	t.Run("GetByEmail", func(t *testing.T) {
		tx, err := pool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		repo := NewUserRepository(tx)
		email := "test_email@example.com"
		_, err = repo.Create(ctx, &domain.CreateUserRequest{
			Username: "testuser_email",
			Email:    email,
			Password: "password",
		})
		if err != nil {
			t.Fatalf("failed to create user: %v", err)
		}

		user, err := repo.GetByEmail(ctx, email)
		if err != nil {
			t.Fatalf("failed to get user by email: %v", err)
		}
		if user.Email != email {
			t.Errorf("expected email %s, got %s", email, user.Email)
		}
	})

	t.Run("ExistUserByEmail", func(t *testing.T) {
		tx, err := pool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		repo := NewUserRepository(tx)
		email := "exist@example.com"
		
		exists, _ := repo.ExistUserByEmail(ctx, email)
		if exists {
			t.Error("expected user not to exist")
		}

		_, err = repo.Create(ctx, &domain.CreateUserRequest{
			Username: "existuser",
			Email:    email,
			Password: "password",
		})
		if err != nil {
			t.Fatalf("failed to create user: %v", err)
		}

		exists, err = repo.ExistUserByEmail(ctx, email)
		if err != nil {
			t.Fatalf("failed to check existence: %v", err)
		}
		if !exists {
			t.Error("expected user to exist")
		}
	})

	t.Run("Update", func(t *testing.T) {
		tx, err := pool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		repo := NewUserRepository(tx)
		user, _ := repo.Create(ctx, &domain.CreateUserRequest{
			Username: "oldname",
			Email:    "old@example.com",
			Password: "password",
		})

		newName := "newname"
		newEmail := "new@example.com"
		updatedUser, err := repo.Update(ctx, user.ID, &domain.UpdateUserRequest{
			Username: &newName,
			Email:    &newEmail,
		})
		if err != nil {
			t.Fatalf("failed to update user: %v", err)
		}

		if updatedUser.Username != newName {
			t.Errorf("expected username %s, got %s", newName, updatedUser.Username)
		}
		if updatedUser.Email != newEmail {
			t.Errorf("expected email %s, got %s", newEmail, updatedUser.Email)
		}
	})

	t.Run("Delete", func(t *testing.T) {
		tx, err := pool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		repo := NewUserRepository(tx)
		user, _ := repo.Create(ctx, &domain.CreateUserRequest{
			Username: "delete_me",
			Email:    "delete@example.com",
			Password: "password",
		})

		err = repo.Delete(ctx, user.ID)
		if err != nil {
			t.Fatalf("failed to delete user: %v", err)
		}

		_, err = repo.GetByID(ctx, user.ID)
		if err == nil {
			t.Error("expected error when getting deleted user")
		}
	})
}
