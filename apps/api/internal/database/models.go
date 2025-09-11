package database

import "time"

type Job struct {
	ID              string    `json:"id"`
	Title           string    `json:"name"`
	Company         string    `json:"company"`
	Source          string    `json:"source"`
	Salary          string    `json:"salary"`
	Description     string    `json:"description"`
	Requirements    string    `json:"requirements"`
	CurrentStatus   string    `json:"currentStatus"`
	ApplicationDate string    `json:"applicationDate"`
	Notes           string    `json:"notes"`
	JobUrl          string    `json:"jobUrl"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}
