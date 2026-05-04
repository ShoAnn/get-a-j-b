package domain

type ErrorResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (e *ErrorResponse) Error() string {
	return e.Message
}

var (
	ErrInvalidCredentials   = &ErrorResponse{Code: 401, Message: "Invalid email or password"}
	ErrEmailAlreadyExists   = &ErrorResponse{Code: 409, Message: "Email already exists"}
	ErrUserNotFound         = &ErrorResponse{Code: 404, Message: "User not found"}
	ErrUnauthorized         = &ErrorResponse{Code: 401, Message: "Unauthorized"}
	ErrInvalidInput         = &ErrorResponse{Code: 400, Message: "Invalid input"}
	ErrRefreshTokenNotFound = &ErrorResponse{Code: 404, Message: "Refresh token not found"}
	ErrRefreshTokenExpired  = &ErrorResponse{Code: 401, Message: "Refresh token expired"}
	ErrRefreshTokenRevoked  = &ErrorResponse{Code: 401, Message: "Refresh token revoked"}
)

var AppName = "get-a-j-b"
