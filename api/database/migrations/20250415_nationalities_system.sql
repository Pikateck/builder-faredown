-- =====================================================
-- Nationality System Migration
-- Created: 2025-04-15
-- Purpose: Add first-class nationality support for hotel search & pricing
-- =====================================================

-- 1. Create Nationalities Master Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.nationalities_master (
  id SERIAL PRIMARY KEY,
  iso_code VARCHAR(2) NOT NULL UNIQUE,
  country_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 999,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nationalities_is_active 
  ON public.nationalities_master (is_active);

CREATE INDEX IF NOT EXISTS idx_nationalities_display_order 
  ON public.nationalities_master (display_order, country_name);

-- 2. Extend Users Table with Nationality
-- =====================================================
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS nationality_iso VARCHAR(2);

-- Add foreign key constraint (optional, enforces data integrity)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_users_nationality'
  ) THEN
    ALTER TABLE public.users 
      ADD CONSTRAINT fk_users_nationality 
      FOREIGN KEY (nationality_iso) 
      REFERENCES public.nationalities_master(iso_code) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_users_nationality 
  ON public.users (nationality_iso) 
  WHERE nationality_iso IS NOT NULL;

-- 3. Seed Nationalities Data
-- =====================================================
-- Top priority countries (commonly used in travel)
INSERT INTO public.nationalities_master (iso_code, country_name, is_active, display_order) 
VALUES 
  ('IN', 'India', true, 1),
  ('AE', 'United Arab Emirates', true, 2),
  ('GB', 'United Kingdom', true, 3),
  ('US', 'United States', true, 4),
  ('SG', 'Singapore', true, 5),
  ('AU', 'Australia', true, 6),
  ('CA', 'Canada', true, 7),
  ('SA', 'Saudi Arabia', true, 8),
  ('QA', 'Qatar', true, 9),
  ('KW', 'Kuwait', true, 10),
  ('BH', 'Bahrain', true, 11),
  ('OM', 'Oman', true, 12),
  ('FR', 'France', true, 13),
  ('DE', 'Germany', true, 14),
  ('IT', 'Italy', true, 15),
  ('ES', 'Spain', true, 16),
  ('NL', 'Netherlands', true, 17),
  ('CH', 'Switzerland', true, 18),
  ('MY', 'Malaysia', true, 19),
  ('TH', 'Thailand', true, 20),
  ('JP', 'Japan', true, 21),
  ('CN', 'China', true, 22),
  ('KR', 'South Korea', true, 23),
  ('PH', 'Philippines', true, 24),
  ('ID', 'Indonesia', true, 25),
  ('VN', 'Vietnam', true, 26),
  ('NZ', 'New Zealand', true, 27),
  ('ZA', 'South Africa', true, 28),
  ('EG', 'Egypt', true, 29),
  ('TR', 'Turkey', true, 30),
  ('BR', 'Brazil', true, 31),
  ('MX', 'Mexico', true, 32),
  ('AR', 'Argentina', true, 33),
  ('RU', 'Russia', true, 34),
  ('PL', 'Poland', true, 35),
  ('SE', 'Sweden', true, 36),
  ('NO', 'Norway', true, 37),
  ('DK', 'Denmark', true, 38),
  ('FI', 'Finland', true, 39),
  ('IE', 'Ireland', true, 40),
  ('BE', 'Belgium', true, 41),
  ('AT', 'Austria', true, 42),
  ('PT', 'Portugal', true, 43),
  ('GR', 'Greece', true, 44),
  ('CZ', 'Czech Republic', true, 45),
  ('HU', 'Hungary', true, 46),
  ('RO', 'Romania', true, 47),
  ('BG', 'Bulgaria', true, 48),
  ('IL', 'Israel', true, 49),
  ('JO', 'Jordan', true, 50)
ON CONFLICT (iso_code) DO UPDATE SET
  country_name = EXCLUDED.country_name,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Add remaining countries (alphabetically, lower priority)
INSERT INTO public.nationalities_master (iso_code, country_name, is_active, display_order) 
VALUES 
  ('AF', 'Afghanistan', true, 100),
  ('AL', 'Albania', true, 100),
  ('DZ', 'Algeria', true, 100),
  ('AD', 'Andorra', true, 100),
  ('AO', 'Angola', true, 100),
  ('AG', 'Antigua and Barbuda', true, 100),
  ('AM', 'Armenia', true, 100),
  ('AZ', 'Azerbaijan', true, 100),
  ('BS', 'Bahamas', true, 100),
  ('BD', 'Bangladesh', true, 100),
  ('BB', 'Barbados', true, 100),
  ('BY', 'Belarus', true, 100),
  ('BZ', 'Belize', true, 100),
  ('BJ', 'Benin', true, 100),
  ('BT', 'Bhutan', true, 100),
  ('BO', 'Bolivia', true, 100),
  ('BA', 'Bosnia and Herzegovina', true, 100),
  ('BW', 'Botswana', true, 100),
  ('BN', 'Brunei', true, 100),
  ('BF', 'Burkina Faso', true, 100),
  ('BI', 'Burundi', true, 100),
  ('KH', 'Cambodia', true, 100),
  ('CM', 'Cameroon', true, 100),
  ('CV', 'Cape Verde', true, 100),
  ('CF', 'Central African Republic', true, 100),
  ('TD', 'Chad', true, 100),
  ('CL', 'Chile', true, 100),
  ('CO', 'Colombia', true, 100),
  ('KM', 'Comoros', true, 100),
  ('CG', 'Congo', true, 100),
  ('CR', 'Costa Rica', true, 100),
  ('HR', 'Croatia', true, 100),
  ('CU', 'Cuba', true, 100),
  ('CY', 'Cyprus', true, 100),
  ('DJ', 'Djibouti', true, 100),
  ('DM', 'Dominica', true, 100),
  ('DO', 'Dominican Republic', true, 100),
  ('EC', 'Ecuador', true, 100),
  ('SV', 'El Salvador', true, 100),
  ('GQ', 'Equatorial Guinea', true, 100),
  ('ER', 'Eritrea', true, 100),
  ('EE', 'Estonia', true, 100),
  ('ET', 'Ethiopia', true, 100),
  ('FJ', 'Fiji', true, 100),
  ('GA', 'Gabon', true, 100),
  ('GM', 'Gambia', true, 100),
  ('GE', 'Georgia', true, 100),
  ('GH', 'Ghana', true, 100),
  ('GD', 'Grenada', true, 100),
  ('GT', 'Guatemala', true, 100),
  ('GN', 'Guinea', true, 100),
  ('GW', 'Guinea-Bissau', true, 100),
  ('GY', 'Guyana', true, 100),
  ('HT', 'Haiti', true, 100),
  ('HN', 'Honduras', true, 100),
  ('HK', 'Hong Kong', true, 100),
  ('IS', 'Iceland', true, 100),
  ('IQ', 'Iraq', true, 100),
  ('JM', 'Jamaica', true, 100),
  ('KZ', 'Kazakhstan', true, 100),
  ('KE', 'Kenya', true, 100),
  ('KI', 'Kiribati', true, 100),
  ('XK', 'Kosovo', true, 100),
  ('KG', 'Kyrgyzstan', true, 100),
  ('LA', 'Laos', true, 100),
  ('LV', 'Latvia', true, 100),
  ('LB', 'Lebanon', true, 100),
  ('LS', 'Lesotho', true, 100),
  ('LR', 'Liberia', true, 100),
  ('LY', 'Libya', true, 100),
  ('LI', 'Liechtenstein', true, 100),
  ('LT', 'Lithuania', true, 100),
  ('LU', 'Luxembourg', true, 100),
  ('MK', 'North Macedonia', true, 100),
  ('MG', 'Madagascar', true, 100),
  ('MW', 'Malawi', true, 100),
  ('MV', 'Maldives', true, 100),
  ('ML', 'Mali', true, 100),
  ('MT', 'Malta', true, 100),
  ('MH', 'Marshall Islands', true, 100),
  ('MR', 'Mauritania', true, 100),
  ('MU', 'Mauritius', true, 100),
  ('FM', 'Micronesia', true, 100),
  ('MD', 'Moldova', true, 100),
  ('MC', 'Monaco', true, 100),
  ('MN', 'Mongolia', true, 100),
  ('ME', 'Montenegro', true, 100),
  ('MA', 'Morocco', true, 100),
  ('MZ', 'Mozambique', true, 100),
  ('MM', 'Myanmar', true, 100),
  ('NA', 'Namibia', true, 100),
  ('NR', 'Nauru', true, 100),
  ('NP', 'Nepal', true, 100),
  ('NI', 'Nicaragua', true, 100),
  ('NE', 'Niger', true, 100),
  ('NG', 'Nigeria', true, 100),
  ('KP', 'North Korea', true, 100),
  ('PK', 'Pakistan', true, 100),
  ('PW', 'Palau', true, 100),
  ('PS', 'Palestine', true, 100),
  ('PA', 'Panama', true, 100),
  ('PG', 'Papua New Guinea', true, 100),
  ('PY', 'Paraguay', true, 100),
  ('PE', 'Peru', true, 100),
  ('RW', 'Rwanda', true, 100),
  ('KN', 'Saint Kitts and Nevis', true, 100),
  ('LC', 'Saint Lucia', true, 100),
  ('VC', 'Saint Vincent and the Grenadines', true, 100),
  ('WS', 'Samoa', true, 100),
  ('SM', 'San Marino', true, 100),
  ('ST', 'Sao Tome and Principe', true, 100),
  ('SN', 'Senegal', true, 100),
  ('RS', 'Serbia', true, 100),
  ('SC', 'Seychelles', true, 100),
  ('SL', 'Sierra Leone', true, 100),
  ('SK', 'Slovakia', true, 100),
  ('SI', 'Slovenia', true, 100),
  ('SB', 'Solomon Islands', true, 100),
  ('SO', 'Somalia', true, 100),
  ('SS', 'South Sudan', true, 100),
  ('LK', 'Sri Lanka', true, 100),
  ('SD', 'Sudan', true, 100),
  ('SR', 'Suriname', true, 100),
  ('SZ', 'Eswatini', true, 100),
  ('SY', 'Syria', true, 100),
  ('TW', 'Taiwan', true, 100),
  ('TJ', 'Tajikistan', true, 100),
  ('TZ', 'Tanzania', true, 100),
  ('TL', 'Timor-Leste', true, 100),
  ('TG', 'Togo', true, 100),
  ('TO', 'Tonga', true, 100),
  ('TT', 'Trinidad and Tobago', true, 100),
  ('TN', 'Tunisia', true, 100),
  ('TM', 'Turkmenistan', true, 100),
  ('TV', 'Tuvalu', true, 100),
  ('UG', 'Uganda', true, 100),
  ('UA', 'Ukraine', true, 100),
  ('UY', 'Uruguay', true, 100),
  ('UZ', 'Uzbekistan', true, 100),
  ('VU', 'Vanuatu', true, 100),
  ('VA', 'Vatican City', true, 100),
  ('VE', 'Venezuela', true, 100),
  ('YE', 'Yemen', true, 100),
  ('ZM', 'Zambia', true, 100),
  ('ZW', 'Zimbabwe', true, 100)
ON CONFLICT (iso_code) DO NOTHING;

-- 4. Create Updated At Trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_nationalities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nationalities_updated_at ON public.nationalities_master;

CREATE TRIGGER trigger_nationalities_updated_at
  BEFORE UPDATE ON public.nationalities_master
  FOR EACH ROW
  EXECUTE FUNCTION update_nationalities_updated_at();

-- 5. Create Helper Function for Resolving Nationality
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_nationality(user_id UUID)
RETURNS VARCHAR(2) AS $$
DECLARE
  nationality VARCHAR(2);
BEGIN
  SELECT nationality_iso INTO nationality
  FROM public.users
  WHERE id = user_id AND nationality_iso IS NOT NULL;
  
  RETURN COALESCE(nationality, 'IN'); -- Default to India
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Comments for Documentation
-- =====================================================
COMMENT ON TABLE public.nationalities_master IS 
  'Master table for guest nationalities used in hotel search and pricing. ISO 3166-1 alpha-2 codes.';

COMMENT ON COLUMN public.nationalities_master.iso_code IS 
  'ISO 3166-1 alpha-2 country code (e.g., IN, AE, GB, US)';

COMMENT ON COLUMN public.nationalities_master.country_name IS 
  'Full country name displayed in dropdowns';

COMMENT ON COLUMN public.nationalities_master.is_active IS 
  'Whether this nationality is available for selection';

COMMENT ON COLUMN public.nationalities_master.display_order IS 
  'Sort order for dropdown display (lower = higher priority)';

COMMENT ON COLUMN public.users.nationality_iso IS 
  'User''s nationality (ISO 2-letter code) for hotel search defaults';

COMMENT ON FUNCTION get_user_nationality(UUID) IS 
  'Helper function to resolve user nationality with IN fallback';

-- 7. Grant Permissions (if using specific roles)
-- =====================================================
-- Uncomment if you have specific database roles
-- GRANT SELECT ON public.nationalities_master TO readonly_role;
-- GRANT SELECT, UPDATE ON public.users TO app_role;
