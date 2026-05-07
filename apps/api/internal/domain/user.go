package domain

import (
	"context"
)

type User struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Password  string `json:"-"`
	Role      string `json:"role"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type CreateUserRequest struct {
	Username string `json:"username" validate:"required,min=5"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"-" validate:"required,min=6"`
}

type UpdateUserRequest struct {
	Username *string `json:"username" validate:"omitempty,min=5"`
	Email    *string `json:"email" validate:"omitempty,email"`
}

type UserRepository interface {
	Create(ctx context.Context, user *CreateUserRequest) (*User, error)
	GetAll(ctx context.Context) ([]*User, error)
	GetByID(ctx context.Context, id int) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	ExistUserByEmail(ctx context.Context, email string) (bool, error)
	Update(ctx context.Context, id int, user *UpdateUserRequest) (*User, error)
	Delete(ctx context.Context, id int) error
}

type UserService interface {
	Register(ctx context.Context, user *User) (*User, error)
	GetAllUsers(ctx context.Context) ([]*User, error)
	GetUserByID(ctx context.Context, id int) (*User, error)
	UpdateUser(ctx context.Context, id int, user *User) (*User, error)
	DeleteUser(ctx context.Context, id int) error
}
