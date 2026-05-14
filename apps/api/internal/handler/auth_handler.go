package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"reflect"
	"strings"

	"github.com/ShoAnn/get-a-j-b/api/internal/domain"
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
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	if err := h.validate.Struct(input); err != nil {
		h.writeValidationError(w, err)
		return
	}

	authResponse, err := h.svc.Register(r.Context(), &domain.CreateUserRequest{
		Username: input.Username,
		Email:    input.Email,
		Password: input.Password,
	})
	if errors.Is(err, domain.ErrEmailAlreadyExists) {
		http.Error(w, "Email already exists", http.StatusConflict)
		return
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
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
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(input); err != nil {
		h.writeValidationError(w, err)
		return
	}

	authResponse, err := h.svc.Login(r.Context(), input.Email, input.Password)
	if errors.Is(err, domain.ErrInvalidCredentials) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(authResponse)
	if err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(input); err != nil {
		h.writeValidationError(w, err)
		return
	}

	err := h.svc.Logout(r.Context(), input.RefreshToken)
	if errors.Is(err, domain.ErrRefreshTokenNotFound) {
		http.Error(w, "Refresh token not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(input); err != nil {
		h.writeValidationError(w, err)
		return
	}

	authResponse, err := h.svc.RefreshToken(r.Context(), input.RefreshToken)
	switch {
	case errors.Is(err, domain.ErrRefreshTokenNotFound):
		http.Error(w, "Refresh token not found", http.StatusNotFound)
		return
	case errors.Is(err, domain.ErrRefreshTokenInvalid):
		http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	case errors.Is(err, domain.ErrRefreshTokenExpired):
		http.Error(w, "Refresh token expired", http.StatusUnauthorized)
		return
	case errors.Is(err, domain.ErrRefreshTokenRevoked):
		http.Error(w, "Refresh token revoked", http.StatusUnauthorized)
		return
	case err != nil:
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(authResponse)
	if err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *AuthHandler) writeValidationError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"errors": h.formatValidationErrors(err),
	})
}

func (h *AuthHandler) formatValidationErrors(err error) map[string]string {
	messages := make(map[string]string)
	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		for _, fe := range ve {
			messages[fe.Field()] = validationMessage(fe)
		}
	}
	return messages
}
