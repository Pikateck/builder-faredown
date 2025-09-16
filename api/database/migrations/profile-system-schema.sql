-- Complete Profile System Database Schema
-- Mirrors Booking.com's Profile system with full CRUD capabilities
-- Run this migration to create all profile-related tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create faredown schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS faredown;

-- 1) Enhanced users table (extends existing basic users table)
-- First, let's update the existing users table to match our needs
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS uuid uuid DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone_e164 text,
ADD COLUMN IF NOT EXISTS dob date,
ADD COLUMN IF NOT EXISTS nationality_iso2 char(2),
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male','female','non_binary','prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS address_id uuid,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS profile_picture_url text,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;

-- Add unique constraint on uuid if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_uuid_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_uuid_key UNIQUE (uuid);
    END IF;
END $$;

-- 2) Addresses table (shared for users & travelers)
CREATE TABLE IF NOT EXISTS faredown.addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text,
  postal_code text,
  country_iso2 char(2) NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add foreign key constraint to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_address') THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_address 
        FOREIGN KEY (address_id) REFERENCES faredown.addresses(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3) Travelers table (co-travelers saved under a user profile)
CREATE TABLE IF NOT EXISTS faredown.travelers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id integer NOT NULL, -- References existing users.id
  first_name text NOT NULL,
  last_name text NOT NULL,
  dob date NOT NULL,
  gender text CHECK (gender IN ('male','female','non_binary','prefer_not_to_say')),
  nationality_iso2 char(2),
  address_id uuid,
  relationship text, -- e.g., self/spouse/child/friend
  frequent_flyer_number text,
  dietary_restrictions text[],
  mobility_assistance boolean DEFAULT false,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (address_id) REFERENCES faredown.addresses(id) ON DELETE SET NULL
);

-- 4) Passports table (one traveler can have multiple)
CREATE TABLE IF NOT EXISTS faredown.passports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  traveler_id uuid NOT NULL,
  given_names text NOT NULL, -- as printed on passport
  surname text NOT NULL,
  number_enc bytea NOT NULL, -- encrypted passport number
  issuing_country char(2) NOT NULL,
  issue_date date,
  expiry_date date NOT NULL,
  place_of_birth text,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (traveler_id) REFERENCES faredown.travelers(id) ON DELETE CASCADE
);

-- Helper view exposing only masked passport data for security
CREATE OR REPLACE VIEW faredown.v_passports_masked AS
SELECT
  p.id,
  p.traveler_id,
  p.given_names,
  p.surname,
  '****' || right(
    CASE 
      WHEN p.number_enc IS NOT NULL THEN 
        convert_from(pgp_sym_decrypt(number_enc, coalesce(current_setting('app.passport_key', true), 'default_key')),'utf8')
      ELSE ''
    END, 4
  ) AS passport_last4,
  p.issuing_country,
  p.issue_date,
  p.expiry_date,
  p.place_of_birth,
  p.is_primary,
  p.created_at,
  p.updated_at
FROM faredown.passports p;

-- 5) Payment methods table (tokenized; no PAN/CVV storage)
CREATE TABLE IF NOT EXISTS faredown.payment_methods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id integer NOT NULL, -- References existing users.id
  provider text NOT NULL, -- stripe, razorpay, etc.
  token text NOT NULL, -- customer/payment token from provider
  type text NOT NULL CHECK (type IN ('card','bank_account','wallet','upi')),
  brand text, -- Visa, Mastercard, etc.
  last4 text,
  exp_month int,
  exp_year int,
  holder_name text,
  billing_address_id uuid,
  is_default boolean NOT NULL DEFAULT false,
  is_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (billing_address_id) REFERENCES faredown.addresses(id) ON DELETE SET NULL,
  UNIQUE (user_id, token)
);

-- Ensure only one default payment method per user
CREATE UNIQUE INDEX IF NOT EXISTS uniq_payment_default_per_user
ON faredown.payment_methods(user_id)
WHERE is_default;

-- 6) User preferences table (email, currency, language, etc.)
CREATE TABLE IF NOT EXISTS faredown.user_preferences (
  user_id integer PRIMARY KEY, -- References existing users.id
  currency_iso3 char(3) DEFAULT 'INR',
  language text DEFAULT 'en',
  timezone text DEFAULT 'Asia/Kolkata',
  date_format text DEFAULT 'DD/MM/YYYY',
  marketing_opt_in boolean DEFAULT false,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  price_alerts boolean DEFAULT false,
  booking_reminders boolean DEFAULT true,
  travel_tips boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7) Enhanced bookings table (extend existing if needed)
-- If hotel_bookings table exists, we'll add columns to support all modules
-- Create a generic bookings table for all modules
CREATE TABLE IF NOT EXISTS faredown.bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id integer NOT NULL, -- References existing users.id
  module text NOT NULL CHECK (module IN ('flight','hotel','activity','transfer')),
  booking_ref text NOT NULL UNIQUE,
  supplier_ref text, -- PNR / reservation id
  status text NOT NULL DEFAULT 'pending',
  total_amount decimal(10,2),
  currency char(3) DEFAULT 'INR',
  booking_data jsonb, -- Module-specific booking details
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8) Booking passengers table (links to saved traveler snapshot)
CREATE TABLE IF NOT EXISTS faredown.booking_passengers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  traveler_id uuid NOT NULL,
  -- Snapshot to preserve historic data at ticketing time:
  first_name text NOT NULL,
  last_name text NOT NULL,
  dob date NOT NULL,
  gender text,
  nationality_iso2 char(2),
  passport_last4 text,
  frequent_flyer_number text,
  special_requests text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (booking_id) REFERENCES faredown.bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (traveler_id) REFERENCES faredown.travelers(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_booking_passengers_booking ON faredown.booking_passengers(booking_id);

-- 9) Seat assignments table (Flights)
CREATE TABLE IF NOT EXISTS faredown.seat_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  passenger_id uuid NOT NULL,
  segment_index int NOT NULL, -- 0..n for multi-segment trips
  seat_label text NOT NULL, -- e.g., 12A
  cabin_class text, -- Y, W, J, F
  price decimal(10,2) DEFAULT 0,
  locked boolean DEFAULT false, -- if ticketed/paid
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (booking_id) REFERENCES faredown.bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES faredown.booking_passengers(id) ON DELETE CASCADE,
  UNIQUE (booking_id, segment_index, seat_label)
);

-- 10) Hotel-specific tables
CREATE TABLE IF NOT EXISTS faredown.hotel_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid UNIQUE NOT NULL,
  checkin date NOT NULL,
  checkout date NOT NULL,
  rooms int NOT NULL,
  hotel_data jsonb, -- Hotel-specific details
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (booking_id) REFERENCES faredown.bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faredown.stay_guests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_booking_id uuid NOT NULL,
  traveler_id uuid NOT NULL,
  room_index int NOT NULL, -- 0..rooms-1
  guest_type text CHECK (guest_type IN ('adult','child','infant')) DEFAULT 'adult',
  age_years int, -- for child pricing if needed
  first_name text NOT NULL, -- snapshot
  last_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (hotel_booking_id) REFERENCES faredown.hotel_bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (traveler_id) REFERENCES faredown.travelers(id) ON DELETE RESTRICT,
  UNIQUE (hotel_booking_id, room_index, traveler_id)
);

-- 11) Activity/Sightseeing tables
CREATE TABLE IF NOT EXISTS faredown.activity_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid UNIQUE NOT NULL,
  activity_code text NOT NULL,
  activity_date date NOT NULL,
  activity_data jsonb,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (booking_id) REFERENCES faredown.bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faredown.activity_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_booking_id uuid NOT NULL,
  traveler_id uuid NOT NULL,
  pax_type text CHECK (pax_type IN ('adult','child','infant','senior')) DEFAULT 'adult',
  first_name text NOT NULL, -- snapshot
  last_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (activity_booking_id) REFERENCES faredown.activity_bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (traveler_id) REFERENCES faredown.travelers(id) ON DELETE RESTRICT
);

-- 12) Transfer tables
CREATE TABLE IF NOT EXISTS faredown.transfer_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid UNIQUE NOT NULL,
  pickup_datetime timestamptz NOT NULL,
  pickup_location text NOT NULL,
  drop_location text NOT NULL,
  vehicle_type text,
  transfer_data jsonb,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (booking_id) REFERENCES faredown.bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faredown.transfer_passengers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_booking_id uuid NOT NULL,
  traveler_id uuid NOT NULL,
  first_name text NOT NULL, -- snapshot
  last_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (transfer_booking_id) REFERENCES faredown.transfer_bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (traveler_id) REFERENCES faredown.travelers(id) ON DELETE RESTRICT
);

-- 13) Profile activity log table
CREATE TABLE IF NOT EXISTS faredown.profile_activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id integer NOT NULL,
  action text NOT NULL, -- 'profile_updated', 'traveler_added', 'payment_method_added', etc.
  entity_type text, -- 'profile', 'traveler', 'passport', 'payment_method'
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14) Saved searches table
CREATE TABLE IF NOT EXISTS faredown.saved_searches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id integer NOT NULL,
  module text NOT NULL CHECK (module IN ('flight','hotel','activity','transfer')),
  search_name text NOT NULL,
  search_criteria jsonb NOT NULL,
  is_alert_enabled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_travelers_user_id ON faredown.travelers(user_id);
CREATE INDEX IF NOT EXISTS idx_passports_traveler_id ON faredown.passports(traveler_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON faredown.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON faredown.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_module ON faredown.bookings(module);
CREATE INDEX IF NOT EXISTS idx_profile_activity_user_id ON faredown.profile_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON faredown.saved_searches(user_id);

-- Insert default preferences for existing users
INSERT INTO faredown.user_preferences (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM faredown.user_preferences);

-- Create a function to encrypt passport numbers
CREATE OR REPLACE FUNCTION faredown.encrypt_passport_number(passport_number text)
RETURNS bytea AS $$
BEGIN
  RETURN pgp_sym_encrypt(passport_number, coalesce(current_setting('app.passport_key', true), 'default_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to decrypt passport numbers (for admin use only)
CREATE OR REPLACE FUNCTION faredown.decrypt_passport_number(encrypted_number bytea)
RETURNS text AS $$
BEGIN
  RETURN convert_from(pgp_sym_decrypt(encrypted_number, coalesce(current_setting('app.passport_key', true), 'default_key')), 'utf8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION faredown.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DO $$ 
DECLARE
    table_name text;
    trigger_name text;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.columns t 
        WHERE t.table_schema = 'faredown' 
        AND t.column_name = 'updated_at'
    LOOP
        trigger_name := 'update_' || table_name || '_updated_at';
        
        -- Check if trigger already exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = trigger_name
        ) THEN
            EXECUTE format('
                CREATE TRIGGER %I
                BEFORE UPDATE ON faredown.%I
                FOR EACH ROW
                EXECUTE FUNCTION faredown.update_updated_at_column()
            ', trigger_name, table_name);
        END IF;
    END LOOP;
END $$;

-- Comments for documentation
COMMENT ON SCHEMA faredown IS 'Complete profile system schema for Booking.com-style functionality';
COMMENT ON TABLE faredown.travelers IS 'Saved travelers/co-travelers under user profiles';
COMMENT ON TABLE faredown.passports IS 'Passport details with encrypted numbers';
COMMENT ON TABLE faredown.payment_methods IS 'Tokenized payment methods (no PAN/CVV stored)';
COMMENT ON TABLE faredown.user_preferences IS 'User customization preferences';
COMMENT ON TABLE faredown.booking_passengers IS 'Passenger snapshots for bookings';
COMMENT ON TABLE faredown.seat_assignments IS 'Flight seat assignments';
COMMENT ON VIEW faredown.v_passports_masked IS 'Secure view showing only masked passport numbers';
