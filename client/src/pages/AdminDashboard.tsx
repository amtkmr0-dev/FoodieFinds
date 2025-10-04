import { useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { UserListItem } from "@/components/UserListItem";
import { ApprovalItem } from "@/components/ApprovalItem";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, DollarSign, UserPlus, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [timeFilter, setTimeFilter] = useState("today");

  const stats = [
    {
      title: "Total Signups",
      value: "12,543",
      icon: UserPlus,
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: "Recharges Today",
      value: "₹45,230",
      icon: DollarSign,
      trend: { value: 8.2, isPositive: true },
    },
    {
      title: "Active Users",
      value: "8,234",
      icon: Users,
      trend: { value: 5.3, isPositive: true },
    },
    {
      title: "Net Revenue",
      value: "₹38,500",
      icon: TrendingUp,
      trend: { value: 15.7, isPositive: true },
    },
  ];

  const users = [
    {
      id: "1",
      name: "Rahul Sharma",
      phone: "+91 98765 43210",
      balance: 450,
      lastSeen: "2 hours ago",
    },
    {
      id: "2",
      name: "Priya Patel",
      phone: "+91 98765 43211",
      balance: 125,
      status: "blocked" as const,
      lastSeen: "1 day ago",
    },
  ];

  const approvals = [
    {
      id: "1",
      creatorName: "Sarah Johnson",
      type: "kyc" as const,
      status: "pending" as const,
      details: "Updated Aadhar & PAN documents",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      creatorName: "Rahul Verma",
      type: "profile" as const,
      status: "approved" as const,
      details: "Profile picture changed",
      timestamp: "1 day ago",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32" data-testid="select-time-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">
              User Management
            </TabsTrigger>
            <TabsTrigger value="approvals" data-testid="tab-approvals">
              Approvals
            </TabsTrigger>
            <TabsTrigger value="finance" data-testid="tab-finance">
              Finance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="border rounded-xl overflow-hidden">
              <div className="p-4 bg-card border-b">
                <h3 className="font-semibold">All Users</h3>
              </div>
              {users.map((user) => (
                <UserListItem
                  key={user.id}
                  {...user}
                  onChat={() => console.log("Chat with", user.name)}
                  onBlock={() => console.log("Block", user.name)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="approvals">
            <div className="border rounded-xl overflow-hidden">
              <div className="p-4 bg-card border-b">
                <h3 className="font-semibold">Pending Approvals</h3>
              </div>
              {approvals.map((approval) => (
                <ApprovalItem
                  key={approval.id}
                  {...approval}
                  onApprove={() => console.log("Approved", approval.creatorName)}
                  onReject={() => console.log("Rejected", approval.creatorName)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="finance">
            <div className="border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Financial Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-secondary rounded-lg">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-semibold">₹1,23,450</span>
                </div>
                <div className="flex justify-between p-4 bg-secondary rounded-lg">
                  <span className="text-muted-foreground">Total Expenses</span>
                  <span className="font-semibold">₹45,230</span>
                </div>
                <div className="flex justify-between p-4 bg-primary/10 rounded-lg">
                  <span className="font-semibold">Net Profit</span>
                  <span className="font-bold text-primary">₹78,220</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
