package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"reflect"
	"strings"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
	"github.com/ShoAnn/get-a-j-b/api/internal/middleware"
	"github.com/go-playground/validator/v10"
)

type AuthHandler struct {
	svc      domain.AuthService
	validate *validator.Validate
}

func NewAuthHandler(svc domain.AuthService) *AuthHandler {
	v := validator.New()
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := fld.Tag.Get("json")
		if name == "" || name == "-" {
			return fld.Name
		}
		return strings.Split(name, ",")[0]
	})
	return &AuthHandler{svc: svc, validate: v}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Username string `json:"username" validate:"required"`
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=6"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSONError(w, "invalid input", http.StatusBadRequest)
		return
	}
	if err := h.validate.Struct(input); err != nil {
		writeValidationError(w, err)
		return
	}

	authResponse, err := h.svc.Register(r.Context(), &domain.CreateUserRequest{
		Username: input.Username,
		Email:    input.Email,
		Password: input.Password,
	})
	if errors.Is(err, domain.ErrEmailAlreadyExists) {
		writeJSONError(w, "email already exist", http.StatusConflict)
		return
	} else if err != nil {
		writeJSONError(w, "internal server error", http.StatusConflict)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	err = json.NewEncoder(w).Encode(authResponse)
	if err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSONError(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(input); err != nil {
		writeValidationError(w, err)
		return
	}

	authResponse, err := h.svc.Login(r.Context(), input.Email, input.Password)
	if errors.Is(err, domain.ErrInvalidCredentials) {
		writeJSONError(w, "Invalid credentials", http.StatusUnauthorized)
		return
	} else if err != nil {
		writeJSONError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(authResponse)
	if err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// get token from header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		writeJSONError(w, "Unauthorized access", http.StatusBadRequest)
		return
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		writeJSONError(w, "Unauthorized access", http.StatusBadRequest)
		return
	}

	// FUTURE NOTE: change empty json to no json if necessary
	var input struct{}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSONError(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err := h.svc.Logout(r.Context(), parts[1])
	if errors.Is(err, domain.ErrRefreshTokenNotFound) {
		writeJSONError(w, "Refresh token not found", http.StatusNotFound)
		return
	} else if err != nil {
		writeJSONError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSONError(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(input); err != nil {
		writeValidationError(w, err)
		return
	}

	authResponse, err := h.svc.RefreshToken(r.Context(), input.RefreshToken)
	switch {
	case errors.Is(err, domain.ErrRefreshTokenNotFound):
		writeJSONError(w, "Refresh token not found", http.StatusNotFound)
		return
	case errors.Is(err, domain.ErrRefreshTokenInvalid):
		writeJSONError(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	case errors.Is(err, domain.ErrRefreshTokenExpired):
		writeJSONError(w, "Refresh token expired", http.StatusUnauthorized)
		return
	case errors.Is(err, domain.ErrRefreshTokenRevoked):
		writeJSONError(w, "Refresh token revoked", http.StatusUnauthorized)
		return
	case err != nil:
		writeJSONError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(authResponse)
	if err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}
