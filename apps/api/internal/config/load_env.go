package config

import (
	"log"
	"os"
	"path/filepath"
	"runtime"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	_, filename, _, _ := runtime.Caller(0)
	dir := filepath.Dir(filename)

	// Walk up directories until a .env file found
	for {
		envPath := filepath.Join(dir, ".env")
		if _, err := os.Stat(envPath); err == nil {
			err := godotenv.Load(envPath)
			if err != nil {
				log.Fatal("Error loading .env file")
			}
			return
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			// Reached filesystem root without finding .env
			log.Fatal("Could not find .env file")
		}
		dir = parent
	}
}
