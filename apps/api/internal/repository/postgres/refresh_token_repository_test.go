package repository

import (
	"context"
	"log"
	"os"
	"testing"
	"time"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
)

var testPool *pgxpool.Pool

func setupSchema(connStr string) {
	// Points to your actual migration files on disk
	m, err := migrate.New("file://../../db/migrations", connStr)
	if err != nil {
		log.Fatal(err)
	}

	// Runs all "up" migrations to build the whole DB
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatal(err)
	}
}
func TestMain(m *testing.M) {
	ctx := context.Background()
	dbName := "todolist"
	dbUsername := "user"
	dbPassword := "password"

	// 1. Spin up the Postgres container
	postgresContainer, err := postgres.Run(ctx,
		"postgres:16-alpine",
		postgres.WithDatabase(dbName),
		postgres.WithUsername(dbUsername),
		postgres.WithPassword(dbPassword),
		postgres.BasicWaitStrategies(),
	)
	if err != nil {
		log.Fatalf("Failed to start container: %s", err)
	}

	// 2. Get the connection string from the container
	connStr, _ := postgresContainer.ConnectionString(ctx, "sslmode=disable")

	// 3. Initialize pgxpool
	testPool, err = pgxpool.New(ctx, connStr)
	if err != nil {
		log.Fatal(err)
	}

	// 4. Setup Schema (Migrations)
	setupSchema(connStr)

	// 5. Run Tests and Cleanup
	code := m.Run()
	testPool.Close()
	postgresContainer.Terminate(ctx)
	os.Exit(code)
}
func TestPostgresRefreshTokenRepository(t *testing.T) {
	ctx := context.Background()

	t.Run("CreateAndGet", func(t *testing.T) {
		tx, err := testPool.Begin(ctx)
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
		tx, err := testPool.Begin(ctx)
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
		tx, err := testPool.Begin(ctx)
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
