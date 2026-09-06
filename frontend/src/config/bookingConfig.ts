export interface WorkLevelConfig {
  key: 'LOW' | 'MODERATE' | 'HIGH';
  labelKey: string;
  defaultLabel: string;
  multiplier: number;
  descriptionKey: string;
  defaultDescription: string;
  badgeColor: string;
}

export const WORK_LEVELS: Record<'LOW' | 'MODERATE' | 'HIGH', WorkLevelConfig> = {
  LOW: {
    key: 'LOW',
    labelKey: 'work_level_low',
    defaultLabel: 'Low',
    multiplier: 1.0,
    descriptionKey: 'work_level_low_desc',
    defaultDescription: 'Minor inspection, basic quick fixes (Base rate)',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  MODERATE: {
    key: 'MODERATE',
    labelKey: 'work_level_moderate',
    defaultLabel: 'Moderate',
    multiplier: 1.5,
    descriptionKey: 'work_level_moderate_desc',
    defaultDescription: 'Standard repair, part replacement, multi-room (1.5x)',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  HIGH: {
    key: 'HIGH',
    labelKey: 'work_level_high',
    defaultLabel: 'High',
    multiplier: 2.0,
    descriptionKey: 'work_level_high_desc',
    defaultDescription: 'Comprehensive work, deep overhaul, heavy duty (2.0x)',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
  }
};

export function calculatePriceBreakdown(baseRate: number, workLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW') {
  const config = WORK_LEVELS[workLevel] || WORK_LEVELS.LOW;
  const total = Number((baseRate * config.multiplier).toFixed(2));
  const workerShare = Number((total * 0.80).toFixed(2));
  const coopFund = Number((total * 0.15).toFixed(2));
  const platformFee = Number((total * 0.05).toFixed(2));

  return {
    multiplier: config.multiplier,
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
  // Direct match or partial match
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
