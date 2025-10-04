import { BalanceDisplay } from "../BalanceDisplay";

export default function BalanceDisplayExample() {
  return (
    <div className="flex gap-4 items-center">
      <BalanceDisplay balance={450} />
      <BalanceDisplay balance={100} />
    </div>
  );
}
