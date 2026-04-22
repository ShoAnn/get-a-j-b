package service

import (
	"context"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo domain.UserRepository
}

func NewUserService(repo domain.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) Register(ctx context.Context, user *domain.CreateUserRequest) (*domain.User, error) {
	exist, err := s.repo.ExistByEmail(ctx, user.Email)
	if err != nil {
		return nil, err
	}
	if exist {
		return nil, domain.ErrEmailAlreadyExists
	}

	hashedPassword, err := HashPassword(user.Password)
	if err != nil {
		return nil, err
	}

	user.Password = hashedPassword
	newUser, err := s.repo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	return newUser, nil
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

	if user.Username != nil {
		existingUser.Username = *user.Username
	}
	if user.Email != nil && user.Email != &existingUser.Email {
		exist, err := s.repo.ExistByEmail(ctx, *user.Email)
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

// Helper functions
func HashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hashedBytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
