package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

func validationMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "this field is required"
	case "email":
		return "must be a valid email address"
	case "min":
		return fmt.Sprintf("must be at least %s characters", fe.Param())
	case "max":
		return fmt.Sprintf("must be at most %s characters", fe.Param())
	default:
		return "invalid value"
	}
}

func writeValidationError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"errors": formatValidationErrors(err),
	}); err != nil {
		log.Printf("Failed to encode validation error response: %v", err)
	}
}

func formatValidationErrors(err error) map[string]string {
	messages := make(map[string]string)
	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		for _, fe := range ve {
			messages[fe.Field()] = validationMessage(fe)
		}
	}
	return messages
}

func registerJSONTagNameFunc(v *validator.Validate) {
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := fld.Tag.Get("json")
		if name == "" || name == "-" {
			return fld.Name
		}
		return strings.Split(name, ",")[0]
	})
}

func setAccessTokenCookie(w http.ResponseWriter)
