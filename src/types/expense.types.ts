export type TransactionType = 'debit' | 'credit';

export interface Transaction {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  subCategory?: string;
  merchant?: string;
  referenceId?: string; // UPI ref, UTR, Bank Ref No
  paymentMethod?: string; // UPI, NetBanking, Card, Cash
  sourceStatement?: string; // e.g. PhonePe, HDFC Bank, etc.
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  iconName: string;
  subCategories: string[];
}

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  {
    id: 'flat_rent',
    name: 'Flat Rent',
    color: '#6366f1',
    iconName: 'Home',
    subCategories: ['Monthly Rent', 'Maintenance', 'Deposit', 'General']
  },
  {
    id: 'roommate',
    name: 'Roommate',
    color: '#8b5cf6',
    iconName: 'Users',
    subCategories: ['Roommate Split', 'Rent Share', 'Shared Household', 'Sinchan', 'General']
  },
  {
    id: 'groceries',
    name: 'Groceries',
    color: '#10b981',
    iconName: 'ShoppingCart',
    subCategories: ['Daily Provisions & Dals', 'Dairy & Milk', 'Supermarket', 'General']
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    color: '#84cc16',
    iconName: 'Salad',
    subCategories: ['Fresh Vegetables', 'Fruits', 'Local Sabzi Mandi', 'General']
  },
  {
    id: 'tea_snacks',
    name: 'Tea & Snacks',
    color: '#f59e0b',
    iconName: 'Coffee',
    subCategories: ['Tea & Chai', 'Nasta & Breakfast', 'Snacks', 'General']
  },
  {
    id: 'company_canteen',
    name: 'Company Canteen',
    color: '#0284c7',
    iconName: 'UtensilsCrossed',
    subCategories: ['Office Canteen', 'Lunch & Dinner', 'Canteen Snacks', 'General']
  },
  {
    id: 'food',
    name: 'Food & Dining',
    color: '#f97316',
    iconName: 'Utensils',
    subCategories: ['Food Delivery', 'Restaurants', 'Cafes', 'Fine Dining']
  },
  {
    id: 'transport',
    name: 'Transportation',
    color: '#06b6d4',
    iconName: 'Car',
    subCategories: ['Petrol', 'Cabs & Transit', 'Fastag & Toll', 'Flight & Train']
  },
  {
    id: 'shopping',
    name: 'Shopping',
    color: '#ec4899',
    iconName: 'ShoppingBag',
    subCategories: ['Online Shopping', 'Electronics', 'Clothing', 'Home']
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    color: '#a855f7',
    iconName: 'Tv',
    subCategories: ['Subscription', 'Movies', 'Gaming', 'Events']
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    color: '#eab308',
    iconName: 'Zap',
    subCategories: ['Electricity', 'Mobile Recharge', 'Internet', 'Water']
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    color: '#14b8a6',
    iconName: 'HeartPulse',
    subCategories: ['Pharmacy', 'Doctor', 'Gym', 'Insurance']
  },
  {
    id: 'income',
    name: 'Income & Investment',
    color: '#22c55e',
    iconName: 'TrendingUp',
    subCategories: ['Salary', 'Interest & Dividend', 'Refund', 'Cashback', 'Investment']
  },
  {
    id: 'transfers',
    name: 'Transfers & Personal',
    color: '#3b82f6',
    iconName: 'ArrowLeftRight',
    subCategories: ['UPI Transfer', 'Friends & Family', 'Personal Payment']
  },
  {
    id: 'uncategorized',
    name: 'Uncategorized',
    color: '#64748b',
    iconName: 'HelpCircle',
    subCategories: ['General']
  }
];
