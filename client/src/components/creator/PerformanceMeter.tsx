import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface PerformanceMeterProps {
  score: number; // A score from 0 to 100
  metrics: {
    avgCallDuration: number; // in seconds
    userRetention: number; // percentage
    callAcceptanceRate: number; // percentage
  };
}

const getScoreColor = (score: number) => {
  if (score < 40) return "bg-red-500";
  if (score < 75) return "bg-yellow-500";
  return "bg-green-500";
};

export function PerformanceMeter({ score, metrics }: PerformanceMeterProps) {
  const scoreColor = getScoreColor(score);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance Meter</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Your score is based on call duration, user retention, and call acceptance rate. Higher scores unlock more visibility and rewards.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>Your current performance score based on recent activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">{score.toFixed(1)}</div>
          <div className="flex-1">
            <Progress value={score} className="h-3" indicatorClassName={scoreColor} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
          <div>
            <p className="font-semibold">{(metrics.avgCallDuration / 60).toFixed(1)} min</p>
            <p className="text-muted-foreground">Avg. Call</p>
          </div>
          <div>
            <p className="font-semibold">{metrics.userRetention.toFixed(1)}%</p>
            <p className="text-muted-foreground">Retention</p>
          </div>
          <div>
            <p className="font-semibold">{metrics.callAcceptanceRate.toFixed(1)}%</p>
            <p className="text-muted-foreground">Acceptance</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
