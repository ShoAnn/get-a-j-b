package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
)

func TestAuthService_Register(t *testing.T) {
	userRepo := &mockUserRepository{users: make(map[int]*domain.User)}
	tokenRepo := &mockRefreshTokenRepository{tokens: make(map[string]*domain.RefreshToken)}
	s, _ := NewAuthService(userRepo, tokenRepo, "secret")

	req := &domain.CreateUserRequest{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}

	resp, err := s.Register(context.Background(), req)
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if resp.AccessToken == "" {
		t.Error("expected token, got empty string")
	}
}

func TestAuthService_Login(t *testing.T) {
	hashedPassword, _ := hashPassword("password123")
	userRepo := &mockUserRepository{
		users: map[int]*domain.User{
			1: {ID: 1, Username: "testuser", Email: "test@example.com", Password: hashedPassword},
		},
	}
	tokenRepo := &mockRefreshTokenRepository{tokens: make(map[string]*domain.RefreshToken)}
	s, _ := NewAuthService(userRepo, tokenRepo, "secret")

	t.Run("Success", func(t *testing.T) {
		resp, err := s.Login(context.Background(), "test@example.com", "password123")
		if err != nil {
			t.Errorf("expected no error, got %v", err)
		}
		if resp.AccessToken == "" {
			t.Error("expected access token")
		}
		if resp.RefreshToken == "" {
			t.Error("expected refresh token")
		}
	})

	t.Run("InvalidCredentials", func(t *testing.T) {
		_, err := s.Login(context.Background(), "test@example.com", "wrongpassword")
		if !errors.Is(err, domain.ErrInvalidCredentials) {
			t.Errorf("expected ErrInvalidCredentials, got %v", err)
		}
	})
}

func TestAuthService_RefreshToken(t *testing.T) {
	userRepo := &mockUserRepository{
		users: map[int]*domain.User{
			1: {ID: 1, Username: "testuser", Email: "test@example.com", Role: "user"},
		},
	}
	tokenRepo := &mockRefreshTokenRepository{
		tokens: map[string]*domain.RefreshToken{
			"valid_token":   {UserID: 1, Token: "valid_token", ExpiresAt: time.Now().Add(time.Hour)},
			"expired_token": {UserID: 1, Token: "expired_token", ExpiresAt: time.Now().Add(-time.Hour)},
		},
	}
	s, _ := NewAuthService(userRepo, tokenRepo, "secret")

	t.Run("Success", func(t *testing.T) {
		resp, err := s.RefreshToken(context.Background(), "valid_token")
		if err != nil {
			t.Errorf("expected no error, got %v", err)
		}
		if resp.AccessToken == "" {
			t.Error("expected new access token")
		}
		if resp.RefreshToken == "" {
			t.Error("expected new refresh token")
		}

		// Check if old token was revoked
		oldToken, _ := tokenRepo.GetByToken(context.Background(), "valid_token")
		if oldToken.RevokedAt == nil {
			t.Error("expected old token to be revoked")
		}
	})

	t.Run("Expired", func(t *testing.T) {
		_, err := s.RefreshToken(context.Background(), "expired_token")
		if !errors.Is(err, domain.ErrRefreshTokenExpired) {
			t.Errorf("expected ErrRefreshTokenExpired, got %v", err)
		}
	})

	t.Run("NotFound", func(t *testing.T) {
		_, err := s.RefreshToken(context.Background(), "non_existent")
		if !errors.Is(err, domain.ErrRefreshTokenNotFound) {
			t.Errorf("expected ErrRefreshTokenNotFound, got %v", err)
		}
	})
}

func TestAuthService_ValidateToken(t *testing.T) {
	userRepo := &mockUserRepository{}
	tokenRepo := &mockRefreshTokenRepository{tokens: make(map[string]*domain.RefreshToken)}
	s, _ := NewAuthService(userRepo, tokenRepo, "secret")

	user := &domain.User{ID: 1, Username: "testuser", Email: "test@example.com", Role: "user"}
	token, _ := s.GenerateJWT(user)

	t.Run("Valid", func(t *testing.T) {
		claims, err := s.ValidateToken(token)
		if err != nil {
			t.Errorf("expected no error, got %v", err)
		}
		if claims.UserID != 1 {
			t.Errorf("expected user ID 1, got %d", claims.UserID)
		}
	})

	t.Run("Invalid", func(t *testing.T) {
		_, err := s.ValidateToken("invalid_token")
		if !errors.Is(err, domain.ErrUnauthorized) {
			t.Errorf("expected ErrUnauthorized, got %v", err)
		}
	})
}
