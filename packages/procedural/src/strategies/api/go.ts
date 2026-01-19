/**
 * Go Backend Strategies
 *
 * Generates Go backend projects (Gin, Echo).
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Gin backend strategy
 */
export const GinStrategy: GenerationStrategy = {
  id: 'gin',
  name: 'Gin Backend',
  priority: 10,

  matches: (stack) =>
    stack.language === 'go' &&
    stack.archetype === 'backend' &&
    stack.framework === 'gin',

  apply: async ({ files, projectName, stack }) => {
    // go.mod
    files['go.mod'] = `module ${projectName}

go 1.22

require (
	github.com/gin-gonic/gin v1.9.1
)
`;

    // Main entry
    files['main.go'] = `package main

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

type HealthResponse struct {
	Status    string \`json:"status"\`
	Timestamp string \`json:"timestamp"\`
}

type ApiResponse struct {
	Message string \`json:"message"\`
}

func main() {
	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, HealthResponse{
			Status:    "ok",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
	})

	// API root
	r.GET("/api", func(c *gin.Context) {
		c.JSON(http.StatusOK, ApiResponse{
			Message: "Welcome to ${projectName} API",
		})
	})

	// Get port from env or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
`;

    // Add database setup if needed
    if (stack.orm === 'gorm' && stack.database !== 'none') {
      addGormSetup(files, stack.database, projectName);
    }

    // Test file
    files['main_test.go'] = `package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	return r
}

func TestHealthCheck(t *testing.T) {
	router := setupRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}
`;

    // Makefile
    files['Makefile'] = `GO := go
BINARY := bin/${projectName}

.PHONY: build run test lint clean tidy

build:
\t$(GO) build -o $(BINARY) .

run:
\t$(GO) run .

dev:
\tGIN_MODE=debug $(GO) run .

test:
\t$(GO) test -v ./...

lint:
\tgolangci-lint run

tidy:
\t$(GO) mod tidy

clean:
\trm -rf bin/
`;

    // .env.example
    files['.env.example'] = `PORT=8080
GIN_MODE=release
`;
  },
};

/**
 * Echo backend strategy
 */
export const EchoStrategy: GenerationStrategy = {
  id: 'echo',
  name: 'Echo Backend',
  priority: 10,

  matches: (stack) =>
    stack.language === 'go' &&
    stack.archetype === 'backend' &&
    stack.framework === 'echo',

  apply: async ({ files, projectName, stack }) => {
    // go.mod
    files['go.mod'] = `module ${projectName}

go 1.22

require (
	github.com/labstack/echo/v4 v4.11.4
)
`;

    // Main entry
    files['main.go'] = `package main

import (
	"net/http"
	"os"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type HealthResponse struct {
	Status    string \`json:"status"\`
	Timestamp string \`json:"timestamp"\`
}

type ApiResponse struct {
	Message string \`json:"message"\`
}

func main() {
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Health check
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, HealthResponse{
			Status:    "ok",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
	})

	// API root
	e.GET("/api", func(c echo.Context) error {
		return c.JSON(http.StatusOK, ApiResponse{
			Message: "Welcome to ${projectName} API",
		})
	})

	// Get port from env or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	e.Logger.Fatal(e.Start(":" + port))
}
`;

    // Add database setup if needed
    if (stack.orm === 'gorm' && stack.database !== 'none') {
      addGormSetup(files, stack.database, projectName);
    }

    // Test file
    files['main_test.go'] = `package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestHealthCheck(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	handler := func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	}

	if err := handler(c); err != nil {
		t.Errorf("Handler returned error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}
}
`;

    // Makefile
    files['Makefile'] = `GO := go
BINARY := bin/${projectName}

.PHONY: build run test lint clean tidy

build:
\t$(GO) build -o $(BINARY) .

run:
\t$(GO) run .

dev:
\tECHO_DEBUG=true $(GO) run .

test:
\t$(GO) test -v ./...

lint:
\tgolangci-lint run

tidy:
\t$(GO) mod tidy

clean:
\trm -rf bin/
`;
  },
};

/**
 * Cobra CLI strategy for Go
 */
export const CobraStrategy: GenerationStrategy = {
  id: 'cobra',
  name: 'Cobra CLI',
  priority: 10,

  matches: (stack) =>
    stack.language === 'go' &&
    stack.archetype === 'cli' &&
    stack.framework === 'cobra',

  apply: async ({ files, projectName }) => {
    // go.mod
    files['go.mod'] = `module ${projectName}

go 1.22

require (
	github.com/spf13/cobra v1.8.0
)
`;

    // Main entry
    files['main.go'] = `package main

import (
	"${projectName}/cmd"
)

func main() {
	cmd.Execute()
}
`;

    // Root command
    files['cmd/root.go'] = `package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "${projectName}",
	Short: "A CLI tool",
	Long:  \`${projectName} is a CLI tool built with Cobra.\`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.AddCommand(helloCmd)
	rootCmd.AddCommand(versionCmd)
}
`;

    // Hello command
    files['cmd/hello.go'] = `package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var name string

var helloCmd = &cobra.Command{
	Use:   "hello",
	Short: "Say hello",
	Long:  \`Prints a greeting message.\`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("Hello, %s!\\n", name)
	},
}

func init() {
	helloCmd.Flags().StringVarP(&name, "name", "n", "World", "Name to greet")
}
`;

    // Version command
    files['cmd/version.go'] = `package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var Version = "0.1.0"

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print version",
	Long:  \`Print the version number of ${projectName}.\`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("${projectName} v%s\\n", Version)
	},
}
`;

    // Makefile
    files['Makefile'] = `GO := go
BINARY := bin/${projectName}
VERSION := 0.1.0

.PHONY: build install test lint clean tidy

build:
\t$(GO) build -ldflags "-X ${projectName}/cmd.Version=$(VERSION)" -o $(BINARY) .

install:
\t$(GO) install -ldflags "-X ${projectName}/cmd.Version=$(VERSION)" .

test:
\t$(GO) test -v ./...

lint:
\tgolangci-lint run

tidy:
\t$(GO) mod tidy

clean:
\trm -rf bin/
`;
  },
};

/**
 * Add GORM setup for Go projects
 */
function addGormSetup(files: Record<string, string>, database: string, _projectName: string): void {
  let driver = 'postgres';
  let url = 'host=localhost user=postgres password=postgres dbname=db port=5432';

  if (database === 'mysql') {
    driver = 'mysql';
    url = 'user:password@tcp(127.0.0.1:3306)/db?charset=utf8mb4&parseTime=True&loc=Local';
  } else if (database === 'sqlite') {
    driver = 'sqlite';
    url = './app.db';
  }

  // Update go.mod
  const goMod = files['go.mod'];
  files['go.mod'] = goMod + `
require (
	gorm.io/gorm v1.25.5
	gorm.io/driver/${driver} v1.5.4
)
`;

  // Database package
  files['db/db.go'] = `package db

import (
	"os"

	"gorm.io/driver/${driver}"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "${url}"
	}

	var err error
	DB, err = gorm.Open(${driver}.Open(dsn), &gorm.Config{})
	return err
}
`;

  // Models package
  files['models/user.go'] = `package models

import (
	"time"
)

type User struct {
	ID        string \`gorm:"primaryKey"\`
	Email     string \`gorm:"uniqueIndex"\`
	Name      *string
	CreatedAt time.Time
	UpdatedAt time.Time
}
`;

  // .env.example
  files['.env.example'] = `DATABASE_URL=${url}
PORT=8080
`;
}
