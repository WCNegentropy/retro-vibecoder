/**
 * Python Backend Strategies
 *
 * Generates Python backend projects (FastAPI, Flask, Django).
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * FastAPI backend strategy
 */
export const FastAPIStrategy: GenerationStrategy = {
  id: 'fastapi',
  name: 'FastAPI Backend',
  priority: 10,

  matches: stack =>
    stack.language === 'python' && stack.archetype === 'backend' && stack.framework === 'fastapi',

  apply: async ({ files, projectName, stack }) => {
    // requirements.txt
    const requirements = [
      'fastapi>=0.109.0',
      'uvicorn[standard]>=0.27.0',
      'pydantic>=2.5.0',
      'python-dotenv>=1.0.0',
    ];

    if (stack.database === 'postgres') {
      requirements.push('asyncpg>=0.29.0');
      requirements.push('sqlalchemy>=2.0.0');
    } else if (stack.database === 'mysql') {
      requirements.push('aiomysql>=0.2.0');
      requirements.push('sqlalchemy>=2.0.0');
    } else if (stack.database === 'sqlite') {
      requirements.push('aiosqlite>=0.19.0');
      requirements.push('sqlalchemy>=2.0.0');
    } else if (stack.database === 'mongodb') {
      requirements.push('motor>=3.3.0');
    }

    files['requirements.txt'] = requirements.join('\n') + '\n';

    // requirements-dev.txt
    files['requirements-dev.txt'] = `pytest>=7.4.0
pytest-asyncio>=0.23.0
httpx>=0.26.0
ruff>=0.1.0
mypy>=1.8.0
`;

    // pyproject.toml
    files['pyproject.toml'] = `[project]
name = "${projectName}"
version = "0.1.0"
description = "A FastAPI backend service"
requires-python = ">=3.12"

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W"]

[tool.mypy]
python_version = "3.12"
strict = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
`;

    // Main entry
    files['main.py'] = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI(
    title="${projectName}",
    description="A FastAPI backend service",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.get("/api")
async def root():
    """Root API endpoint."""
    return {"message": f"Welcome to ${projectName} API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;

    // Add SQLAlchemy models if using SQL database
    if (stack.orm === 'sqlalchemy' && stack.database !== 'none' && stack.database !== 'mongodb') {
      addSQLAlchemySetup(files, stack.database);
    }

    // Tests
    files['tests/__init__.py'] = '';
    files['tests/test_main.py'] = `import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_root(client):
    response = await client.get("/api")
    assert response.status_code == 200
`;

    // .env.example
    files['.env.example'] = getDatabaseEnvExample(stack.database);

    // Makefile
    files['Makefile'] = `PYTHON := python3
VENV := .venv

.PHONY: setup dev test lint format clean

setup:
\t$(PYTHON) -m venv $(VENV)
\t$(VENV)/bin/pip install -r requirements.txt -r requirements-dev.txt

dev:
\t$(VENV)/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000

test:
\t$(VENV)/bin/pytest

lint:
\t$(VENV)/bin/ruff check .
\t$(VENV)/bin/mypy .

format:
\t$(VENV)/bin/ruff format .

clean:
\trm -rf $(VENV) __pycache__ .pytest_cache .mypy_cache .ruff_cache
`;
  },
};

/**
 * Flask backend strategy
 */
export const FlaskStrategy: GenerationStrategy = {
  id: 'flask',
  name: 'Flask Backend',
  priority: 10,

  matches: stack =>
    stack.language === 'python' && stack.archetype === 'backend' && stack.framework === 'flask',

  apply: async ({ files, projectName, stack }) => {
    // requirements.txt
    const requirements = ['flask>=3.0.0', 'python-dotenv>=1.0.0', 'gunicorn>=21.0.0'];

    if (stack.database !== 'none' && stack.database !== 'mongodb') {
      requirements.push('flask-sqlalchemy>=3.1.0');
    }

    files['requirements.txt'] = requirements.join('\n') + '\n';

    // requirements-dev.txt
    files['requirements-dev.txt'] = `pytest>=7.4.0
ruff>=0.1.0
mypy>=1.8.0
`;

    // pyproject.toml
    files['pyproject.toml'] = `[project]
name = "${projectName}"
version = "0.1.0"
description = "A Flask backend service"
requires-python = ">=3.12"

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.mypy]
python_version = "3.12"
strict = true
`;

    // Main entry
    files['main.py'] = `from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)


@app.route("/health")
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})


@app.route("/api")
def root():
    """Root API endpoint."""
    return jsonify({"message": "Welcome to ${projectName} API"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
`;

    // Tests
    files['tests/__init__.py'] = '';
    files['tests/test_main.py'] = `import pytest
from main import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"


def test_root(client):
    response = client.get("/api")
    assert response.status_code == 200
`;

    // Makefile
    files['Makefile'] = `PYTHON := python3
VENV := .venv

.PHONY: setup dev test lint clean

setup:
\t$(PYTHON) -m venv $(VENV)
\t$(VENV)/bin/pip install -r requirements.txt -r requirements-dev.txt

dev:
\tFLASK_DEBUG=1 $(VENV)/bin/flask run --host=0.0.0.0 --port=8000

test:
\t$(VENV)/bin/pytest

lint:
\t$(VENV)/bin/ruff check .
\t$(VENV)/bin/mypy .

clean:
\trm -rf $(VENV) __pycache__ .pytest_cache .mypy_cache
`;
  },
};

/**
 * Django backend strategy
 */
export const DjangoStrategy: GenerationStrategy = {
  id: 'django',
  name: 'Django Backend',
  priority: 10,

  matches: stack =>
    stack.language === 'python' && stack.archetype === 'backend' && stack.framework === 'django',

  apply: async ({ files, projectName }) => {
    const appName = projectName.replace(/-/g, '_');

    // requirements.txt
    files['requirements.txt'] = `django>=5.0.0
djangorestframework>=3.14.0
python-dotenv>=1.0.0
gunicorn>=21.0.0
`;

    // requirements-dev.txt
    files['requirements-dev.txt'] = `pytest>=7.4.0
pytest-django>=4.7.0
ruff>=0.1.0
mypy>=1.8.0
django-stubs>=4.2.0
`;

    // pyproject.toml
    files['pyproject.toml'] = `[project]
name = "${projectName}"
version = "0.1.0"
description = "A Django backend service"
requires-python = ">=3.12"

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.mypy]
python_version = "3.12"
plugins = ["mypy_django_plugin.main"]
strict = true

[tool.django-stubs]
django_settings_module = "${appName}.settings"

[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "${appName}.settings"
`;

    // manage.py
    files['manage.py'] = `#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "${appName}.settings")
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
`;

    // settings.py
    files[`${appName}/settings.py`] = `from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

DEBUG = os.environ.get("DEBUG", "True") == "True"

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "rest_framework",
    "api",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "${appName}.urls"

TEMPLATES = []

WSGI_APPLICATION = "${appName}.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "UNAUTHENTICATED_USER": None,
}
`;

    // urls.py
    files[`${appName}/urls.py`] = `from django.urls import path, include

urlpatterns = [
    path("", include("api.urls")),
]
`;

    // wsgi.py
    files[`${appName}/wsgi.py`] = `import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "${appName}.settings")
application = get_wsgi_application()
`;

    // __init__.py
    files[`${appName}/__init__.py`] = '';

    // API app
    files['api/__init__.py'] = '';

    files['api/views.py'] = `from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime


@api_view(["GET"])
def health_check(request):
    return Response({"status": "ok", "timestamp": datetime.now().isoformat()})


@api_view(["GET"])
def root(request):
    return Response({"message": "Welcome to ${projectName} API"})
`;

    files['api/urls.py'] = `from django.urls import path
from . import views

urlpatterns = [
    path("health", views.health_check),
    path("api", views.root),
]
`;

    // Makefile
    files['Makefile'] = `PYTHON := python3
VENV := .venv

.PHONY: setup dev test lint migrate clean

setup:
\t$(PYTHON) -m venv $(VENV)
\t$(VENV)/bin/pip install -r requirements.txt -r requirements-dev.txt

dev:
\t$(VENV)/bin/python manage.py runserver 0.0.0.0:8000

test:
\t$(VENV)/bin/pytest

lint:
\t$(VENV)/bin/ruff check .
\t$(VENV)/bin/mypy .

migrate:
\t$(VENV)/bin/python manage.py migrate

clean:
\trm -rf $(VENV) __pycache__ .pytest_cache .mypy_cache db.sqlite3
`;
  },
};

/**
 * Add SQLAlchemy setup for Python projects
 */
function addSQLAlchemySetup(files: Record<string, string>, database: string): void {
  let url = 'postgresql+asyncpg://user:password@localhost:5432/db';

  if (database === 'mysql') {
    url = 'mysql+aiomysql://user:password@localhost:3306/db';
  } else if (database === 'sqlite') {
    url = 'sqlite+aiosqlite:///./app.db';
  }

  files['database.py'] = `from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "${url}")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
`;

  files['models.py'] = `from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
`;
}

/**
 * Get database environment example
 */
function getDatabaseEnvExample(database: string): string {
  switch (database) {
    case 'postgres':
      return 'DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/db\n';
    case 'mysql':
      return 'DATABASE_URL=mysql+aiomysql://user:password@localhost:3306/db\n';
    case 'sqlite':
      return 'DATABASE_URL=sqlite+aiosqlite:///./app.db\n';
    case 'mongodb':
      return 'DATABASE_URL=mongodb://localhost:27017/db\n';
    default:
      return '';
  }
}
