import { SourceWithCount } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SourceFilterProps {
  sources: SourceWithCount[];
  selectedSources: string[];
  onSourceToggle: (sourceId: string) => void;
  isLoading: boolean;
}

export function SourceFilter({
  sources,
  selectedSources,
  onSourceToggle,
  isLoading,
}: SourceFilterProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="source-filter">
      {sources.map((source) => {
        const isChecked = selectedSources.includes(source.id);
        return (
          <div
            key={source.id}
            className="flex items-center gap-3 group"
            data-testid={`filter-source-${source.id}`}
          >
            <Checkbox
              id={source.id}
              checked={isChecked}
              onCheckedChange={() => onSourceToggle(source.id)}
              data-testid={`checkbox-source-${source.id}`}
            />
            <Label
              htmlFor={source.id}
              className="flex-1 text-sm font-normal cursor-pointer"
            >
              {source.name}
            </Label>
            <Badge
              variant="secondary"
              className="text-xs font-medium tabular-nums shrink-0"
              data-testid={`badge-count-${source.id}`}
            >
              {source.articleCount}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
