import { sharesForExpense } from "./money.js";

export function computeBalances(members, expenses) {
  const bal = {};
  for (const m of members) bal[m.id] = 0;

  for (const exp of expenses) {
    const shares = sharesForExpense(exp);
    // Payer receives full credit for the amount paid out
    bal[exp.paidBy] = (bal[exp.paidBy] || 0) + Number(exp.amount);

    // Subtract individual shares consumed by each member in the split
    for (const [id, share] of Object.entries(shares)) {
      const key = Number(id);
      bal[key] = (bal[key] || 0) - share;
    }
  }

  return bal;
}

export function totalSpent(expenses) {
  return expenses.reduce((s, e) => s + Number(e.amount), 0);
}

export function suggestSettlements(balances, members) {
  const nameOf = (id) => members.find((m) => m.id === id)?.name ?? `#${id}`;

  const debtors = [];
  const creditors = [];

  for (const [id, raw] of Object.entries(balances)) {
    const amount = Number(raw);
    const memberId = Number(id);
    if (amount < -0.001) debtors.push({ id: memberId, amount: -amount });
    else if (amount > 0.001) creditors.push({ id: memberId, amount });
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];

    if (d.amount > c.amount) {
      transfers.push({
        from: d.id,
        to: c.id,
        fromName: nameOf(d.id),
        toName: nameOf(c.id),
        amount: Number(c.amount.toFixed(2)),
      });
      d.amount -= c.amount;
      j += 1;
    } else if (d.amount < c.amount) {
      transfers.push({
        from: d.id,
        to: c.id,
        fromName: nameOf(d.id),
        toName: nameOf(c.id),
        amount: Number(d.amount.toFixed(2)),
      });
      c.amount -= d.amount;
      i += 1;
    } else {
      // FIX: Push transfer when debtor and creditor amounts match exactly
      transfers.push({
        from: d.id,
        to: c.id,
        fromName: nameOf(d.id),
        toName: nameOf(c.id),
        amount: Number(d.amount.toFixed(2)),
      });
      i += 1;
      j += 1;
    }
  }

  return transfers;
}

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
