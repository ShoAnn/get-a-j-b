package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/go-playground/validator/v10"
)

type UserHandler struct {
	svc      domain.UserService
	validate *validator.Validate
}

func NewUserHandler(svc domain.UserService) *UserHandler {
	v := validator.New()
	registerJSONTagNameFunc(v)
	return &UserHandler{svc: svc, validate: v}
}

func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.svc.GetAllUsers(r.Context())
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(users); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *UserHandler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	user, err := h.svc.GetUserByID(r.Context(), id)
	if errors.Is(err, domain.ErrUserNotFound) {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var input domain.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(input); err != nil {
		writeValidationError(w, err)
		return
	}

	user, err := h.svc.UpdateUser(r.Context(), id, &input)
	if errors.Is(err, domain.ErrUserNotFound) {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	} else if errors.Is(err, domain.ErrUnauthorized) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	} else if errors.Is(err, domain.ErrEmailAlreadyExists) {
		http.Error(w, "Email already exists", http.StatusConflict)
		return
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	err = h.svc.DeleteUser(r.Context(), id)
	if errors.Is(err, domain.ErrUserNotFound) {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
