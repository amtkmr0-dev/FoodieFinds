/**
 * Application constants for FoodieFinds
 */

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://13.234.19.105:5000'
export const API_TIMEOUT = 30000 // 30 seconds

// Application Roles
export const ROLES = {
    USER: 'user',
    CREATOR: 'creator',
    AGENT: 'agent',
    ADMIN: 'admin',
    SUPER_USER: 'super_user',
    SUPPORT: 'support',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// Approval Statuses
export const APPROVAL_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    BANNED: 'banned',
} as const

export type ApprovalStatus = typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS]

// Call Types
export const CALL_TYPES = {
    AUDIO: 'audio',
    VIDEO: 'video',
    BOTH: 'both',
} as const

export type CallType = typeof CALL_TYPES[keyof typeof CALL_TYPES]

// Payment Methods
export const PAYMENT_METHODS = {
    UPI: 'upi',
    CARD: 'card',
    NET_BANKING: 'net_banking',
    WALLET: 'wallet',
} as const

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]

// Quick Recharge Amounts (INR)
export const QUICK_RECHARGE_AMOUNTS = [100, 250, 500, 1000, 2000, 5000] as const

// Creator Categories
export const CREATOR_CATEGORIES = [
    'Food & Cooking',
    'Fitness & Health',
    'Music & Dance',
    'Comedy & Entertainment',
    'Gaming',
    'Beauty & Fashion',
    'Education & Learning',
    'Travel & Adventure',
    'Business & Finance',
    'Art & Creativity',
] as const

export type CreatorCategory = typeof CREATOR_CATEGORIES[number]

// Languages
export const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'bn', name: 'Bengali' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'mr', name: 'Marathi' },
    { code: 'pa', name: 'Punjabi' },
] as const

// Time Constants
export const TIME = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
} as const

// Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'foodiefinds_auth_token',
    USER_ROLE: 'foodiefinds_user_role',
    USER_ID: 'foodiefinds_user_id',
    THEME: 'foodiefinds_theme',
    LANGUAGE: 'foodiefinds_language',
    FOLLOWED_CREATORS: 'foodiefinds_followed_creators',
} as const

// Routes
export const ROUTES = {
    // User App
    USER_HOME: '/',
    USER_EXPLORE: '/explore',
    USER_NEW: '/new',
    USER_FOLLOW: '/follow',
    USER_RECHARGE: '/recharge',
    USER_PROFILE: '/profile',

    // Creator App
    CREATOR_DASHBOARD: '/creator/dashboard',
    CREATOR_LIVE: '/creator/live',
    CREATOR_PK_BATTLES: '/creator/pk-battles',
    CREATOR_LEADERBOARD: '/creator/leaderboard',
    CREATOR_GIFTS: '/creator/gifts',
    CREATOR_EARNINGS: '/creator/earnings',
    CREATOR_SETTINGS: '/creator/settings',

    // Admin
    ADMIN_LOGIN: '/admin/login',
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_KYC: '/admin/kyc',
    ADMIN_PRICING: '/admin/pricing',
    ADMIN_GIFTS: '/admin/gifts',
    ADMIN_ADMINS: '/admin/admins',
    ADMIN_SUPPORT: '/admin/support',

    // Auth
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
} as const

// Feature Flags
export const FEATURE_FLAGS = {
    ENABLE_RANDOM_MATCH: true,
    ENABLE_GIFT_SENDING: true,
    ENABLE_PK_BATTLES: true,
    ENABLE_LIVE_STREAMING: true,
    ENABLE_WALLET_RECHARGE: true,
    ENABLE_CREATOR_APPLICATIONS: true,
} as const

// Default Values
export const DEFAULTS = {
    CREATOR_PER_MINUTE_RATE: 50, // INR
    AGENCY_COMMISSION_PERCENTAGE: 20, // %
    MINIMUM_RECHARGE_AMOUNT: 100, // INR
    MAXIMUM_RECHARGE_AMOUNT: 10000, // INR
    CALL_MINIMUM_DURATION: 1, // minutes
    CALL_MAXIMUM_DURATION: 60, // minutes
    RANDOM_MATCH_TIMEOUT: 30, // seconds
} as const

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    INSUFFICIENT_BALANCE: 'Insufficient balance. Please recharge your wallet.',
    CALL_NOT_ALLOWED: 'This creator does not allow calls at the moment.',
    CREATOR_BUSY: 'Creator is currently busy. Please try again later.',
    INVALID_CALL_TYPE: 'Invalid call type selected.',
    PAYMENT_FAILED: 'Payment failed. Please try again.',
    KYC_PENDING: 'Your KYC is pending approval.',
    KYC_REJECTED: 'Your KYC has been rejected.',
    ACCOUNT_BANNED: 'Your account has been banned.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
    RECHARGE_SUCCESSFUL: 'Recharge successful!',
    CALL_STARTED: 'Call started successfully!',
    GIFT_SENT: 'Gift sent successfully!',
    FOLLOW_SUCCESS: 'Followed successfully!',
    UNFOLLOW_SUCCESS: 'Unfollowed successfully!',
    PROFILE_UPDATED: 'Profile updated successfully!',
    SETTINGS_SAVED: 'Settings saved successfully!',
    KYC_SUBMITTED: 'KYC submitted for approval.',
    WITHDRAWAL_REQUESTED: 'Withdrawal requested successfully!',
} as const