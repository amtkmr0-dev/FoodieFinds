# LINKY Platform

## Overview

LINKY (Real Voices, Real Connections.) is a voice-calling platform that connects users with creators for paid conversations, operating on a pay-per-minute model in INR. The platform comprises three main applications: a User App for browsing creators and initiating calls, a Creator & Agency App for profile and earning management, and an Admin Dashboard for platform oversight and creator approval. It aims to provide transparent financial transactions and strong privacy protections.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with **React 18** and TypeScript, using **Vite** as the build tool. **Wouter** handles routing, and **TanStack Query** manages server state. The UI leverages **Shadcn/ui** components built on **Radix UI** primitives, styled with **Tailwind CSS** and a custom Material Design-inspired color palette. Typography uses Inter and Sora from Google Fonts, and the platform supports dark/light themes. State management relies on React Context for themes and local state, avoiding global state libraries. Key design patterns include component composition, feature-based organization, path aliases, and a mobile-first responsive design.

### Backend Architecture

The backend is developed with **Express.js** and TypeScript on Node.js. It uses **Drizzle ORM** for type-safe database operations with **PostgreSQL** via Neon serverless driver. The API follows a RESTful pattern with an `/api` prefix and includes an abstraction layer for storage. Authentication is **OTP-based passwordless** using mobile numbers, with auto-generated usernames and device-ID fast login. Session management uses a cookie-based approach with PostgreSQL session storage.

### Core Features

-   **Multi-role Architecture**: Supports User, Creator, Agency, and Admin roles.
-   **Financial Transactions**: Pay-per-minute billing, minimum balance requirements, and predefined recharge packs.
-   **Creator Profiles**: Detailed profiles with about sections, languages, media galleries, and follow/unfollow functionality.
-   **Account Management**: User ID display with copy functionality, profile editing (username, name, email), and recharge pack selection.
-   **Creator & Agency App**: Live status, earnings display, virtual gifts, PK battle system, live streaming controls with beauty filters, and agency management.
-   **Admin Dashboard**: Secure login with role-based access control (Super User, Admin, Support), KYC management, pricing management for creators and agencies, admin user management, and a support ticket system.

## External Dependencies

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **Drizzle Kit**: Database migration and schema management.
-   **Radix UI**: Headless accessible UI component primitives.
-   **Lucide React**: Icon library.
-   **Embla Carousel**: Touch-friendly carousel.
-   **CMDK**: Command palette interface.
-   **React Hook Form** with **Zod**: Form management and schema validation.
-   **date-fns**: Date manipulation.
-   **Tailwind CSS**, **PostCSS**, **Autoprefixer**: Styling.
-   **Google Fonts**: Inter and Sora font families.
-   **class-variance-authority & clsx**: Dynamic className management.
-   **nanoid**: Unique ID generation.