export type PricingModel = 'complexity' | 'duration';

export interface TierConfig {
  key: 'LOW' | 'MODERATE' | 'HIGH';
  label: string;
  description: string;
  multiplier: number;
  badgeColor: string;
}

export interface CategoryPricingConfig {
  pricingModel: PricingModel;
  headingLabel: string;
  tiers: TierConfig[];
}

export const CATEGORY_PRICING_MODELS: Record<string, CategoryPricingConfig> = {
  'Academic Tutoring': {
    pricingModel: 'duration',
    headingLabel: 'Select service duration',
    tiers: [
      {
        key: 'LOW',
        label: '1 Hour',
        description: '1 Hour focused tutoring session (Base rate)',
        multiplier: 1.0,
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      },
      {
        key: 'MODERATE',
        label: '2 Hours',
        description: '2 Hours intensive subject session (1.8x)',
        multiplier: 1.8,
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
      },
      {
        key: 'HIGH',
        label: '3+ Hours',
        description: '3+ Hours comprehensive study & exam prep (2.5x)',
        multiplier: 2.5,
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
      }
    ]
  },
  'Elder & Caregiving': {
    pricingModel: 'duration',
    headingLabel: 'Select service duration',
    tiers: [
      {
        key: 'LOW',
        label: '2 Hours Visit',
        description: '2 Hours assistance & health check (Base rate)',
        multiplier: 1.0,
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      },
      {
        key: 'MODERATE',
        label: 'Half-Day (4 Hrs)',
        description: '4 Hours continuous personal caregiving (1.8x)',
        multiplier: 1.8,
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
      },
      {
        key: 'HIGH',
        label: 'Full-Day (8 Hrs)',
        description: '8 Hours full shift care & nursing support (3.2x)',
        multiplier: 3.2,
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
      }
    ]
  }
};

export const DEFAULT_COMPLEXITY_PRICING: CategoryPricingConfig = {
  pricingModel: 'complexity',
  headingLabel: 'Select work level',
  tiers: [
    {
      key: 'LOW',
      label: 'Low',
      description: 'Minor inspection, basic quick fixes (Base rate)',
      multiplier: 1.0,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      key: 'MODERATE',
      label: 'Moderate',
      description: 'Standard repair, part replacement, multi-room (1.5x)',
      multiplier: 1.5,
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    {
      key: 'HIGH',
      label: 'High',
      description: 'Comprehensive work, deep overhaul, heavy duty (2.0x)',
      multiplier: 2.0,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
    }
  ]
};

export function getCategoryPricingConfig(categoryName?: string): CategoryPricingConfig {
  if (!categoryName) return DEFAULT_COMPLEXITY_PRICING;
  const matchKey = Object.keys(CATEGORY_PRICING_MODELS).find(
    k => k.toLowerCase() === categoryName.toLowerCase() || categoryName.toLowerCase().includes(k.toLowerCase())
  );
  return matchKey ? CATEGORY_PRICING_MODELS[matchKey] : DEFAULT_COMPLEXITY_PRICING;
}

export function calculatePriceBreakdown(
  baseRate: number,
  workLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW',
  categoryName: string = ''
) {
  const pricingConfig = getCategoryPricingConfig(categoryName);
  const selectedTier = pricingConfig.tiers.find(t => t.key === workLevel) || pricingConfig.tiers[0];
  const multiplier = selectedTier ? selectedTier.multiplier : 1.0;
  const total = Number((baseRate * multiplier).toFixed(2));
  const workerShare = Number((total * 0.80).toFixed(2));
  const coopFund = Number((total * 0.15).toFixed(2));
  const platformFee = Number((total * 0.05).toFixed(2));

  return {
    pricingModel: pricingConfig.pricingModel,
    headingLabel: pricingConfig.headingLabel,
    tier: selectedTier,
    multiplier,
    total,
    workerShare,
    coopFund,
    platformFee
  };
}

export const CATEGORY_PROBLEM_TYPES: Record<string, string[]> = {
  'Cleaning & Sanitation': [
    'Deep Cleaning',
    'Kitchen Sanitization',
    'Bathroom Sanitization',
    'Sofa & Upholstery Cleaning'
  ],
  'Plumbing Services': [
    'Leak Repair',
    'Pipe Fitting',
    'Faucet & Tap Replacement',
    'Drain Blockage & Cleaning'
  ],
  'Electrical Works': [
    'Wiring & Switchboard',
    'MCB Repair & Fuse',
    'Fan & Light Installation',
    'Appliance & Inverter Setup'
  ],
  'Academic Tutoring': [
    'Mathematics Tutoring',
    'Science Tutoring',
    'English Tutoring',
    'Physics & High School Prep'
  ],
  'Elder & Caregiving': [
    'Daily Elderly Assistance & Companionship',
    'Nursing & Medical Care',
    'Mobility & Physical Support',
    'Overnight Caregiving'
  ],
  'Appliance Repair': [
    'AC Servicing & Repair',
    'Refrigerator Repair',
    'Washing Machine Repair',
    'Microwave & Kitchen Appliances'
  ]
};

export function getProblemTypesForCategory(categoryName: string): string[] {
  if (!categoryName) return ['Others'];
  const match = Object.keys(CATEGORY_PROBLEM_TYPES).find(
    cat => cat.toLowerCase() === categoryName.toLowerCase() || categoryName.toLowerCase().includes(cat.toLowerCase())
  );
  const baseList = match
    ? [...CATEGORY_PROBLEM_TYPES[match]]
    : [
        'General Inspection & Repair',
        'Standard Service Visit',
        'Urgent Maintenance',
        'Custom Assistance'
      ];

  const filtered = baseList.filter(p => p.toLowerCase() !== 'others');
  filtered.push('Others');
  return filtered;
}
