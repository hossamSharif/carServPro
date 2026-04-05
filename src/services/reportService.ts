import {
  queryDocuments,
  orderBy,
  Timestamp,
} from './firestore';
import type { JournalEntry } from '@/types';

const COLLECTION = 'journalEntries';

interface AccountSummary {
  accountCode: string;
  accountName: string;
  total: number;
}

interface IncomeStatement {
  revenue: AccountSummary[];
  totalRevenue: number;
  expenses: AccountSummary[];
  totalExpenses: number;
  netProfit: number;
}

interface BalanceSheet {
  assets: AccountSummary[];
  liabilities: AccountSummary[];
  equity: AccountSummary[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

interface VATReport {
  vatCollected: number;
  vatPaid: number;
  vatDeductible: number;
  netVat: number;
}

interface LedgerEntry {
  entry: JournalEntry;
  runningBalances: Record<string, number>;
}

export async function generateIncomeStatement(fromDate: Date, toDate: Date): Promise<IncomeStatement> {
  const allEntries = await queryDocuments<JournalEntry>(COLLECTION, [orderBy('date', 'asc')]);

  // Filter entries within date range client-side
  const fromTimestamp = Timestamp.fromDate(fromDate);
  const toTimestamp = Timestamp.fromDate(toDate);

  const filtered = allEntries.filter((entry) => {
    const entryTime = entry.date.toMillis();
    return entryTime >= fromTimestamp.toMillis() && entryTime <= toTimestamp.toMillis();
  });

  // Aggregate by account type using code prefix
  // 4xxx = revenue, 5xxx = expense
  const revenueMap = new Map<string, AccountSummary>();
  const expenseMap = new Map<string, AccountSummary>();

  for (const entry of filtered) {
    for (const line of entry.lines) {
      const prefix = line.accountCode.charAt(0);

      if (prefix === '4') {
        // Revenue accounts: credit increases revenue
        const existing = revenueMap.get(line.accountCode) || {
          accountCode: line.accountCode,
          accountName: line.accountNameAr,
          total: 0,
        };
        existing.total += line.credit - line.debit;
        revenueMap.set(line.accountCode, existing);
      } else if (prefix === '5') {
        // Expense accounts: debit increases expense
        const existing = expenseMap.get(line.accountCode) || {
          accountCode: line.accountCode,
          accountName: line.accountNameAr,
          total: 0,
        };
        existing.total += line.debit - line.credit;
        expenseMap.set(line.accountCode, existing);
      }
    }
  }

  const revenue = Array.from(revenueMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  const expenses = Array.from(expenseMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));

  const totalRevenue = revenue.reduce((sum, r) => sum + r.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0);

  return {
    revenue,
    totalRevenue,
    expenses,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
  };
}

export async function generateBalanceSheet(asOfDate: Date): Promise<BalanceSheet> {
  const allEntries = await queryDocuments<JournalEntry>(COLLECTION, [orderBy('date', 'asc')]);

  // Filter entries up to asOfDate
  const asOfTimestamp = Timestamp.fromDate(asOfDate);

  const filtered = allEntries.filter((entry) => {
    return entry.date.toMillis() <= asOfTimestamp.toMillis();
  });

  // Aggregate by account type using code prefix
  // 1xxx = asset, 2xxx = liability, 3xxx = equity
  const assetMap = new Map<string, AccountSummary>();
  const liabilityMap = new Map<string, AccountSummary>();
  const equityMap = new Map<string, AccountSummary>();

  for (const entry of filtered) {
    for (const line of entry.lines) {
      const prefix = line.accountCode.charAt(0);
      let targetMap: Map<string, AccountSummary> | null = null;
      let balance = 0;

      if (prefix === '1') {
        // Asset accounts: debit increases, credit decreases
        targetMap = assetMap;
        balance = line.debit - line.credit;
      } else if (prefix === '2') {
        // Liability accounts: credit increases, debit decreases
        targetMap = liabilityMap;
        balance = line.credit - line.debit;
      } else if (prefix === '3') {
        // Equity accounts: credit increases, debit decreases
        targetMap = equityMap;
        balance = line.credit - line.debit;
      }

      if (targetMap) {
        const existing = targetMap.get(line.accountCode) || {
          accountCode: line.accountCode,
          accountName: line.accountNameAr,
          total: 0,
        };
        existing.total += balance;
        targetMap.set(line.accountCode, existing);
      }
    }
  }

  const assets = Array.from(assetMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  const liabilities = Array.from(liabilityMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  const equity = Array.from(equityMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));

  return {
    assets,
    liabilities,
    equity,
    totalAssets: assets.reduce((sum, a) => sum + a.total, 0),
    totalLiabilities: liabilities.reduce((sum, l) => sum + l.total, 0),
    totalEquity: equity.reduce((sum, e) => sum + e.total, 0),
  };
}

export async function generateVATReport(fromDate: Date, toDate: Date): Promise<VATReport> {
  const allEntries = await queryDocuments<JournalEntry>(COLLECTION, [orderBy('date', 'asc')]);

  // Filter entries within date range
  const fromTimestamp = Timestamp.fromDate(fromDate);
  const toTimestamp = Timestamp.fromDate(toDate);

  const filtered = allEntries.filter((entry) => {
    const entryTime = entry.date.toMillis();
    return entryTime >= fromTimestamp.toMillis() && entryTime <= toTimestamp.toMillis();
  });

  // Output VAT (Sales): credits on 2001 = collected
  // Debits on 2001 = paid/refunded (cancellations)
  // Input VAT (Purchases): debits on 1300 = deductible
  let vatCollected = 0;
  let vatPaid = 0;
  let vatDeductible = 0;

  for (const entry of filtered) {
    for (const line of entry.lines) {
      if (line.accountCode === '2001') {
        vatCollected += line.credit;
        vatPaid += line.debit;
      } else if (line.accountCode === '1300') {
        vatDeductible += line.debit - line.credit;
      }
    }
  }

  const netOutputVat = vatCollected - vatPaid;

  return {
    vatCollected,
    vatPaid,
    vatDeductible,
    netVat: netOutputVat - vatDeductible,
  };
}

export async function getGeneralLedger(fromDate: Date, toDate: Date): Promise<LedgerEntry[]> {
  const allEntries = await queryDocuments<JournalEntry>(COLLECTION, [orderBy('date', 'asc')]);

  // Filter entries within date range
  const fromTimestamp = Timestamp.fromDate(fromDate);
  const toTimestamp = Timestamp.fromDate(toDate);

  const filtered = allEntries.filter((entry) => {
    const entryTime = entry.date.toMillis();
    return entryTime >= fromTimestamp.toMillis() && entryTime <= toTimestamp.toMillis();
  });

  // Build running balances per account across all entries
  const runningBalances: Record<string, number> = {};
  const ledger: LedgerEntry[] = [];

  for (const entry of filtered) {
    for (const line of entry.lines) {
      const code = line.accountCode;
      if (!(code in runningBalances)) {
        runningBalances[code] = 0;
      }
      // Running balance: debits increase, credits decrease (natural balance for assets/expenses)
      runningBalances[code] += line.debit - line.credit;
    }

    ledger.push({
      entry,
      runningBalances: { ...runningBalances },
    });
  }

  return ledger;
}
