const TAX_BRACKETS = [
    { upTo: 24000, rate: 0 },
    { upTo: 40000, rate: 0.15 },
    { upTo: Infinity, rate: 0.25 }
];

const SOCIAL_SECURITY_RATE = 0.06;
const SOCIAL_SECURITY_CAP = 2160;

function calculateTax(taxableIncome) {
    let tax = 0;
    let remaining = taxableIncome;
    let lowerBound = 0;

    for (const bracket of TAX_BRACKETS) {
        if (remaining <= 0) break;
        const bracketSize = bracket.upTo - lowerBound;
        const amountInBracket = Math.min(remaining, bracketSize);
        tax += amountInBracket * bracket.rate;
        remaining -= amountInBracket;
        lowerBound = bracket.upTo;
    }
    return Math.round(tax * 100) / 100;
}

function calculateSocialSecurity(grossPay) {
    return Math.round(Math.min(grossPay * SOCIAL_SECURITY_RATE, SOCIAL_SECURITY_CAP) * 100) / 100;
}

function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function daysBetween(start, end) {
    const diff = new Date(end) - new Date(start);
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
}

function overlapDays(rangeAStart, rangeAEnd, rangeBStart, rangeBEnd) {
    const start = new Date(Math.max(new Date(rangeAStart), new Date(rangeBStart)));
    const end = new Date(Math.min(new Date(rangeAEnd), new Date(rangeBEnd)));
    if (start > end) return 0;
    return daysBetween(start, end);
}

module.exports = {
    TAX_BRACKETS, SOCIAL_SECURITY_RATE, SOCIAL_SECURITY_CAP,
    calculateTax, calculateSocialSecurity, daysInMonth, daysBetween, overlapDays
};