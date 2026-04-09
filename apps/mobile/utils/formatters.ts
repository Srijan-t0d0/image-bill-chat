const ones = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];

const tens = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
];

function convertBelowThousand(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) {
    const t = tens[Math.floor(n / 10)];
    const o = ones[n % 10];
    return o ? `${t} ${o}` : t;
  }
  const h = ones[Math.floor(n / 100)];
  const rest = convertBelowThousand(n % 100);
  return rest ? `${h} hundred ${rest}` : `${h} hundred`;
}

/**
 * Convert a number to words (Indian numbering: lakh, crore).
 * Works up to 99,99,99,999 (99 crore).
 */
export function numberToWords(n: number): string {
  if (n === 0) return 'zero';
  if (n < 0) return `minus ${numberToWords(-n)}`;

  n = Math.round(n);
  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  if (crore > 0) parts.push(`${convertBelowThousand(crore)} crore`);
  if (lakh > 0) parts.push(`${convertBelowThousand(lakh)} lakh`);
  if (thousand > 0) parts.push(`${convertBelowThousand(thousand)} thousand`);
  if (remainder > 0) parts.push(convertBelowThousand(remainder));

  return parts.join(' ');
}

/**
 * Format a number as INR currency string.
 * Uses Indian numbering: 1,00,000 instead of 100,000
 */
export function formatINR(amount: number): string {
  const n = Math.round(amount);
  const str = n.toString();
  if (str.length <= 3) return `\u20B9${str}`;

  // Indian grouping: last 3 digits, then groups of 2
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `\u20B9${grouped},${last3}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
