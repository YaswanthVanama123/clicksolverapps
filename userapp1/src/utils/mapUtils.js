/**
 * Compute bounding box from array of coordinates
 * @param {Array} coords - Array of [lng, lat] coordinates
 * @returns {{ne: [number, number], sw: [number, number]}}
 */
export const computeBoundingBox = coords => {
  let minX, minY, maxX, maxY;

  for (let coord of coords) {
    const [x, y] = coord; // x = lng, y = lat
    if (minX === undefined || x < minX) {
      minX = x;
    }
    if (maxX === undefined || x > maxX) {
      maxX = x;
    }
    if (minY === undefined || y < minY) {
      minY = y;
    }
    if (maxY === undefined || y > maxY) {
      maxY = y;
    }
  }

  return {
    ne: [maxX, maxY],
    sw: [minX, minY],
  };
};

/**
 * Prepare marker features for Mapbox
 * @param {Array} startPoint - [lng, lat]
 * @param {Array} endPoint - [lng, lat]
 * @returns {object} GeoJSON FeatureCollection
 */
export const prepareMarkers = (startPoint, endPoint) => {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          icon: 'start-point-icon',
          iconSize: 0.2,
        },
        geometry: {
          type: 'Point',
          coordinates: startPoint,
        },
      },
      {
        type: 'Feature',
        properties: {
          icon: 'end-point-icon',
          iconSize: 0.13,
        },
        geometry: {
          type: 'Point',
          coordinates: endPoint,
        },
      },
    ],
  };
};

/**
 * Decode polyline and convert to GeoJSON Feature
 * @param {string} encodedPolyline - Encoded polyline string
 * @param {object} polyline - Polyline decoder library
 * @returns {object} GeoJSON Feature
 */
export const decodeRoutePolyline = (encodedPolyline, polyline) => {
  const decodedCoordinates = polyline
    .decode(encodedPolyline)
    .map(coord => [coord[1], coord[0]]); // [lng, lat]

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: decodedCoordinates,
    },
  };
};
