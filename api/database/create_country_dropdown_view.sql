-- ========================================
-- Country Dropdown View for Faredown
-- ========================================

-- Create the dropdown view for easy frontend integration
CREATE OR REPLACE VIEW v_country_dropdown AS
SELECT 
    iso2,
    name as display_name,
    flag_emoji,
    popular,
    -- Order popular countries first, then alphabetically
    CASE WHEN popular = true THEN 0 ELSE 1 END as sort_order
FROM public.countries
ORDER BY sort_order, display_name;

-- Grant permissions to the view
GRANT SELECT ON v_country_dropdown TO public;

-- Test the view
SELECT * FROM v_country_dropdown LIMIT 10;
