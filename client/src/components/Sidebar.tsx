import { SourceWithCount } from "@shared/schema";
import { SearchBox } from "./SearchBox";
import { TimeFilter } from "./TimeFilter";
import { SourceFilter } from "./SourceFilter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type TimeFilterValue = "24h" | "7d" | "all";

interface SidebarProps {
  sources: SourceWithCount[];
  selectedSources: string[];
  searchQuery: string;
  timeFilter: TimeFilterValue;
  onSourceToggle: (sourceId: string) => void;
  onSearchChange: (query: string) => void;
  onTimeFilterChange: (value: TimeFilterValue) => void;
  onClearFilters: () => void;
  isLoadingSources: boolean;
  hasActiveFilters: boolean;
}

export function Sidebar({
  sources,
  selectedSources,
  searchQuery,
  timeFilter,
  onSourceToggle,
  onSearchChange,
  onTimeFilterChange,
  onClearFilters,
  isLoadingSources,
  hasActiveFilters,
}: SidebarProps) {
  return (
    <aside
      className="w-[280px] border-r border-border bg-sidebar flex-shrink-0"
      data-testid="sidebar"
    >
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <SearchBox value={searchQuery} onChange={onSearchChange} />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Time Period</h3>
            </div>
            <TimeFilter value={timeFilter} onChange={onTimeFilterChange} />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Sources</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-auto py-1 px-2 text-xs"
                  data-testid="button-clear-filters"
                >
                  Clear all
                </Button>
              )}
            </div>
            <SourceFilter
              sources={sources}
              selectedSources={selectedSources}
              onSourceToggle={onSourceToggle}
              isLoading={isLoadingSources}
            />
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
