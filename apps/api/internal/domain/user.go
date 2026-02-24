package domain

import "context"

type User struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	CreatedAt string `json:"created_at"`
}

type CreateUserRequest struct {
	Username string `json:"username" validate:"required,min=5"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type UpdateUserRequest struct {
	Username *string `json:"username" validate:"omitempty,min=5"`
	Email    *string `json:"email" validate:"omitempty,email"`
	Password *string `json:"password" validate:"omitempty,min=6"`
}

type UserRepository interface {
	Create(ctx context.Context, user *User) (*User, error)
	GetByID(ctx context.Context, id int) (*User, error)
	Update(ctx context.Context, user *User) (*User, error)
	Delete(ctx context.Context, id int) error
}

type UserService interface {
	Register(ctx context.Context, req *CreateUserRequest) (*User, error)
	GetByID(ctx context.Context, id int) (*User, error)
	UpdateUser(ctx context.Context, id int, req *UpdateUserRequest) (*User, error)
	DeleteUser(ctx context.Context, id int) error
}
