-- Migrate all 'restaurant' data to 'cafe'
BEGIN;

UPDATE "orders" SET "businessUnit" = 'cafe' WHERE "businessUnit" = 'restaurant';
UPDATE "menu_items" SET "businessUnit" = 'cafe' WHERE "businessUnit" = 'restaurant';
UPDATE "tables" SET "businessUnit" = 'cafe' WHERE "businessUnit" = 'restaurant';
UPDATE "bills" SET "businessUnit" = 'cafe' WHERE "businessUnit" = 'restaurant';

COMMIT;
