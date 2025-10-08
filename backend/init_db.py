"""
Database Initialization Script
Creates all tables and runs initial setup
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine
from app.models.base import Base

# Import all models to ensure they're registered
from app.models import (
    User, UserProfile, UserSession,
    Booking, BookingItem, Payment,
    Flight, Airline, Airport, FlightBooking,
    Hotel, Room, HotelBooking, HotelAmenity,
    BargainSession, BargainAttempt, CounterOffer,
    AdminUser, AdminSession, AuditLog,
    Markup, Currency, VAT, ConvenienceFee,
    PromoCode, PromoUsage,
    CMSContent, Banner, Destination,
    ExtranetHotel, ExtranetFlight, ExtranetDeal,
    AIRecommendation, AIAnalytics, AILog,
    BookingReport, RevenueReport, UserReport
)

def init_database():
    """Initialize database with all tables"""
    print("🔄 Creating database tables...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        # List all created tables
        print("\n📋 Created tables:")
        for table in Base.metadata.sorted_tables:
            print(f"  ✓ {table.name}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        import traceback
        traceback.print_exc()
        return False

def drop_all_tables():
    """Drop all tables (use with caution!)"""
    print("⚠️  WARNING: Dropping all database tables...")
    
    try:
        Base.metadata.drop_all(bind=engine)
        print("✅ All tables dropped successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error dropping tables: {e}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database initialization script")
    parser.add_argument("--drop", action="store_true", help="Drop all tables before creating")
    parser.add_argument("--force", action="store_true", help="Skip confirmation prompts")
    
    args = parser.parse_args()
    
    if args.drop:
        if not args.force:
            confirm = input("Are you sure you want to drop all tables? (yes/no): ")
            if confirm.lower() != "yes":
                print("Operation cancelled.")
                sys.exit(0)
        
        drop_all_tables()
    
    init_database()
