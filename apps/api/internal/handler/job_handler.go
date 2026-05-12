package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/ShoAnn/get-a-j-b/api/internal/middleware"
	"github.com/go-playground/validator/v10"
)

type JobHandler struct {
	svc      domain.JobService
	validate *validator.Validate
}

func NewJobHandler(svc domain.JobService) *JobHandler {
	v := validator.New()
	registerJSONTagNameFunc(v)
	return &JobHandler{svc: svc, validate: v}
}

func (h *JobHandler) CreateJob(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateJobRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(req); err != nil {
		writeValidationError(w, err)
		return
	}

	job, err := h.svc.CreateJob(r.Context(), &req)
	if errors.Is(err, domain.ErrUnauthorized) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(job); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *JobHandler) GetAllJobs(w http.ResponseWriter, r *http.Request) {
	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		http.Error(w, "claims not found in context", http.StatusNotFound)
		return
	}
	jobs, err := h.svc.ListAllJobs(r.Context(), claims.UserID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(jobs); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *JobHandler) GetJobByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		http.Error(w, "Claims not found in context", http.StatusNotFound)
		return
	}
	job, err := h.svc.GetJobByID(r.Context(), id, claims.UserID)
	if errors.Is(err, domain.ErrJobNotFound) {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(job); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *JobHandler) UpdateJob(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}
	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		http.Error(w, "Claims not found in context", http.StatusNotFound)
		return
	}

	var req domain.UpdateJobRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	if err := h.validate.Struct(req); err != nil {
		writeValidationError(w, err)
		return
	}

	job, err := h.svc.UpdateJob(r.Context(), id, claims.UserID, &req)
	if errors.Is(err, domain.ErrUnauthorized) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	} else if errors.Is(err, domain.ErrJobNotFound) {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(job); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *JobHandler) DeleteJob(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}
	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		http.Error(w, "Claims not found in context", http.StatusNotFound)
		return
	}

	err = h.svc.DeleteJob(r.Context(), id, claims.UserID)
	if errors.Is(err, domain.ErrUnauthorized) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	} else if errors.Is(err, domain.ErrJobNotFound) {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
