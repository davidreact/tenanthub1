-- Migration to convert from square feet to square meters
-- This migration handles the unit conversion for property areas

-- Step 1: Add new square_meters column
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS square_meters INTEGER;

-- Step 2: Convert existing square feet values to square meters (1 sq ft = 0.092903 sq m)
-- Round to nearest integer for simplicity
UPDATE public.properties 
SET square_meters = ROUND(square_feet * 0.092903)
WHERE square_feet IS NOT NULL;

-- Step 3: Set default value for new records
ALTER TABLE public.properties 
ALTER COLUMN square_meters SET DEFAULT 0;

-- Step 4: Update any zero values to NULL for consistency
UPDATE public.properties 
SET square_meters = NULL 
WHERE square_meters = 0 AND square_feet IS NULL;

-- Step 5: Drop the old square_feet column (commented out for safety - uncomment after verification)
-- ALTER TABLE public.properties DROP COLUMN IF EXISTS square_feet;

-- Note: To rollback this migration, you would need to:
-- 1. Add back the square_feet column
-- 2. Convert square meters back to square feet (1 sq m = 10.7639 sq ft)
-- 3. Drop the square_meters column
