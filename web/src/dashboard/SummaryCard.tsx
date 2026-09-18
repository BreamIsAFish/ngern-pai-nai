interface SummaryCardProps {
  balance: number
  expenses: number
  income: number
  monthLabel: string
}

const formatMoney = (amount: number) => new Intl.NumberFormat('en-US', {
  currency: 'THB',
  maximumFractionDigits: 0,
  style: 'currency',
}).format(amount).replace('THB', '฿')

export default function SummaryCard({ balance, expenses, income, monthLabel }: SummaryCardProps) {
  return (
    <section className="summary-card">
      <div className="summary-topline">
        <span>This month</span>
        <span>{monthLabel}</span>
      </div>
      <p className="summary-label">Available balance</p>
      <p className="summary-balance">{formatMoney(balance)}</p>
      <div className="summary-grid">
        <div>
          <span className="summary-dot income" />
          <span>Income</span>
          <strong>{formatMoney(income)}</strong>
        </div>
        <div>
          <span className="summary-dot expense" />
          <span>Expenses</span>
          <strong>{formatMoney(expenses)}</strong>
        </div>
      </div>
    </section>
  )
}

