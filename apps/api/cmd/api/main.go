package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ShoAnn/get-a-j-b/api/internal/handler"
	"github.com/ShoAnn/get-a-j-b/api/internal/middleware"
	repository "github.com/ShoAnn/get-a-j-b/api/internal/repository/postgres"
	"github.com/ShoAnn/get-a-j-b/api/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	ctx := context.Background()

	// Database configuration
	dbURL := os.Getenv("POSTGRES_URL")
	if dbURL == "" {
		log.Fatal("POSTGRES_URL environment variable is required")
	}

	dbpool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v\n", err)
	}
	defer dbpool.Close()

	// Verify database connection
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := dbpool.Ping(pingCtx); err != nil {
		log.Fatalf("Database unreachable: %v", err)
	}
	log.Println("Successfully connected to the database")

	// JWT Secret
	jwtSecretKey := os.Getenv("JWT_SECRET_KEY")
	if jwtSecretKey == "" {
		log.Fatal("JWT_SECRET_KEY environment variable is required")
	}

	// Repositories
	userRepo := repository.NewUserRepository(dbpool)
	jobRepo := repository.NewJobRepository(dbpool)
	resumeRepo := repository.NewResumeRepository(dbpool)
	tokenRepo := repository.NewRefreshTokenRepository(dbpool)

	// Services
	userService := service.NewUserService(userRepo)
	jobService := service.NewJobService(jobRepo)
	resumeService := service.NewResumeService(resumeRepo)
	authService, err := service.NewAuthService(userRepo, tokenRepo, jwtSecretKey)
	if err != nil {
		log.Fatalf("Failed to initialize auth service: %v", err)
	}

	// Handlers
	userHandler := handler.NewUserHandler(userService)
	jobHandler := handler.NewJobHandler(jobService)
	resumeHandler := handler.NewResumeHandler(resumeService)
	authHandler := handler.NewAuthHandler(authService)

	// Middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)
	allowedOrigins := strings.Split(os.Getenv("CORS_ALLOWED_ORIGINS"), ",")
	if len(allowedOrigins) == 1 && allowedOrigins[0] == "" {
		allowedOrigins = []string{"http://localhost:3000"}
	}
	corsMiddleware := middleware.NewCORS(allowedOrigins)

	// Router
	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})
	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.HandleFunc("POST /api/auth/refresh", authHandler.RefreshToken)

	// Protected routes
	// Logout
	mux.Handle("POST /api/auth/logout", authMiddleware.Auth(http.HandlerFunc(authHandler.Logout)))

	// Jobs
	mux.Handle("POST /api/jobs", authMiddleware.Auth(http.HandlerFunc(jobHandler.CreateJob)))
	mux.Handle("GET /api/jobs", authMiddleware.Auth(http.HandlerFunc(jobHandler.GetAllJobs)))
	mux.Handle("GET /api/jobs/{id}", authMiddleware.Auth(http.HandlerFunc(jobHandler.GetJobByID)))
	mux.Handle("PUT /api/jobs/{id}", authMiddleware.Auth(http.HandlerFunc(jobHandler.UpdateJob)))
	mux.Handle("DELETE /api/jobs/{id}", authMiddleware.Auth(http.HandlerFunc(jobHandler.DeleteJob)))

	// Resumes
	mux.Handle("POST /api/resumes", authMiddleware.Auth(http.HandlerFunc(resumeHandler.CreateResume)))
	mux.Handle("GET /api/resumes", authMiddleware.Auth(http.HandlerFunc(resumeHandler.GetAllResumes)))
	mux.Handle("GET /api/resumes/{id}", authMiddleware.Auth(http.HandlerFunc(resumeHandler.GetResumeByID)))
	mux.Handle("PUT /api/resumes/{id}", authMiddleware.Auth(http.HandlerFunc(resumeHandler.UpdateResume)))
	mux.Handle("DELETE /api/resumes/{id}", authMiddleware.Auth(http.HandlerFunc(resumeHandler.DeleteResume)))

	// Users
	mux.Handle("GET /api/users", authMiddleware.Auth(http.HandlerFunc(userHandler.GetAllUsers)))
	mux.Handle("GET /api/users/{id}", authMiddleware.Auth(http.HandlerFunc(userHandler.GetUserByID)))
	mux.Handle("PUT /api/users/{id}", authMiddleware.Auth(http.HandlerFunc(userHandler.UpdateUser)))
	mux.Handle("DELETE /api/users/{id}", authMiddleware.Auth(http.HandlerFunc(userHandler.DeleteUser)))
	// TODO : add/modify "/me" logic

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Go API server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, middleware.Logger(corsMiddleware.Middleware(mux))))
}
