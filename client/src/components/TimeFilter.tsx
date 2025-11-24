import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type TimeFilterValue = "24h" | "7d" | "all";

interface TimeFilterProps {
  value: TimeFilterValue;
  onChange: (value: TimeFilterValue) => void;
}

export function TimeFilter({ value, onChange }: TimeFilterProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as TimeFilterValue)}
      data-testid="time-filter"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem
          value="24h"
          id="24h"
          data-testid="radio-24h"
        />
        <Label htmlFor="24h" className="text-sm font-normal cursor-pointer">
          Last 24 hours
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem
          value="7d"
          id="7d"
          data-testid="radio-7d"
        />
        <Label htmlFor="7d" className="text-sm font-normal cursor-pointer">
          Last 7 days
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem
          value="all"
          id="all"
          data-testid="radio-all"
        />
        <Label htmlFor="all" className="text-sm font-normal cursor-pointer">
          All
        </Label>
      </div>
    </RadioGroup>
  );
}
