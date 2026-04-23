package middleware

import (
	"net/http"
)

func AuthMiddleware(next http.Handler) http.Handler
