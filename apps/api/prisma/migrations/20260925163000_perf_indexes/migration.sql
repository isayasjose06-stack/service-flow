-- Performance indexes for pagination
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ServiceRequest_clientId_createdAt_idx" ON "ServiceRequest"("clientId", "createdAt" DESC);

-- Performance indexes for filtering statuses
CREATE INDEX IF NOT EXISTS "Offer_serviceRequestId_status_idx" ON "Offer"("serviceRequestId", "status");
CREATE INDEX IF NOT EXISTS "Offer_technicianId_status_idx" ON "Offer"("technicianId", "status");
CREATE INDEX IF NOT EXISTS "Service_technicianId_status_idx" ON "Service"("technicianId", "status");

-- GIST indexes for PostGIS geography columns
CREATE INDEX IF NOT EXISTS "CoverageZone_geom_gist_idx" ON "CoverageZone" USING GIST ("geom");
CREATE INDEX IF NOT EXISTS "ServiceRequest_location_gist_idx" ON "ServiceRequest" USING GIST ("location");
