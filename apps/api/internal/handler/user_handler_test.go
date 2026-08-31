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

type mockUserService struct {
	getAllFn    func(ctx context.Context) ([]*domain.User, error)
	getByIDFn   func(ctx context.Context, id int) (*domain.User, error)
	updateUserF func(ctx context.Context, id int, req *domain.UpdateUserRequest) (*domain.User, error)
	deleteUserF func(ctx context.Context, id int) error
}

func (m *mockUserService) GetAllUsers(ctx context.Context) ([]*domain.User, error) {
	if m.getAllFn != nil {
		return m.getAllFn(ctx)
	}
	return nil, nil
}

func (m *mockUserService) GetUserByID(ctx context.Context, id int) (*domain.User, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, id)
	}
	return nil, nil
}

func (m *mockUserService) UpdateUser(ctx context.Context, id int, req *domain.UpdateUserRequest) (*domain.User, error) {
	if m.updateUserF != nil {
		return m.updateUserF(ctx, id, req)
	}
	return nil, nil
}

func (m *mockUserService) DeleteUser(ctx context.Context, id int) error {
	if m.deleteUserF != nil {
		return m.deleteUserF(ctx, id)
	}
	return nil
}

func newUserMux(h *UserHandler) *http.ServeMux {
	mux := http.NewServeMux()
	mux.Handle("GET /api/users", http.HandlerFunc(h.GetAllUsers))
	mux.Handle("GET /api/users/{id}", http.HandlerFunc(h.GetUserByID))
	mux.Handle("PUT /api/users/{id}", http.HandlerFunc(h.UpdateUser))
	mux.Handle("DELETE /api/users/{id}", http.HandlerFunc(h.DeleteUser))
	return mux
}

func testUser() *domain.User {
	return &domain.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
		Role:     "user",
	}
}

func TestUserHandler_GetAllUsers(t *testing.T) {
	t.Run("SuccessAsAdmin", func(t *testing.T) {
		svc := &mockUserService{
			getAllFn: func(ctx context.Context) ([]*domain.User, error) {
				return []*domain.User{testUser()}, nil
			},
		}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/users", nil), 1, "admin")

		w := serve(mux, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp []*domain.User
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Len(t, resp, 1)
	})

	t.Run("ForbiddenForNonAdmin", func(t *testing.T) {
		svc := &mockUserService{}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/users", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusForbidden, w.Code)

		var resp map[string]string
		json.NewDecoder(w.Body).Decode(&resp)
		assert.Equal(t, "Access forbidden", resp["message"])
	})

	t.Run("NoClaimsInContext", func(t *testing.T) {
		svc := &mockUserService{}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := httptest.NewRequest(http.MethodGet, "/api/users", nil)

		w := serve(mux, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("InternalServerError", func(t *testing.T) {
		svc := &mockUserService{
			getAllFn: func(ctx context.Context) ([]*domain.User, error) {
				return nil, assert.AnError
			},
		}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/users", nil), 1, "admin")

		w := serve(mux, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestUserHandler_GetUserByID(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockUserService{
			getByIDFn: func(ctx context.Context, id int) (*domain.User, error) {
				assert.Equal(t, 1, id)
				user := testUser()
				user.ID = id
				return user, nil
			},
		}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/users/1", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp domain.User
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Equal(t, 1, resp.ID)
	})

	t.Run("InvalidID", func(t *testing.T) {
		svc := &mockUserService{}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/users/abc", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("ForbiddenForOtherUsers", func(t *testing.T) {
		svc := &mockUserService{}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/users/2", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusForbidden, w.Code)
	})

	t.Run("UserNotFound", func(t *testing.T) {
		svc := &mockUserService{
			getByIDFn: func(ctx context.Context, id int) (*domain.User, error) {
				return nil, domain.ErrUserNotFound
			},
		}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := withClaims(httptest.NewRequest(http.MethodGet, "/api/users/999", nil), 999, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestUserHandler_UpdateUser(t *testing.T) {
	newUsername := "newusername"
	newEmail := "new@example.com"
	t.Run("Success", func(t *testing.T) {
		svc := &mockUserService{
			updateUserF: func(ctx context.Context, id int, req *domain.UpdateUserRequest) (*domain.User, error) {
				assert.Equal(t, 1, id)
				assert.Equal(t, &newUsername, req.Username)
				user := testUser()
				user.Username = newUsername
				return user, nil
			},
		}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		body := `{"username":"newusername"}`
		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/users/1", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp domain.User
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Equal(t, "newusername", resp.Username)
	})

	t.Run("InvalidID", func(t *testing.T) {
		svc := &mockUserService{}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		body := `{"username":"newusername"}`
		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/users/abc", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("ForbiddenForOtherUsers", func(t *testing.T) {
		svc := &mockUserService{}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		body := `{"username":"newusername"}`
		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/users/2", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusForbidden, w.Code)
	})

	t.Run("ValidationError", func(t *testing.T) {
		svc := &mockUserService{}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		body := `{"email":"not-an-email"}`
		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/users/1", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]map[string]string
		json.NewDecoder(w.Body).Decode(&resp)
		assert.Contains(t, resp["errors"], "email")
	})

	t.Run("EmailAlreadyExists", func(t *testing.T) {
		svc := &mockUserService{
			updateUserF: func(ctx context.Context, id int, req *domain.UpdateUserRequest) (*domain.User, error) {
				return nil, domain.ErrEmailAlreadyExists
			},
		}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		body := `{"email":"` + newEmail + `"}`
		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/users/1", bytes.NewBufferString(body)), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusConflict, w.Code)
	})

	t.Run("UserNotFound", func(t *testing.T) {
		svc := &mockUserService{
			updateUserF: func(ctx context.Context, id int, req *domain.UpdateUserRequest) (*domain.User, error) {
				return nil, domain.ErrUserNotFound
			},
		}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		body := `{}`
		req := withClaims(httptest.NewRequest(http.MethodPut, "/api/users/999", bytes.NewBufferString(body)), 999, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestUserHandler_DeleteUser(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockUserService{
			deleteUserF: func(ctx context.Context, id int) error {
				assert.Equal(t, 1, id)
				return nil
			},
		}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := withClaims(httptest.NewRequest(http.MethodDelete, "/api/users/1", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
	})

	t.Run("InvalidID", func(t *testing.T) {
		svc := &mockUserService{}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := withClaims(httptest.NewRequest(http.MethodDelete, "/api/users/abc", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("ForbiddenForOtherUsers", func(t *testing.T) {
		svc := &mockUserService{}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := withClaims(httptest.NewRequest(http.MethodDelete, "/api/users/2", nil), 1, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusForbidden, w.Code)
	})

	t.Run("UserNotFound", func(t *testing.T) {
		svc := &mockUserService{
			deleteUserF: func(ctx context.Context, id int) error {
				return domain.ErrUserNotFound
			},
		}
		h := NewUserHandler(svc)
		mux := newUserMux(h)

		req := withClaims(httptest.NewRequest(http.MethodDelete, "/api/users/999", nil), 999, "user")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}
