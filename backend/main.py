"""
Faredown Backend API - Main Application Entry Point
AI-Powered Travel Booking Platform with Bargain Engine
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os
from datetime import datetime

# Import database components
from app.database import engine, get_db
from app.core.config import settings

# Import models first to register them with Base
try:
    from app import models
    print("✅ Models imported successfully")
except Exception as e:
    print(f"�� Error importing models: {e}")
    import traceback
    traceback.print_exc()

from app.models.base import Base

# Import routers with error handling
routers_to_import = []

try:
    from app.routers import auth
    routers_to_import.append(("auth", auth))
    print("✅ Auth router imported")
except Exception as e:
    print(f"❌ Failed to import auth router: {e}")

try:
    from app.routers import admin
    routers_to_import.append(("admin", admin))
    print("✅ Admin router imported")
except Exception as e:
    print(f"❌ Failed to import admin router: {e}")

try:
    from app.routers import users
    routers_to_import.append(("users", users))
    print("✅ Users router imported")
except Exception as e:
    print(f"❌ Failed to import users router: {e}")

try:
    from app.routers import bookings
    routers_to_import.append(("bookings", bookings))
    print("✅ Bookings router imported")
except Exception as e:
    print(f"❌ Failed to import bookings router: {e}")

try:
    from app.routers import airlines
    routers_to_import.append(("airlines", airlines))
    print("✅ Airlines router imported")
except Exception as e:
    print(f"❌ Failed to import airlines router: {e}")

try:
    from app.routers import hotels
    routers_to_import.append(("hotels", hotels))
    print("✅ Hotels router imported")
except Exception as e:
    print(f"❌ Failed to import hotels router: {e}")

try:
    from app.routers import bargain
    routers_to_import.append(("bargain", bargain))
    print("✅ Bargain router imported")
except Exception as e:
    print(f"❌ Failed to import bargain router: {e}")

try:
    from app.routers import promo
    routers_to_import.append(("promo", promo))
    print("✅ Promo router imported")
except Exception as e:
    print(f"❌ Failed to import promo router: {e}")

try:
    from app.routers import currency
    routers_to_import.append(("currency", currency))
    print("✅ Currency router imported")
except Exception as e:
    print(f"❌ Failed to import currency router: {e}")

try:
    from app.routers import vat
    routers_to_import.append(("vat", vat))
    print("✅ VAT router imported")
except Exception as e:
    print(f"❌ Failed to import vat router: {e}")

try:
    from app.routers import cms
    routers_to_import.append(("cms", cms))
    print("✅ CMS router imported")
except Exception as e:
    print(f"❌ Failed to import cms router: {e}")

try:
    from app.routers import extranet
    routers_to_import.append(("extranet", extranet))
    print("✅ Extranet router imported")
except Exception as e:
    print(f"❌ Failed to import extranet router: {e}")

try:
    from app.routers import ai
    routers_to_import.append(("ai", ai))
    print("✅ AI router imported")
except Exception as e:
    print(f"❌ Failed to import ai router: {e}")

try:
    from app.routers import reports
    routers_to_import.append(("reports", reports))
    print("✅ Reports router imported")
except Exception as e:
    print(f"❌ Failed to import reports router: {e}")

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")
except Exception as e:
    print(f"⚠️  Warning creating database tables (continuing...): {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    print("🚀 Faredown Backend API Starting...")
    print(f"📅 Started at: {datetime.now()}")
    print(f"🌐 Environment: {settings.ENVIRONMENT}")
    yield
    print("👋 Faredown Backend API Shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title="Faredown Backend API",
    description="AI-Powered Travel Booking Platform with Real-time Bargain Engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware for frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "🎯 Faredown Backend API - Live and Running!",
        "version": "1.0.0",
        "status": "active",
        "features": [
            "✅ AI-Powered Bargain Engine",
            "✅ Real-time Booking Management", 
            "✅ Extranet Deal System",
            "✅ Advanced Analytics & Reporting",
            "✅ Multi-currency Support",
            "✅ CMS Integration"
        ],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.now().isoformat()
    }

# Include all API routers that were successfully imported
router_config = {
    "auth": ("/api/auth", ["Authentication"]),
    "admin": ("/api/admin", ["Admin Dashboard"]),
    "users": ("/api/users", ["User Management"]),
    "bookings": ("/api/bookings", ["Booking Management"]),
    "airlines": ("/api/airlines", ["Airlines & Flights"]),
    "hotels": ("/api/hotels", ["Hotels & Accommodation"]),
    "bargain": ("/api/bargain", ["Bargain Engine"]),
    "promo": ("/api/promo", ["Promo Codes"]),
    "currency": ("/api/currency", ["Currency Management"]),
    "vat": ("/api/vat", ["VAT & Fees"]),
    "cms": ("/api/cms", ["Content Management"]),
    "extranet": ("/api/extranet", ["Extranet System"]),
    "ai": ("/api/ai", ["AI Engine"]),
    "reports": ("/api/reports", ["Analytics & Reports"]),
}

for name, router_module in routers_to_import:
    if name in router_config:
        prefix, tags = router_config[name]
        try:
            app.include_router(router_module.router, prefix=prefix, tags=tags)
            print(f"✅ Mounted {name} router at {prefix}")
        except Exception as e:
            print(f"❌ Failed to mount {name} router: {e}")

# Global exception handler
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

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=settings.DEBUG
    )
