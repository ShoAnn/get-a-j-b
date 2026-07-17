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
	tokenRepo    domain.RefreshTokenRepository
	jwtSecretKey []byte
}

func NewAuthService(userRepo domain.UserRepository, tokenRepo domain.RefreshTokenRepository, secret string) (*AuthService, error) {
	if secret == "" {
		return nil, errors.New("jwt secret key is required")
	}
	return &AuthService{
		userRepo:     userRepo,
		tokenRepo:    tokenRepo,
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

	token, err := s.GenerateJWT(user)
	if err != nil {
		return nil, err
	}

	refreshToken, err := GenerateRefreshToken(32)
	if err != nil {
		return nil, err
	}

	_, err = s.tokenRepo.Create(ctx, &domain.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	})

	return &domain.AuthResponse{
		AccessToken:  token,
		RefreshToken: refreshToken,
		ExpiresIn:    "900",
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

	accessToken, err := s.GenerateJWT(user)
	if err != nil {
		return nil, err
	}

	refreshToken, err := GenerateRefreshToken(32)
	if err != nil {
		return nil, err
	}

	_, err = s.tokenRepo.Create(ctx, &domain.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	})

	return &domain.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    "900",
	}, nil
}

func (s *AuthService) Logout(ctx context.Context, refreshTokenStr string) error {
	return s.tokenRepo.Revoke(ctx, refreshTokenStr)
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshTokenStr string) (*domain.AuthResponse, error) {
	refreshToken, err := s.tokenRepo.GetByToken(ctx, refreshTokenStr)
	if err != nil {
		return nil, domain.ErrRefreshTokenNotFound
	}
	if refreshToken.RevokedAt != nil {
		return nil, domain.ErrRefreshTokenRevoked
	}
	if time.Now().After(refreshToken.ExpiresAt) {
		return nil, domain.ErrRefreshTokenExpired
	}

	user, err := s.userRepo.GetByID(ctx, refreshToken.UserID)
	if err != nil {
		return nil, domain.ErrRefreshTokenInvalid
	}

	accessToken, err := s.GenerateJWT(user)
	if err != nil {
		return nil, err
	}

	newRefreshToken, err := GenerateRefreshToken(32)
	if err != nil {
		return nil, err
	}

	// Token Rotation
	err = s.tokenRepo.Revoke(ctx, refreshTokenStr)
	if err != nil {
		return nil, err
	}

	_, err = s.tokenRepo.Create(ctx, &domain.RefreshToken{
		UserID:    user.ID,
		Token:     newRefreshToken,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	})
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    "900",
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

func (s *AuthService) GenerateJWT(user *domain.User) (string, error) {
	claims := domain.Claims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    domain.AppName,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecretKey)
}
