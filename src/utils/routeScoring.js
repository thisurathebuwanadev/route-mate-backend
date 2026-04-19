const MAX_KM = 5;
const MIN_COMPATIBILITY = 0.3;

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => d * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreRoute({ startLat, startLng, endLat, endLng }, route, routePoints) {
  let startDist, endDist;

  if (routePoints && routePoints.length > 0) {
    // Find first route point within MAX_KM of passenger's start
    let startMatchIndex = -1;
    for (let i = 0; i < routePoints.length; i++) {
      const dist = haversineDistance(startLat, startLng, routePoints[i].latitude, routePoints[i].longitude);
      if (dist <= MAX_KM) {
        startDist = dist;
        startMatchIndex = i;
        break;
      }
    }
    if (startMatchIndex === -1) return null;

    // From matched index onward, find a route point within MAX_KM of passenger's end
    let endMatched = false;
    for (let i = startMatchIndex; i < routePoints.length; i++) {
      const dist = haversineDistance(endLat, endLng, routePoints[i].latitude, routePoints[i].longitude);
      if (dist <= MAX_KM) {
        endDist = dist;
        endMatched = true;
        break;
      }
    }
    if (!endMatched) return null;
  } else {
    // Fallback to route start/end when no route points exist
    startDist = haversineDistance(startLat, startLng, route.start_latitude, route.start_longitude);
    endDist = haversineDistance(endLat, endLng, route.end_latitude, route.end_longitude);
  }

  const startScore = Math.max(0, 1 - startDist / MAX_KM);
  const endScore = Math.max(0, 1 - endDist / MAX_KM);
  const compatibilityScore = (startScore + endScore) / 2;

  if (compatibilityScore < MIN_COMPATIBILITY) return null;

  const proximityScore = Math.max(0, 1 - startDist / MAX_KM);
  const trustScore = route.trust_score || 0;
  const compositeScore = (compatibilityScore * 0.4) + (trustScore / 5 * 0.3) + (proximityScore * 0.3);

  return {
    compatibilityScore: parseFloat(compatibilityScore.toFixed(2)),
    compositeScore: parseFloat(compositeScore.toFixed(2)),
    distanceFromPickup: parseFloat(startDist.toFixed(2))
  };
}

module.exports = { haversineDistance, scoreRoute, MAX_KM, MIN_COMPATIBILITY };
