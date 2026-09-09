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

type mockResumeService struct {
	createResumeFn func(ctx context.Context, userID int, req *domain.CreateResumeRequest) (*domain.Resume, error)
	getAllFn       func(ctx context.Context, userID int) ([]*domain.Resume, error)
	getByIDFn      func(ctx context.Context, resumeID, userID int) (*domain.Resume, error)
	updateResumeFn func(ctx context.Context, resumeID, userID int, req *domain.UpdateResumeRequest) (*domain.Resume, error)
	deleteResumeFn func(ctx context.Context, resumeID, userID int) error
}

func (m *mockResumeService) CreateResume(ctx context.Context, userID int, req *domain.CreateResumeRequest) (*domain.Resume, error) {
	if m.createResumeFn != nil {
		return m.createResumeFn(ctx, userID, req)
	}
	return nil, nil
}

func (m *mockResumeService) GetAllResumes(ctx context.Context, userID int) ([]*domain.Resume, error) {
	if m.getAllFn != nil {
		return m.getAllFn(ctx, userID)
	}
	return nil, nil
}

func (m *mockResumeService) GetByID(ctx context.Context, resumeID, userID int) (*domain.Resume, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, resumeID, userID)
	}
	return nil, nil
}

func (m *mockResumeService) UpdateResume(ctx context.Context, resumeID, userID int, req *domain.UpdateResumeRequest) (*domain.Resume, error) {
	if m.updateResumeFn != nil {
		return m.updateResumeFn(ctx, resumeID, userID, req)
	}
	return nil, nil
}

func (m *mockResumeService) DeleteResume(ctx context.Context, resumeID, userID int) error {
	if m.deleteResumeFn != nil {
		return m.deleteResumeFn(ctx, resumeID, userID)
	}
	return nil
}

func newResumeMux(h *ResumeHandler) *http.ServeMux {
	mux := http.NewServeMux()
	mux.Handle("POST /api/resumes", http.HandlerFunc(h.CreateResume))
	mux.Handle("GET /api/resumes", http.HandlerFunc(h.GetAllResumes))
	mux.Handle("GET /api/resumes/{id}", http.HandlerFunc(h.GetResumeByID))
	mux.Handle("PUT /api/resumes/{id}", http.HandlerFunc(h.UpdateResume))
	mux.Handle("DELETE /api/resumes/{id}", http.HandlerFunc(h.DeleteResume))
	return mux
}

func testResume() *domain.Resume {
	return &domain.Resume{
		ID:      1,
		Label:   "main-resume",
		UserID:  1,
		Content: "# My Resume\nExperienced engineer",
	}
}

func TestResumeHandler_CreateResume(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockResumeService{
			createResumeFn: func(ctx context.Context, userID int, req *domain.CreateResumeRequest) (*domain.Resume, error) {
				assert.Equal(t, 1, userID)
				assert.Equal(t, "main-resume", req.Label)
				resume := testResume()
				resume.UserID = userID
				return resume, nil
			},
		}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		body := `{"label":"main-resume","content":"# My Resume\nExperienced engineer"}`
		req := withClaims(httptest.NewRequest(http.MethodPost, "/api/resumes", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var resp domain.Resume
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Equal(t, "main-resume", resp.Label)
	})

	t.Run("NoClaimsInContext", func(t *testing.T) {
		svc := &mockResumeService{}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		body := `{"label":"main-resume","content":"# My Resume\nExperienced engineer"}`
		req := httptest.NewRequest(http.MethodPost, "/api/resumes", bytes.NewBufferString(body))

		w := serve(mux, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("InvalidJSON", func(t *testing.T) {
		svc := &mockResumeService{}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		req := withClaims(httptest.NewRequest(http.MethodPost, "/api/resumes", bytes.NewBufferString("not-json")), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("ValidationError", func(t *testing.T) {
		svc := &mockResumeService{}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		body := `{"label":"main-resume"}`
		req := withClaims(httptest.NewRequest(http.MethodPost, "/api/resumes", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]map[string]string
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Contains(t, resp["errors"], "content")
	})
}

func TestResumeHandler_GetAllResumes(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockResumeService{
			getAllFn: func(ctx context.Context, userID int) ([]*domain.Resume, error) {
				assert.Equal(t, 1, userID)
				return []*domain.Resume{testResume()}, nil
			},
		}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/resumes", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp []*domain.Resume
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Len(t, resp, 1)
	})

	t.Run("InternalServerError", func(t *testing.T) {
		svc := &mockResumeService{
			getAllFn: func(ctx context.Context, userID int) ([]*domain.Resume, error) {
				return nil, assert.AnError
			},
		}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/resumes", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestResumeHandler_GetResumeByID(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockResumeService{
			getByIDFn: func(ctx context.Context, resumeID, userID int) (*domain.Resume, error) {
				assert.Equal(t, 42, resumeID)
				assert.Equal(t, 1, userID)
				resume := testResume()
				resume.ID = resumeID
				return resume, nil
			},
		}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/resumes/42", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp domain.Resume
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Equal(t, 42, resp.ID)
	})

	t.Run("InvalidID", func(t *testing.T) {
		svc := &mockResumeService{}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/resumes/abc", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("ResumeNotFound", func(t *testing.T) {
		svc := &mockResumeService{
			getByIDFn: func(ctx context.Context, resumeID, userID int) (*domain.Resume, error) {
				return nil, domain.ErrResumeNotFound
			},
		}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/resumes/999", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestResumeHandler_UpdateResume(t *testing.T) {
	newLabel := "updated-label"
	t.Run("Success", func(t *testing.T) {
		svc := &mockResumeService{
			updateResumeFn: func(ctx context.Context, resumeID, userID int, req *domain.UpdateResumeRequest) (*domain.Resume, error) {
				assert.Equal(t, 42, resumeID)
				assert.Equal(t, 1, userID)
				assert.Equal(t, &newLabel, req.Label)
				resume := testResume()
				resume.ID = resumeID
				resume.Label = newLabel
				return resume, nil
			},
		}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		body := `{"label":"updated-label"}`
		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/resumes/42", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp domain.Resume
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Equal(t, "updated-label", resp.Label)
	})

	t.Run("InvalidID", func(t *testing.T) {
		svc := &mockResumeService{}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/resumes/abc", bytes.NewBufferString("{}")), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("ResumeNotFound", func(t *testing.T) {
		svc := &mockResumeService{
			updateResumeFn: func(ctx context.Context, resumeID, userID int, req *domain.UpdateResumeRequest) (*domain.Resume, error) {
				return nil, domain.ErrResumeNotFound
			},
		}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/resumes/999", bytes.NewBufferString("{}")), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestResumeHandler_DeleteResume(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockResumeService{
			deleteResumeFn: func(ctx context.Context, resumeID, userID int) error {
				assert.Equal(t, 42, resumeID)
				assert.Equal(t, 1, userID)
				return nil
			},
		}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		req := withClaims(httptest.NewRequest(http.MethodDelete, "/api/resumes/42", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
	})

	t.Run("InvalidID", func(t *testing.T) {
		svc := &mockResumeService{}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		req := withClaims(httptest.NewRequest(http.MethodDelete, "/api/resumes/abc", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("ResumeNotFound", func(t *testing.T) {
		svc := &mockResumeService{
			deleteResumeFn: func(ctx context.Context, resumeID, userID int) error {
				return domain.ErrResumeNotFound
			},
		}
		h := NewResumeHandler(svc)
		mux := newResumeMux(h)

		req := withClaims(httptest.NewRequest(http.MethodDelete, "/api/resumes/999", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}
