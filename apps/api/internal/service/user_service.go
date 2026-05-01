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

func (s *UserService) GetAllUsers(ctx context.Context) ([]*domain.User, error) {
	users, err := s.repo.GetAll(ctx)
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (s *UserService) GetUserByID(ctx context.Context, id int) (*domain.User, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, domain.ErrUserNotFound
	}
	return user, nil
}

func (s *UserService) UpdateUser(ctx context.Context, id int, user *domain.UpdateUserRequest) (*domain.User, error) {
	existingUser, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, domain.ErrUserNotFound
	}

	callerId := ctx.Value("user_id").(int)
	if callerId != existingUser.ID {
		return nil, domain.ErrUnauthorized
	}

	if user.Username != nil {
		existingUser.Username = *user.Username
	}
	if user.Email != nil {
		exist, err := s.repo.ExistUserByEmail(ctx, *user.Email)
		if err != nil {
			return nil, err
		}
		if exist {
			return nil, domain.ErrEmailAlreadyExists
		}
	}
	updatedUser, err := s.repo.Update(ctx, existingUser.ID, user)
	if err != nil {
		return nil, err
	}
	return updatedUser, nil
}

func (s *UserService) DeleteUser(ctx context.Context, id int) error {
	existingUser, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return domain.ErrUserNotFound
	}
	return s.repo.Delete(ctx, existingUser.ID)
}
