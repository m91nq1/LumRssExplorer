import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Search articles..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-9"
        data-testid="input-search"
      />
    </div>
  );
}
