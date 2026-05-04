package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/ShoAnn/get-a-j-b/api/internal/handler"
	"github.com/ShoAnn/get-a-j-b/api/internal/middleware"
	"github.com/ShoAnn/get-a-j-b/api/internal/service"
)

var jwtSecretKey = os.Getenv("JWT_SECRET_KEY")

func main() {

	authService, _ := service.NewAuthService(userRepo, jwtSecretKey)
	authMiddleware := middleware.NewAuthMiddleware(authService)
	authHandler := handler.NewAuthHandler(authService)

	mux := http.NewServeMux()

	mux.HandleFunc("POST /auth/register", authHandler.Register)
	mux.HandleFunc("POST /auth/login", authHandler.Login)

	// Protected routes

	fmt.Println("Go API server starting on port 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
