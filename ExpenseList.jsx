import { useState } from "react";
import { formatMoney } from "../lib/money.js";
import { dateValue, formatDate } from "../lib/format.js";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ExpenseRow({ expense, memberMap, onDelete, onSaveAmount }) {
  const [draft, setDraft] = useState(String(expense.amount));
  const payer = memberMap[expense.paidBy];

  return (
    <article className="expense">
      <span className="avatar" style={{ background: payer?.color ?? "#888" }}>
        {payer ? initials(payer.name) : "?"}
      </span>
      <div>
        <div className="expense-title">
          {expense.description}
          <span className="cat">{expense.category}</span>
        </div>
        <div className="expense-meta">
          {payer?.name ?? "Unknown"} · {formatDate(expense.date)} · split{" "}
          {expense.splitWith.length} ways
        </div>
        <div className="actions">
          <input
            className="edit-amount"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const n = Number(draft);
              if (Number.isFinite(n) && n > 0 && n !== Number(expense.amount)) {
                onSaveAmount(n);
              }
            }}
            aria-label={`Edit amount for ${expense.description}`}
          />
          <button type="button" className="btn danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
      <div className="amount">{formatMoney(expense.amount)}</div>
    </article>
  );
}

export default function ExpenseList({
  expenses,
  members,
  onDeleteAt,
  onUpdateAt,
}) {
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  
  // FIX 1 & 2: Sort descending (newest first) and retain originalIndex for deletion/editing
  const sorted = expenses
    .map((expense, originalIndex) => ({ expense, originalIndex }))
    .sort((a, b) => dateValue(b.expense.date) - dateValue(a.expense.date));

  return (
    <section className="card">
      <h2>Expenses</h2>
      <p className="sort-label">Newest first</p>
      {sorted.length === 0 ? (
        <p className="empty">No expenses match these filters.</p>
      ) : (
        sorted.map(({ expense, originalIndex }) => (
          <ExpenseRow
            key={expense.id || originalIndex}
            expense={expense}
            memberMap={memberMap}
            onDelete={() => onDeleteAt(originalIndex)}
            onSaveAmount={(amount) => onUpdateAt(originalIndex, { amount })}
          />
        ))
      )}
    </section>
  );
}

const KEY = "fairshare-v1";

function hydrate(data) {
  return {
    groupName: data.groupName,
    members: data.members.map((m) => ({ ...m })),
    expenses: data.expenses.map((e) => ({
      ...e,
      date: new Date(e.date),
    })),
  };
}

export function loadState(seed) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const initial = hydrate(seed);
      localStorage.setItem(KEY, JSON.stringify(initial));
      return initial;
    }
    // FIX 3: Re-hydrate dates from local storage string back to Date objects
    return hydrate(JSON.parse(raw));
  } catch {
    return hydrate(seed);
  }
}

export function persistState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function nextExpenseId() {
  return `e-${Date.now()}`;
}

export function nextMemberId(members) {
  const max = members.reduce((m, x) => (x.id > m ? x.id : m), 0);
  return max + 1;
}

export function reducer(state, action) {
  switch (action.type) {
    case "ADD_EXPENSE": {
      return { ...state, expenses: [...state.expenses, action.expense] };
    }
    case "DELETE_EXPENSE": {
      const next = state.expenses.slice();
      next.splice(action.index, 1);
      return { ...state, expenses: next };
    }
    case "UPDATE_EXPENSE": {
      const next = state.expenses.slice();
      next[action.index] = { ...next[action.index], ...action.patch };
      return { ...state, expenses: next };
    }
    case "ADD_MEMBER": {
      return { ...state, members: [...state.members, action.member] };
    }
    default:
      return state;
  }
}
