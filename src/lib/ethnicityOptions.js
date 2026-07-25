export const ETHNICITY_VALUES = [
  'asian',
  'black',
  'caucasian',
  'hispanic',
  'middle_eastern',
  'native_american',
  'pacific_islander',
  'mixed',
  'other',
  'rather_not_say',
];

export const ETHNICITY_LABELS = {
  asian: 'Asian',
  black: 'Black / African American',
  caucasian: 'Caucasian / White',
  hispanic: 'Hispanic / Latino',
  middle_eastern: 'Middle Eastern',
  native_american: 'Native American',
  pacific_islander: 'Pacific Islander',
  mixed: 'Mixed / Multiracial',
  other: 'Other',
  rather_not_say: 'Prefer not to say',
};

export function isValidEthnicity(value) {
  return !value || ETHNICITY_VALUES.includes(value);
}

export function getEthnicityLabel(value) {
  if (!value) return '—';
  return ETHNICITY_LABELS[value] || value.replace(/_/g, ' ');
}