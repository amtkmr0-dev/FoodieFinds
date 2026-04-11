import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  variant?: "mobile-s" | "mobile-m" | "mobile-l" | "tablet" | "auto";
}

export function ResponsiveLayout({
  children,
  className = "",
  variant = "auto"
}: ResponsiveLayoutProps) {
  const getLayoutClasses = () => {
    switch (variant) {
      case "mobile-s":
        return "max-w-[320px] mx-auto px-2 py-2";
      case "mobile-m":
        return "max-w-[375px] mx-auto px-3 py-3";
      case "mobile-l":
        return "max-w-[414px] mx-auto px-4 py-4";
      case "tablet":
        return "max-w-[768px] mx-auto px-6 py-6";
      case "auto":
      default:
        return "max-w-7xl mx-auto px-3 mobile-m:px-4 mobile-l:px-5 tablet:px-6 py-3 mobile-m:py-4 mobile-l:py-5 tablet:py-6";
    }
  };

  return (
    <div className={cn(getLayoutClasses(), className)}>
      {children}
    </div>
  );
}

// Screen size detection hook
export function useScreenSize() {
  if (typeof window === "undefined") return "mobile-m";

  const width = window.innerWidth;

  if (width <= 320) return "mobile-s";
  if (width <= 375) return "mobile-m";
  if (width <= 414) return "mobile-l";
  if (width <= 768) return "tablet";
  return "desktop";
}

// Responsive grid component for creator cards
interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveGrid({ children, className = "" }: ResponsiveGridProps) {
  return (
    <div className={cn(
      "grid gap-3 mobile-m:gap-4",
      "grid-cols-2", // Small phones: 2 columns
      "mobile-l:grid-cols-3", // Large phones: 3 columns
      "tablet:grid-cols-4", // Tablets: 4 columns
      "lg:grid-cols-5", // Desktop: 5 columns
      className
    )}>
      {children}
    </div>
  );
}