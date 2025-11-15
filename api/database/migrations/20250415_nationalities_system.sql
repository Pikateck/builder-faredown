-- =====================================================
-- Nationality System Migration
-- Created: 2025-04-15
-- Purpose: Add nationality support for hotel search and user profiles
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

-- Create index for active nationalities (used by dropdown)
CREATE INDEX IF NOT EXISTS idx_nationalities_active 
  ON public.nationalities_master (is_active, display_order, country_name) 
  WHERE is_active = true;

-- 2. Extend Users Table with Nationality
-- =====================================================
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS nationality_iso VARCHAR(2);

-- Add foreign key constraint
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

-- 3. Seed Nationalities Master Data
-- =====================================================
-- Priority countries (display_order < 100)
INSERT INTO public.nationalities_master (iso_code, country_name, display_order) VALUES
  ('IN', 'India', 1),
  ('AE', 'United Arab Emirates', 2),
  ('GB', 'United Kingdom', 3),
  ('US', 'United States', 4),
  ('SG', 'Singapore', 5),
  ('AU', 'Australia', 6),
  ('CA', 'Canada', 7),
  ('SA', 'Saudi Arabia', 8),
  ('QA', 'Qatar', 9),
  ('KW', 'Kuwait', 10),
  ('BH', 'Bahrain', 11),
  ('OM', 'Oman', 12),
  ('FR', 'France', 13),
  ('DE', 'Germany', 14),
  ('IT', 'Italy', 15),
  ('ES', 'Spain', 16),
  ('NL', 'Netherlands', 17),
  ('CH', 'Switzerland', 18),
  ('MY', 'Malaysia', 19),
  ('TH', 'Thailand', 20),
  ('ID', 'Indonesia', 21),
  ('PH', 'Philippines', 22),
  ('CN', 'China', 23),
  ('JP', 'Japan', 24),
  ('KR', 'South Korea', 25),
  ('NZ', 'New Zealand', 26),
  ('ZA', 'South Africa', 27),
  ('EG', 'Egypt', 28),
  ('TR', 'Turkey', 29),
  ('BR', 'Brazil', 30),
  ('MX', 'Mexico', 31),
  ('AR', 'Argentina', 32),
  ('CL', 'Chile', 33),
  ('CO', 'Colombia', 34),
  ('PE', 'Peru', 35),
  ('RU', 'Russia', 36),
  ('PL', 'Poland', 37),
  ('SE', 'Sweden', 38),
  ('NO', 'Norway', 39),
  ('DK', 'Denmark', 40),
  ('FI', 'Finland', 41),
  ('IE', 'Ireland', 42),
  ('BE', 'Belgium', 43),
  ('AT', 'Austria', 44),
  ('PT', 'Portugal', 45),
  ('GR', 'Greece', 46),
  ('CZ', 'Czech Republic', 47),
  ('HU', 'Hungary', 48),
  ('RO', 'Romania', 49),
  ('IL', 'Israel', 50)
ON CONFLICT (iso_code) DO UPDATE SET
  country_name = EXCLUDED.country_name,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Standard countries (alphabetical, display_order = 999)
INSERT INTO public.nationalities_master (iso_code, country_name) VALUES
  ('AF', 'Afghanistan'),
  ('AL', 'Albania'),
  ('DZ', 'Algeria'),
  ('AD', 'Andorra'),
  ('AO', 'Angola'),
  ('AG', 'Antigua and Barbuda'),
  ('AM', 'Armenia'),
  ('AZ', 'Azerbaijan'),
  ('BS', 'Bahamas'),
  ('BD', 'Bangladesh'),
  ('BB', 'Barbados'),
  ('BY', 'Belarus'),
  ('BZ', 'Belize'),
  ('BJ', 'Benin'),
  ('BT', 'Bhutan'),
  ('BO', 'Bolivia'),
  ('BA', 'Bosnia and Herzegovina'),
  ('BW', 'Botswana'),
  ('BN', 'Brunei'),
  ('BG', 'Bulgaria'),
  ('BF', 'Burkina Faso'),
  ('BI', 'Burundi'),
  ('CV', 'Cabo Verde'),
  ('KH', 'Cambodia'),
  ('CM', 'Cameroon'),
  ('CF', 'Central African Republic'),
  ('TD', 'Chad'),
  ('CR', 'Costa Rica'),
  ('HR', 'Croatia'),
  ('CU', 'Cuba'),
  ('CY', 'Cyprus'),
  ('CI', 'Côte d''Ivoire'),
  ('CD', 'Democratic Republic of the Congo'),
  ('DJ', 'Djibouti'),
  ('DM', 'Dominica'),
  ('DO', 'Dominican Republic'),
  ('EC', 'Ecuador'),
  ('SV', 'El Salvador'),
  ('GQ', 'Equatorial Guinea'),
  ('ER', 'Eritrea'),
  ('EE', 'Estonia'),
  ('SZ', 'Eswatini'),
  ('ET', 'Ethiopia'),
  ('FJ', 'Fiji'),
  ('GA', 'Gabon'),
  ('GM', 'Gambia'),
  ('GE', 'Georgia'),
  ('GH', 'Ghana'),
  ('GD', 'Grenada'),
  ('GT', 'Guatemala'),
  ('GN', 'Guinea'),
  ('GW', 'Guinea-Bissau'),
  ('GY', 'Guyana'),
  ('HT', 'Haiti'),
  ('HN', 'Honduras'),
  ('IS', 'Iceland'),
  ('IQ', 'Iraq'),
  ('JM', 'Jamaica'),
  ('JO', 'Jordan'),
  ('KZ', 'Kazakhstan'),
  ('KE', 'Kenya'),
  ('KI', 'Kiribati'),
  ('XK', 'Kosovo'),
  ('KG', 'Kyrgyzstan'),
  ('LA', 'Laos'),
  ('LV', 'Latvia'),
  ('LB', 'Lebanon'),
  ('LS', 'Lesotho'),
  ('LR', 'Liberia'),
  ('LY', 'Libya'),
  ('LI', 'Liechtenstein'),
  ('LT', 'Lithuania'),
  ('LU', 'Luxembourg'),
  ('MG', 'Madagascar'),
  ('MW', 'Malawi'),
  ('MV', 'Maldives'),
  ('ML', 'Mali'),
  ('MT', 'Malta'),
  ('MH', 'Marshall Islands'),
  ('MR', 'Mauritania'),
  ('MU', 'Mauritius'),
  ('FM', 'Micronesia'),
  ('MD', 'Moldova'),
  ('MC', 'Monaco'),
  ('MN', 'Mongolia'),
  ('ME', 'Montenegro'),
  ('MA', 'Morocco'),
  ('MZ', 'Mozambique'),
  ('MM', 'Myanmar'),
  ('NA', 'Namibia'),
  ('NR', 'Nauru'),
  ('NP', 'Nepal'),
  ('NI', 'Nicaragua'),
  ('NE', 'Niger'),
  ('NG', 'Nigeria'),
  ('KP', 'North Korea'),
  ('MK', 'North Macedonia'),
  ('PK', 'Pakistan'),
  ('PW', 'Palau'),
  ('PS', 'Palestine'),
  ('PA', 'Panama'),
  ('PG', 'Papua New Guinea'),
  ('PY', 'Paraguay'),
  ('CG', 'Republic of the Congo'),
  ('RW', 'Rwanda'),
  ('KN', 'Saint Kitts and Nevis'),
  ('LC', 'Saint Lucia'),
  ('VC', 'Saint Vincent and the Grenadines'),
  ('WS', 'Samoa'),
  ('SM', 'San Marino'),
  ('ST', 'Sao Tome and Principe'),
  ('SN', 'Senegal'),
  ('RS', 'Serbia'),
  ('SC', 'Seychelles'),
  ('SL', 'Sierra Leone'),
  ('SK', 'Slovakia'),
  ('SI', 'Slovenia'),
  ('SB', 'Solomon Islands'),
  ('SO', 'Somalia'),
  ('SS', 'South Sudan'),
  ('LK', 'Sri Lanka'),
  ('SD', 'Sudan'),
  ('SR', 'Suriname'),
  ('SY', 'Syria'),
  ('TJ', 'Tajikistan'),
  ('TZ', 'Tanzania'),
  ('TL', 'Timor-Leste'),
  ('TG', 'Togo'),
  ('TO', 'Tonga'),
  ('TT', 'Trinidad and Tobago'),
  ('TN', 'Tunisia'),
  ('TM', 'Turkmenistan'),
  ('TV', 'Tuvalu'),
  ('UG', 'Uganda'),
  ('UA', 'Ukraine'),
  ('UY', 'Uruguay'),
  ('UZ', 'Uzbekistan'),
  ('VU', 'Vanuatu'),
  ('VA', 'Vatican City'),
  ('VE', 'Venezuela'),
  ('VN', 'Vietnam'),
  ('YE', 'Yemen'),
  ('ZM', 'Zambia'),
  ('ZW', 'Zimbabwe')
ON CONFLICT (iso_code) DO NOTHING;

-- 4. Create Audit Trigger for Updates
-- =====================================================
CREATE OR REPLACE FUNCTION update_nationalities_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nationalities_updated_at ON public.nationalities_master;
CREATE TRIGGER trg_nationalities_updated_at
  BEFORE UPDATE ON public.nationalities_master
  FOR EACH ROW
  EXECUTE FUNCTION update_nationalities_timestamp();

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

-- 6. Add Comments for Documentation
-- =====================================================
COMMENT ON TABLE public.nationalities_master IS 
  'Master table of nationalities (ISO 3166-1 alpha-2) for hotel search and user profiles';

COMMENT ON COLUMN public.nationalities_master.iso_code IS 
  'ISO 3166-1 alpha-2 country code (2 letters)';

COMMENT ON COLUMN public.nationalities_master.display_order IS 
  'Lower values appear first in dropdowns (priority countries)';

COMMENT ON COLUMN public.nationalities_master.is_active IS 
  'Whether this nationality is available for selection';

COMMENT ON COLUMN public.users.nationality_iso IS 
  'User''s nationality (ISO 2-letter code), used for hotel search defaults';

COMMENT ON FUNCTION get_user_nationality(UUID) IS 
  'Helper function to resolve user nationality with IN fallback';

-- 7. Verification Queries (for testing after migration)
-- =====================================================
-- Uncomment to verify migration success:
-- SELECT COUNT(*) as total_nationalities FROM public.nationalities_master;
-- SELECT COUNT(*) as active_nationalities FROM public.nationalities_master WHERE is_active = true;
-- SELECT iso_code, country_name FROM public.nationalities_master ORDER BY display_order LIMIT 20;
-- SELECT get_user_nationality('00000000-0000-0000-0000-000000000000'::UUID) as default_nationality;
