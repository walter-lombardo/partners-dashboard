import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface KpiCardProps {
  title: string;
  value: string;
  btcEquivalent?: string;
  testId?: string;
  timeRange?: "1D" | "7D" | "1M" | "3M" | "All";
  onTimeRangeChange?: (range: "1D" | "7D" | "1M" | "3M" | "All") => void;
  isLoading?: boolean;
}

export function KpiCard({ 
  title, 
  value, 
  btcEquivalent, 
  testId, 
  timeRange, 
  onTimeRangeChange,
  isLoading 
}: KpiCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  const timeRanges: Array<"1D" | "7D" | "1M" | "3M" | "All"> = ["1D", "7D", "1M", "3M", "All"];

  return (
    <Card className="border-card-border relative">
      {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>}
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-muted-foreground hover-elevate p-1 rounded"
            data-testid={`button-toggle-${testId}`}
          >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold font-tabular tracking-tight" data-testid={`text-${testId}`}>
            {isVisible ? value : "••••••••"}
          </div>
          {btcEquivalent && (
            <div className="text-xs text-muted-foreground font-tabular">
              {isVisible ? btcEquivalent : "~•••• BTC"}
            </div>
          )}
        </div>
        {onTimeRangeChange && timeRange && (
          <div className="flex gap-1 mt-4 flex-wrap">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "bg-card-elevated hover-elevate text-muted-foreground"
                }`}
                data-testid={`button-${testId}-${range.toLowerCase()}`}
              >
                {range}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
