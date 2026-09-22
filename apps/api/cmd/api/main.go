package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"time"

	"github.com/ShoAnn/get-a-j-b/api/internal/handler"
	"github.com/ShoAnn/get-a-j-b/api/internal/middleware"
	repository "github.com/ShoAnn/get-a-j-b/api/internal/repository/postgres"
	"github.com/ShoAnn/get-a-j-b/api/internal/service"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file in dev; in prod (docker) env comes from the orchestrator.
	// Missing .env must not be fatal so the prod image can boot without one.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	ctx := context.Background()

	// Database configuration
	dbURL := os.Getenv("POSTGRES_URL")
	if dbURL == "" {
		log.Fatal("POSTGRES_URL environment variable is required")
	}

	poolCfg, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("Invalid POSTGRES_URL: %v", err)
	}
	// Sensible pool defaults for a small production service.
	poolCfg.MaxConns = 20
	poolCfg.MinConns = 2
	poolCfg.MaxConnLifetime = 30 * time.Minute
	poolCfg.MaxConnIdleTime = 5 * time.Minute

	dbpool, err := pgxpool.NewWithConfig(ctx, poolCfg)
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

	// Run migrations (best-effort: required for fresh volumes / e2e)
	migrationsPath := os.Getenv("MIGRATIONS_PATH")
	if migrationsPath == "" {
		_, filename, _, _ := runtime.Caller(0)
		dir := filepath.Dir(filename)
		for {
			candidate := filepath.Join(dir, "internal", "db", "migrations")
			if _, err := os.Stat(candidate); err == nil {
				migrationsPath = "file://" + candidate
				break
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
			dir = parent
		}
	}
	if migrationsPath != "" {
		if !strings.HasPrefix(migrationsPath, "file://") {
			migrationsPath = "file://" + migrationsPath
		}
		if m, err := migrate.New(migrationsPath, dbURL); err == nil {
			if err := m.Up(); err != nil && err != migrate.ErrNoChange {
				log.Printf("Migration failed: %v", err)
			} else {
				log.Println("Migrations applied (or already up-to-date)")
			}
			if srcErr, dbErr := m.Close(); srcErr != nil || dbErr != nil {
				if srcErr != nil {
					log.Printf("Migration source close error: %v", srcErr)
				}
				if dbErr != nil {
					log.Printf("Migration db close error: %v", dbErr)
				}
			}
		} else {
			log.Printf("Failed to init migrator (%s): %v", migrationsPath, err)
		}
	}

	// JWT Secret — fail fast on missing/weak secrets (except explicit dev opt-in).
	jwtSecretKey := os.Getenv("JWT_SECRET_KEY")
	if jwtSecretKey == "" || jwtSecretKey == "change_me_in_production" {
		if os.Getenv("ALLOW_INSECURE_JWT") == "true" {
			log.Println("WARNING: using insecure JWT secret (ALLOW_INSECURE_JWT=true, dev only)")
			jwtSecretKey = "dev-only-insecure-secret-change-me"
		} else {
			log.Fatal("JWT_SECRET_KEY environment variable is required (min 32 chars); refusing to boot with default/insecure value")
		}
	}
	if len(jwtSecretKey) < 32 {
		log.Fatal("JWT_SECRET_KEY must be at least 32 characters")
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
	allowedOrigins := parseOrigins(os.Getenv("CORS_ALLOWED_ORIGINS"), "http://localhost:3000")
	corsMiddleware := middleware.NewCORS(allowedOrigins)

	// Router
	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
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

	// Current authenticated user
	mux.Handle("GET /api/me", authMiddleware.Auth(http.HandlerFunc(userHandler.GetMe)))
	mux.Handle("PUT /api/me", authMiddleware.Auth(http.HandlerFunc(userHandler.UpdateMe)))
	mux.Handle("DELETE /api/me", authMiddleware.Auth(http.HandlerFunc(userHandler.DeleteMe)))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	handlerChain := middleware.Logger(
		middleware.SecurityHeaders(
			middleware.MaxBodyBytes(1 << 20)(corsMiddleware.Middleware(mux)),
		),
	)

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           handlerChain,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Graceful shutdown: drain in-flight requests on SIGINT/SIGTERM.
	go func() {
		fmt.Printf("Go API server starting on port %s\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	dbpool.Close()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Forced shutdown: %v", err)
	}
	log.Println("Server stopped")
}

func parseOrigins(raw, fallback string) []string {
	var out []string
	for _, o := range strings.Split(raw, ",") {
		o = strings.TrimSpace(strings.TrimSuffix(o, "/"))
		if o != "" {
			out = append(out, o)
		}
	}
	if len(out) == 0 {
		return []string{fallback}
	}
	return out
}
