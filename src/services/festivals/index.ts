// Festival Calendar Service - Indian festivals and pollution events

import type { FestivalEvent } from '@/types';

// Maintained festival calendar with approximate dates
// Dates for lunar-calendar festivals are approximate and should be updated annually
const FESTIVAL_DATABASE: Omit<FestivalEvent, 'id'>[] = [
  {
    name: 'Diwali',
    date: '2026-10-20',
    endDate: '2026-10-22',
    region: 'pan-india',
    pollutionImpact: 'very_high',
    pollutionType: ['firecrackers', 'PM2.5', 'PM10', 'SO2', 'noise'],
    description: 'Festival of lights. Extensive firecracker use causes severe air quality deterioration, especially in north India. PM2.5 levels can spike 5-10x above normal.',
    historicalAQIImpact: {
      avgAQIBefore: 200,
      avgAQIDuring: 450,
      avgAQIAfter: 350,
      peakAQI: 500,
      recoveryDays: 5,
    },
  },
  {
    name: 'New Year (1 January)',
    date: '2027-01-01',
    region: 'pan-india',
    pollutionImpact: 'medium',
    pollutionType: ['firecrackers', 'PM2.5', 'traffic'],
    description: 'New Year celebrations with firecrackers and increased traffic. Combined with winter conditions, pollution can be significant.',
    historicalAQIImpact: {
      avgAQIBefore: 250,
      avgAQIDuring: 350,
      avgAQIAfter: 280,
      peakAQI: 400,
      recoveryDays: 2,
    },
  },
  {
    name: 'Christmas',
    date: '2026-12-25',
    region: 'pan-india',
    pollutionImpact: 'low',
    pollutionType: ['traffic', 'bonfires'],
    description: 'Christmas celebrations with moderate increase in traffic and some bonfires in certain regions.',
  },
  {
    name: 'Kali Puja',
    date: '2026-10-20',
    region: 'east-india',
    pollutionImpact: 'high',
    pollutionType: ['firecrackers', 'PM2.5', 'PM10'],
    description: 'Celebrated primarily in West Bengal and eastern India alongside Diwali with significant firecracker use.',
  },
  {
    name: 'Chhath Puja',
    date: '2026-10-26',
    region: 'north-india',
    pollutionImpact: 'low',
    pollutionType: ['biomass_burning', 'traffic'],
    description: 'Sun worship festival. Relatively lower direct pollution impact but occurs during peak winter pollution season.',
  },
  {
    name: 'Holi',
    date: '2027-03-14',
    region: 'pan-india',
    pollutionImpact: 'medium',
    pollutionType: ['bonfires', 'PM2.5', 'traffic'],
    description: 'Festival of colors. Holika Dahan (bonfire) night can cause localized air quality deterioration.',
  },
  {
    name: 'Durga Puja',
    date: '2026-10-14',
    endDate: '2026-10-18',
    region: 'east-india',
    pollutionImpact: 'medium',
    pollutionType: ['traffic', 'generators', 'PM2.5'],
    description: 'Major festival in eastern India with large gatherings, traffic congestion, and use of diesel generators for pandals.',
  },
  {
    name: 'Dussehra / Vijayadashami',
    date: '2026-10-11',
    region: 'pan-india',
    pollutionImpact: 'medium',
    pollutionType: ['effigy_burning', 'firecrackers', 'PM2.5'],
    description: 'Ravan effigy burning releases significant smoke and particulates in localized areas.',
  },
  {
    name: 'Lohri',
    date: '2027-01-13',
    region: 'north-india',
    pollutionImpact: 'medium',
    pollutionType: ['bonfires', 'PM2.5', 'PM10'],
    description: 'Bonfire festival in Punjab and north India. Multiple community bonfires contribute to localized air quality deterioration.',
  },
  {
    name: 'Makar Sankranti / Pongal',
    date: '2027-01-14',
    region: 'pan-india',
    pollutionImpact: 'low',
    pollutionType: ['bonfires', 'crop_burning'],
    description: 'Harvest festival with regional bonfires. Impact varies by region.',
  },
];

export function getUpcomingFestivals(daysAhead: number = 60, region?: string): FestivalEvent[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return FESTIVAL_DATABASE
    .filter((f) => {
      const festDate = new Date(f.date);
      return festDate >= now && festDate <= cutoff;
    })
    .filter((f) => !region || f.region === 'pan-india' || f.region === region)
    .map((f, i) => ({
      ...f,
      id: `festival_${i}_${f.name.toLowerCase().replace(/\s/g, '_')}`,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getFestivalWarnings(daysAhead: number = 30): Array<{
  festival: FestivalEvent;
  daysUntil: number;
  warningLevel: 'prepare' | 'imminent' | 'active' | 'recovery';
  preparations: string[];
}> {
  const now = new Date();
  const festivals = getUpcomingFestivals(daysAhead);

  return festivals
    .filter((f) => f.pollutionImpact !== 'none' && f.pollutionImpact !== 'low')
    .map((f) => {
      const festDate = new Date(f.date);
      const daysUntil = Math.ceil((festDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      let warningLevel: 'prepare' | 'imminent' | 'active' | 'recovery';
      if (daysUntil > 7) warningLevel = 'prepare';
      else if (daysUntil > 3) warningLevel = 'imminent';
      else if (daysUntil >= 0) warningLevel = 'active';
      else warningLevel = 'recovery';

      const preparations: string[] = [];
      if (f.pollutionImpact === 'very_high' || f.pollutionImpact === 'high') {
        preparations.push('Service your air purifier and check filter condition');
        preparations.push('Stock up on N95/PM2.5 respirator masks');
        preparations.push('Keep windows and doors sealed during peak pollution hours');
        preparations.push('Avoid outdoor exercise during and after the festival');
        preparations.push('Keep emergency medication accessible if you have respiratory conditions');
      }
      if (f.pollutionImpact === 'medium') {
        preparations.push('Keep windows closed during evening and night hours');
        preparations.push('Use an air purifier if available');
        preparations.push('Limit outdoor exposure during peak hours');
      }
      preparations.push('Monitor AQI levels before stepping outside');
      preparations.push('Plan safer commuting timings to avoid peak traffic');

      return { festival: f, daysUntil, warningLevel, preparations };
    });
}

export function getSeasonalRisk(month: number): {
  season: string;
  riskLevel: string;
  description: string;
  factors: string[];
  recommendations: string[];
} {
  if (month >= 11 || month <= 2) {
    return {
      season: 'Winter',
      riskLevel: 'High',
      description: 'Winter months typically see the worst air quality due to temperature inversion, low wind speeds, and agricultural residue burning.',
      factors: [
        'Temperature inversion traps pollutants near ground level',
        'Low wind speeds reduce pollutant dispersal',
        'Fog and smog reduce visibility and trap particles',
        'Stubble burning in agricultural regions (Oct-Nov)',
        'Increased use of heating fuels',
        'Festive season firecrackers',
      ],
      recommendations: [
        'Keep air purifiers running continuously',
        'Avoid outdoor exercise during early morning and evening',
        'Use N95 masks when AQI exceeds 200',
        'Keep windows closed during peak pollution hours',
        'Use indoor plants as supplementary air quality aids (not replacements for mechanical filtration)',
        'Monitor AQI before any outdoor activity',
      ],
    };
  }

  if (month >= 3 && month <= 5) {
    return {
      season: 'Summer',
      riskLevel: 'Moderate',
      description: 'Summer brings dust storms, high ozone levels, and heat-related air quality concerns.',
      factors: [
        'Dust storms from western deserts',
        'High ground-level ozone from UV radiation',
        'Construction dust in dry conditions',
        'Increased vehicle emissions from AC usage',
      ],
      recommendations: [
        'Stay hydrated and avoid midday outdoor exposure',
        'Monitor ozone levels in addition to PM2.5',
        'Use dust-proof curtains and seals',
        'Keep homes well-ventilated during early morning',
      ],
    };
  }

  if (month >= 6 && month <= 8) {
    return {
      season: 'Monsoon',
      riskLevel: 'Low',
      description: 'Monsoon rains typically wash out pollutants, resulting in the best air quality of the year.',
      factors: [
        'Rainfall washes out particulate matter',
        'High humidity can trap some pollutants',
        'Reduced dust due to wet conditions',
        'Possible localized flooding affecting air quality temporarily',
      ],
      recommendations: [
        'Good time for outdoor activities during clear spells',
        'Watch for post-rain humidity spikes',
        'Maintain indoor ventilation to prevent mold',
        'Take advantage of cleaner air for home ventilation',
      ],
    };
  }

  // Sept-Oct (Post-monsoon)
  return {
    season: 'Post-Monsoon',
    riskLevel: 'Moderate to High',
    description: 'Post-monsoon transition period with deteriorating air quality as winter approaches.',
    factors: [
      'Stubble burning begins in Punjab and Haryana',
      'Wind patterns shift, reducing dispersal',
      'Temperature begins dropping, early inversions possible',
      'Festival season begins',
    ],
    recommendations: [
      'Start preparing for winter pollution season',
      'Service air purifiers and check filters',
      'Monitor regional stubble burning reports',
      'Begin limiting outdoor exposure in evening hours',
    ],
  };
}
