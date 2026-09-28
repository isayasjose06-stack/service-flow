-- ============================================================================
-- ServiceFlow — Manual PostGIS Setup & Constraints
-- ============================================================================
-- This script must be executed manually against the database or added to the
-- initial Prisma migration because Prisma does not natively support PostGIS
-- GEOGRAPHY types or advanced CHECK constraints in the schema.
-- ============================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. CoverageZone: geom field (PostGIS)
ALTER TABLE "CoverageZone" ADD COLUMN IF NOT EXISTS "geom" geography(Point, 4326);
CREATE INDEX IF NOT EXISTS "idx_coverage_zone_geom" ON "CoverageZone" USING GIST("geom");

-- 3. ServiceRequest: location field (PostGIS)
ALTER TABLE "ServiceRequest" ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326);
CREATE INDEX IF NOT EXISTS "idx_service_request_location" ON "ServiceRequest" USING GIST("location");

-- 4. Rating: Advanced CHECK constraints
-- A user cannot rate themselves
ALTER TABLE "Rating" ADD CONSTRAINT "chk_rating_not_self" CHECK ("fromUserId" != "toUserId");

-- The score must be between 1 and 5
ALTER TABLE "Rating" ADD CONSTRAINT "chk_rating_score_range" CHECK ("score" BETWEEN 1 AND 5);

-- 5. Offer: Limit estimatedDuration (optional safety)
ALTER TABLE "Offer" ADD CONSTRAINT "chk_offer_duration_positive" CHECK ("estimatedDuration" > 0);

-- ============================================================================
-- Trigger (Optional): Auto-update geom/location from lat/lon inserts
-- ============================================================================
-- If you want the database to automatically calculate the geography point
-- whenever latitude and longitude are inserted/updated.

/*
CREATE OR REPLACE FUNCTION update_coverage_zone_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude::float8, NEW.latitude::float8), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_coverage_zone_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON "CoverageZone"
FOR EACH ROW EXECUTE FUNCTION update_coverage_zone_geom();

CREATE OR REPLACE FUNCTION update_service_request_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude::float8, NEW.latitude::float8), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_service_request_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON "ServiceRequest"
FOR EACH ROW EXECUTE FUNCTION update_service_request_location();
*/
