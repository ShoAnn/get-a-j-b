package domain

import (
	"context"

	"github.com/golang-jwt/jwt/v5"
)

type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token,omitempty"`
	ExpiresIn    string `json:"expires_in"`
}

type Claims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

type AuthService interface {
	Register(ctx context.Context, req *CreateUserRequest) (*AuthResponse, error)
	Login(ctx context.Context, email, password string) (*AuthResponse, error)
	Logout(ctx context.Context, refreshTokenStr string) error
	ValidateToken(tokenStr string) (*Claims, error)
	GenerateJWT(user *User) (string, error)
	RefreshToken(ctx context.Context, refreshTokenStr string) (*AuthResponse, error)
}

type contextKey string

const (
	ContextKeyClaims contextKey = "claims"
)
