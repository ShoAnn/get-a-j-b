package domain

import (
	"context"

	"github.com/golang-jwt/jwt/v5"
)

type AuthResponse struct {
	Token string `json:"token"`
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
	ValidateToken(tokenStr string) (*Claims, error)
	GenerateToken(user *User) (string, error)
}
