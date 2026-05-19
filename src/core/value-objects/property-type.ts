export const PropertyType = {
  VILLA: 0,
  HOMESTAY: 1,
  HOTEL: 2,
} as const;

export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const PropertyView = ['sea', 'city'] as const;
export type PropertyView = (typeof PropertyView)[number];

export const CancellationPolicy = {
  FLEXIBLE: 0,
  MODERATE: 1,
  STRICT: 2,
} as const;

export type CancellationPolicy =
  (typeof CancellationPolicy)[keyof typeof CancellationPolicy];

const TYPE_LABEL: Record<PropertyType, string> = {
  [PropertyType.VILLA]: 'Villa',
  [PropertyType.HOMESTAY]: 'Homestay',
  [PropertyType.HOTEL]: 'Hotel',
};

const POLICY_LABEL: Record<CancellationPolicy, string> = {
  [CancellationPolicy.FLEXIBLE]: 'Linh hoạt',
  [CancellationPolicy.MODERATE]: 'Vừa phải',
  [CancellationPolicy.STRICT]: 'Nghiêm ngặt',
};

export const propertyTypeLabel = (t: PropertyType): string => TYPE_LABEL[t];
export const cancellationPolicyLabel = (p: CancellationPolicy): string =>
  POLICY_LABEL[p];
