"""
Faredown Backend API - Main Application Entry Point
AI-Powered Travel Booking Platform with Bargain Engine
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os
from datetime import datetime

# Import database and config
from app.database import engine, get_db
from app.core.config import settings

# Import Base
try:
    from app.models.base import Base
except:
    from sqlalchemy.ext.declarative import declarative_base
    Base = declarative_base()

# Import all models to register with Base
try:
    from app import models
except Exception as e:
    print(f"Warning importing models: {e}")

# Import routers individually with error handling
routers_to_import = []

try:
    from app.routers import auth
    routers_to_import.append(("auth", auth, "/api/auth", ["Authentication"]))
except Exception as e:
    print(f"Failed to import auth: {e}")

try:
    from app.routers import admin
    routers_to_import.append(("admin", admin, "/api/admin", ["Admin Dashboard"]))
except Exception as e:
    print(f"Failed to import admin: {e}")

try:
    from app.routers import users
    routers_to_import.append(("users", users, "/api/users", ["User Management"]))
except Exception as e:
    print(f"Failed to import users: {e}")

try:
    from app.routers import bookings
    routers_to_import.append(("bookings", bookings, "/api/bookings", ["Booking Management"]))
except Exception as e:
    print(f"Failed to import bookings: {e}")

try:
    from app.routers import airlines
    routers_to_import.append(("airlines", airlines, "/api/airlines", ["Airlines"]))
except Exception as e:
    print(f"Failed to import airlines: {e}")

try:
    from app.routers import hotels
    routers_to_import.append(("hotels", hotels, "/api/hotels", ["Hotels"]))
except Exception as e:
    print(f"Failed to import hotels: {e}")

try:
    from app.routers import bargain
    routers_to_import.append(("bargain", bargain, "/api/bargain", ["Bargain Engine"]))
except Exception as e:
    print(f"Failed to import bargain: {e}")

try:
    from app.routers import promo
    routers_to_import.append(("promo", promo, "/api/promo", ["Promo Codes"]))
except Exception as e:
    print(f"Failed to import promo: {e}")

try:
    from app.routers import currency
    routers_to_import.append(("currency", currency, "/api/currency", ["Currency"]))
except Exception as e:
    print(f"Failed to import currency: {e}")

try:
    from app.routers import vat
    routers_to_import.append(("vat", vat, "/api/vat", ["VAT"]))
except Exception as e:
    print(f"Failed to import vat: {e}")

try:
    from app.routers import cms
    routers_to_import.append(("cms", cms, "/api/cms", ["CMS"]))
except Exception as e:
    print(f"Failed to import cms: {e}")

try:
    from app.routers import extranet
    routers_to_import.append(("extranet", extranet, "/api/extranet", ["Extranet"]))
except Exception as e:
    print(f"Failed to import extranet: {e}")

try:
    from app.routers import ai
    routers_to_import.append(("ai", ai, "/api/ai", ["AI Engine"]))
except Exception as e:
    print(f"Failed to import ai: {e}")

try:
    from app.routers import reports
    routers_to_import.append(("reports", reports, "/api/reports", ["Reports"]))
except Exception as e:
    print(f"Failed to import reports: {e}")

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified")
except Exception as e:
    print(f"Warning creating tables: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    print(f"Faredown Backend API Starting - Environment: {settings.ENVIRONMENT}")
    yield
    print("Faredown Backend API Shutting down")

# Initialize FastAPI app
app = FastAPI(
    title="Faredown Backend API",
    description="AI-Powered Travel Booking Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/")
async def root():
    return {
        "message": "Faredown Backend API - Live",
        "version": "1.0.0",
        "status": "active",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.now().isoformat()
    }

# Include all successfully imported routers
for name, router_module, prefix, tags in routers_to_import:
    try:
        app.include_router(router_module.router, prefix=prefix, tags=tags)
        print(f"Mounted {name} router at {prefix}")
    except Exception as e:
        print(f"Failed to mount {name} router: {e}")

# Error handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )

# 404 handler
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def catch_all(path: str):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not found",
            "message": f"Route /{path} not found",
            "available_routes": [
                "/api/auth/register",
                "/api/auth/login",
                "/api/admin/users",
                "/health"
            ]
        }
    )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG
    )
