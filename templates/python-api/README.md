# Python API Template

A Python REST API scaffold with FastAPI or Flask, optional database support, Docker, and testing.

## Features

- Choice of FastAPI (modern, async) or Flask (lightweight)
- Optional SQLAlchemy database support (PostgreSQL, SQLite, MySQL)
- Optional Docker support with docker-compose
- Optional pytest testing setup
- Pydantic for data validation (FastAPI)
- CORS middleware configured
- Health check endpoint

## Usage

```bash
# Generate with defaults (FastAPI)
upg generate python-api

# Generate with Flask
upg generate python-api --framework flask

# Generate with PostgreSQL
upg generate python-api --use-database --database-type postgres
```

## Configuration Options

| Option           | Type    | Default           | Description         |
| ---------------- | ------- | ----------------- | ------------------- |
| `project_name`   | string  | my-api            | Project name        |
| `description`    | string  | A Python REST API | Project description |
| `author_name`    | string  | (from env)        | Author name         |
| `framework`      | select  | fastapi           | Web framework       |
| `use_database`   | boolean | true              | Include database    |
| `database_type`  | select  | postgres          | Database type       |
| `use_docker`     | boolean | true              | Include Docker      |
| `use_testing`    | boolean | true              | Include testing     |
| `python_version` | select  | 3.11              | Python version      |

## After Generation

1. Create virtual environment: `python -m venv venv`
2. Activate: `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Run: `python main.py`
5. Open http://localhost:8000

## API Documentation

FastAPI automatically generates API docs at:

- `/docs` - Swagger UI
- `/redoc` - ReDoc

## License

MIT
