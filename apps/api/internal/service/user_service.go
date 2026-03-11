package service

import (
	"context"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
)

type UserService struct {
	repo domain.UserRepository
}

func NewUserService(repo domain.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) Register(ctx context.Context, user *domain.User) (*domain.User, error) {
	newUser, err := s.repo.Create(ctx, user)
	if err != nil {
		return nil, err
	}
	return newUser, nil
}
