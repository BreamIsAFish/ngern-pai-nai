import type { CategoryInput } from './model'

export interface DefaultCategoryDefinition extends CategoryInput {
  id: string
}

/** Mirrored from app/lib/categories/default_categories.dart for browser-only use. */
export const defaultCategoryDefinitions: DefaultCategoryDefinition[] = [
  { id: 'default-expense-food', name: 'Food', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/food/takeaway.png' },
  { id: 'default-expense-transport', name: 'Transport', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/transportation/tram.png' },
  { id: 'default-expense-essentials', name: 'Essentials', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/food/nutrition-plan.png' },
  { id: 'default-expense-shopping', name: 'Shopping', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/entertainment/shopping-bag.png' },
  { id: 'default-expense-entertainment', name: 'Entertainment', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/entertainment/controller.png' },
  { id: 'default-expense-home-utilities', name: 'Home & Utilities', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/utility/tools.png' },
  { id: 'default-expense-health-self-care', name: 'Health & Self-care', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/health/pill.png' },
  { id: 'default-expense-family-pets', name: 'Family & Pets', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/social/family-small.png' },
  { id: 'default-expense-gifts-donations', name: 'Gifts & Donations', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/entertainment/gift.png' },
  { id: 'default-expense-travel', name: 'Travel', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/travel/luggage.png' },
  { id: 'default-expense-education', name: 'Education', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/education/graduation.png' },
  { id: 'default-expense-work-business', name: 'Work & Business', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/business/tuxedo.png' },
  { id: 'default-expense-savings-investments', name: 'Savings & Investments', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/money-tree.png' },
  { id: 'default-expense-loans-credit-cards', name: 'Loans & Credit Cards', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/debit-card.png' },
  { id: 'default-expense-other', name: 'Other', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/utility/subscription.png' },
  { id: 'default-income-salary', name: 'Salary', type: 'income', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/payroll.png' },
  { id: 'default-income-wages', name: 'Wages', type: 'income', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/money.png' },
  { id: 'default-income-gifts', name: 'Gifts', type: 'income', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/coin.png' },
  { id: 'default-income-business-sales', name: 'Business & Sales', type: 'income', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/shopping-cart.png' },
  { id: 'default-income-refunds', name: 'Refunds', type: 'income', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/cashback.png' },
  { id: 'default-income-other', name: 'Other', type: 'income', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/utility/subscription.png' },
  { id: 'default-transfer', name: 'Transfer', type: 'transfer', iconUrl: 'https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/turnover.png' },
]
