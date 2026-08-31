package service

import (
	"context"
	"errors"
	"testing"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
)

func TestUserService_GetUserByID(t *testing.T) {
	repo := &mockUserRepository{
		users: map[int]*domain.User{
			1: {ID: 1, Username: "testuser", Email: "test@example.com"},
		},
	}
	s := NewUserService(repo)

	t.Run("Success", func(t *testing.T) {
		user, err := s.GetUserByID(context.Background(), 1)
		if err != nil {
			t.Errorf("expected no error, got %v", err)
		}
		if user.ID != 1 {
			t.Errorf("expected user ID 1, got %d", user.ID)
		}
	})

	t.Run("NotFound", func(t *testing.T) {
		_, err := s.GetUserByID(context.Background(), 2)
		if !errors.Is(err, domain.ErrUserNotFound) {
			t.Errorf("expected ErrUserNotFound, got %v", err)
		}
	})
}

func TestUserService_GetAllUsers(t *testing.T) {
	repo := &mockUserRepository{
		users: map[int]*domain.User{
			1: {ID: 1, Username: "user1"},
			2: {ID: 2, Username: "user2"},
		},
	}
	s := NewUserService(repo)

	users, err := s.GetAllUsers(context.Background())
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if len(users) != 2 {
		t.Errorf("expected 2 users, got %d", len(users))
	}
}

func TestUserService_UpdateUser(t *testing.T) {
	repo := &mockUserRepository{
		users: map[int]*domain.User{
			1: {ID: 1, Username: "olduser", Email: "old@example.com"},
		},
	}
	s := NewUserService(repo)

	t.Run("Unauthorized", func(t *testing.T) {
		ctx := context.WithValue(context.Background(), domain.ContextKeyClaims, &domain.Claims{UserID: 2})
		newUsername := "newuser"
		_, err := s.UpdateUser(ctx, 1, &domain.UpdateUserRequest{Username: &newUsername})
		if !errors.Is(err, domain.ErrUnauthorized) {
			t.Errorf("expected ErrUnauthorized, got %v", err)
		}
	})

	t.Run("Success", func(t *testing.T) {
		ctx := context.WithValue(context.Background(), domain.ContextKeyClaims, &domain.Claims{UserID: 1})
		newUsername := "newuser"
		user, err := s.UpdateUser(ctx, 1, &domain.UpdateUserRequest{Username: &newUsername})
		if err != nil {
			t.Errorf("expected no error, got %v", err)
		}
		if user.Username != "newuser" {
			t.Errorf("expected username newuser, got %s", user.Username)
		}
	})

	t.Run("EmailAlreadyExists", func(t *testing.T) {
		repo.users[2] = &domain.User{ID: 2, Email: "existing@example.com"}
		ctx := context.WithValue(context.Background(), domain.ContextKeyClaims, &domain.Claims{UserID: 1})
		newEmail := "existing@example.com"
		_, err := s.UpdateUser(ctx, 1, &domain.UpdateUserRequest{Email: &newEmail})
		if !errors.Is(err, domain.ErrEmailAlreadyExists) {
			t.Errorf("expected ErrEmailAlreadyExists, got %v", err)
		}
	})
}

func TestUserService_DeleteUser(t *testing.T) {
	repo := &mockUserRepository{
		users: map[int]*domain.User{
			1: {ID: 1, Username: "testuser"},
		},
	}
	s := NewUserService(repo)

	t.Run("Success", func(t *testing.T) {
		err := s.DeleteUser(context.Background(), 1)
		if err != nil {
			t.Errorf("expected no error, got %v", err)
		}
		if len(repo.users) != 0 {
			t.Errorf("expected 0 users, got %d", len(repo.users))
		}
	})

	t.Run("NotFound", func(t *testing.T) {
		err := s.DeleteUser(context.Background(), 2)
		if !errors.Is(err, domain.ErrUserNotFound) {
			t.Errorf("expected ErrUserNotFound, got %v", err)
		}
	})
}
