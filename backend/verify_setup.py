"""
Backend Setup Verification Script
Verifies all components are correctly configured
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

def verify_imports():
    """Verify all critical imports work"""
    print("\n🔍 Verifying imports...")
    
    errors = []
    
    # Test database connection
    try:
        from app.database import engine, get_db
        print("  ✅ Database module imported")
    except Exception as e:
        print(f"  ❌ Database import failed: {e}")
        errors.append(("database", str(e)))
    
    # Test models
    try:
        from app.models.base import Base
        print("  ✅ Base model imported")
    except Exception as e:
        print(f"  ❌ Base model import failed: {e}")
        errors.append(("base_model", str(e)))
    
    try:
        from app.models.user_models import User
        print("  ✅ User model imported")
    except Exception as e:
        print(f"  ❌ User model import failed: {e}")
        errors.append(("user_model", str(e)))
    
    # Test routers
    try:
        from app.routers import auth
        print("  ✅ Auth router imported")
    except Exception as e:
        print(f"  ❌ Auth router import failed: {e}")
        errors.append(("auth_router", str(e)))
    
    try:
        from app.routers import admin
        print("  ✅ Admin router imported")
    except Exception as e:
        print(f"  ❌ Admin router import failed: {e}")
        errors.append(("admin_router", str(e)))
    
    return errors

def verify_database():
    """Verify database connection"""
    print("\n🔍 Verifying database connection...")
    
    try:
        from app.database import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("  ✅ Database connection successful")
            return True
    except Exception as e:
        print(f"  ❌ Database connection failed: {e}")
        return False

def verify_config():
    """Verify configuration"""
    print("\n🔍 Verifying configuration...")
    
    try:
        from app.core.config import settings
        
        print(f"  ℹ️  Environment: {settings.ENVIRONMENT}")
        print(f"  ℹ️  Debug mode: {settings.DEBUG}")
        print(f"  ℹ️  Database URL: {settings.DATABASE_URL[:50]}...")
        
        if not settings.SECRET_KEY or settings.SECRET_KEY == "your-secret-key-change-in-production":
            print("  ⚠️  WARNING: Using default SECRET_KEY")
        else:
            print("  ✅ SECRET_KEY is configured")
        
        print(f"  ℹ️  Allowed origins: {len(settings.ALLOWED_ORIGINS)} configured")
        
        return True
    except Exception as e:
        print(f"  ❌ Configuration verification failed: {e}")
        return False

def verify_tables():
    """Verify database tables exist"""
    print("\n🔍 Verifying database tables...")
    
    try:
        from app.database import engine
        from app.models.base import Base
        from sqlalchemy import inspect
        
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        print(f"  ℹ️  Found {len(existing_tables)} tables in database")
        
        # Check for critical tables
        critical_tables = ['users', 'bookings', 'bargain_sessions']
        
        for table in critical_tables:
            if table in existing_tables:
                print(f"  ✅ Table '{table}' exists")
            else:
                print(f"  ❌ Table '{table}' missing")
        
        if 'users' not in existing_tables:
            print("\n  ⚠️  Users table missing - run: python init_db.py")
            return False
        
        return True
    except Exception as e:
        print(f"  ❌ Table verification failed: {e}")
        return False

def main():
    """Run all verifications"""
    print("=" * 60)
    print("🚀 Faredown Backend Setup Verification")
    print("=" * 60)
    
    # Verify imports
    import_errors = verify_imports()
    
    # Verify configuration
    config_ok = verify_config()
    
    # Verify database connection
    db_ok = verify_database()
    
    # Verify tables (only if database is connected)
    tables_ok = verify_tables() if db_ok else False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Verification Summary")
    print("=" * 60)
    
    if import_errors:
        print(f"\n❌ Import Errors ({len(import_errors)}):")
        for component, error in import_errors:
            print(f"  - {component}: {error}")
    else:
        print("\n✅ All imports successful")
    
    print(f"\n{'✅' if config_ok else '❌'} Configuration: {'OK' if config_ok else 'FAILED'}")
    print(f"{'✅' if db_ok else '❌'} Database Connection: {'OK' if db_ok else 'FAILED'}")
    print(f"{'✅' if tables_ok else '❌'} Database Tables: {'OK' if tables_ok else 'MISSING'}")
    
    if import_errors or not config_ok or not db_ok or not tables_ok:
        print("\n⚠️  Some checks failed. Please review the errors above.")
        return 1
    
    print("\n✅ All verifications passed! Backend is ready to start.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
