-- Migration to add shipping charges and shipping included columns to ec_products table

-- Add shipping_charges column (DECIMAL type with 10 digits total, 2 decimal places)
ALTER TABLE ec_products 
ADD COLUMN shipping_charges DECIMAL(10,2) DEFAULT 0;

-- Add shipping_included column (BOOLEAN type with default FALSE)
ALTER TABLE ec_products 
ADD COLUMN shipping_included BOOLEAN DEFAULT FALSE;

-- Message to confirm success
SELECT 'Migration completed successfully. Added shipping_charges and shipping_included columns to ec_products table.' AS 'Migration Status';
