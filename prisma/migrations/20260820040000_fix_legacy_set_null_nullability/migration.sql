-- No-op migration.
-- The previous nullable change was withdrawn because the system uses soft deletion.
-- Legacy foreign-key columns remain NOT NULL.
SELECT 1;