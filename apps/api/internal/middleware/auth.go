package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
)

type AuthMiddleware struct {
	authService domain.AuthService
}

func NewAuthMiddleware(authService domain.AuthService) *AuthMiddleware {
	return &AuthMiddleware{authService: authService}
}

func (m *AuthMiddleware) Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check for the presence of the Authorization header
		authHeader := r.Header.Get("Authorization")
		prefix := "Bearer "
		if !strings.HasPrefix(authHeader, prefix) {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		token := strings.TrimPrefix(authHeader, prefix)
		if token == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		claims, err := m.authService.ValidateToken(token)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// If the token is valid, proceed to the next handler
		ctx := setClaimsInContext(r.Context(), claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetClaimsFromContext(ctx context.Context) (*domain.Claims, error) {
	claims, ok := ctx.Value(domain.ContextKeyClaims).(*domain.Claims)
	if !ok {
		return nil, errors.New("claims not found in context")
	}

	return claims, nil
}

func setClaimsInContext(ctx context.Context, claims *domain.Claims) context.Context {
	ctx = context.WithValue(ctx, domain.ContextKeyClaims, claims)
	return ctx
}
