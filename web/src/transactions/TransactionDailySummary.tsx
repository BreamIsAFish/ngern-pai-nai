import Icon from '../ui/Icon'
import type { DailyTransactionSummary as Summary } from './summarizeDailyTransactions'

interface Props {
  summary: Summary
}

const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

/** Displays the non-empty income, expense, and transfer totals for one day. */
export default function TransactionDailySummary({ summary }: Props) {
  const hasIncome = summary.incomeTotal > 0
  const hasExpense = summary.expenseTotal > 0
  const transferLabel = `${summary.transferCount} ${summary.transferCount === 1 ? 'transfer' : 'transfers'}`
  return <div aria-label="Daily totals" className={`daily-total ${hasIncome && hasExpense ? 'with-two-totals' : ''}`}>
    {hasIncome && <div className="daily-total-metric daily-total-income"><span><Icon name="arrow-down" size={18} /> Income</span><b>+{money.format(summary.incomeTotal)}</b></div>}
    {hasExpense && <div className="daily-total-metric daily-total-expense"><span><Icon name="arrow-up" size={18} /> Expenses</span><b>{money.format(summary.expenseTotal)}</b></div>}
    {summary.transferCount > 0 && <small className="daily-transfer-count">{hasIncome || hasExpense ? 'and ' : ''}{transferLabel}</small>}
  </div>
}
