import { Button } from "@/components/ui/button";

type TimeRange = "1D" | "7D" | "1M" | "3M" | "All";

interface TimeRangeTabsProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const ranges: TimeRange[] = ["1D", "7D", "1M", "3M", "All"];

export function TimeRangeTabs({ value, onChange }: TimeRangeTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 bg-card border border-card-border rounded-md p-1">
      {ranges.map((range) => (
        <Button
          key={range}
          variant={value === range ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(range)}
          className="h-7 px-3 text-xs font-medium"
          data-testid={`button-range-${range.toLowerCase()}`}
        >
          {range}
        </Button>
      ))}
    </div>
  );
}
