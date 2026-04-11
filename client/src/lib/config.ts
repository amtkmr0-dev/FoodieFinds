/**
 * Client-side configuration constants for FoodieFinds
 */

// Balance thresholds
export const BALANCE_THRESHOLDS = {
    LOW_BALANCE: 135, // Minimum balance warning threshold
    MIN_CALL_MINUTES: 3, // Minimum minutes required to start a call
} as const;

// Quick recharge amounts
export const QUICK_RECHARGE_AMOUNTS = [100, 250, 500, 1000, 2000, 5000] as const;

// Status colors (CSS variable references)
export const STATUS_COLORS = {
    ONLINE: 'bg-status-online',
    OFFLINE: 'bg-status-offline',
} as const;

// Payment status colors (CSS variable references)
export const PAYMENT_STATUS_COLORS = {
    SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
} as const;

// Phone validation patterns
export const PHONE_PATTERNS = {
    // Indian phone number pattern: +91 followed by 10 digits
    INDIA: /^(\+91|0)?[6-9]\d{9}$/,
    // Generic international pattern: + followed by 10-15 digits
    INTERNATIONAL: /^\+[1-9]\d{1,14}$/,
} as const;

// Country flag mapping (ISO 3166-1 alpha-2 to emoji)
export const COUNTRY_FLAGS: Record<string, string> = {
    IN: '🇮🇳',
    US: '🇺🇸',
    GB: '🇬🇧',
    CA: '🇨🇦',
    AU: '🇦🇺',
    DE: '🇩🇪',
    FR: '🇫🇷',
    JP: '🇯🇵',
    KR: '🇰🇷',
    CN: '🇨🇳',
    BR: '🇧🇷',
    MX: '🇲🇽',
    ES: '🇪🇸',
    IT: '🇮🇹',
    RU: '🇷🇺',
    SA: '🇸🇦',
    AE: '🇦🇪',
    SG: '🇸🇬',
    MY: '🇲🇾',
    TH: '🇹🇭',
    ID: '🇮🇩',
    PH: '🇵🇭',
    VN: '🇻🇳',
    BD: '🇧🇩',
    PK: '🇵🇰',
    LK: '🇱🇰',
    NP: '🇳🇵',
    // Add more countries as needed
} as const;

// Payment fees configuration
export const PAYMENT_FEES = {
    // Fee percentage for different payment methods
    UPI: 0, // No fee for UPI
    CARD: 0.02, // 2% fee for cards
    NET_BANKING: 0.01, // 1% fee for net banking
    WALLET: 0.015, // 1.5% fee for wallets
} as const;

// Minimum fee amount (in INR)
export const MIN_PAYMENT_FEE = 1;

// Maximum fee amount (in INR)
export const MAX_PAYMENT_FEE = 50;

// Calculate payment fee based on amount and payment method
export const calculatePaymentFee = (amount: number, paymentMethod: string): number => {
    const feePercentage = PAYMENT_FEES[paymentMethod.toUpperCase() as keyof typeof PAYMENT_FEES] || 0;
    const fee = amount * feePercentage;
    return Math.max(MIN_PAYMENT_FEE, Math.min(fee, MAX_PAYMENT_FEE));
};

// Calculate total amount including fees
export const calculateTotalWithFee = (amount: number, paymentMethod: string): number => {
    const fee = calculatePaymentFee(amount, paymentMethod);
    return amount + fee;
};

// Validate phone number
export const validatePhoneNumber = (phone: string, country: string = 'IN'): boolean => {
    const pattern = country === 'IN' ? PHONE_PATTERNS.INDIA : PHONE_PATTERNS.INTERNATIONAL;
    return pattern.test(phone.replace(/\s/g, ''));
};

// Get country flag emoji from country code
export const getCountryFlag = (countryCode: string): string => {
    return COUNTRY_FLAGS[countryCode.toUpperCase()] || '🌍';
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as +91 XXXXX XXXXX for Indian numbers
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }

    // Format as +XX XXXXXXXXXX for international numbers
    if (cleaned.length > 10) {
        const countryCode = cleaned.slice(0, -10);
        const number = cleaned.slice(-10);
        return `+${countryCode} ${number}`;
    }

    return phone;
};
