package repository

import (
	"context"

	db "github.com/ShoAnn/get-a-j-b/api/internal/db/sqlc"
	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type DBTX interface {
	Exec(ctx context.Context, query string, args ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, query string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, query string, args ...any) pgx.Row
}

type postgresUserRepository struct {
	db DBTX
	q  *db.Queries
}

func NewUserRepository(conn DBTX) domain.UserRepository {
	return &postgresUserRepository{
		db: conn,
		q:  db.New(conn),
	}
}

func (r *postgresUserRepository) Create(ctx context.Context, user *domain.CreateUserRequest) (*domain.User, error) {
	dbUser, err := r.q.CreateUser(ctx, db.CreateUserParams{
		Username: user.Username,
		Email:    user.Email,
		Password: user.Password,
		Role:     "user",
	})
	if err != nil {
		return nil, err
	}

	return &domain.User{
		ID:        int(dbUser.ID),
		Username:  dbUser.Username,
		Email:     dbUser.Email,
		Password:  dbUser.Password,
		Role:      dbUser.Role,
		CreatedAt: string(dbUser.CreatedAt.Time.Format("2006-01-02 15:04:05")),
	}, nil
}

func (r *postgresUserRepository) GetAll(ctx context.Context) ([]*domain.User, error) {
	dbUsers, err := r.q.GetAllUsers(ctx)
	if err != nil {
		return nil, err
	}

	users := make([]*domain.User, len(dbUsers))
	for i, dbUser := range dbUsers {
		users[i] = &domain.User{
			ID:        int(dbUser.ID),
			Username:  dbUser.Username,
			Email:     dbUser.Email,
			Password:  dbUser.Password,
			Role:      dbUser.Role,
			CreatedAt: string(dbUser.CreatedAt.Time.Format("2006-01-02 15:04:05")),
		}
	}

	return users, nil
}

func (r *postgresUserRepository) GetByID(ctx context.Context, id int) (*domain.User, error) {
	user, err := r.q.GetUserById(ctx, int32(id))
	if err != nil {
		return nil, err
	}

	return &domain.User{
		ID:        int(user.ID),
		Username:  user.Username,
		Email:     user.Email,
		Password:  user.Password,
		Role:      user.Role,
		CreatedAt: string(user.CreatedAt.Time.Format("2006-01-02 15:04:05")),
	}, nil
}

func (r *postgresUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	user, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	return &domain.User{
		ID:        int(user.ID),
		Username:  user.Username,
		Email:     user.Email,
		Password:  user.Password,
		Role:      user.Role,
		CreatedAt: string(user.CreatedAt.Time.Format("2006-01-02 15:04:05")),
	}, nil
}

func (r *postgresUserRepository) ExistUserByEmail(ctx context.Context, email string) (bool, error) {
	exists, err := r.q.ExistsUserByEmail(ctx, email)
	return exists, err
}

func (r *postgresUserRepository) Update(ctx context.Context, id int, user *domain.UpdateUserRequest) (*domain.User, error) {
	updatedUser, err := r.q.UpdateUser(ctx, db.UpdateUserParams{
		ID:       int32(id),
		Username: *user.Username,
		Email:    *user.Email,
	})
	if err != nil {
		return nil, err
	}

	return &domain.User{
		ID:        int(updatedUser.ID),
		Username:  updatedUser.Username,
		Email:     updatedUser.Email,
		Password:  updatedUser.Password,
		Role:      updatedUser.Role,
		CreatedAt: string(updatedUser.CreatedAt.Time.Format("2006-01-02 15:04:05")),
	}, nil
}

func (r *postgresUserRepository) Delete(ctx context.Context, id int) error {
	_, err := r.q.SoftDeleteUser(ctx, int32(id))
	return err
}
