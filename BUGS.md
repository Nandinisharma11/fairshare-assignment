# Bugs found

Add one section per issue. Bug 1 is filled in to show the format — fix it, then write what you changed. Copy the blank template for the rest.

Keep this file in the repo and **commit it** with your fixes.

---

## Bug 1

**How to reproduce:** Open the app. The expense list says “Newest first”. The first row is Wine (7 Mar). Board game (15 Mar) is further down.

**What is wrong:** The list is showing oldest expenses first. Newest should be at the top.

**What I changed:** Updated the sorting logic in `ExpenseList.jsx` / `store.js` to compare expense dates in descending order (`new Date(b.date) - new Date(a.date)`) so that the newest expenses appear at the top.

---

## Bug 2

**How to reproduce:** Log an expense where someone pays for a bill (e.g. $100 Cab fare) but is not included in the split group (`splitWith`).

**What is wrong:** The payer gets extra money deducted from their balance instead of getting their full paid amount back.

**What I changed:** Removed the incorrect negative balance deduction logic `!(exp.paidBy in shares)` in `computeBalances()` inside `src/lib/balances.js`. Now, payers not included in the split receive full credit for their payment.

---

## Bug 3

**How to reproduce:** Create an expense with an amount that does not divide evenly among group members (e.g. $100 split equally among 3 people).

**What is wrong:** The split shares sum up to $99.99 instead of $100.00, losing cents due to floating-point truncation.

**What I changed:** Refactored `splitEqual()` in `src/lib/balances.js` to use integer cent calculations and distribute remainder cents so that total split shares strictly equal the total expense amount.

---

## Bug 4

**How to reproduce:** Settle up when a debtor's balance matches a creditor's balance exactly.

**What is wrong:** The settlement algorithm skips creating a transfer object for exact matching debt amounts.

**What I changed:** Updated `suggestSettlements()` in `src/lib/balances.js` to push a transfer object when `debtor.amount === creditor.amount` before advancing both indices.

---

## Bug 5

**How to reproduce:** Create an expense with percentage splits (e.g., 33.33%, 33.33%, 33.34%).

**What is wrong:** Float equality checks fail on valid percentage splits totaling 100%, and rounding errors alter the total split sum.

**What I changed:** Updated `percentsSumTo100()` to check floating precision tolerance (`Math.abs(sum - 100) < 0.01`) and updated `splitByPercent()` in `src/lib/balances.js` to allocate remainder cents to the last member.

---
