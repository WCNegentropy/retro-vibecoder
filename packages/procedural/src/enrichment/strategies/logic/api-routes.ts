/**
 * API Routes Enrichment Strategy
 *
 * Fills backend route handlers with real CRUD logic:
 * - Model-based routes (User, Item, Post, etc.)
 * - Proper HTTP status codes
 * - Input validation stubs
 * - Error handling patterns
 */

import type { EnrichmentStrategy, TechStack, EnrichmentFlags, EnrichmentContext } from '../../../types.js';

function generateTypescriptRoutes(modelName: string, modelLower: string, framework: string): string {
  if (framework === 'express' || framework === 'fastify') {
    return `import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

interface ${modelName} {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store (replace with database in production)
const ${modelLower}s = new Map<string, ${modelName}>();

// GET /${modelLower}s - List all
router.get('/${modelLower}s', (_req: Request, res: Response) => {
  const items = Array.from(${modelLower}s.values());
  res.json({ data: items, total: items.length });
});

// GET /${modelLower}s/:id - Get by ID
router.get('/${modelLower}s/:id', (req: Request, res: Response) => {
  const item = ${modelLower}s.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: '${modelName} not found' });
  }
  res.json({ data: item });
});

// POST /${modelLower}s - Create
router.post('/${modelLower}s', (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const item: ${modelName} = { id, name, createdAt: now, updatedAt: now };
  ${modelLower}s.set(id, item);

  res.status(201).json({ data: item });
});

// PUT /${modelLower}s/:id - Update
router.put('/${modelLower}s/:id', (req: Request, res: Response) => {
  const existing = ${modelLower}s.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '${modelName} not found' });
  }

  const { name } = req.body;
  const updated: ${modelName} = {
    ...existing,
    name: name ?? existing.name,
    updatedAt: new Date(),
  };
  ${modelLower}s.set(req.params.id, updated);

  res.json({ data: updated });
});

// DELETE /${modelLower}s/:id - Delete
router.delete('/${modelLower}s/:id', (req: Request, res: Response) => {
  if (!${modelLower}s.has(req.params.id)) {
    return res.status(404).json({ error: '${modelName} not found' });
  }
  ${modelLower}s.delete(req.params.id);
  res.status(204).send();
});

export default router;
`;
  }

  // NestJS controller
  return `import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';

interface ${modelName} {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@Controller('${modelLower}s')
export class ${modelName}Controller {
  private readonly ${modelLower}s = new Map<string, ${modelName}>();

  @Get()
  findAll() {
    const items = Array.from(this.${modelLower}s.values());
    return { data: items, total: items.length };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const item = this.${modelLower}s.get(id);
    if (!item) throw new NotFoundException('${modelName} not found');
    return { data: item };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: { name: string }) {
    if (!body.name) throw new BadRequestException('Name is required');
    const id = crypto.randomUUID();
    const now = new Date();
    const item: ${modelName} = { id, name: body.name, createdAt: now, updatedAt: now };
    this.${modelLower}s.set(id, item);
    return { data: item };
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { name?: string }) {
    const existing = this.${modelLower}s.get(id);
    if (!existing) throw new NotFoundException('${modelName} not found');
    const updated = { ...existing, name: body.name ?? existing.name, updatedAt: new Date() };
    this.${modelLower}s.set(id, updated);
    return { data: updated };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    if (!this.${modelLower}s.has(id)) throw new NotFoundException('${modelName} not found');
    this.${modelLower}s.delete(id);
  }
}
`;
}

function generatePythonRoutes(modelName: string, modelLower: string, framework: string): string {
  if (framework === 'fastapi') {
    return `from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4

router = APIRouter(prefix="/${modelLower}s", tags=["${modelLower}s"])


class ${modelName}Create(BaseModel):
    name: str


class ${modelName}Update(BaseModel):
    name: str | None = None


class ${modelName}Response(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime


# In-memory store (replace with database in production)
_${modelLower}s: dict[str, ${modelName}Response] = {}


@router.get("/", response_model=list[${modelName}Response])
async def list_${modelLower}s():
    return list(_${modelLower}s.values())


@router.get("/{${modelLower}_id}", response_model=${modelName}Response)
async def get_${modelLower}(${modelLower}_id: str):
    if ${modelLower}_id not in _${modelLower}s:
        raise HTTPException(status_code=404, detail="${modelName} not found")
    return _${modelLower}s[${modelLower}_id]


@router.post("/", response_model=${modelName}Response, status_code=status.HTTP_201_CREATED)
async def create_${modelLower}(data: ${modelName}Create):
    item_id = str(uuid4())
    now = datetime.utcnow()
    item = ${modelName}Response(id=item_id, name=data.name, created_at=now, updated_at=now)
    _${modelLower}s[item_id] = item
    return item


@router.put("/{${modelLower}_id}", response_model=${modelName}Response)
async def update_${modelLower}(${modelLower}_id: str, data: ${modelName}Update):
    if ${modelLower}_id not in _${modelLower}s:
        raise HTTPException(status_code=404, detail="${modelName} not found")
    existing = _${modelLower}s[${modelLower}_id]
    updated = existing.model_copy(update={
        "name": data.name or existing.name,
        "updated_at": datetime.utcnow(),
    })
    _${modelLower}s[${modelLower}_id] = updated
    return updated


@router.delete("/{${modelLower}_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_${modelLower}(${modelLower}_id: str):
    if ${modelLower}_id not in _${modelLower}s:
        raise HTTPException(status_code=404, detail="${modelName} not found")
    del _${modelLower}s[${modelLower}_id]
`;
  }

  // Flask
  return `from flask import Blueprint, jsonify, request
from datetime import datetime
from uuid import uuid4

${modelLower}_bp = Blueprint("${modelLower}s", __name__, url_prefix="/${modelLower}s")

_${modelLower}s: dict[str, dict] = {}


@${modelLower}_bp.route("/", methods=["GET"])
def list_${modelLower}s():
    return jsonify(list(_${modelLower}s.values()))


@${modelLower}_bp.route("/<${modelLower}_id>", methods=["GET"])
def get_${modelLower}(${modelLower}_id: str):
    item = _${modelLower}s.get(${modelLower}_id)
    if not item:
        return jsonify({"error": "${modelName} not found"}), 404
    return jsonify(item)


@${modelLower}_bp.route("/", methods=["POST"])
def create_${modelLower}():
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Name is required"}), 400
    item_id = str(uuid4())
    now = datetime.utcnow().isoformat()
    item = {"id": item_id, "name": data["name"], "created_at": now, "updated_at": now}
    _${modelLower}s[item_id] = item
    return jsonify(item), 201


@${modelLower}_bp.route("/<${modelLower}_id>", methods=["PUT"])
def update_${modelLower}(${modelLower}_id: str):
    item = _${modelLower}s.get(${modelLower}_id)
    if not item:
        return jsonify({"error": "${modelName} not found"}), 404
    data = request.get_json() or {}
    item["name"] = data.get("name", item["name"])
    item["updated_at"] = datetime.utcnow().isoformat()
    return jsonify(item)


@${modelLower}_bp.route("/<${modelLower}_id>", methods=["DELETE"])
def delete_${modelLower}(${modelLower}_id: str):
    if ${modelLower}_id not in _${modelLower}s:
        return jsonify({"error": "${modelName} not found"}), 404
    del _${modelLower}s[${modelLower}_id]
    return "", 204
`;
}

function generateGoRoutes(modelName: string, modelLower: string, framework: string): string {
  return `package handlers

import (
\t"net/http"
\t"sync"
\t"time"

\t"github.com/google/uuid"
\t"github.com/${framework === 'gin' ? 'gin-gonic/gin' : 'labstack/echo/v4'}"
)

type ${modelName} struct {
\tID        string    \`json:"id"\`
\tName      string    \`json:"name"\`
\tCreatedAt time.Time \`json:"created_at"\`
\tUpdatedAt time.Time \`json:"updated_at"\`
}

var (
\t${modelLower}s   = make(map[string]${modelName})
\t${modelLower}sMu sync.RWMutex
)

${framework === 'gin' ? `
func List${modelName}s(c *gin.Context) {
\t${modelLower}sMu.RLock()
\tdefer ${modelLower}sMu.RUnlock()
\titems := make([]${modelName}, 0, len(${modelLower}s))
\tfor _, v := range ${modelLower}s {
\t\titems = append(items, v)
\t}
\tc.JSON(http.StatusOK, gin.H{"data": items, "total": len(items)})
}

func Get${modelName}(c *gin.Context) {
\t${modelLower}sMu.RLock()
\tdefer ${modelLower}sMu.RUnlock()
\titem, ok := ${modelLower}s[c.Param("id")]
\tif !ok {
\t\tc.JSON(http.StatusNotFound, gin.H{"error": "${modelName} not found"})
\t\treturn
\t}
\tc.JSON(http.StatusOK, gin.H{"data": item})
}

func Create${modelName}(c *gin.Context) {
\tvar input struct{ Name string \`json:"name" binding:"required"\` }
\tif err := c.ShouldBindJSON(&input); err != nil {
\t\tc.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
\t\treturn
\t}
\tnow := time.Now()
\titem := ${modelName}{ID: uuid.New().String(), Name: input.Name, CreatedAt: now, UpdatedAt: now}
\t${modelLower}sMu.Lock()
\t${modelLower}s[item.ID] = item
\t${modelLower}sMu.Unlock()
\tc.JSON(http.StatusCreated, gin.H{"data": item})
}

func Delete${modelName}(c *gin.Context) {
\t${modelLower}sMu.Lock()
\tdefer ${modelLower}sMu.Unlock()
\tif _, ok := ${modelLower}s[c.Param("id")]; !ok {
\t\tc.JSON(http.StatusNotFound, gin.H{"error": "${modelName} not found"})
\t\treturn
\t}
\tdelete(${modelLower}s, c.Param("id"))
\tc.Status(http.StatusNoContent)
}` : `
func List${modelName}s(c echo.Context) error {
\t${modelLower}sMu.RLock()
\tdefer ${modelLower}sMu.RUnlock()
\titems := make([]${modelName}, 0, len(${modelLower}s))
\tfor _, v := range ${modelLower}s {
\t\titems = append(items, v)
\t}
\treturn c.JSON(http.StatusOK, map[string]interface{}{"data": items, "total": len(items)})
}

func Get${modelName}(c echo.Context) error {
\t${modelLower}sMu.RLock()
\tdefer ${modelLower}sMu.RUnlock()
\titem, ok := ${modelLower}s[c.Param("id")]
\tif !ok {
\t\treturn c.JSON(http.StatusNotFound, map[string]string{"error": "${modelName} not found"})
\t}
\treturn c.JSON(http.StatusOK, map[string]interface{}{"data": item})
}

func Create${modelName}(c echo.Context) error {
\tvar input struct{ Name string \`json:"name"\` }
\tif err := c.Bind(&input); err != nil || input.Name == "" {
\t\treturn c.JSON(http.StatusBadRequest, map[string]string{"error": "Name is required"})
\t}
\tnow := time.Now()
\titem := ${modelName}{ID: uuid.New().String(), Name: input.Name, CreatedAt: now, UpdatedAt: now}
\t${modelLower}sMu.Lock()
\t${modelLower}s[item.ID] = item
\t${modelLower}sMu.Unlock()
\treturn c.JSON(http.StatusCreated, map[string]interface{}{"data": item})
}

func Delete${modelName}(c echo.Context) error {
\t${modelLower}sMu.Lock()
\tdefer ${modelLower}sMu.Unlock()
\tif _, ok := ${modelLower}s[c.Param("id")]; !ok {
\t\treturn c.JSON(http.StatusNotFound, map[string]string{"error": "${modelName} not found"})
\t}
\tdelete(${modelLower}s, c.Param("id"))
\treturn c.NoContent(http.StatusNoContent)
}`}
`;
}

function generateRustRoutes(modelName: string, modelLower: string, framework: string): string {
  if (framework === 'axum') {
    return `use axum::{
    extract::{Path, State, Json},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post, put, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ${modelName} {
    pub id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct Create${modelName} {
    pub name: String,
}

pub type ${modelName}Store = Arc<RwLock<HashMap<String, ${modelName}>>>;

pub fn ${modelLower}_routes() -> Router<${modelName}Store> {
    Router::new()
        .route("/${modelLower}s", get(list_${modelLower}s).post(create_${modelLower}))
        .route("/${modelLower}s/:id", get(get_${modelLower}).put(update_${modelLower}).delete(delete_${modelLower}))
}

async fn list_${modelLower}s(State(store): State<${modelName}Store>) -> impl IntoResponse {
    let items: Vec<${modelName}> = store.read().unwrap().values().cloned().collect();
    Json(serde_json::json!({ "data": items, "total": items.len() }))
}

async fn get_${modelLower}(State(store): State<${modelName}Store>, Path(id): Path<String>) -> impl IntoResponse {
    match store.read().unwrap().get(&id) {
        Some(item) => (StatusCode::OK, Json(serde_json::json!({ "data": item }))).into_response(),
        None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "${modelName} not found" }))).into_response(),
    }
}

async fn create_${modelLower}(State(store): State<${modelName}Store>, Json(input): Json<Create${modelName}>) -> impl IntoResponse {
    let now = Utc::now();
    let item = ${modelName} {
        id: Uuid::new_v4().to_string(),
        name: input.name,
        created_at: now,
        updated_at: now,
    };
    store.write().unwrap().insert(item.id.clone(), item.clone());
    (StatusCode::CREATED, Json(serde_json::json!({ "data": item })))
}

async fn update_${modelLower}(State(store): State<${modelName}Store>, Path(id): Path<String>, Json(input): Json<Create${modelName}>) -> impl IntoResponse {
    let mut store = store.write().unwrap();
    match store.get_mut(&id) {
        Some(item) => {
            item.name = input.name;
            item.updated_at = Utc::now();
            (StatusCode::OK, Json(serde_json::json!({ "data": item.clone() }))).into_response()
        }
        None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "${modelName} not found" }))).into_response(),
    }
}

async fn delete_${modelLower}(State(store): State<${modelName}Store>, Path(id): Path<String>) -> impl IntoResponse {
    match store.write().unwrap().remove(&id) {
        Some(_) => StatusCode::NO_CONTENT.into_response(),
        None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "${modelName} not found" }))).into_response(),
    }
}
`;
  }

  return '// Actix routes — see framework documentation\n';
}

export const ApiRoutesEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-api-routes',
  name: 'API Route Logic Fill',
  priority: 20,

  matches: (stack: TechStack, flags: EnrichmentFlags) =>
    flags.fillLogic && stack.archetype === 'backend',

  apply: async (context: EnrichmentContext) => {
    const { files, stack, rng } = context;

    const modelNames = ['User', 'Item', 'Post', 'Task', 'Product', 'Order'];
    const modelName = rng.pick(modelNames);
    const modelLower = modelName.toLowerCase();

    switch (stack.language) {
      case 'typescript':
      case 'javascript':
        files[`src/routes/${modelLower}s.ts`] = generateTypescriptRoutes(modelName, modelLower, stack.framework);
        break;
      case 'python':
        files[`src/routes/${modelLower}s.py`] = generatePythonRoutes(modelName, modelLower, stack.framework);
        break;
      case 'go':
        files[`internal/handlers/${modelLower}s.go`] = generateGoRoutes(modelName, modelLower, stack.framework);
        break;
      case 'rust':
        files[`src/routes/${modelLower}s.rs`] = generateRustRoutes(modelName, modelLower, stack.framework);
        break;
    }
  },
};
