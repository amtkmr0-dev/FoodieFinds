import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { WalletProvider } from "@foodiefinds/hooks";
import UserApp from "./pages/UserApp";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

function App() {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <WalletProvider>
                    <ThemeProvider defaultTheme="light">
                        <TooltipProvider>
                            <UserApp />
                        </TooltipProvider>
                    </ThemeProvider>
                </WalletProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;