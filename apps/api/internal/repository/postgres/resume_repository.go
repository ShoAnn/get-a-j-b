package repository

import (
	"context"

	db "github.com/ShoAnn/get-a-j-b/api/internal/db/sqlc"
	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/jackc/pgx/v5/pgtype"
)

type ResumeRepository struct {
	db db.DBTX
	q  *db.Queries
}

func NewResumeRepository(conn db.DBTX) *ResumeRepository {
	return &ResumeRepository{
		db: conn,
		q:  db.New(conn),
	}
}

func (r *ResumeRepository) Create(ctx context.Context, resume *domain.Resume) (*domain.Resume, error) {
	dbResume, err := r.q.CreateResume(ctx, db.CreateResumeParams{
		Label:   resume.Label,
		FileUrl: resume.FileUrl,
		UserID:  pgtype.Int4{Int32: int32(resume.UserID), Valid: true},
	})
	if err != nil {
		return nil, err
	}

	return toDomainResume(dbResume), nil
}

func (r *ResumeRepository) GetAll(ctx context.Context, userId int) ([]*domain.Resume, error) {
	dbResumes, err := r.q.GetAllResumes(ctx, pgtype.Int4{Int32: int32(userId), Valid: true})
	if err != nil {
		return nil, err
	}

	resumes := make([]*domain.Resume, len(dbResumes))
	for i, dbResume := range dbResumes {
		resumes[i] = toDomainResume(dbResume)
	}

	return resumes, nil
}

func (r *ResumeRepository) GetByID(ctx context.Context, id int) (*domain.Resume, error) {
	dbResume, err := r.q.GetResumeById(ctx, int32(id))
	if err != nil {
		return nil, err
	}

	return toDomainResume(dbResume), nil
}

func (r *ResumeRepository) Update(ctx context.Context, resume *domain.Resume) (*domain.Resume, error) {
	dbResume, err := r.q.UpdateResume(ctx, db.UpdateResumeParams{
		ID:      int32(resume.ID),
		Label:   resume.Label,
		FileUrl: resume.FileUrl,
	})
	if err != nil {
		return nil, err
	}

	return toDomainResume(dbResume), nil
}

func (r *ResumeRepository) Delete(ctx context.Context, id int) error {
	_, err := r.q.DeleteResume(ctx, int32(id))
	return err
}

func toDomainResume(dbJob db.Resume) *domain.Resume {
	return &domain.Resume{
		ID:      int(dbJob.ID),
		Label:   dbJob.Label,
		FileUrl: dbJob.FileUrl,
		UserID:  int(dbJob.UserID.Int32),
	}
}
