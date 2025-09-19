-- Rename column 'name' to 'item' in inventory_items
BEGIN;

ALTER TABLE public.inventory_items
  RENAME COLUMN name TO item;

COMMIT;