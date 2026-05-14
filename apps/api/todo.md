# Project Todo List: Get-A-J-B API

This list outlines the remaining tasks to complete the project and potential enhancements.

## 🚀 Core Features (Required to Finish)

### 1. Resume Management
- [x] **Implement Repository:** Complete `internal/repository/postgres/resume_repository.go` using the generated `sqlc` queries.
- [x] **Implement Service:** Complete `internal/service/resume_service.go` to handle business logic for resumes.
- [x] **Implement Handler:** Complete `internal/handler/resume_handler.go` with CRUD endpoints:
    - `POST /resumes`: Create a new resume.
    - `GET /resumes`: List all resumes for the authenticated user.
    - `GET /resumes/{id}`: Get a specific resume.
    - `PUT /resumes/{id}`: Update resume details.
    - `DELETE /resumes/{id}`: Delete a resume.

### 2. Main Application Bootstrap
- [x] **Database Connection:** Implement robust database connection logic in `cmd/api/main.go` using `pgx`.
- [x] **Dependency Injection:** Wire up all repositories, services, and handlers in `main.go`.
- [x] **Routing:** Register all endpoints in the router.
- [x] **Middleware Integration:** Apply `AuthMiddleware` to all protected routes (Jobs, Resumes, User management).
- [x] **Configuration:** Use environment variables for sensitive data (DB URL, JWT Secret, Port).

### 3. Verification & Validation
- [x] **API Testing:** Ensure all handlers have corresponding tests (similar to `user_repository_test.go`).
- [x] **Error Handling:** Ensure consistent error responses across all handlers using the `domain.ErrorResponse` struct.

---

## ✨ Nice-to-Have Features (Enhancements)

### 1. API Documentation
- [ ] Integrate **Swagger/OpenAPI** (e.g., using `swaggo/swag`) to provide interactive API documentation.

### 2. Advanced File Handling
- [ ] **Actual File Uploads:** Instead of just `file_url`, implement multi-part form uploads for Resume files.
- [ ] **Cloud Storage Integration:** Store uploaded resumes in AWS S3 or Google Cloud Storage.

### 3. Job Tracking Improvements
- [ ] **Search & Filter:** Add query parameters to `GET /jobs` for filtering by company, title, or status.
- [ ] **Pagination:** Implement pagination for Job and Resume listings.

### 4. User Experience & Security
- [ ] **Email Verification:** Implement a flow to verify user emails after registration.
- [ ] **Password Reset:** Add "Forgot Password" functionality.
- [ ] **Rate Limiting:** Protect the API from abuse using a rate-limiting middleware.
- [ ] **CORS Configuration:** Properly configure Cross-Origin Resource Sharing for frontend integration.

### 5. DevOps & Observability
- [ ] **Structured Logging:** Replace standard `log` with `slog` or `zap` for better traceability.
- [ ] **Health Checks:** Add a `/health` endpoint for monitoring.
- [ ] **CI/CD Pipeline:** Set up GitHub Actions for automated testing and linting.
- [ ] **Docker Compose:** Create a `docker-compose.yml` for easy local development setup including the database.
