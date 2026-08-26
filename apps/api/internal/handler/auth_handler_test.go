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
	loginFn         func(ctx context.Context, email, password string) (*domain.AuthResponse, error)
	registerFn      func(ctx context.Context, req *domain.CreateUserRequest) (*domain.AuthResponse, error)
	logoutFn        func(ctx context.Context, refreshTokenStr string) error
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
					AccessToken:  "jwt-token",
					RefreshToken: "refresh-token",
					ExpiresIn:    "3600",
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
		assert.Equal(t, "jwt-token", resp.AccessToken)
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

func TestAuthHandler_Register(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockAuthService{
			registerFn: func(ctx context.Context, req *domain.CreateUserRequest) (*domain.AuthResponse, error) {
				assert.Equal(t, "testuser", req.Username)
				assert.Equal(t, "test@example.com", req.Email)
				assert.Equal(t, "password123", req.Password)
				return &domain.AuthResponse{
					AccessToken:  "jwt-token",
					RefreshToken: "refresh-token",
					ExpiresIn:    "3600",
				}, nil
			},
		}
		h := NewAuthHandler(svc)

		body := `{"username":"testuser","email":"test@example.com","password":"password123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.Register(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var resp domain.AuthResponse
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Equal(t, "jwt-token", resp.AccessToken)
	})

	t.Run("InvalidJSON", func(t *testing.T) {
		svc := &mockAuthService{}
		h := NewAuthHandler(svc)

		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBufferString("not-json"))
		w := httptest.NewRecorder()

		h.Register(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("ValidationError", func(t *testing.T) {
		svc := &mockAuthService{}
		h := NewAuthHandler(svc)

		body := `{"username":"ab","email":"not-an-email","password":"123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.Register(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]map[string]string
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Contains(t, resp["errors"], "email")
		assert.Contains(t, resp["errors"], "password")
	})

	t.Run("EmailAlreadyExists", func(t *testing.T) {
		svc := &mockAuthService{
			registerFn: func(ctx context.Context, req *domain.CreateUserRequest) (*domain.AuthResponse, error) {
				return nil, domain.ErrEmailAlreadyExists
			},
		}
		h := NewAuthHandler(svc)

		body := `{"username":"testuser","email":"test@example.com","password":"password123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.Register(w, req)

		assert.Equal(t, http.StatusConflict, w.Code)

		var resp map[string]string
		json.NewDecoder(w.Body).Decode(&resp)
		assert.Equal(t, "email already exist", resp["message"])
	})

	t.Run("InternalServerError", func(t *testing.T) {
		svc := &mockAuthService{
			registerFn: func(ctx context.Context, req *domain.CreateUserRequest) (*domain.AuthResponse, error) {
				return nil, assert.AnError
			},
		}
		h := NewAuthHandler(svc)

		body := `{"username":"testuser","email":"test@example.com","password":"password123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.Register(w, req)

		assert.Equal(t, http.StatusConflict, w.Code)
	})
}

func TestAuthHandler_Logout(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockAuthService{
			logoutFn: func(ctx context.Context, refreshTokenStr string) error {
				assert.Equal(t, "refresh-token", refreshTokenStr)
				return nil
			},
		}
		h := NewAuthHandler(svc)

		mux := http.NewServeMux()
		mux.Handle("POST /api/auth/logout", http.HandlerFunc(h.Logout))

		req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", bytes.NewBufferString("{}"))
		req.Header.Set("Authorization", "Bearer refresh-token")

		w := serve(mux, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
	})

	t.Run("MissingAuthorizationHeader", func(t *testing.T) {
		svc := &mockAuthService{}
		h := NewAuthHandler(svc)

		req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", bytes.NewBufferString("{}"))
		w := httptest.NewRecorder()

		h.Logout(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]string
		json.NewDecoder(w.Body).Decode(&resp)
		assert.Equal(t, "Unauthorized access", resp["message"])
	})

	t.Run("MalformedAuthorizationHeader", func(t *testing.T) {
		svc := &mockAuthService{}
		h := NewAuthHandler(svc)

		req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", bytes.NewBufferString("{}"))
		req.Header.Set("Authorization", "Basic some-token")
		w := httptest.NewRecorder()

		h.Logout(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("RefreshTokenNotFound", func(t *testing.T) {
		svc := &mockAuthService{
			logoutFn: func(ctx context.Context, refreshTokenStr string) error {
				return domain.ErrRefreshTokenNotFound
			},
		}
		h := NewAuthHandler(svc)

		req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", bytes.NewBufferString("{}"))
		req.Header.Set("Authorization", "Bearer unknown-token")
		w := httptest.NewRecorder()

		h.Logout(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("InternalServerError", func(t *testing.T) {
		svc := &mockAuthService{
			logoutFn: func(ctx context.Context, refreshTokenStr string) error {
				return assert.AnError
			},
		}
		h := NewAuthHandler(svc)

		req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", bytes.NewBufferString("{}"))
		req.Header.Set("Authorization", "Bearer refresh-token")
		w := httptest.NewRecorder()

		h.Logout(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestAuthHandler_RefreshToken(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		svc := &mockAuthService{
			refreshTokenFn: func(ctx context.Context, refreshTokenStr string) (*domain.AuthResponse, error) {
				assert.Equal(t, "refresh-token", refreshTokenStr)
				return &domain.AuthResponse{
					AccessToken:  "new-jwt-token",
					ExpiresIn:    "3600",
				}, nil
			},
		}
		h := NewAuthHandler(svc)

		body := `{"refresh_token":"refresh-token"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.RefreshToken(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp domain.AuthResponse
		err := json.NewDecoder(w.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Equal(t, "new-jwt-token", resp.AccessToken)
	})

	t.Run("InvalidJSON", func(t *testing.T) {
		svc := &mockAuthService{}
		h := NewAuthHandler(svc)

		req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBufferString("not-json"))
		w := httptest.NewRecorder()

		h.RefreshToken(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("MissingRefreshToken", func(t *testing.T) {
		svc := &mockAuthService{}
		h := NewAuthHandler(svc)

		body := `{}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		h.RefreshToken(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]map[string]string
		json.NewDecoder(w.Body).Decode(&resp)
		assert.Contains(t, resp["errors"], "refresh_token")
	})

	t.Run("RefreshTokenNotFound", func(t *testing.T) {
		svc := &mockAuthService{
			refreshTokenFn: func(ctx context.Context, refreshTokenStr string) (*domain.AuthResponse, error) {
				return nil, domain.ErrRefreshTokenNotFound
			},
		}
		h := NewAuthHandler(svc)

		body := `{"refresh_token":"unknown"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBufferString(body))
		w := httptest.NewRecorder()

		h.RefreshToken(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("RefreshTokenExpired", func(t *testing.T) {
		svc := &mockAuthService{
			refreshTokenFn: func(ctx context.Context, refreshTokenStr string) (*domain.AuthResponse, error) {
				return nil, domain.ErrRefreshTokenExpired
			},
		}
		h := NewAuthHandler(svc)

		body := `{"refresh_token":"expired"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBufferString(body))
		w := httptest.NewRecorder()

		h.RefreshToken(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("RefreshTokenRevoked", func(t *testing.T) {
		svc := &mockAuthService{
			refreshTokenFn: func(ctx context.Context, refreshTokenStr string) (*domain.AuthResponse, error) {
				return nil, domain.ErrRefreshTokenRevoked
			},
		}
		h := NewAuthHandler(svc)

		body := `{"refresh_token":"revoked"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBufferString(body))
		w := httptest.NewRecorder()

		h.RefreshToken(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("InternalServerError", func(t *testing.T) {
		svc := &mockAuthService{
			refreshTokenFn: func(ctx context.Context, refreshTokenStr string) (*domain.AuthResponse, error) {
				return nil, assert.AnError
			},
		}
		h := NewAuthHandler(svc)

		body := `{"refresh_token":"refresh-token"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBufferString(body))
		w := httptest.NewRecorder()

		h.RefreshToken(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}
