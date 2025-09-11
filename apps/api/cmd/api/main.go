package main

import (
	"fmt"
	"log"
	"net/http"
)


func main() {
	http.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "ok"}`))
	})

	fmt.Println("Go API server starting on port 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
