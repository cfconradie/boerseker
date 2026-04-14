// Boerseker — Calculation Engine (from Annexure 1)

const FSF_TABLE = {
  tractor: 0.85,
  attachments_implements: 0.85,
  sprayer: 0.80,
  planter: 0.78,
  baler_forage: 0.78,
  combine: 0.70,
  other_machinery: 0.68,
  irrigation: 0.60,
};

const AGE_FACTOR_TABLE = [
  { min: 0, max: 3, factor: 1.00 },
  { min: 4, max: 6, factor: 0.90 },
  { min: 7, max: 10, factor: 0.80 },
  { min: 11, max: 99, factor: 0.65 },
];

const CONDITION_FACTOR_TABLE = {
  excellent: 1.00,
  good: 0.90,
  fair: 0.80,
  poor: 0.65,
};

const LTV_TABLE = {
  good: 0.40,
  medium: 0.35,
  weak: 0.30,
};

const MAX_TERM_BY_CREDIT = {
  good: 60,
  medium: 48,
  weak: 36,
};

function lookupAgeFactor(years) {
  for (const row of AGE_FACTOR_TABLE) {
    if (years >= row.min && years <= row.max) return row.factor;
  }
  return 0.65; // fallback for very old
}

function calculateAsset(input) {
  const mv = input.market_value;
  const fsf = FSF_TABLE[input.asset_category];
  const af = lookupAgeFactor(input.asset_age_years);
  const cf = CONDITION_FACTOR_TABLE[input.asset_condition];
  const ltv = LTV_TABLE[input.credit_record];

  if (!fsf || !cf || !ltv || mv <= 0) return null;

  const collateral_value = mv * fsf * af * cf;
  const max_loan = collateral_value * ltv;

  const term = input.loan_term_months;
  const annual_rate = input.annual_interest_rate;
  const monthly_rate = annual_rate / 12;

  let monthly_payment;
  if (annual_rate === 0) {
    monthly_payment = max_loan / term;
  } else {
    monthly_payment =
      max_loan *
      (monthly_rate * Math.pow(1 + monthly_rate, term)) /
      (Math.pow(1 + monthly_rate, term) - 1);
  }

  const total_repayment = monthly_payment * term;
  const total_finance_cost = total_repayment - max_loan;

  return {
    collateral_value: Math.round(collateral_value),
    max_loan: Math.round(max_loan),
    monthly_payment: Math.round(monthly_payment),
    total_repayment: Math.round(total_repayment),
    total_finance_cost: Math.round(total_finance_cost),
  };
}

// Simple calculator: given desired finance, what assets do you need?
function quickEstimate(desiredAmount) {
  const lower = desiredAmount / 0.40;
  const upper = desiredAmount / 0.30;
  return { lower: Math.round(lower), upper: Math.round(upper) };
}

function formatZAR(n) {
  return 'R ' + n.toLocaleString('en-ZA');
}
