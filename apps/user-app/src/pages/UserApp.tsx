import { useState } from "react";
import { useWallet } from "@foodiefinds/hooks";

export default function UserApp() {
    const { balance, isLoading } = useWallet();
    const [count, setCount] = useState(0);

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">FoodieFinds User App</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-card p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Wallet Balance</h2>
                        <div className="text-2xl font-bold text-primary">
                            {isLoading ? "Loading..." : `₹${balance}`}
                        </div>
                        <p className="text-muted-foreground mt-2">
                            Your current wallet balance
                        </p>
                    </div>

                    <div className="bg-card p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Demo Counter</h2>
                        <div className="text-2xl font-bold text-primary">{count}</div>
                        <div className="flex gap-2 mt-4">
                            <button
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                onClick={() => setCount(count + 1)}
                            >
                                Increment
                            </button>
                            <button
                                className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md"
                                onClick={() => setCount(0)}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">User App Features</h2>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Browse Creator Profiles</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Audio/Video Calls with Creators</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Send Gifts to Creators</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Random Match for Instant Connections</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Follow Your Favorite Creators</span>
                        </li>
                    </ul>
                </div>

                <div className="mt-8 text-center text-muted-foreground">
                    <p>User App is running successfully in the monorepo!</p>
                    <p className="text-sm mt-2">Server: http://localhost:5080/</p>
                </div>
            </div>
        </div>
    );
}