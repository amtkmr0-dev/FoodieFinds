import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        screens: {
            'xs': '320px',    // Small phones
            'sm': '375px',    // Regular phones
            'md': '768px',    // Tablets
            'lg': '1024px',   // Desktop
            'xl': '1280px',   // Large desktop
            '2xl': '1536px',  // Extra large desktop
            // Custom mobile breakpoints
            'mobile-s': '320px',  // Galaxy S5, iPhone 5/SE
            'mobile-m': '375px',  // iPhone 6/7/8
            'mobile-l': '414px',  // iPhone 6/7/8 Plus
            'tablet': '768px',    // iPad
        },
        extend: {
            borderRadius: {
                lg: ".5rem", /* 8px */
                md: ".375rem", /* 6px */
                sm: ".1875rem", /* 3px */
                xl: ".75rem", /* 12px */
                "2xl": "1rem", /* 16px */
                "3xl": "1.5rem", /* 24px */
            },
            colors: {
                // Flat / base colors (regular buttons)
                background: "hsl(var(--background) / <alpha-value>)",
                foreground: "hsl(var(--foreground) / <alpha-value>)",
                border: "hsl(var(--border) / <alpha-value>)",
                input: "hsl(var(--input) / <alpha-value>)",
                card: {
                    DEFAULT: "hsl(var(--card) / <alpha-value>)",
                    foreground: "hsl(var(--card-foreground) / <alpha-value>)",
                    border: "hsl(var(--card-border) / <alpha-value>)",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover) / <alpha-value>)",
                    foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
                    border: "hsl(var(--popover-border) / <alpha-value>)",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary) / <alpha-value>)",
                    foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
                    border: "var(--primary-border)",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
                    foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
                    border: "hsl(var(--secondary-border) / <alpha-value>)",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted) / <alpha-value>)",
                    foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
                    border: "hsl(var(--muted-border) / <alpha-value>)",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent) / <alpha-value>)",
                    foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
                    border: "hsl(var(--accent-border) / <alpha-value>)",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
                    foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
                    border: "hsl(var(--destructive-border) / <alpha-value>)",
                },
                success: {
                    DEFAULT: "hsl(var(--success) / <alpha-value>)",
                    foreground: "hsl(var(--success-foreground) / <alpha-value>)",
                    border: "hsl(var(--success-border) / <alpha-value>)",
                },
                warning: {
                    DEFAULT: "hsl(var(--warning) / <alpha-value>)",
                    foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
                    border: "hsl(var(--warning-border) / <alpha-value>)",
                },
                info: {
                    DEFAULT: "hsl(var(--info) / <alpha-value>)",
                    foreground: "hsl(var(--info-foreground) / <alpha-value>)",
                    border: "hsl(var(--info-border) / <alpha-value>)",
                },
                // Gradient colors (gradient buttons)
                "gradient-primary": {
                    start: "hsl(var(--gradient-primary-start) / <alpha-value>)",
                    end: "hsl(var(--gradient-primary-end) / <alpha-value>)",
                },
                "gradient-secondary": {
                    start: "hsl(var(--gradient-secondary-start) / <alpha-value>)",
                    end: "hsl(var(--gradient-secondary-end) / <alpha-value>)",
                },
                "gradient-success": {
                    start: "hsl(var(--gradient-success-start) / <alpha-value>)",
                    end: "hsl(var(--gradient-success-end) / <alpha-value>)",
                },
                "gradient-warning": {
                    start: "hsl(var(--gradient-warning-start) / <alpha-value>)",
                    end: "hsl(var(--gradient-warning-end) / <alpha-value>)",
                },
                "gradient-destructive": {
                    start: "hsl(var(--gradient-destructive-start) / <alpha-value>)",
                    end: "hsl(var(--gradient-destructive-end) / <alpha-value>)",
                },
                // Special UI colors
                ring: "hsl(var(--ring) / <alpha-value>)",
                overlay: "hsl(var(--overlay) / <alpha-value>)",
                "sidebar-background": "hsl(var(--sidebar-background) / <alpha-value>)",
                "sidebar-foreground": "hsl(var(--sidebar-foreground) / <alpha-value>)",
                "sidebar-border": "hsl(var(--sidebar-border) / <alpha-value>)",
                "sidebar-accent": "hsl(var(--sidebar-accent) / <alpha-value>)",
                "sidebar-accent-foreground": "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            fontSize: {
                "2xs": ["0.625rem", { lineHeight: "0.75rem" }], // 10px
                "3xs": ["0.5rem", { lineHeight: "0.625rem" }], // 8px
            },
            boxShadow: {
                "elevate-sm": "0 2px 8px -2px rgba(0, 0, 0, 0.1)",
                "elevate-md": "0 4px 16px -4px rgba(0, 0, 0, 0.15)",
                "elevate-lg": "0 8px 32px -8px rgba(0, 0, 0, 0.2)",
                "elevate-xl": "0 16px 64px -16px rgba(0, 0, 0, 0.25)",
                "inner-elevate": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
                "glow-primary": "0 0 20px -4px hsl(var(--primary) / 0.5)",
                "glow-success": "0 0 20px -4px hsl(var(--success) / 0.5)",
                "glow-warning": "0 0 20px -4px hsl(var(--warning) / 0.5)",
                "glow-destructive": "0 0 20px -4px hsl(var(--destructive) / 0.5)",
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-out",
                "slide-up": "slideUp 0.3s ease-out",
                "slide-down": "slideDown 0.3s ease-out",
                "slide-left": "slideLeft 0.3s ease-out",
                "slide-right": "slideRight 0.3s ease-out",
                "scale-in": "scaleIn 0.2s ease-out",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "spin-slow": "spin 3s linear infinite",
                "bounce-slow": "bounce 2s infinite",
                "ping-slow": "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
                "shimmer": "shimmer 2s infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideDown: {
                    "0%": { transform: "translateY(-10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideLeft: {
                    "0%": { transform: "translateX(10px)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
                slideRight: {
                    "0%": { transform: "translateX(-10px)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
                scaleIn: {
                    "0%": { transform: "scale(0.95)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200px 0" },
                    "100%": { backgroundPosition: "calc(200px + 100%) 0" },
                },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "gradient-primary": "linear-gradient(135deg, hsl(var(--gradient-primary-start)) 0%, hsl(var(--gradient-primary-end)) 100%)",
                "gradient-secondary": "linear-gradient(135deg, hsl(var(--gradient-secondary-start)) 0%, hsl(var(--gradient-secondary-end)) 100%)",
                "gradient-success": "linear-gradient(135deg, hsl(var(--gradient-success-start)) 0%, hsl(var(--gradient-success-end)) 100%)",
                "gradient-warning": "linear-gradient(135deg, hsl(var(--gradient-warning-start)) 0%, hsl(var(--gradient-warning-end)) 100%)",
                "gradient-destructive": "linear-gradient(135deg, hsl(var(--gradient-destructive-start)) 0%, hsl(var(--gradient-destructive-end)) 100%)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config;