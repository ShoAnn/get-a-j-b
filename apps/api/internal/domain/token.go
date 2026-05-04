package domain

import (
	"context"
	"time"
)

type RefreshToken struct {
	UserID    int        `json:"user_id"`
	Token     string     `json:"token"`
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt time.Time  `json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
}

type RefreshTokenRepository interface {
	Create(ctx context.Context, token *RefreshToken) (*RefreshToken, error)
	GetByToken(ctx context.Context, token string) (*RefreshToken, error)
	Revoke(ctx context.Context, token string) error
	RevokeAllForUser(ctx context.Context, userID int) error
	DeleteExpired(ctx context.Context) error
}
