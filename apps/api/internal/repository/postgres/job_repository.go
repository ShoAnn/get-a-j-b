package repository

import (
	"context"
	"math/big"

	db "github.com/ShoAnn/get-a-j-b/api/internal/db/sqlc"
	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/jackc/pgx/v5/pgtype"
)

type postgresJobRepository struct {
	db db.DBTX
	q  *db.Queries
}

func NewJobRepository(conn db.DBTX) domain.JobRepository {
	return &postgresJobRepository{
		db: conn,
		q:  db.New(conn),
	}
}

func (r *postgresJobRepository) Create(ctx context.Context, job *domain.Job) (*domain.Job, error) {
	salary := pgtype.Numeric{}
	salary.Int = big.NewInt(int64(job.Salary))
	salary.Exp = 0
	salary.Valid = true

	dbJob, err := r.q.CreateJob(ctx, db.CreateJobParams{
		UserID:            pgtype.Int4{Int32: int32(job.UserID), Valid: true},
		Title:             job.Title,
		Company:           job.Company,
		Location:          job.Location,
		Salary:            salary,
		Description:       pgtype.Text{String: job.Description, Valid: job.Description != ""},
		Requirements:      job.Requirements,
		ApplicationStatus: job.ApplicationStatus,
		Notes:             pgtype.Text{String: job.Notes, Valid: job.Notes != ""},
		SourceUrl:         job.SourceURL,
		JobPortal:         pgtype.Text{String: job.JobPortal, Valid: job.JobPortal != ""},
	})
	if err != nil {
		return nil, err
	}

	return toDomainJob(dbJob), nil
}

func (r *postgresJobRepository) ListAll(ctx context.Context, userId int) ([]*domain.Job, error) {
	dbJobs, err := r.q.GetAllJobs(ctx, pgtype.Int4{Int32: int32(userId), Valid: true})
	if err != nil {
		return nil, err
	}

	jobs := make([]*domain.Job, len(dbJobs))
	for i, dbJob := range dbJobs {
		jobs[i] = toDomainJob(dbJob)
	}

	return jobs, nil
}

func (r *postgresJobRepository) GetByID(ctx context.Context, id int) (*domain.Job, error) {
	dbJob, err := r.q.GetJobById(ctx, int32(id))
	if err != nil {
		return nil, err
	}

	return toDomainJob(dbJob), nil
}

func (r *postgresJobRepository) Update(ctx context.Context, job *domain.Job) (*domain.Job, error) {
	salary := pgtype.Numeric{}
	salary.Int = big.NewInt(int64(job.Salary))
	salary.Exp = 0
	salary.Valid = true

	dbJob, err := r.q.UpdateJob(ctx, db.UpdateJobParams{
		ID:                int32(job.ID),
		Title:             job.Title,
		Company:           job.Company,
		Location:          job.Location,
		Salary:            salary,
		Description:       pgtype.Text{String: job.Description, Valid: job.Description != ""},
		Requirements:      job.Requirements,
		ApplicationStatus: job.ApplicationStatus,
		Notes:             pgtype.Text{String: job.Notes, Valid: job.Notes != ""},
		SourceUrl:         job.SourceURL,
		JobPortal:         pgtype.Text{String: job.JobPortal, Valid: job.JobPortal != ""},
	})
	if err != nil {
		return nil, err
	}

	return toDomainJob(dbJob), nil
}

func (r *postgresJobRepository) Delete(ctx context.Context, id int) error {
	_, err := r.q.DeleteJob(ctx, int32(id))
	return err
}

func toDomainJob(dbJob db.Job) *domain.Job {
	var salaryInt int64
	if dbJob.Salary.Valid && dbJob.Salary.Int != nil {
		// pgtype.Numeric stores value as Int * 10^Exp.
		// For DECIMAL(15,2) the DB returns Exp=-2 with Int = salary*100.
		// Convert back to int salary (whole units) by dividing if Exp < 0.
		val := new(big.Int).Set(dbJob.Salary.Int)
		exp := dbJob.Salary.Exp
		if exp < 0 {
			divisor := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(-exp)), nil)
			val.Div(val, divisor)
		} else if exp > 0 {
			multiplier := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(exp)), nil)
			val.Mul(val, multiplier)
		}
		salaryInt = val.Int64()
	}

	var statusChangedAt string
	if dbJob.StatusChangedAt.Valid {
		statusChangedAt = dbJob.StatusChangedAt.Time.Format("2006-01-02 15:04:05")
	}

	return &domain.Job{
		ID:                int(dbJob.ID),
		UserID:            int(dbJob.UserID.Int32),
		Title:             dbJob.Title,
		Company:           dbJob.Company,
		Location:          dbJob.Location,
		Salary:            int(salaryInt),
		Description:       dbJob.Description.String,
		Requirements:      dbJob.Requirements,
		ApplicationStatus: dbJob.ApplicationStatus,
		StatusChangedAt:   statusChangedAt,
		Notes:             dbJob.Notes.String,
		SourceURL:         dbJob.SourceUrl,
		JobPortal:         dbJob.JobPortal.String,
		CreatedAt:         dbJob.CreatedAt.Time.Format("2006-01-02 15:04:05"),
	}
}
