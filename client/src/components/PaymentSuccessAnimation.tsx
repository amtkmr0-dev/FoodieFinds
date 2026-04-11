import { CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface PaymentSuccessAnimationProps {
    onComplete?: () => void;
    duration?: number;
}

export function PaymentSuccessAnimation({
    onComplete,
    duration = 2000
}: PaymentSuccessAnimationProps) {
    const [showSparkles, setShowSparkles] = useState(false);

    useEffect(() => {
        // Show sparkles after a short delay
        const timer = setTimeout(() => {
            setShowSparkles(true);
        }, 300);

        // Call onComplete after animation duration
        const completeTimer = setTimeout(() => {
            onComplete?.();
        }, duration);

        return () => {
            clearTimeout(timer);
            clearTimeout(completeTimer);
        };
    }, [duration, onComplete]);

    return (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
            {/* Success Icon with Animation */}
            <div className="relative">
                <div className={`w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center transition-all duration-500 ${showSparkles ? "scale-110" : "scale-0"
                    }`}>
                    <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
                </div>

                {/* Sparkles */}
                {showSparkles && (
                    <>
                        <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-bounce" />
                        <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-blue-500 animate-bounce delay-100" />
                        <Sparkles className="absolute top-1/2 -right-4 w-5 h-5 text-purple-500 animate-bounce delay-200" />
                    </>
                )}
            </div>

            {/* Success Text */}
            <div className={`text-center space-y-2 transition-all duration-500 ${showSparkles ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Payment Successful!
                </h2>
                <p className="text-sm text-muted-foreground">
                    Your wallet has been credited
                </p>
            </div>

            {/* Animated Checkmark */}
            <div className={`w-16 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent transition-all duration-1000 ${showSparkles ? "w-full opacity-100" : "w-0 opacity-0"
                }`} />
        </div>
    );
}
