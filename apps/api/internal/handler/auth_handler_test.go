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

type mockAuthService struct {
	loginFn       func(ctx context.Context, email, password string) (*domain.AuthResponse, error)
	registerFn    func(ctx context.Context, req *domain.CreateUserRequest) (*domain.AuthResponse, error)
	logoutFn      func(ctx context.Context, refreshTokenStr string) error
	validateTokenFn func(tokenStr string) (*domain.Claims, error)
	generateJWTFn   func(user *domain.User) (string, error)
	refreshTokenFn  func(ctx context.Context, refreshTokenStr string) (*domain.AuthResponse, error)
}

func (m *mockAuthService) Login(ctx context.Context, email, password string) (*domain.AuthResponse, error) {
	if m.loginFn != nil {
		return m.loginFn(ctx, email, password)
	}
	return nil, nil
}

func (m *mockAuthService) Register(ctx context.Context, req *domain.CreateUserRequest) (*domain.AuthResponse, error) {
	if m.registerFn != nil {
		return m.registerFn(ctx, req)
	}
	return nil, nil
}

func (m *mockAuthService) Logout(ctx context.Context, refreshTokenStr string) error {
	if m.logoutFn != nil {
		return m.logoutFn(ctx, refreshTokenStr)
	}
	return nil
}

func (m *mockAuthService) ValidateToken(tokenStr string) (*domain.Claims, error) {
	if m.validateTokenFn != nil {
		return m.validateTokenFn(tokenStr)
	}
	return nil, nil
}

func (m *mockAuthService) GenerateJWT(user *domain.User) (string, error) {
	if m.generateJWTFn != nil {
		return m.generateJWTFn(user)
	}
	return "", nil
}

func (m *mockAuthService) RefreshToken(ctx context.Context, refreshTokenStr string) (*domain.AuthResponse, error) {
	if m.refreshTokenFn != nil {
		return m.refreshTokenFn(ctx, refreshTokenStr)
	}
	return nil, nil
}

func TestAuthHandler_Login(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockAuthService{
			loginFn: func(ctx context.Context, email, password string) (*domain.AuthResponse, error) {
				assert.Equal(t, "test@example.com", email)
				assert.Equal(t, "password123", password)
				return &domain.AuthResponse{
					Token:        "jwt-token",
					RefreshToken: "refresh-token",
				}, nil
			},
		}
		h := NewAuthHandler(svc)

		body := `{"email":"test@example.com","password":"password123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.Login(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "application/json", w.Header().Get("Content-Type"))

		var resp domain.AuthResponse
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Equal(t, "jwt-token", resp.Token)
		assert.Equal(t, "refresh-token", resp.RefreshToken)
	})

	t.Run("InvalidJSON", func(t *testing.T) {
		svc := &mockAuthService{}
		h := NewAuthHandler(svc)

		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBufferString("not-json"))
		w := httptest.NewRecorder()

		h.Login(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]string
		json.NewDecoder(w.Body).Decode(&resp)
		assert.Equal(t, "Invalid input", resp["message"])
	})

	t.Run("MissingEmail", func(t *testing.T) {
		svc := &mockAuthService{}
		h := NewAuthHandler(svc)

		body := `{"password":"password123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.Login(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]map[string]string
		json.NewDecoder(w.Body).Decode(&resp)
		assert.Contains(t, resp["errors"], "email")
	})

	t.Run("InvalidEmailFormat", func(t *testing.T) {
		svc := &mockAuthService{}
		h := NewAuthHandler(svc)

		body := `{"email":"not-an-email","password":"password123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.Login(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]map[string]string
		json.NewDecoder(w.Body).Decode(&resp)
		assert.Contains(t, resp["errors"], "email")
	})

	t.Run("MissingPassword", func(t *testing.T) {
		svc := &mockAuthService{}
		h := NewAuthHandler(svc)

		body := `{"email":"test@example.com"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.Login(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]map[string]string
		json.NewDecoder(w.Body).Decode(&resp)
		assert.Contains(t, resp["errors"], "password")
	})

	t.Run("InvalidCredentials", func(t *testing.T) {
		svc := &mockAuthService{
			loginFn: func(ctx context.Context, email, password string) (*domain.AuthResponse, error) {
				return nil, domain.ErrInvalidCredentials
			},
		}
		h := NewAuthHandler(svc)

		body := `{"email":"test@example.com","password":"wrongpassword"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.Login(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var resp map[string]string
		json.NewDecoder(w.Body).Decode(&resp)
		assert.Equal(t, "Invalid credentials", resp["message"])
	})

	t.Run("InternalServerError", func(t *testing.T) {
		svc := &mockAuthService{
			loginFn: func(ctx context.Context, email, password string) (*domain.AuthResponse, error) {
				return nil, assert.AnError
			},
		}
		h := NewAuthHandler(svc)

		body := `{"email":"test@example.com","password":"password123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.Login(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)

		var resp map[string]string
		json.NewDecoder(w.Body).Decode(&resp)
		assert.Equal(t, "Internal server error", resp["message"])
	})
}
