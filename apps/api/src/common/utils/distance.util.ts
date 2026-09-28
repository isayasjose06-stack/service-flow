/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    throw new Error('Coordenadas inválidas. Latitud [-90, 90], Longitud [-180, 180]');
  }

  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function isValidCoordinate(lat: number, lon: number): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (isNaN(lat) || isNaN(lon)) return false;
  if (!isFinite(lat) || !isFinite(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  return true;
}

/**
 * Calculates a bounding box (min/max lat and lon) for a given central point and radius.
 * Useful for filtering results in DB before applying exact Haversine.
 * 
 * @param lat Center latitude
 * @param lon Center longitude
 * @param radiusInMeters Radius in meters
 */
export function getBoundingBox(lat: number, lon: number, radiusInMeters: number) {
  if (!isValidCoordinate(lat, lon)) {
    throw new Error('Coordenadas inválidas.');
  }

  const R = 6371e3; // Radio Tierra en metros
  const latDelta = (radiusInMeters / R) * (180 / Math.PI);
  
  // Calculate longitude delta depending on latitude
  const lonDelta = (radiusInMeters / (R * Math.cos((Math.PI * lat) / 180))) * (180 / Math.PI);

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta,
  };
}
