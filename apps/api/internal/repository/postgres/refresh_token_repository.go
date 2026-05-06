package repository

import (
	"context"
	"time"

	db "github.com/ShoAnn/get-a-j-b/api/internal/db/sqlc"
	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/jackc/pgx/v5/pgtype"
)

type postgresRefreshTokenRepository struct {
	db db.DBTX
	q  *db.Queries
}

func NewRefreshTokenRepository(conn db.DBTX) domain.RefreshTokenRepository {
	return &postgresRefreshTokenRepository{
		// db: conn,
		q: db.New(conn),
	}
}

func (r *postgresRefreshTokenRepository) Create(ctx context.Context, token *domain.RefreshToken) (*domain.RefreshToken, error) {

	dbToken, err := r.q.CreateRefreshToken(ctx, db.CreateRefreshTokenParams{
		UserID:    pgtype.Int4{Int32: int32(token.UserID), Valid: true},
		Token:     token.Token,
		ExpiresAt: pgtype.Timestamp{Time: token.ExpiresAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	return &domain.RefreshToken{
		UserID:    int(dbToken.UserID.Int32),
		Token:     dbToken.Token,
		CreatedAt: dbToken.CreatedAt.Time,
		ExpiresAt: dbToken.ExpiresAt.Time,
	}, nil
}

func (r *postgresRefreshTokenRepository) GetByToken(ctx context.Context, token string) (*domain.RefreshToken, error) {
	dbToken, err := r.q.GetRefreshTokenByToken(ctx, token)
	if err != nil {
		return nil, domain.ErrRefreshTokenNotFound
	}

	return &domain.RefreshToken{
		UserID:    int(dbToken.UserID.Int32),
		Token:     dbToken.Token,
		CreatedAt: dbToken.CreatedAt.Time,
		ExpiresAt: dbToken.ExpiresAt.Time,
		RevokedAt: func() *time.Time {
			if dbToken.RevokedAt.Valid {
				t := dbToken.RevokedAt.Time
				return &t
			}
			return nil
		}(),
	}, nil
}

func (r *postgresRefreshTokenRepository) Revoke(ctx context.Context, token string) error {
	return r.q.RevokeRefreshToken(ctx, token)
}

func (r *postgresRefreshTokenRepository) RevokeAllForUser(ctx context.Context, userID int) error {
	return r.q.RevokeAllRefreshTokensForUser(ctx, pgtype.Int4{Int32: int32(userID), Valid: true})
}

func (r *postgresRefreshTokenRepository) DeleteExpired(ctx context.Context) error {
	return r.q.DeleteExpiredRefreshTokens(ctx)
}
