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

type ResumeHandler struct {
	svc      domain.ResumeService
	validate *validator.Validate
}

func NewResumeHandler(svc domain.ResumeService) *ResumeHandler {
	v := validator.New()
	registerJSONTagNameFunc(v)
	return &ResumeHandler{svc: svc, validate: v}
}

func (h *ResumeHandler) CreateResume(w http.ResponseWriter, r *http.Request) {
	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusUnauthorized)
		return
	}
	var req domain.CreateResumeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(req); err != nil {
		writeValidationError(w, err)
		return
	}

	resume, err := h.svc.CreateResume(r.Context(), claims.UserID, &req)
	if errors.Is(err, domain.ErrUnauthorized) {
		writeJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	} else if err != nil {
		writeJSONError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(resume); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *ResumeHandler) GetAllResumes(w http.ResponseWriter, r *http.Request) {
	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	resumes, err := h.svc.GetAllResumes(r.Context(), claims.UserID)
	if err != nil {
		writeJSONError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resumes); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *ResumeHandler) GetResumeByID(w http.ResponseWriter, r *http.Request) {
	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSONError(w, "Invalid resume ID", http.StatusBadRequest)
		return
	}
	resume, err := h.svc.GetByID(r.Context(), id, claims.UserID)
	if errors.Is(err, domain.ErrResumeNotFound) {
		writeJSONError(w, "Resume not found", http.StatusNotFound)
		return
	} else if errors.Is(err, domain.ErrForbidden) {
		writeJSONError(w, "Forbidden", http.StatusForbidden)
		return
	} else if errors.Is(err, domain.ErrUnauthorized) {
		writeJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	} else if err != nil {
		writeJSONError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resume); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *ResumeHandler) UpdateResume(w http.ResponseWriter, r *http.Request) {
	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSONError(w, "Invalid resume ID", http.StatusBadRequest)
		return
	}

	var req domain.UpdateResumeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(req); err != nil {
		writeValidationError(w, err)
		return
	}

	resume, err := h.svc.UpdateResume(r.Context(), id, claims.UserID, &req)
	if errors.Is(err, domain.ErrResumeNotFound) {
		writeJSONError(w, "Resume not found", http.StatusNotFound)
		return
	} else if errors.Is(err, domain.ErrForbidden) {
		writeJSONError(w, "Forbidden", http.StatusForbidden)
		return
	} else if errors.Is(err, domain.ErrUnauthorized) {
		writeJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	} else if err != nil {
		writeJSONError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resume); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *ResumeHandler) DeleteResume(w http.ResponseWriter, r *http.Request) {
	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSONError(w, "Invalid resume ID", http.StatusBadRequest)
		return
	}

	err = h.svc.DeleteResume(r.Context(), id, claims.UserID)
	if errors.Is(err, domain.ErrResumeNotFound) {
		writeJSONError(w, "Resume not found", http.StatusNotFound)
		return
	} else if errors.Is(err, domain.ErrForbidden) {
		writeJSONError(w, "Forbidden", http.StatusForbidden)
		return
	} else if errors.Is(err, domain.ErrUnauthorized) {
		writeJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	} else if err != nil {
		writeJSONError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
