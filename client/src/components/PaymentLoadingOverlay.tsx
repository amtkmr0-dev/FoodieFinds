import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface PaymentLoadingOverlayProps {
    message?: string;
    subMessage?: string;
}

export function PaymentLoadingOverlay({
    message = "Processing your payment...",
    subMessage = "Please don't close this window"
}: PaymentLoadingOverlayProps) {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="p-8 max-w-sm w-full text-center space-y-4">
                <div className="flex justify-center">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{message}</h3>
                    {subMessage && (
                        <p className="text-sm text-muted-foreground">{subMessage}</p>
                    )}
                </div>

                <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span>Secure connection</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100" />
                        <span>Processing payment</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
