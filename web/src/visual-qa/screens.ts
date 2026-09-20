export interface VisualQaScreen {
  actualFile: string
  id: string
  label: string
  referenceFile: string
  referenceAvailable: boolean
  route: string
}

export const visualQaScreens: VisualQaScreen[] = [
  { id: 'home-dashboard', label: 'Home / dashboard', route: '/?visual=home-dashboard', referenceFile: 'IMG_1327.PNG', actualFile: 'home-dashboard.png', referenceAvailable: true },
  { id: 'home-transactions', label: 'Home / dashboard, scrolled to transactions', route: '/?visual=home-dashboard&scroll=transactions', referenceFile: 'IMG_1173.png', actualFile: 'home-transactions.png', referenceAvailable: true },
  { id: 'home-month-picker', label: 'Home / month picker', route: '/?visual=home-month-picker', referenceFile: 'IMG_1328.PNG', actualFile: 'home-month-picker.png', referenceAvailable: true },
  { id: 'summary', label: 'Summary', route: '/?visual=summary', referenceFile: 'IMG_1174.png', actualFile: 'summary.png', referenceAvailable: true },
  { id: 'summary-categories', label: 'Summary / category list, scrolled', route: '/?visual=summary-categories', referenceFile: 'IMG_1329.PNG', actualFile: 'summary-categories.png', referenceAvailable: true },
  { id: 'categories-expense', label: 'Expense categories', route: '/?visual=categories-expense', referenceFile: 'IMG_1176.png', actualFile: 'categories-expense.png', referenceAvailable: true },
  { id: 'categories-income', label: 'Income categories', route: '/?visual=categories-income', referenceFile: 'IMG_1177.png', actualFile: 'categories-income.png', referenceAvailable: true },
  { id: 'add-expense', label: 'Add expense', route: '/?visual=add-expense', referenceFile: 'IMG_1178.png', actualFile: 'add-expense.png', referenceAvailable: true },
  { id: 'add-expense-picker', label: 'Add expense / category picker', route: '/?visual=add-expense-picker', referenceFile: 'IMG_1330.PNG', actualFile: 'add-expense-picker.png', referenceAvailable: false },
  { id: 'add-expense-picker-scrolled', label: 'Add expense / category picker, scrolled', route: '/?visual=add-expense-picker-scrolled', referenceFile: 'IMG_1331.PNG', actualFile: 'add-expense-picker-scrolled.png', referenceAvailable: false },
  { id: 'add-income', label: 'Add income', route: '/?visual=add-income', referenceFile: 'IMG_1179.png', actualFile: 'add-income.png', referenceAvailable: true },
  { id: 'add-transfer', label: 'Add transfer', route: '/?visual=add-transfer', referenceFile: 'IMG_1180.png', actualFile: 'add-transfer.png', referenceAvailable: true },
  { id: 'edit-transaction', label: 'Edit transaction', route: '/?visual=edit-transaction', referenceFile: 'No reference supplied', actualFile: 'edit-transaction.png', referenceAvailable: false },
  { id: 'search', label: 'Search', route: '/?visual=search', referenceFile: 'IMG_1181.png', actualFile: 'search.png', referenceAvailable: true },
  { id: 'tags', label: 'Tag manager', route: '/?visual=tags', referenceFile: 'IMG_1182.png', actualFile: 'tags.png', referenceAvailable: true },
  { id: 'add-tag', label: 'Add tag', route: '/?visual=add-tag', referenceFile: 'IMG_1183.png', actualFile: 'add-tag.png', referenceAvailable: true },
  { id: 'profile', label: 'Profile', route: '/?visual=profile', referenceFile: 'IMG_1184.png', actualFile: 'profile.png', referenceAvailable: true },
  { id: 'sheet-trash', label: 'Spreadsheet recovery', route: '/?visual=sheet-trash', referenceFile: 'No reference supplied', actualFile: 'sheet-trash.png', referenceAvailable: false },
]

export const currentVisualState = () => new URLSearchParams(window.location.search).get('visual')
