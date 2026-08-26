package handler

import (
	"context"
	"net/http"
	"net/http/httptest"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
)

func testClaims(userID int, role string) *domain.Claims {
	return &domain.Claims{
		UserID:   userID,
		Username: "testuser",
		Email:    "test@example.com",
		Role:     role,
	}
}

func withClaims(r *http.Request, userID int, role string) *http.Request {
	ctx := context.WithValue(r.Context(), domain.ContextKeyClaims, testClaims(userID, role))
	return r.WithContext(ctx)
}

func serve(mux *http.ServeMux, r *http.Request) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, r)
	return w
}
