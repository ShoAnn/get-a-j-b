package domain

import "github.com/golang-jwt/jwt/v5"

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
