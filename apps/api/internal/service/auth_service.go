package service

import (
	"context"
	"errors"
	"time"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/golang-jwt/jwt/v5"
)

type AuthService struct {
	userRepo     domain.UserRepository
	jwtSecretKey []byte
}

func NewAuthService(userRepo domain.UserRepository, secret string) (*AuthService, error) {
	if secret == "" {
		return nil, errors.New("jwt secret key is required")
	}
	return &AuthService{
		userRepo:     userRepo,
		jwtSecretKey: []byte(secret),
	}, nil
}

func (s *AuthService) Register(ctx context.Context, req *domain.CreateUserRequest) (*domain.AuthResponse, error) {
	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user, err := s.userRepo.Create(ctx, &domain.CreateUserRequest{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
	})
	if err != nil {
		return nil, err
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*domain.AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	if !checkPasswordHash(password, user.Password) {
		return nil, domain.ErrInvalidCredentials
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
	}, nil
}
func (s *AuthService) ValidateToken(tokenStr string) (*domain.Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &domain.Claims{}, func(token *jwt.Token) (interface{}, error) {
		tokenMethod, ok := token.Method.(*jwt.SigningMethodHMAC)
		if !ok || tokenMethod != jwt.SigningMethodHS256 {
			return nil, domain.ErrUnauthorized
		}
		return s.jwtSecretKey, nil
	})
	if err != nil || !token.Valid {
		return nil, domain.ErrUnauthorized
	}

	claims, ok := token.Claims.(*domain.Claims)
	if !ok {
		return nil, domain.ErrUnauthorized
	}

	return claims, nil
}

func (s *AuthService) GenerateToken(user *domain.User) (string, error) {
	claims := domain.Claims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    domain.AppName,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecretKey)
}
