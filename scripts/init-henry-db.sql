-- Create app role + database (matches docker-compose credentials).
-- Native PostgreSQL on Windows: run as superuser, e.g.
--   "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -f scripts/init-henry-db.sql

CREATE USER henry WITH PASSWORD 'henry';
CREATE DATABASE henry OWNER henry;
