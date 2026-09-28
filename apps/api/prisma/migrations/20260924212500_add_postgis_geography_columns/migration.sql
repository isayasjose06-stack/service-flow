-- AlterTable
ALTER TABLE "CoverageZone" ADD COLUMN "geom" geography(Point,4326);

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN "location" geography(Point,4326);