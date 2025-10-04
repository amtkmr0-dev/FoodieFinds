import { StatsCard } from "../StatsCard";
import { Users, DollarSign } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatsCard
        title="Total Users"
        value="12,543"
        icon={Users}
        trend={{ value: 12.5, isPositive: true }}
      />
      <StatsCard
        title="Revenue Today"
        value="₹45,230"
        icon={DollarSign}
        description="INR"
        trend={{ value: 8.2, isPositive: true }}
      />
    </div>
  );
}
