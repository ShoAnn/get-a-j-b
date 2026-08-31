package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/stretchr/testify/assert"
)

type mockJobService struct {
	createJobFn    func(ctx context.Context, userID int, req *domain.CreateJobRequest) (*domain.Job, error)
	listAllJobsFn  func(ctx context.Context, userID int) ([]*domain.Job, error)
	getJobByIDFn   func(ctx context.Context, jobID, userID int) (*domain.Job, error)
	updateJobFn    func(ctx context.Context, jobID, userID int, req *domain.UpdateJobRequest) (*domain.Job, error)
	deleteJobFn    func(ctx context.Context, jobID, userID int) error
}

func (m *mockJobService) CreateJob(ctx context.Context, userID int, req *domain.CreateJobRequest) (*domain.Job, error) {
	if m.createJobFn != nil {
		return m.createJobFn(ctx, userID, req)
	}
	return nil, nil
}

func (m *mockJobService) ListAllJobs(ctx context.Context, userID int) ([]*domain.Job, error) {
	if m.listAllJobsFn != nil {
		return m.listAllJobsFn(ctx, userID)
	}
	return nil, nil
}

func (m *mockJobService) GetJobByID(ctx context.Context, jobID, userID int) (*domain.Job, error) {
	if m.getJobByIDFn != nil {
		return m.getJobByIDFn(ctx, jobID, userID)
	}
	return nil, nil
}

func (m *mockJobService) UpdateJob(ctx context.Context, jobID, userID int, req *domain.UpdateJobRequest) (*domain.Job, error) {
	if m.updateJobFn != nil {
		return m.updateJobFn(ctx, jobID, userID, req)
	}
	return nil, nil
}

func (m *mockJobService) DeleteJob(ctx context.Context, jobID, userID int) error {
	if m.deleteJobFn != nil {
		return m.deleteJobFn(ctx, jobID, userID)
	}
	return nil
}

func newJobMux(h *JobHandler) *http.ServeMux {
	mux := http.NewServeMux()
	mux.Handle("POST /api/jobs", http.HandlerFunc(h.CreateJob))
	mux.Handle("GET /api/jobs", http.HandlerFunc(h.GetAllJobs))
	mux.Handle("GET /api/jobs/{id}", http.HandlerFunc(h.GetJobByID))
	mux.Handle("PUT /api/jobs/{id}", http.HandlerFunc(h.UpdateJob))
	mux.Handle("DELETE /api/jobs/{id}", http.HandlerFunc(h.DeleteJob))
	return mux
}

func testJob() *domain.Job {
	return &domain.Job{
		ID:                1,
		UserID:            1,
		Title:             "Backend Engineer",
		Company:           "Acme",
		Location:          "Remote",
		Salary:            100000,
		ApplicationStatus: "draft",
	}
}

func TestJobHandler_CreateJob(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockJobService{
			createJobFn: func(ctx context.Context, userID int, req *domain.CreateJobRequest) (*domain.Job, error) {
				assert.Equal(t, 1, userID)
				assert.Equal(t, "Backend Engineer", req.Title)
				job := testJob()
				job.UserID = userID
				return job, nil
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		body := `{"title":"Backend Engineer","company":"Acme","location":"Remote","salary":100000,"requirements":"Go"}`
		req := withClaims(httptest.NewRequest(http.MethodPost, "/api/jobs", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var resp domain.Job
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Equal(t, "Backend Engineer", resp.Title)
	})

	t.Run("NoClaimsInContext", func(t *testing.T) {
		svc := &mockJobService{}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		body := `{"title":"Backend Engineer","company":"Acme","location":"Remote","salary":100000,"requirements":"Go"}`
		req := httptest.NewRequest(http.MethodPost, "/api/jobs", bytes.NewBufferString(body))

		w := serve(mux, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("InvalidJSON", func(t *testing.T) {
		svc := &mockJobService{}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodPost, "/api/jobs", bytes.NewBufferString("not-json")), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("ValidationError", func(t *testing.T) {
		svc := &mockJobService{}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		body := `{"title":"Backend Engineer"}`
		req := withClaims(httptest.NewRequest(http.MethodPost, "/api/jobs", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]map[string]string
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Contains(t, resp["errors"], "company")
		assert.Contains(t, resp["errors"], "location")
		assert.Contains(t, resp["errors"], "salary")
		assert.Contains(t, resp["errors"], "requirements")
	})

	t.Run("Unauthorized", func(t *testing.T) {
		svc := &mockJobService{
			createJobFn: func(ctx context.Context, userID int, req *domain.CreateJobRequest) (*domain.Job, error) {
				return nil, domain.ErrUnauthorized
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		body := `{"title":"Backend Engineer","company":"Acme","location":"Remote","salary":100000,"requirements":"Go"}`
		req := withClaims(httptest.NewRequest(http.MethodPost, "/api/jobs", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("InternalServerError", func(t *testing.T) {
		svc := &mockJobService{
			createJobFn: func(ctx context.Context, userID int, req *domain.CreateJobRequest) (*domain.Job, error) {
				return nil, assert.AnError
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		body := `{"title":"Backend Engineer","company":"Acme","location":"Remote","salary":100000,"requirements":"Go"}`
		req := withClaims(httptest.NewRequest(http.MethodPost, "/api/jobs", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestJobHandler_GetAllJobs(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockJobService{
			listAllJobsFn: func(ctx context.Context, userID int) ([]*domain.Job, error) {
				assert.Equal(t, 1, userID)
				return []*domain.Job{testJob()}, nil
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/jobs", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp []*domain.Job
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Len(t, resp, 1)
	})

	t.Run("NoClaimsInContext", func(t *testing.T) {
		svc := &mockJobService{}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := httptest.NewRequest(http.MethodGet, "/api/jobs", nil)

		w := serve(mux, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("InternalServerError", func(t *testing.T) {
		svc := &mockJobService{
			listAllJobsFn: func(ctx context.Context, userID int) ([]*domain.Job, error) {
				return nil, assert.AnError
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/jobs", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestJobHandler_GetJobByID(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockJobService{
			getJobByIDFn: func(ctx context.Context, jobID, userID int) (*domain.Job, error) {
				assert.Equal(t, 42, jobID)
				assert.Equal(t, 1, userID)
				job := testJob()
				job.ID = jobID
				return job, nil
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/jobs/42", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp domain.Job
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Equal(t, 42, resp.ID)
	})

	t.Run("InvalidID", func(t *testing.T) {
		svc := &mockJobService{}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/jobs/abc", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("JobNotFound", func(t *testing.T) {
		svc := &mockJobService{
			getJobByIDFn: func(ctx context.Context, jobID, userID int) (*domain.Job, error) {
				return nil, domain.ErrJobNotFound
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/jobs/999", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("InternalServerError", func(t *testing.T) {
		svc := &mockJobService{
			getJobByIDFn: func(ctx context.Context, jobID, userID int) (*domain.Job, error) {
				return nil, assert.AnError
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/jobs/1", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestJobHandler_UpdateJob(t *testing.T) {
	newStatus := "submitted"
	t.Run("Success", func(t *testing.T) {
		svc := &mockJobService{
			updateJobFn: func(ctx context.Context, jobID, userID int, req *domain.UpdateJobRequest) (*domain.Job, error) {
				assert.Equal(t, 42, jobID)
				assert.Equal(t, 1, userID)
				assert.Equal(t, &newStatus, req.ApplicationStatus)
				job := testJob()
				job.ID = jobID
				job.ApplicationStatus = newStatus
				return job, nil
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		body := `{"current_status":"submitted"}`
		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/jobs/42", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp domain.Job
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Equal(t, "submitted", resp.ApplicationStatus)
	})

	t.Run("InvalidID", func(t *testing.T) {
		svc := &mockJobService{}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/jobs/abc", bytes.NewBufferString("{}")), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("InvalidJSON", func(t *testing.T) {
		svc := &mockJobService{}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/jobs/1", bytes.NewBufferString("not-json")), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("JobNotFound", func(t *testing.T) {
		svc := &mockJobService{
			updateJobFn: func(ctx context.Context, jobID, userID int, req *domain.UpdateJobRequest) (*domain.Job, error) {
				return nil, domain.ErrJobNotFound
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/jobs/999", bytes.NewBufferString("{}")), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("Unauthorized", func(t *testing.T) {
		svc := &mockJobService{
			updateJobFn: func(ctx context.Context, jobID, userID int, req *domain.UpdateJobRequest) (*domain.Job, error) {
				return nil, domain.ErrUnauthorized
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/jobs/1", bytes.NewBufferString("{}")), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestJobHandler_DeleteJob(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockJobService{
			deleteJobFn: func(ctx context.Context, jobID, userID int) error {
				assert.Equal(t, 42, jobID)
				assert.Equal(t, 1, userID)
				return nil
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodDelete, "/api/jobs/42", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
	})

	t.Run("InvalidID", func(t *testing.T) {
		svc := &mockJobService{}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodDelete, "/api/jobs/abc", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("JobNotFound", func(t *testing.T) {
		svc := &mockJobService{
			deleteJobFn: func(ctx context.Context, jobID, userID int) error {
				return domain.ErrJobNotFound
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodDelete, "/api/jobs/999", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("Unauthorized", func(t *testing.T) {
		svc := &mockJobService{
			deleteJobFn: func(ctx context.Context, jobID, userID int) error {
				return domain.ErrUnauthorized
			},
		}
		h := NewJobHandler(svc)
		mux := newJobMux(h)

		req := withClaims(httptest.NewRequest(http.MethodDelete, "/api/jobs/1", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}
