export interface MatchScoreDetails {
  workerId: string;
  matchScore: number; // 0 to 100%
  breakdown: {
    proximityScore: number;
    ratingScore: number;
    reliabilityScore: number;
    availabilityScore: number;
    skillMatchScore: number;
    distanceKm: number;
    declineRatio: number;
  };
}

// Haversine formula for distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function rankWorker(
  worker: {
    id: string;
    skills: string;
    rating_avg: number;
    availability_status: boolean;
    lat: number | null;
    lng: number | null;
    total_accepted_requests?: number;
    total_declined_requests?: number;
    reliability_score?: number;
  },
  reqLat?: number,
  reqLng?: number,
  categoryName?: string
): MatchScoreDetails {
  // Proximity score: if lat/lng available, calculate distance
  let distanceKm = 5.0; // default estimated distance
  if (reqLat && reqLng && worker.lat && worker.lng) {
    distanceKm = calculateDistanceKm(reqLat, reqLng, worker.lat, worker.lng);
  }
  // Inverse proximity normalization: score = 1 / (1 + distance/10)
  const proximityScore = Math.max(0, Math.min(1, 1 / (1 + distanceKm / 10)));

  // Rating score (0 to 1)
  const ratingScore = Math.max(0, Math.min(1, worker.rating_avg / 5.0));

  // Availability score (1 or 0)
  const availabilityScore = worker.availability_status ? 1.0 : 0.0;

  // Reliability tracking: compute decline ratio (declines / total accepted)
  // Higher declines lead to lower reliability score and lower overall rank
  const totalAccepted = worker.total_accepted_requests || 0;
  const totalDeclined = worker.total_declined_requests || 0;
  const declineRatio = totalAccepted > 0 ? Math.min(1, totalDeclined / totalAccepted) : 0;
  const reliabilityScore = Math.max(0, 1 - declineRatio);

  // Exact skill match (1, 0.5, or 0)
  let skillMatchScore = 0.5;
  if (categoryName) {
    const workerSkillsLower = worker.skills.toLowerCase();
    const catLower = categoryName.toLowerCase();
    if (workerSkillsLower.includes(catLower)) {
      skillMatchScore = 1.0;
    } else if (workerSkillsLower.split(',').some(s => catLower.includes(s.trim()) || s.trim().includes(catLower))) {
      skillMatchScore = 0.8;
    }
  }

  // Weighted total match score formula:
  // Proximity: 35%, Rating: 25%, Reliability: 15%, Availability: 15%, Skill Match: 10%
  const matchScoreRaw =
    0.35 * proximityScore +
    0.25 * ratingScore +
    0.15 * reliabilityScore +
    0.15 * availabilityScore +
    0.10 * skillMatchScore;

  const matchScorePct = Number((matchScoreRaw * 100).toFixed(1));

  return {
    workerId: worker.id,
    matchScore: matchScorePct,
    breakdown: {
      proximityScore: Number((proximityScore * 100).toFixed(1)),
      ratingScore: Number((ratingScore * 100).toFixed(1)),
      reliabilityScore: Number((reliabilityScore * 100).toFixed(1)),
      availabilityScore: Number((availabilityScore * 100).toFixed(1)),
      skillMatchScore: Number((skillMatchScore * 100).toFixed(1)),
      distanceKm,
      declineRatio: Number((declineRatio * 100).toFixed(1))
    }
  };
}
