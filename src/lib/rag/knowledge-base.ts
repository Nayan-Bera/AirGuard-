// Trusted Environmental Knowledge Base & Retrieval (RAG)
// Provides verified guidance from WHO, CPCB (India), and public health authorities
// Never used as a substitute for real-time environmental APIs.

export interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  url?: string;
  category:
  | 'aqi_standards'
  | 'health_guidelines'
  | 'indoor_air'
  | 'respirators'
  | 'plants'
  | 'seasonal';
  tags: string[];
  content: string;
}

export const TRUSTED_KNOWLEDGE_BASE: KnowledgeDocument[] = [
  {
    id: 'cpcb-aqi-categories',
    title: 'India CPCB National Air Quality Index (NAQI) Categories',
    source: 'Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change, India',
    url: 'https://cpcb.nic.in/',
    category: 'aqi_standards',
    tags: ['aqi', 'cpcb', 'india', 'categories', 'good', 'satisfactory', 'moderate', 'poor', 'very poor', 'severe', 'pm2.5', 'pm10'],
    content:
      'CPCB defines 6 AQI categories: Good (0-50, minimal impact), Satisfactory (51-100, minor breathing discomfort to sensitive people), Moderate (101-200, breathing discomfort to people with lung/heart disease, children, older adults), Poor (201-300, breathing discomfort to most people on prolonged exposure), Very Poor (301-400, respiratory illness on prolonged exposure), Severe (401-500, affects healthy people and seriously impacts those with existing diseases).',
  },
  {
    id: 'who-aqg-2021',
    title: 'WHO Global Air Quality Guidelines (2021)',
    source: 'World Health Organization (WHO)',
    url: 'https://www.who.int/publications/i/item/9789240034228',
    category: 'health_guidelines',
    tags: ['who', 'pm2.5', 'pm10', 'no2', 'o3', 'so2', 'co', 'guidelines', 'threshold', 'safe'],
    content:
      'WHO 2021 Air Quality Guidelines recommend 24-hour mean PM2.5 below 15 µg/m³ (annual 5 µg/m³), 24-hour mean PM10 below 45 µg/m³ (annual 15 µg/m³), 24-hour NO2 below 25 µg/m³, and 8-hour peak O3 below 100 µg/m³. No level of PM2.5 is completely free of health risk, especially for children, pregnant individuals, older adults, and people with cardiorespiratory conditions.',
  },
  {
    id: 'indoor-air-filtration',
    title: 'Indoor Air Quality & Mechanical HEPA Filtration',
    source: 'WHO / US EPA Indoor Air Quality Guidance',
    url: 'https://www.epa.gov/indoor-air-quality-iaq',
    category: 'indoor_air',
    tags: ['indoor', 'hepa', 'purifier', 'windows', 'ventilation', 'cooking', 'incense', 'dust', 'smoke'],
    content:
      'During high outdoor AQI episodes (>200), keep windows and doors sealed and run a properly sized True HEPA (H13/H14) air purifier with a Clean Air Delivery Rate (CADR) matched to room size. Avoid burning incense sticks (agarbatti), candles, or mosquito coils indoors, as they generate high indoor PM2.5. Always use a kitchen exhaust fan or chimney when cooking, especially with LPG or solid fuels.',
  },
  {
    id: 'plants-limitations',
    title: 'Role and Limitations of Indoor Plants for Air Quality',
    source: 'Environmental Science & Indoor Air Quality Consensus (Cummings & Waring, 2019; EPA)',
    category: 'plants',
    tags: ['plants', 'snake plant', 'areca palm', 'peace lily', 'pothos', 'pm2.5', 'purifier', 'voc'],
    content:
      'While indoor plants (such as Snake Plant, Areca Palm, Peace Lily, Spider Plant) support humidity balance, mental wellbeing, and minor surface dust settling, scientific studies show ordinary houseplants cannot meaningfully lower indoor PM2.5 or replace mechanical HEPA air purifiers in real-world homes. Keep leaves clean of settled dust and use plants alongside proper ventilation or filtration.',
  },
  {
    id: 'respirator-n95-guidance',
    title: 'Particulate Respirator (N95 / FFP2 / KN95) Guidance',
    source: 'Public Health & Occupational Safety Guidance',
    category: 'respirators',
    tags: ['mask', 'n95', 'ffp2', 'kn95', 'bike', 'commute', 'travel', 'outdoor', 'walk', 'exercise'],
    content:
      'Cloth and surgical masks do not reliably filter fine PM2.5 particles. When outdoor AQI is Poor (>200) or higher, or when commuting by two-wheeler/walking near busy traffic, a properly fitted N95 or FFP2 particulate respirator without an exhalation valve (or with a well-sealed fit around the nose bridge and chin) helps reduce inhaled particulate exposure. Avoid vigorous outdoor exercise during Poor to Severe AQI.',
  },
  {
    id: 'winter-inversion-smog',
    title: 'Winter Temperature Inversion, Smog, and Festival Spikes',
    source: 'India Meteorological Department (IMD) & CPCB Seasonal Advisories',
    category: 'seasonal',
    tags: ['winter', 'smog', 'inversion', 'fog', 'diwali', 'new year', 'firecrackers', 'stubble', 'morning', 'evening'],
    content:
      'In North and urban India during post-monsoon and winter (October–February), cool surface air trapped under warmer air aloft creates temperature inversions with low wind speeds, preventing pollutant dispersion. PM2.5 often peaks early morning and late evening/night; mid-afternoon (12 PM – 4 PM) frequently offers slightly better mixing, though real-time AQI must always be checked. Firecracker emissions during Diwali and New Year can cause acute multi-day PM2.5 and SO2 spikes.',
  },
];

export interface RetrievedKnowledge {
  document: KnowledgeDocument;
  score: number;
}

/**
 * Retrieves the most relevant trusted documents for a user query or environmental context.
 */
export function retrieveTrustedKnowledge(
  query: string,
  maxResults: number = 3
): RetrievedKnowledge[] {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (tokens.length === 0) {
    return TRUSTED_KNOWLEDGE_BASE.slice(0, maxResults).map((doc) => ({
      document: doc,
      score: 1,
    }));
  }

  const scored = TRUSTED_KNOWLEDGE_BASE.map((doc) => {
    let score = 0;
    const haystack = `${doc.title} ${doc.content}`.toLowerCase();

    for (const token of tokens) {
      if (doc.tags.some((tag) => tag.includes(token) || token.includes(tag))) {
        score += 3;
      }
      if (haystack.includes(token)) {
        score += 1;
      }
    }

    return { document: doc, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

