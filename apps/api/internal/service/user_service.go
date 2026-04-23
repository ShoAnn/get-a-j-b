package service

import (
	"context"
	"os"
	"time"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecretKey = []byte(os.Getenv("JWT_SECRET"))

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

	hashedPassword, err := hashPassword(user.Password)
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

func (s *UserService) Login(ctx context.Context, email string, password string) (string, *domain.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return "", nil, domain.ErrInvalidCredentials
	}

	if !checkPasswordHash(password, user.Password) {
		return "", nil, domain.ErrInvalidCredentials
	}

	token, err := generateToken(user)
	if err != nil {
		return "", nil, err
	}

	return token, user, nil
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
func generateToken(user *domain.User) (string, error) {
	claims := domain.Claims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     "user",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "get-a-j-b",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecretKey))
}

func hashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hashedBytes), err
}

func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
