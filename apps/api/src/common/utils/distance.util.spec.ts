import { calculateHaversineDistance, isValidCoordinate, getBoundingBox } from './distance.util';

describe('Distance Utility', () => {
  describe('isValidCoordinate', () => {
    it('should return true for valid coordinates', () => {
      expect(isValidCoordinate(0, 0)).toBe(true);
      expect(isValidCoordinate(45, 90)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
      expect(isValidCoordinate(90, 180)).toBe(true);
    });

    it('should return false for invalid latitudes', () => {
      expect(isValidCoordinate(91, 0)).toBe(false);
      expect(isValidCoordinate(-91, 0)).toBe(false);
    });

    it('should return false for invalid longitudes', () => {
      expect(isValidCoordinate(0, 181)).toBe(false);
      expect(isValidCoordinate(0, -181)).toBe(false);
    });

    it('should return false for NaN or Infinity', () => {
      expect(isValidCoordinate(NaN, 0)).toBe(false);
      expect(isValidCoordinate(0, Infinity)).toBe(false);
      expect(isValidCoordinate(-Infinity, 0)).toBe(false);
    });
  });

  describe('calculateHaversineDistance', () => {
    it('should return 0 for the exact same point', () => {
      expect(calculateHaversineDistance(4.6097100, -74.0817500, 4.6097100, -74.0817500)).toBe(0);
    });

    it('should calculate distance between known points accurately (approx)', () => {
      // Bogota: 4.6097, -74.0817
      // Medellin: 6.2442, -75.5812
      // Real distance is ~240km
      const distance = calculateHaversineDistance(4.6097, -74.0817, 6.2442, -75.5812);
      expect(distance).toBeGreaterThan(230000); // 230km
      expect(distance).toBeLessThan(250000); // 250km
    });

    it('should work across different hemispheres', () => {
      // Bogota (North/West)
      // Buenos Aires (South/West): -34.6037, -58.3816
      const distance = calculateHaversineDistance(4.6097, -74.0817, -34.6037, -58.3816);
      expect(distance).toBeGreaterThan(4000000); // ~4600km
    });

    it('should throw if coordinates are invalid', () => {
      expect(() => calculateHaversineDistance(91, 0, 0, 0)).toThrow('Coordenadas inválidas');
    });
  });

  describe('getBoundingBox', () => {
    it('should return a valid bounding box', () => {
      const bbox = getBoundingBox(4.6097, -74.0817, 1000); // 1km radius
      expect(bbox.minLat).toBeLessThan(4.6097);
      expect(bbox.maxLat).toBeGreaterThan(4.6097);
      expect(bbox.minLon).toBeLessThan(-74.0817);
      expect(bbox.maxLon).toBeGreaterThan(-74.0817);
    });
  });
});
