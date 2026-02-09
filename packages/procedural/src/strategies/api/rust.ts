/**
 * Rust Backend Strategies
 *
 * Generates Rust backend projects (Axum, Actix).
 * Tier 1 stacks (Axum) load templates from templates/procedural/.
 */

import type { GenerationStrategy } from '../../types.js';
import { renderTemplateSet, getTemplateSetId, type TemplateContext } from '../../renderer/index.js';

/**
 * Build a TemplateContext from the generation context
 */
function buildTemplateContext(
  projectName: string,
  stack: {
    language: string;
    database: string;
    orm: string;
    framework: string;
    archetype: string;
    runtime: string;
    transport: string;
    packaging: string;
    cicd: string;
  }
): TemplateContext {
  return {
    projectName,
    isTypeScript: false,
    database: stack.database,
    orm: stack.orm,
    framework: stack.framework,
    archetype: stack.archetype,
    language: stack.language,
    runtime: stack.runtime,
    transport: stack.transport,
    packaging: stack.packaging,
    cicd: stack.cicd,
  };
}

/**
 * Axum backend strategy
 */
export const AxumStrategy: GenerationStrategy = {
  id: 'axum',
  name: 'Axum Backend',
  priority: 10,

  matches: stack =>
    stack.language === 'rust' && stack.archetype === 'backend' && stack.framework === 'axum',

  apply: async ({ files, projectName, stack }) => {
    const templateCtx = buildTemplateContext(projectName, stack);

    // Try to load from Nunjucks templates
    const templateSetId = getTemplateSetId(stack.archetype, stack.language, stack.framework);
    if (templateSetId) {
      const rendered = renderTemplateSet(templateSetId, templateCtx);
      if (Object.keys(rendered).length > 0) {
        for (const [path, content] of Object.entries(rendered)) {
          files[path] = content;
        }

        // Add database setup if needed (not yet templated)
        if (stack.database !== 'none' && stack.database !== 'mongodb') {
          addSqlxSetup(files, stack.database, projectName);
        }

        return;
      }
    }

    // Fallback: inline generation (original code)
    // Cargo.toml
    const dependencies: string[] = [
      'axum = "0.7"',
      'tokio = { version = "1", features = ["full"] }',
      'serde = { version = "1", features = ["derive"] }',
      'serde_json = "1"',
      'tower = "0.4"',
      'tower-http = { version = "0.5", features = ["cors", "trace"] }',
      'tracing = "0.1"',
      'tracing-subscriber = { version = "0.3", features = ["env-filter"] }',
    ];

    if (stack.database === 'postgres') {
      dependencies.push('sqlx = { version = "0.7", features = ["runtime-tokio", "postgres"] }');
    } else if (stack.database === 'sqlite') {
      dependencies.push('sqlx = { version = "0.7", features = ["runtime-tokio", "sqlite"] }');
    }

    files['Cargo.toml'] = `[package]
name = "${projectName.replace(/-/g, '_')}"
version = "0.1.0"
edition = "2021"

[dependencies]
${dependencies.join('\n')}

[dev-dependencies]
tokio-test = "0.4"
`;

    // Main entry
    files['src/main.rs'] = `use axum::{
    routing::get,
    Json, Router,
};
use serde::Serialize;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    timestamp: String,
}

#[derive(Serialize)]
struct ApiResponse {
    message: String,
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

async fn root() -> Json<ApiResponse> {
    Json(ApiResponse {
        message: "Welcome to ${projectName} API".to_string(),
    })
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api", get(root))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    // Run server
    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_health_check() {
        let response = health_check().await;
        assert_eq!(response.0.status, "ok");
    }
}
`;

    // Add chrono dependency for timestamps
    const cargoContent = files['Cargo.toml'];
    files['Cargo.toml'] = cargoContent.replace(
      'tracing-subscriber',
      'chrono = { version = "0.4", features = ["serde"] }\ntracing-subscriber'
    );

    // Add database setup if needed
    if (stack.database !== 'none' && stack.database !== 'mongodb') {
      addSqlxSetup(files, stack.database, projectName);
    }

    // Makefile
    files['Makefile'] = `CARGO := cargo

.PHONY: build run test lint fmt clean

build:
\t$(CARGO) build --release

run:
\t$(CARGO) run

dev:
\tRUST_LOG=debug $(CARGO) watch -x run

test:
\t$(CARGO) test

lint:
\t$(CARGO) clippy -- -D warnings

fmt:
\t$(CARGO) fmt

clean:
\t$(CARGO) clean
`;
  },
};

/**
 * Actix Web backend strategy
 */
export const ActixStrategy: GenerationStrategy = {
  id: 'actix',
  name: 'Actix Web Backend',
  priority: 10,

  matches: stack =>
    stack.language === 'rust' && stack.archetype === 'backend' && stack.framework === 'actix',

  apply: async ({ files, projectName, stack }) => {
    // Cargo.toml
    const dependencies: string[] = [
      'actix-web = "4"',
      'actix-cors = "0.7"',
      'tokio = { version = "1", features = ["full"] }',
      'serde = { version = "1", features = ["derive"] }',
      'serde_json = "1"',
      'chrono = { version = "0.4", features = ["serde"] }',
      'env_logger = "0.10"',
      'log = "0.4"',
    ];

    if (stack.database === 'postgres') {
      dependencies.push('sqlx = { version = "0.7", features = ["runtime-tokio", "postgres"] }');
    } else if (stack.database === 'sqlite') {
      dependencies.push('sqlx = { version = "0.7", features = ["runtime-tokio", "sqlite"] }');
    }

    files['Cargo.toml'] = `[package]
name = "${projectName.replace(/-/g, '_')}"
version = "0.1.0"
edition = "2021"

[dependencies]
${dependencies.join('\n')}

[dev-dependencies]
actix-rt = "2"
`;

    // Main entry
    files['src/main.rs'] = `use actix_cors::Cors;
use actix_web::{get, web, App, HttpResponse, HttpServer, Responder};
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    timestamp: String,
}

#[derive(Serialize)]
struct ApiResponse {
    message: String,
}

#[get("/health")]
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(HealthResponse {
        status: "ok".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

#[get("/api")]
async fn root() -> impl Responder {
    HttpResponse::Ok().json(ApiResponse {
        message: "Welcome to ${projectName} API".to_string(),
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    log::info!("Starting server at http://0.0.0.0:{}", port);

    HttpServer::new(|| {
        let cors = Cors::permissive();

        App::new()
            .wrap(cors)
            .service(health_check)
            .service(root)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::test;

    #[actix_rt::test]
    async fn test_health_check() {
        let app = test::init_service(App::new().service(health_check)).await;
        let req = test::TestRequest::get().uri("/health").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }
}
`;

    // Makefile
    files['Makefile'] = `CARGO := cargo

.PHONY: build run test lint fmt clean

build:
\t$(CARGO) build --release

run:
\t$(CARGO) run

dev:
\tRUST_LOG=debug $(CARGO) watch -x run

test:
\t$(CARGO) test

lint:
\t$(CARGO) clippy -- -D warnings

fmt:
\t$(CARGO) fmt

clean:
\t$(CARGO) clean
`;
  },
};

/**
 * Add SQLx setup for Rust projects
 */
function addSqlxSetup(files: Record<string, string>, database: string, _projectName: string): void {
  let url = 'postgres://user:password@localhost:5432/db';

  if (database === 'sqlite') {
    url = 'sqlite://./app.db';
  }

  // .env.example
  files['.env.example'] = `DATABASE_URL=${url}
RUST_LOG=info
`;

  // Database module
  files['src/db.rs'] =
    `use sqlx::${database === 'sqlite' ? 'sqlite' : 'postgres'}::${database === 'sqlite' ? 'Sqlite' : 'Postgres'}Pool;
use std::env;

pub type DbPool = ${database === 'sqlite' ? 'Sqlite' : 'Postgres'}Pool;

pub async fn create_pool() -> Result<DbPool, sqlx::Error> {
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    ${database === 'sqlite' ? 'Sqlite' : 'Postgres'}Pool::connect(&database_url).await
}
`;

  // sqlx.toml
  files['.sqlx/query-*.json'] = ''; // Placeholder for SQLx query cache
}

/**
 * Clap CLI strategy for Rust
 */
export const ClapStrategy: GenerationStrategy = {
  id: 'clap',
  name: 'Clap CLI',
  priority: 10,

  matches: stack =>
    stack.language === 'rust' && stack.archetype === 'cli' && stack.framework === 'clap',

  apply: async ({ files, projectName }) => {
    // Cargo.toml
    files['Cargo.toml'] = `[package]
name = "${projectName.replace(/-/g, '_')}"
version = "0.1.0"
edition = "2021"

[dependencies]
clap = { version = "4", features = ["derive"] }
anyhow = "1"
`;

    // Main entry
    files['src/main.rs'] = `use clap::{Parser, Subcommand};
use anyhow::Result;

#[derive(Parser)]
#[command(name = "${projectName}")]
#[command(about = "A CLI tool", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run a greeting
    Hello {
        /// Name to greet
        #[arg(short, long, default_value = "World")]
        name: String,
    },
    /// Show version info
    Version,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Hello { name } => {
            println!("Hello, {}!", name);
        }
        Commands::Version => {
            println!("{} v{}", env!("CARGO_PKG_NAME"), env!("CARGO_PKG_VERSION"));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_hello() {
        // Add tests here
        assert!(true);
    }
}
`;

    // Makefile
    files['Makefile'] = `CARGO := cargo

.PHONY: build install test lint fmt clean

build:
\t$(CARGO) build --release

install:
\t$(CARGO) install --path .

test:
\t$(CARGO) test

lint:
\t$(CARGO) clippy -- -D warnings

fmt:
\t$(CARGO) fmt

clean:
\t$(CARGO) clean
`;
  },
};
