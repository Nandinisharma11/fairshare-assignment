export function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "$0.00";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export function splitEqual(amount, ids) {
  const n = ids.length;
  if (!n) return {};
  
  const totalCents = Math.round(Number(amount) * 100);
  const baseCents = Math.floor(totalCents / n);
  let remainder = totalCents % n;

  const shares = {};
  for (const id of ids) {
    let cents = baseCents;
    if (remainder > 0) {
      cents += 1;
      remainder -= 1;
    }
    shares[id] = cents / 100;
  }
  return shares;
}

export function percentsSumTo100(percents) {
  const values = Object.values(percents).map(Number);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 100) < 0.01;
}

export function splitByPercent(amount, percents) {
  const totalCents = Math.round(Number(amount) * 100);
  const entries = Object.entries(percents);
  const shares = {};
  let allocatedCents = 0;

  entries.forEach(([id, pct], index) => {
    if (index === entries.length - 1) {
      shares[id] = (totalCents - allocatedCents) / 100;
    } else {
      const shareCents = Math.round((totalCents * Number(pct)) / 100);
      shares[id] = shareCents / 100;
      allocatedCents += shareCents;
    }
  });

  return shares;
}

export function sharesForExpense(expense) {
  if (expense.splitType === "percent" && expense.percents) {
    return splitByPercent(expense.amount, expense.percents);
  }
  return splitEqual(expense.amount, expense.splitWith || []);
}
