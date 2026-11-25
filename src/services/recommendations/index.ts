// Recommendation Service - Aggregates data for AI recommendations

import type { 
  AirQualityData, 
  WeatherData, 
  AirQualityForecast,
  HouseholdProfile, 
  HouseholdPlant,
  HomeEnvironmentScore 
} from '@/types';

export function calculateHomeEnvironmentScore(
  profile: HouseholdProfile,
  plants: HouseholdPlant[],
  currentAQI?: number
): HomeEnvironmentScore {
  let ventilationScore = 50;
  let purificationScore = 30;
  let greeneryScore = 20;
  let pollutionExposureScore = 50;
  let indoorSourcesScore = 60;

  // Ventilation
  if (profile.hasProperVentilation) ventilationScore += 20;
  if (profile.hasExhaustFan) ventilationScore += 15;
  if (profile.isKitchenVentilated) ventilationScore += 15;

  // Purification
  if (profile.hasAirPurifier) purificationScore += 40;
  if (profile.hasAC) purificationScore += 15;
  // Window management based on AQI
  if (currentAQI && currentAQI > 200 && profile.windowsUsuallyOpen === false) {
    purificationScore += 15;
  }

  // Greenery (capped - plants help but don't replace purifiers)
  const plantCount = plants.length;
  greeneryScore += Math.min(plantCount * 10, 40);
  if (profile.hasGarden) greeneryScore += 20;
  if (profile.hasBalcony) greeneryScore += 10;
  greeneryScore = Math.min(greeneryScore, 80);

  // Pollution exposure (lower is better for the user, but we display as protection score)
  const nearbyRisks = profile.nearbyFeatures || [];
  if (nearbyRisks.includes('busy_road')) pollutionExposureScore -= 20;
  if (nearbyRisks.includes('industrial_area')) pollutionExposureScore -= 25;
  if (nearbyRisks.includes('construction_site')) pollutionExposureScore -= 15;
  if (nearbyRisks.includes('green_area') || nearbyRisks.includes('park')) pollutionExposureScore += 15;
  if (nearbyRisks.includes('river')) pollutionExposureScore += 10;
  if (profile.floorNumber && profile.floorNumber > 5) pollutionExposureScore += 10;

  // Indoor sources
  if (profile.burnsIncense) indoorSourcesScore -= 15;
  if (profile.cookingFuel === 'wood') indoorSourcesScore -= 25;
  if (profile.cookingFuel === 'lpg' && !profile.isKitchenVentilated) indoorSourcesScore -= 10;
  if (profile.experiencesDust) indoorSourcesScore -= 15;

  // Clamp all scores
  ventilationScore = Math.max(0, Math.min(100, ventilationScore));
  purificationScore = Math.max(0, Math.min(100, purificationScore));
  greeneryScore = Math.max(0, Math.min(100, greeneryScore));
  pollutionExposureScore = Math.max(0, Math.min(100, pollutionExposureScore));
  indoorSourcesScore = Math.max(0, Math.min(100, indoorSourcesScore));

  const overall = Math.round(
    (ventilationScore * 0.25 +
      purificationScore * 0.25 +
      greeneryScore * 0.1 +
      pollutionExposureScore * 0.2 +
      indoorSourcesScore * 0.2)
  );

  const recommendations: string[] = [];
  if (ventilationScore < 50) recommendations.push('Improve home ventilation with exhaust fans or cross-ventilation');
  if (purificationScore < 50) recommendations.push('Consider an air purifier with HEPA filter for high-pollution days');
  if (greeneryScore < 40) recommendations.push('Add air-purifying indoor plants as supplementary aids (not replacements for mechanical filtration)');
  if (pollutionExposureScore < 40) recommendations.push('Use air sealing strips on windows and doors facing pollution sources');
  if (indoorSourcesScore < 50) recommendations.push('Reduce indoor pollution sources: improve kitchen ventilation, reduce incense use');

  return {
    overall,
    ventilation: ventilationScore,
    airPurification: purificationScore,
    greenery: greeneryScore,
    pollutionExposure: pollutionExposureScore,
    indoorSources: indoorSourcesScore,
    recommendations,
    disclaimer: 'This score reflects your household setup and habits, not a measured indoor air quality value. It indicates areas where you can improve your indoor environment preparation.',
  };
}

// Get current season for India
export function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 11 || month <= 2) return 'Winter';
  if (month >= 3 && month <= 5) return 'Summer';
  if (month >= 6 && month <= 8) return 'Monsoon';
  return 'Post-Monsoon';
}
