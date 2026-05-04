package middleware

import (
	"context"
	"net/http"

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
		if authHeader == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		tokenStr := authHeader[len("Bearer "):]
		claims, err := m.authService.ValidateToken(tokenStr)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// If the token is valid, proceed to the next handler
		ctx := setClaimsInContext(r.Context(), claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func setClaimsInContext(ctx context.Context, claims *domain.Claims) context.Context {
	ctx = context.WithValue(ctx, domain.ContextKeyClaims, claims)
	return ctx
}

func getClaimsFromContext(ctx context.Context) (*domain.Claims, bool) {
	claims, ok := ctx.Value(domain.ContextKeyClaims).(*domain.Claims)
	if !ok {
		return nil, false
	}

	return claims, ok
}
