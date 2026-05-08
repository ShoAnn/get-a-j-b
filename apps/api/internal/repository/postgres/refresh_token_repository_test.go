package repository

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestPostgresRefreshTokenRepository(t *testing.T) {
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

		userRepo := NewUserRepository(tx)
		tokenRepo := NewRefreshTokenRepository(tx)

		user, err := userRepo.Create(ctx, &domain.CreateUserRequest{
			Username: "tokenuser",
			Email:    "token@example.com",
			Password: "password",
		})
		if err != nil {
			t.Fatalf("failed to create user: %v", err)
		}

		expiresAt := time.Now().Add(24 * time.Hour).Round(time.Second)
		token := &domain.RefreshToken{
			UserID:    user.ID,
			Token:     "test_refresh_token",
			ExpiresAt: expiresAt,
		}

		createdToken, err := tokenRepo.Create(ctx, token)
		if err != nil {
			t.Fatalf("failed to create token: %v", err)
		}

		if createdToken.Token != token.Token {
			t.Errorf("expected token %s, got %s", token.Token, createdToken.Token)
		}

		foundToken, err := tokenRepo.GetByToken(ctx, token.Token)
		if err != nil {
			t.Fatalf("failed to get token: %v", err)
		}
		if foundToken.UserID != user.ID {
			t.Errorf("expected user ID %d, got %d", user.ID, foundToken.UserID)
		}
	})

	t.Run("Revoke", func(t *testing.T) {
		tx, err := pool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		userRepo := NewUserRepository(tx)
		tokenRepo := NewRefreshTokenRepository(tx)

		user, _ := userRepo.Create(ctx, &domain.CreateUserRequest{
			Username: "revokeuser",
			Email:    "revoke@example.com",
			Password: "password",
		})

		tokenStr := "revoke_me"
		_, _ = tokenRepo.Create(ctx, &domain.RefreshToken{
			UserID:    user.ID,
			Token:     tokenStr,
			ExpiresAt: time.Now().Add(time.Hour),
		})

		err = tokenRepo.Revoke(ctx, tokenStr)
		if err != nil {
			t.Fatalf("failed to revoke token: %v", err)
		}

		foundToken, err := tokenRepo.GetByToken(ctx, tokenStr)
		if err != nil {
			t.Fatalf("failed to get token: %v", err)
		}
		if foundToken.RevokedAt == nil {
			t.Error("expected token to be revoked")
		}
	})

	t.Run("RevokeAllForUser", func(t *testing.T) {
		tx, err := pool.Begin(ctx)
		if err != nil {
			t.Fatalf("failed to begin transaction: %v", err)
		}
		defer tx.Rollback(ctx)

		userRepo := NewUserRepository(tx)
		tokenRepo := NewRefreshTokenRepository(tx)

		user, _ := userRepo.Create(ctx, &domain.CreateUserRequest{
			Username: "revokeall",
			Email:    "revokeall@example.com",
			Password: "password",
		})

		_, _ = tokenRepo.Create(ctx, &domain.RefreshToken{
			UserID:    user.ID,
			Token:     "token1",
			ExpiresAt: time.Now().Add(time.Hour),
		})
		_, _ = tokenRepo.Create(ctx, &domain.RefreshToken{
			UserID:    user.ID,
			Token:     "token2",
			ExpiresAt: time.Now().Add(time.Hour),
		})

		err = tokenRepo.RevokeAllForUser(ctx, user.ID)
		if err != nil {
			t.Fatalf("failed to revoke all tokens: %v", err)
		}

		t1, _ := tokenRepo.GetByToken(ctx, "token1")
		if t1.RevokedAt == nil {
			t.Error("expected token1 to be revoked")
		}
		t2, _ := tokenRepo.GetByToken(ctx, "token2")
		if t2.RevokedAt == nil {
			t.Error("expected token2 to be revoked")
		}
	})
}
