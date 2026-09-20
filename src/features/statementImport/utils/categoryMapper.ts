export interface MappingRule {
  keywords: string[];
  category: string;
  subCategory?: string;
  merchantName?: string;
  defaultType?: 'debit' | 'credit';
  confidence: number;
}

export interface CategoryMappingResult {
  category: string;
  subCategory?: string;
  merchant?: string;
  confidence: number;
}

// Hierarchical rules ordered by specificity
export const MAPPING_RULES: MappingRule[] = [
  // =========================================================================
  // User Personal & Recurring Rules (Highest Priority)
  // =========================================================================
  // 1. Flat Rent - Rupali Jalindar Dhavale
  {
    keywords: ['rupali jalindar dhavale', 'rupali jalindar', 'rupali dhavale', 'jalindar dhavale'],
    category: 'Flat Rent',
    subCategory: 'Monthly Rent',
    merchantName: 'Rupali Jalindar Dhavale (Flat Rent)',
    confidence: 0.99
  },
  // 2. Roommate - Sinchan
  {
    keywords: ['sinchan'],
    category: 'Roommate',
    subCategory: 'Roommate Split',
    merchantName: 'Sinchan (Roommate)',
    confidence: 0.99
  },
  // 3. Groceries - Keval Ram (Curd, Dals & Daily Provisions)
  {
    keywords: ['keval ram', 'kevalram'],
    category: 'Groceries',
    subCategory: 'Daily Provisions & Dals',
    merchantName: 'Keval Ram (Groceries)',
    confidence: 0.99
  },
  // 4. Tea & Snacks - Ritesh Kisan Shelake & Mayur Anil Agarwal (Chai & Nasta)
  {
    keywords: ['ritesh kisan shelake', 'ritesh shelake', 'kisan shelake', 'ritesh kisan'],
    category: 'Tea & Snacks',
    subCategory: 'Tea & Nasta',
    merchantName: 'Ritesh Kisan Shelake (Tea & Nasta)',
    confidence: 0.99
  },
  {
    keywords: ['mayur anil agarwal', 'mayur agarwal', 'anil agarwal', 'mayur anil'],
    category: 'Tea & Snacks',
    subCategory: 'Tea & Nasta',
    merchantName: 'Mayur Anil Agarwal (Tea & Nasta)',
    confidence: 0.99
  },
  // 5. Vegetables - Mota Ram (Dedicated separate category)
  {
    keywords: ['mota ram', 'motaram'],
    category: 'Vegetables',
    subCategory: 'Fresh Vegetables',
    merchantName: 'Mota Ram (Vegetables)',
    confidence: 0.99
  },
  // 6. Company Canteen - Kashiram MDB & MDB01
  {
    keywords: ['kashiram mdb', 'kashiram', 'mdb01', 'mdb 01', 'mdb-01'],
    category: 'Company Canteen',
    subCategory: 'Office Canteen',
    merchantName: 'Kashiram MDB (Company Canteen)',
    confidence: 0.99
  },

  // Generic Rent & Roommate keywords
  {
    keywords: ['flat rent', 'house rent', 'room rent', 'monthly rent'],
    category: 'Flat Rent',
    subCategory: 'Monthly Rent',
    confidence: 0.95
  },
  {
    keywords: ['roommate', 'flatmate', 'room share', 'rent share'],
    category: 'Roommate',
    subCategory: 'Roommate Split',
    confidence: 0.95
  },

  // Vegetables (Dedicated Category)
  {
    keywords: ['vegetable', 'vegitables', 'bhaji market', 'sabzi', 'sabji', 'mandi'],
    category: 'Vegetables',
    subCategory: 'Fresh Vegetables',
    confidence: 0.95
  },

  // Tea & Snacks (Dedicated Category)
  {
    keywords: ['amruttulya', 'amrutttulya', 'tea stall', 'tapri', 'chai tapri', 'nasta center', 'nashta center'],
    category: 'Tea & Snacks',
    subCategory: 'Tea & Nasta',
    confidence: 0.95
  },

  // Company Canteen (Dedicated Category)
  {
    keywords: ['office canteen', 'company canteen', 'office cafeteria', 'work canteen'],
    category: 'Company Canteen',
    subCategory: 'Office Canteen',
    confidence: 0.95
  },

  // Food & Dining - Delivery
  {
    keywords: ['swiggy', 'bundl technologies', 'swiggy instamart'],
    category: 'Food & Dining',
    subCategory: 'Food Delivery',
    merchantName: 'Swiggy',
    confidence: 0.95
  },
  {
    keywords: ['zomato', 'zomato media'],
    category: 'Food & Dining',
    subCategory: 'Food Delivery',
    merchantName: 'Zomato',
    confidence: 0.95
  },
  {
    keywords: ['eatsure', 'faasos', 'behrouz', 'ovenstory', 'box8'],
    category: 'Food & Dining',
    subCategory: 'Food Delivery',
    confidence: 0.9
  },
  // Food & Dining - Restaurants & Cafes
  {
    keywords: ['starbucks', 'tata starbucks'],
    category: 'Food & Dining',
    subCategory: 'Cafes',
    merchantName: 'Starbucks',
    confidence: 0.95
  },
  {
    keywords: ['mcdonalds', 'mcdonald', 'hardcastle'],
    category: 'Food & Dining',
    subCategory: 'Restaurants',
    merchantName: "McDonald's",
    confidence: 0.95
  },
  {
    keywords: ['kfc', 'yum restaurants'],
    category: 'Food & Dining',
    subCategory: 'Restaurants',
    merchantName: 'KFC',
    confidence: 0.95
  },
  {
    keywords: ['dominos', 'jubilant foodworks', 'pizza hut'],
    category: 'Food & Dining',
    subCategory: 'Restaurants',
    confidence: 0.95
  },
  {
    keywords: ['cafe coffee day', 'third wave', 'blue tokai', 'chaayos', 'chai point'],
    category: 'Food & Dining',
    subCategory: 'Cafes',
    confidence: 0.9
  },
  // Groceries (Dedicated Category)
  {
    keywords: ['bigbasket', 'supermarket grocery', 'zepto', 'bb daily', 'nature basket', 'blinkit', 'grofers'],
    category: 'Groceries',
    subCategory: 'Quick Commerce & Supermarkets',
    confidence: 0.95
  },
  {
    keywords: ['dmart', 'avenue supermarts', 'spencer', 'more retail', 'reliance fresh'],
    category: 'Groceries',
    subCategory: 'Supermarket',
    confidence: 0.92
  },

  // Transport - Petrol / Fuel
  {
    keywords: ['hpcl', 'hindustan petroleum', 'hp petrol', 'hp auto'],
    category: 'Transportation',
    subCategory: 'Petrol',
    merchantName: 'HPCL Petrol Pump',
    confidence: 0.95
  },
  {
    keywords: ['bpcl', 'bharat petroleum', 'bharat petro'],
    category: 'Transportation',
    subCategory: 'Petrol',
    merchantName: 'BPCL Petrol Pump',
    confidence: 0.95
  },
  {
    keywords: ['iocl', 'indian oil', 'indianoil'],
    category: 'Transportation',
    subCategory: 'Petrol',
    merchantName: 'Indian Oil Petrol Pump',
    confidence: 0.95
  },
  {
    keywords: ['shell petrol', 'shell india', 'shell retail', 'petrol pump', 'cng station', 'fuel station'],
    category: 'Transportation',
    subCategory: 'Petrol',
    merchantName: 'Shell Petrol Pump',
    confidence: 0.9
  },
  // Transport - Cabs & Transit
  {
    keywords: ['uber', 'uber india'],
    category: 'Transportation',
    subCategory: 'Cabs & Transit',
    merchantName: 'Uber',
    confidence: 0.95
  },
  {
    keywords: ['ola', 'ani technologies', 'olacabs'],
    category: 'Transportation',
    subCategory: 'Cabs & Transit',
    merchantName: 'Ola Cabs',
    confidence: 0.95
  },
  {
    keywords: ['rapido', 'roppen transportation'],
    category: 'Transportation',
    subCategory: 'Cabs & Transit',
    merchantName: 'Rapido',
    confidence: 0.95
  },
  {
    keywords: ['irctc', 'indian railway', 'railway booking'],
    category: 'Transportation',
    subCategory: 'Flight & Train',
    merchantName: 'IRCTC',
    confidence: 0.95
  },
  {
    keywords: ['makemytrip', 'goibibo', 'cleartrip', 'indigo', 'air india', 'spicejet'],
    category: 'Transportation',
    subCategory: 'Flight & Train',
    confidence: 0.9
  },
  {
    keywords: ['fastag', 'toll plaza', 'nhai', 'netc fastag'],
    category: 'Transportation',
    subCategory: 'Fastag & Toll',
    confidence: 0.95
  },

  // Shopping - Online Shopping
  {
    keywords: ['amazon', 'amazon pay', 'amzn', 'amazon seller'],
    category: 'Shopping',
    subCategory: 'Online Shopping',
    merchantName: 'Amazon',
    confidence: 0.95
  },
  {
    keywords: ['flipkart', 'flipkart internet'],
    category: 'Shopping',
    subCategory: 'Online Shopping',
    merchantName: 'Flipkart',
    confidence: 0.95
  },
  {
    keywords: ['myntra', 'myntra designs'],
    category: 'Shopping',
    subCategory: 'Online Shopping',
    merchantName: 'Myntra',
    confidence: 0.95
  },
  {
    keywords: ['ajio', 'reliance retail', 'tata cliq', 'nykaa', 'meesho'],
    category: 'Shopping',
    subCategory: 'Online Shopping',
    confidence: 0.9
  },
  // Shopping - Electronics & Retail
  {
    keywords: ['apple store', 'apple.com/bill', 'croma', 'reliance digital', 'decathlon', 'ikea', 'zara', 'h&m', 'uniqlo'],
    category: 'Shopping',
    subCategory: 'Electronics',
    confidence: 0.9
  },

  // Entertainment - Subscriptions
  {
    keywords: ['netflix', 'netflix entertainment'],
    category: 'Entertainment',
    subCategory: 'Subscription',
    merchantName: 'Netflix',
    confidence: 0.98
  },
  {
    keywords: ['spotify', 'spotify india'],
    category: 'Entertainment',
    subCategory: 'Subscription',
    merchantName: 'Spotify',
    confidence: 0.95
  },
  {
    keywords: ['hotstar', 'disney+ hotstar', 'disney plus', 'prime video', 'youtube premium', 'google play'],
    category: 'Entertainment',
    subCategory: 'Subscription',
    confidence: 0.95
  },
  // Entertainment - Movies
  {
    keywords: ['bookmyshow', 'bigtree entertainment', 'pvr', 'inox', 'cinepolis'],
    category: 'Entertainment',
    subCategory: 'Movies',
    confidence: 0.95
  },

  // Bills & Utilities
  {
    keywords: ['airtel', 'bharti airtel'],
    category: 'Bills & Utilities',
    subCategory: 'Mobile Recharge',
    merchantName: 'Airtel',
    confidence: 0.95
  },
  {
    keywords: ['jio', 'reliance jio', 'jio infocomm'],
    category: 'Bills & Utilities',
    subCategory: 'Mobile Recharge',
    merchantName: 'Jio',
    confidence: 0.95
  },
  {
    keywords: ['bescom', 'tata power', 'adani electricity', 'cesc', 'electricity bill', 'water board', 'gas bill', 'mahanagar gas', 'indane'],
    category: 'Bills & Utilities',
    subCategory: 'Electricity',
    confidence: 0.9
  },
  {
    keywords: ['act fibernet', 'act broadband', 'hathway', 'airtel broadband'],
    category: 'Bills & Utilities',
    subCategory: 'Internet',
    confidence: 0.95
  },

  // Health & Wellness
  {
    keywords: ['apollo pharmacy', 'apollo hospital', 'pharmeasy', '1mg', 'tata 1mg', 'practo', 'medplus', 'netmeds'],
    category: 'Health & Wellness',
    subCategory: 'Pharmacy',
    confidence: 0.95
  },
  {
    keywords: ['cult.fit', 'cultfit', 'curefit', 'gold gym', 'anytime fitness'],
    category: 'Health & Wellness',
    subCategory: 'Gym',
    confidence: 0.95
  },

  // Income & Salary
  {
    keywords: ['salary', 'payroll', 'ach cr salary', 'salary credit', 'monthly pay'],
    category: 'Income & Investment',
    subCategory: 'Salary',
    defaultType: 'credit',
    confidence: 0.98
  },
  {
    keywords: ['dividend', 'interest credit', 'interest paid by bank', 'fd interest'],
    category: 'Income & Investment',
    subCategory: 'Interest & Dividend',
    defaultType: 'credit',
    confidence: 0.95
  },
  {
    keywords: ['cashback', 'reward points credit', 'refund'],
    category: 'Income & Investment',
    subCategory: 'Cashback',
    defaultType: 'credit',
    confidence: 0.9
  },
  {
    keywords: ['zerodha', 'groww', 'upstox', 'angel one', 'kuvera', 'indmoney', 'mutual fund', 'uti mf', 'hdfc mf'],
    category: 'Income & Investment',
    subCategory: 'Investment',
    confidence: 0.9
  },

  // Indian Dining & Hotels
  {
    keywords: [
      'hotel', 'restaurant', 'mangalmurti', 'mess', 'bhojanalaya', 'bhojnalay', 
      'dhaba', 'sweets', 'bhel', 'panipuri', 'icecream', 'sandwich', 'foods', 
      'kitchen', 'caterers', 'momos', 'litti', 'chokha', 'pakoshi', 'pan shop', 'juice', 'bakery'
    ],
    category: 'Food & Dining',
    subCategory: 'Restaurants',
    confidence: 0.9
  },

  // Groceries & General Provisions (Curd, Dals, Kirana, Marts)
  {
    keywords: ['provision', 'kirana', 'dairy', 'supermarket', 'mart', 'general store', 'genral store', 'milk', 'curd', 'dahi', 'dals', 'dal', 'atta', 'rice'],
    category: 'Groceries',
    subCategory: 'Daily Provisions & Dals',
    confidence: 0.9
  },

  // Vegetables & Fresh Fruits
  {
    keywords: ['vegetable', 'vegitables', 'fruits', 'fruit', 'bhaji market', 'sabzi', 'sabji', 'mandi'],
    category: 'Vegetables',
    subCategory: 'Fresh Vegetables',
    confidence: 0.9
  },

  // Tea & Nasta
  {
    keywords: ['tea', 'chai', 'nasta', 'nashta', 'tapri', 'snacks', 'snack'],
    category: 'Tea & Snacks',
    subCategory: 'Tea & Nasta',
    confidence: 0.9
  },

  // Transport & Fuel
  {
    keywords: ['petroleum', 'petrol pump', 'service station', 'fuel', 'redbus', 'makemytrip', 'irctc', 'fastag', 'toll', 'cabs', 'travels'],
    category: 'Transportation',
    subCategory: 'Petrol',
    confidence: 0.95
  },

  // Clothing & Personal Retail
  {
    keywords: ['menswear', 'garments', 'clothing', 'cloth', 'textile', 'fashion', 'saree', 'footwear', 'shoes', 'jeweller', 'optical', 'handloom', 'justcaps'],
    category: 'Shopping',
    subCategory: 'Clothing',
    confidence: 0.9
  },

  // Medical, Chemist & Personal Care
  {
    keywords: ['medical', 'medicals', 'medicine', 'chemist', 'pharmacy', 'hospital', 'clinic', 'pathology', 'lab', 'dental', 'saloon', 'salon'],
    category: 'Health & Wellness',
    subCategory: 'Pharmacy',
    confidence: 0.9
  },

  // Personal UPI Transfers
  {
    keywords: ['paid to', 'received from', 'transfer to', 'sent to'],
    category: 'Transfers & Personal',
    subCategory: 'UPI Transfer',
    confidence: 0.75
  }
];

/**
 * Intelligently maps an arbitrary narration/merchant string to application category.
 * If unmatched, returns "Uncategorized".
 */
export const mapToCategory = (description: string, merchantHint?: string): CategoryMappingResult => {
  const target = `${description} ${merchantHint || ''}`.toLowerCase();

  for (const rule of MAPPING_RULES) {
    for (const keyword of rule.keywords) {
      // Word boundary or containment check
      if (target.includes(keyword.toLowerCase())) {
        return {
          category: rule.category,
          subCategory: rule.subCategory,
          merchant: rule.merchantName || merchantHint || cleanMerchantName(description),
          confidence: rule.confidence,
        };
      }
    }
  }

  // Fallback as specified in requirements
  return {
    category: 'Uncategorized',
    subCategory: 'General',
    merchant: merchantHint || cleanMerchantName(description),
    confidence: 0.3,
  };
};

/**
 * Extracts a neat merchant label from messy bank narrations:
 * e.g., "UPI/6262145899/SWIGGY/HDFC0001" -> "Swiggy"
 */
export const cleanMerchantName = (narration: string): string => {
  if (!narration) return 'Merchant';
  
  let clean = narration.trim();
  
  // Strip common UPI prefixes: "UPI/123456789/..." or "POS 401200XXXXXX ..."
  if (clean.toUpperCase().startsWith('UPI/')) {
    const parts = clean.split('/');
    if (parts.length >= 3 && parts[2]) {
      clean = parts[2];
    }
  } else if (clean.toUpperCase().startsWith('POS ')) {
    const withoutPos = clean.replace(/^POS\s+\S+\s+/i, '');
    if (withoutPos) clean = withoutPos;
  } else if (clean.toUpperCase().startsWith('PAID TO ')) {
    clean = clean.substring(8);
  } else if (clean.toUpperCase().startsWith('RECEIVED FROM ')) {
    clean = clean.substring(14);
  }

  // Take first 3-4 words max
  const words = clean.split(/\s+/).slice(0, 4).join(' ');
  return words.length > 25 ? `${words.slice(0, 25)}...` : words;
};
