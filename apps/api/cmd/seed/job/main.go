package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"math/big"
	"math/rand"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/ShoAnn/get-a-j-b/api/internal/config"
	db "github.com/ShoAnn/get-a-j-b/api/internal/db/sqlc"
	"github.com/brianvoe/gofakeit/v7"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var statuses = []string{
	"draft", "submitted", "under_review",
	"interview_scheduled", "offer_extended",
	"accepted", "rejected", "withdrawn", "archived",
}

var portals = []string{
	"LinkedIn", "Indeed", "Glassdoor", "HackerNews",
	"Company Website", "BuiltIn", "AngelList", "Monster",
}

func randomStatus() string {
	r := rand.Float64()
	switch {
	case r < 0.08:
		return "draft"
	case r < 0.25:
		return "submitted"
	case r < 0.40:
		return "under_review"
	case r < 0.55:
		return "interview_scheduled"
	case r < 0.63:
		return "offer_extended"
	case r < 0.70:
		return "accepted"
	case r < 0.88:
		return "rejected"
	case r < 0.94:
		return "withdrawn"
	default:
		return "archived"
	}
}

func randomSalary() int64 {
	return int64(rand.Intn(39)+6) * 5000
}

func main() {
	count := flag.Int("count", 20, "Number of job seeds to generate")
	reset := flag.Bool("reset", false, "Drop all tables before seeding")
	flag.Parse()

	config.LoadEnv()

	ctx := context.Background()

	dbURL := os.Getenv("POSTGRES_URL")
	if dbURL == "" {
		log.Fatal("POSTGRES_URL environment variable is required")
	}

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
				log.Fatal("Could not find internal/db/migrations directory")
			}
			dir = parent
		}
	}

	fmt.Printf("Migrations path: %s\n", migrationsPath)

	if *reset {
		fmt.Println("Dropping all tables...")
		pool, err := pgxpool.New(ctx, dbURL)
		if err != nil {
			log.Fatalf("Unable to create connection pool: %v", err)
		}
		if _, err := pool.Exec(ctx, "DROP SCHEMA public CASCADE"); err != nil {
			log.Fatal(err)
		}
		if _, err := pool.Exec(ctx, "CREATE SCHEMA public"); err != nil {
			log.Fatal(err)
		}
		pool.Close()
		fmt.Println("All tables dropped")
	}

	m, err := migrate.New(migrationsPath, dbURL)
	if err != nil {
		log.Fatalf("Failed to create migrator: %v", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	fmt.Println("Migrations complete")

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}
	defer pool.Close()

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		log.Fatalf("Database unreachable: %v", err)
	}

	queries := db.New(pool)

	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	user, err := queries.CreateUser(ctx, db.CreateUserParams{
		Username: "demouser",
		Email:    "demo@example.com",
		Password: string(hash),
		Role:     "user",
	})
	if err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}
	fmt.Printf("Created user: %s (ID: %d)\n", user.Username, user.ID)

	_ = gofakeit.Seed(time.Now().UnixNano())

	usedTitles := make(map[string]bool)
	states := []string{"AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
		"HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
		"MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
		"NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
		"SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"}

	for i := range *count {
		title := gofakeit.JobTitle()
		for usedTitles[title] {
			title = gofakeit.JobTitle()
		}
		usedTitles[title] = true
		company := gofakeit.Company()
		location := gofakeit.City() + ", " + states[rand.Intn(len(states))]
		salary := randomSalary()
		description := gofakeit.HipsterSentence()
		if len(description) > 2048 {
			description = description[:2048]
		}
		requirements := fmt.Sprintf(
			"%s experience required. %s. %s.",
			gofakeit.JobLevel(),
			gofakeit.BuzzWord(),
			gofakeit.BuzzWord(),
		)
		status := randomStatus()
		notes := ""
		if rand.Float64() < 0.6 {
			notes = gofakeit.HipsterSentence()
			if len(notes) > 2048 {
				notes = notes[:2048]
			}
		}
		portal := portals[rand.Intn(len(portals))]

		salaryNum := pgtype.Numeric{
			Int:   big.NewInt(salary),
			Exp:   0,
			Valid: true,
		}

		job, err := queries.CreateJob(ctx, db.CreateJobParams{
			UserID:            pgtype.Int4{Int32: user.ID, Valid: true},
			Title:             title,
			Company:           company,
			Location:          location,
			Salary:            salaryNum,
			Description:       pgtype.Text{String: description, Valid: description != ""},
			Requirements:      requirements,
			ApplicationStatus: status,
			Notes:             pgtype.Text{String: notes, Valid: notes != ""},
			SourceUrl:         gofakeit.URL(),
			JobPortal:         pgtype.Text{String: portal, Valid: true},
		})
		if err != nil {
			log.Fatalf("Failed to create job %d (%s): %v", i+1, title, err)
		}
		fmt.Printf("  %3d. %s at %s (%s) — %s\n", i+1, job.Title, job.Company, job.Location, job.ApplicationStatus)
	}

	fmt.Println("\nSeed complete!")
	fmt.Printf("Login with email: demo@example.com / password: password123\n")
}
