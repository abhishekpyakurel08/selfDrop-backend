const MOCK_STATS = {
    totalRevenue: 125400,
    deliveryRevenue: 12400,
    totalExpenses: 45000,
    netProfit: 80400,
    totalOrders: 60,
    pendingOrders: 12,
    completedOrders: 40,
    cancelledOrders: 8,
    totalUsers: 15,
    dailyAnalytics: [
        { date: '2024-03-20', income: 12000 },
        { date: '2024-03-21', income: 15000 },
        { date: '2024-03-22', income: 11000 },
        { date: '2024-03-23', income: 18000 },
        { date: '2024-03-24', income: 22000 },
        { date: '2024-03-25', income: 19000 },
        { date: '2024-03-26', income: 25000 }
    ],
    lowStockProducts: [],
    orderDistribution: [
        { name: "COMPLETED", value: 40 },
        { name: "CREATED", value: 8 },
        { name: "CONFIRMED", value: 4 },
        { name: "OUT_FOR_DELIVERY", value: 4 },
        { name: "CANCELLED", value: 4 }
    ],
    categoryDistribution: [
        { name: "Whiskey", value: 55000 },
        { name: "Beer", value: 25000 },
        { name: "Wine", value: 20000 },
        { name: "Rum", value: 15400 },
        { name: "Cider", value: 10000 }
    ],
    paymentDistribution: [
        { name: "STRIPE", value: 25 },
        { name: "KHALTI", value: 20 },
        { name: "ESEWA", value: 15 }
    ]
};

const MOCK_USERS = [
    { _id: '1', name: 'Main Admin', email: 'abhishekpyakurel01@gmail.com', role: 'admin' },
    { _id: '3', name: 'Customer 1', email: 'customer1@gmail.com', role: 'user' },
    { _id: '4', name: 'Customer 2', email: 'customer2@gmail.com', role: 'user' }
];

const MOCK_ORDERS = [
    {
        _id: 'ord1',
        id: 'ord1',
        user: { name: 'Customer 1' },
        total: 2850,
        status: 'COMPLETED',
        items: [{}, {}],
        createdAt: new Date().toISOString(),
        payment: { method: 'STRIPE', status: 'PAID' }
    },
    {
        _id: 'ord2',
        id: 'ord2',
        user: { name: 'Customer 2' },
        total: 1450,
        status: 'CONFIRMED',
        items: [{}],
        createdAt: new Date().toISOString(),
        payment: { method: 'KHALTI', status: 'PAID' }
    }
];

const MOCK_PRODUCTS = [
    { _id: 'p1', id: 'p1', name: 'Old Durbar Black Chimney', price: 2850, category: 'Whiskey', stock: 45, approved: true, image: '', description: 'Premium Whiskey' },
    { _id: 'p2', id: 'p2', name: 'Signature Premier Whiskey', price: 2100, category: 'Whiskey', stock: 3, approved: true, image: '', description: 'Smooth Whiskey' },
    { _id: 'p3', id: 'p3', name: 'Khukuri XXX Rum', price: 1450, category: 'Rum', stock: 55, approved: true, image: '', description: 'Traditional Rum' },
    { _id: 'p4', id: 'p4', name: 'Sula Vineyards Red', price: 1800, category: 'Wine', stock: 5, approved: true, image: '', description: 'Fine Red Wine' }
];

const MOCK_EXPENSES = [
    { _id: 'e1', title: 'Fuel for Delivery', amount: 1200, category: 'FUEL', date: new Date().toISOString() },
    { _id: 'e2', title: 'Packaging Boxes', amount: 5000, category: 'PACKAGING', date: new Date(Date.now() - 86400000).toISOString() },
    { _id: 'e3', title: 'Staff Lunch', amount: 800, category: 'OTHERS', date: new Date(Date.now() - 172800000).toISOString() }
];

const MOCK_USER_ORDERS = [
    {
        _id: 'ord1',
        id: 'ord1',
        total: 2850,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        items: [{}, {}]
    },
    {
        _id: 'ord3',
        id: 'ord3',
        total: 5000,
        status: 'CANCELLED',
        createdAt: new Date(Date.now() - 100000000).toISOString(),
        items: [{}]
    }
];

module.exports = {
    MOCK_STATS,
    MOCK_USERS,
    MOCK_ORDERS,
    MOCK_PRODUCTS,
    MOCK_EXPENSES,
    MOCK_USER_ORDERS
};
