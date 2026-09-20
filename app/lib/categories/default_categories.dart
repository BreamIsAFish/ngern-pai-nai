import '../transactions/transaction.dart';
import 'category.dart';

class DefaultCategoryDefinition {
  const DefaultCategoryDefinition({
    required this.id,
    required this.name,
    required this.type,
    required this.iconUrl,
  });

  final String id;
  final String name;
  final TransactionType type;

  /// Replace each null value below with a public HTTPS URL.
  final String? iconUrl;
}

const defaultCategoryDefinitions = <DefaultCategoryDefinition>[
  DefaultCategoryDefinition(
    id: 'default-expense-food',
    name: 'Food',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/food/takeaway.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-transport',
    name: 'Transport',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/transportation/tram.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-essentials',
    name: 'Essentials',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/food/nutrition-plan.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-shopping',
    name: 'Shopping',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/entertainment/shopping-bag.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-entertainment',
    name: 'Entertainment',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/entertainment/controller.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-home-utilities',
    name: 'Home & Utilities',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/utility/tools.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-health-self-care',
    name: 'Health & Self-care',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/health/pill.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-family-pets',
    name: 'Family & Pets',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/social/family-small.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-gifts-donations',
    name: 'Gifts & Donations',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/entertainment/gift.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-travel',
    name: 'Travel',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/travel/luggage.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-education',
    name: 'Education',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/education/graduation.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-work-business',
    name: 'Work & Business',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/business/tuxedo.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-savings-investments',
    name: 'Savings & Investments',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/money-tree.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-loans-credit-cards',
    name: 'Loans & Credit Cards',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/debit-card.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-expense-other',
    name: 'Other',
    type: TransactionType.expense,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/utility/subscription.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-income-salary',
    name: 'Salary',
    type: TransactionType.income,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/payroll.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-income-wages',
    name: 'Wages',
    type: TransactionType.income,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/money.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-income-gifts',
    name: 'Gifts',
    type: TransactionType.income,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/coin.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-income-business-sales',
    name: 'Business & Sales',
    type: TransactionType.income,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/shopping-cart.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-income-refunds',
    name: 'Refunds',
    type: TransactionType.income,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/cashback.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-income-other',
    name: 'Other',
    type: TransactionType.income,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/utility/subscription.png",
  ),
  DefaultCategoryDefinition(
    id: 'default-transfer',
    name: 'Transfer',
    type: TransactionType.transfer,
    iconUrl:
        "https://raw.githubusercontent.com/BreamIsAFish/public-icons/refs/heads/main/finance/turnover.png",
  ),
];

/// Creates the locked category rows written into a new spreadsheet.
///
/// [createdAt] becomes the creation and update timestamp for every row.
/// Returns one [CategoryRecord] for each item in
/// [defaultCategoryDefinitions].
///
/// Example:
/// ```dart
/// final categories = createDefaultCategories(DateTime.now().toUtc());
/// ```
List<CategoryRecord> createDefaultCategories(DateTime createdAt) =>
    defaultCategoryDefinitions
        .map(
          (definition) => CategoryRecord(
            id: definition.id,
            name: definition.name,
            type: definition.type,
            iconUrl: definition.iconUrl,
            isDefault: true,
            createdAt: createdAt,
            updatedAt: createdAt,
          ),
        )
        .toList(growable: false);
