package service

import (
	"context"
	"errors"
	"time"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
)

type mockUserRepository struct {
	users             map[int]*domain.User
	emails            map[string]int
	existUserByEmailFn func(ctx context.Context, email string) (bool, error)
	getByIDFn          func(ctx context.Context, id int) (*domain.User, error)
	getAllFn           func(ctx context.Context) ([]*domain.User, error)
	updateFn           func(ctx context.Context, id int, user *domain.UpdateUserRequest) (*domain.User, error)
	deleteFn           func(ctx context.Context, id int) error
}

func (m *mockUserRepository) Create(ctx context.Context, user *domain.CreateUserRequest) (*domain.User, error) {
	if m.users == nil {
		m.users = make(map[int]*domain.User)
	}
	id := len(m.users) + 1
	u := &domain.User{
		ID:       id,
		Username: user.Username,
		Email:    user.Email,
		Password: user.Password,
		Role:     "user",
	}
	m.users[id] = u
	return u, nil
}

func (m *mockUserRepository) GetAll(ctx context.Context) ([]*domain.User, error) {
	if m.getAllFn != nil {
		return m.getAllFn(ctx)
	}
	var users []*domain.User
	for _, u := range m.users {
		users = append(users, u)
	}
	return users, nil
}

func (m *mockUserRepository) GetByID(ctx context.Context, id int) (*domain.User, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, id)
	}
	user, ok := m.users[id]
	if !ok {
		return nil, domain.ErrUserNotFound
	}
	return user, nil
}

func (m *mockUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	for _, u := range m.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *mockUserRepository) ExistUserByEmail(ctx context.Context, email string) (bool, error) {
	if m.existUserByEmailFn != nil {
		return m.existUserByEmailFn(ctx, email)
	}
	for _, u := range m.users {
		if u.Email == email {
			return true, nil
		}
	}
	if m.emails != nil {
		_, ok := m.emails[email]
		return ok, nil
	}
	return false, nil
}

func (m *mockUserRepository) Update(ctx context.Context, id int, user *domain.UpdateUserRequest) (*domain.User, error) {
	if m.updateFn != nil {
		return m.updateFn(ctx, id, user)
	}
	u, ok := m.users[id]
	if !ok {
		return nil, domain.ErrUserNotFound
	}
	if user.Username != nil {
		u.Username = *user.Username
	}
	if user.Email != nil {
		u.Email = *user.Email
	}
	return u, nil
}

func (m *mockUserRepository) Delete(ctx context.Context, id int) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	delete(m.users, id)
	return nil
}

type mockRefreshTokenRepository struct {
	tokens             map[string]*domain.RefreshToken
	createFn           func(ctx context.Context, token *domain.RefreshToken) (*domain.RefreshToken, error)
	getByTokenFn       func(ctx context.Context, token string) (*domain.RefreshToken, error)
	revokeFn           func(ctx context.Context, token string) error
	revokeAllForUserFn func(ctx context.Context, userID int) error
	deleteExpiredFn    func(ctx context.Context) error
}

func (m *mockRefreshTokenRepository) Create(ctx context.Context, token *domain.RefreshToken) (*domain.RefreshToken, error) {
	if m.createFn != nil {
		return m.createFn(ctx, token)
	}
	if m.tokens == nil {
		m.tokens = make(map[string]*domain.RefreshToken)
	}
	m.tokens[token.Token] = token
	return token, nil
}

func (m *mockRefreshTokenRepository) GetByToken(ctx context.Context, token string) (*domain.RefreshToken, error) {
	if m.getByTokenFn != nil {
		return m.getByTokenFn(ctx, token)
	}
	t, ok := m.tokens[token]
	if !ok {
		return nil, domain.ErrRefreshTokenNotFound
	}
	return t, nil
}

func (m *mockRefreshTokenRepository) Revoke(ctx context.Context, token string) error {
	if m.revokeFn != nil {
		return m.revokeFn(ctx, token)
	}
	if t, ok := m.tokens[token]; ok {
		now := time.Now()
		t.RevokedAt = &now
	}
	return nil
}

func (m *mockRefreshTokenRepository) RevokeAllForUser(ctx context.Context, userID int) error {
	return nil
}

func (m *mockRefreshTokenRepository) DeleteExpired(ctx context.Context) error {
	return nil
}

type mockResumeRepository struct {
	resumes  map[int]*domain.Resume
	createFn func(ctx context.Context, resume *domain.Resume) (*domain.Resume, error)
	getAllFn func(ctx context.Context, userID int) ([]*domain.Resume, error)
	getByIDFn func(ctx context.Context, id int) (*domain.Resume, error)
	updateFn func(ctx context.Context, resume *domain.Resume) (*domain.Resume, error)
	deleteFn func(ctx context.Context, id int) error
}

func (m *mockResumeRepository) Create(ctx context.Context, resume *domain.Resume) (*domain.Resume, error) {
	if m.createFn != nil {
		return m.createFn(ctx, resume)
	}
	if m.resumes == nil {
		m.resumes = make(map[int]*domain.Resume)
	}
	id := len(m.resumes) + 1
	resume.ID = id
	m.resumes[id] = resume
	return resume, nil
}

func (m *mockResumeRepository) GetAll(ctx context.Context, userID int) ([]*domain.Resume, error) {
	if m.getAllFn != nil {
		return m.getAllFn(ctx, userID)
	}
	var res []*domain.Resume
	for _, r := range m.resumes {
		if r.UserID == userID {
			res = append(res, r)
		}
	}
	return res, nil
}

func (m *mockResumeRepository) GetByID(ctx context.Context, id int) (*domain.Resume, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, id)
	}
	r, ok := m.resumes[id]
	if !ok {
		return nil, domain.ErrResumeNotFound
	}
	return r, nil
}

func (m *mockResumeRepository) Update(ctx context.Context, resume *domain.Resume) (*domain.Resume, error) {
	if m.updateFn != nil {
		return m.updateFn(ctx, resume)
	}
	m.resumes[resume.ID] = resume
	return resume, nil
}

func (m *mockResumeRepository) Delete(ctx context.Context, id int) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	delete(m.resumes, id)
	return nil
}

type mockJobRepository struct {
	jobs     map[int]*domain.Job
	createFn func(ctx context.Context, job *domain.Job) (*domain.Job, error)
	listAllFn func(ctx context.Context, userID int) ([]*domain.Job, error)
	getByIDFn func(ctx context.Context, id int) (*domain.Job, error)
	updateFn func(ctx context.Context, job *domain.Job) (*domain.Job, error)
	deleteFn func(ctx context.Context, id int) error
}

func (m *mockJobRepository) Create(ctx context.Context, job *domain.Job) (*domain.Job, error) {
	if m.createFn != nil {
		return m.createFn(ctx, job)
	}
	if m.jobs == nil {
		m.jobs = make(map[int]*domain.Job)
	}
	id := len(m.jobs) + 1
	job.ID = id
	m.jobs[id] = job
	return job, nil
}

func (m *mockJobRepository) ListAll(ctx context.Context, userID int) ([]*domain.Job, error) {
	if m.listAllFn != nil {
		return m.listAllFn(ctx, userID)
	}
	var res []*domain.Job
	for _, j := range m.jobs {
		if j.UserID == userID {
			res = append(res, j)
		}
	}
	return res, nil
}

func (m *mockJobRepository) GetByID(ctx context.Context, id int) (*domain.Job, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, id)
	}
	j, ok := m.jobs[id]
	if !ok {
		return nil, domain.ErrJobNotFound
	}
	return j, nil
}

func (m *mockJobRepository) Update(ctx context.Context, job *domain.Job) (*domain.Job, error) {
	if m.updateFn != nil {
		return m.updateFn(ctx, job)
	}
	m.jobs[job.ID] = job
	return job, nil
}

func (m *mockJobRepository) Delete(ctx context.Context, id int) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	delete(m.jobs, id)
	return nil
}
