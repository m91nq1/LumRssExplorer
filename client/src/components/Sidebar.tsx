import { SourceWithCount, TOPICS, REGIONS } from "@shared/schema";
import { SearchBox } from "./SearchBox";
import { TimeFilter } from "./TimeFilter";
import { SourceFilter } from "./SourceFilter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Save, ChevronDown, Zap, Globe, Tag, Newspaper, Settings } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

type TimeFilterValue = "24h" | "7d" | "all";

interface SidebarProps {
  sources: SourceWithCount[];
  selectedSources: string[];
  selectedTopics: string[];
  selectedRegions: string[];
  searchQuery: string;
  timeFilter: TimeFilterValue;
  mostPolarised: boolean;
  onSourceToggle: (sourceId: string) => void;
  onTopicToggle: (topic: string) => void;
  onRegionToggle: (region: string) => void;
  onSearchChange: (query: string) => void;
  onTimeFilterChange: (value: TimeFilterValue) => void;
  onMostPolarisedChange: (value: boolean) => void;
  onClearFilters: () => void;
  onSavePreferences?: () => void;
  isLoadingSources: boolean;
  hasActiveFilters: boolean;
  isSavingPreferences?: boolean;
}

export function Sidebar({
  sources,
  selectedSources,
  selectedTopics,
  selectedRegions,
  searchQuery,
  timeFilter,
  mostPolarised,
  onSourceToggle,
  onTopicToggle,
  onRegionToggle,
  onSearchChange,
  onTimeFilterChange,
  onMostPolarisedChange,
  onClearFilters,
  onSavePreferences,
  isLoadingSources,
  hasActiveFilters,
  isSavingPreferences,
}: SidebarProps) {
  const [topicsOpen, setTopicsOpen] = useState(true);
  const [regionsOpen, setRegionsOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  return (
    <aside
      className="w-[280px] border-r border-border bg-sidebar dark:bg-black/90 flex-shrink-0"
      data-testid="sidebar"
    >
      <ScrollArea className="h-full">
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <SearchBox value={searchQuery} onChange={onSearchChange} />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Most Polarised
              </h3>
              <Switch
                checked={mostPolarised}
                onCheckedChange={onMostPolarisedChange}
                data-testid="switch-most-polarised"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Show articles sorted by engagement and controversy
            </p>
          </div>

          <Separator />

          <Collapsible open={topicsOpen} onOpenChange={setTopicsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Topics
                {selectedTopics.length > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {selectedTopics.length}
                  </span>
                )}
              </h3>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${topicsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="space-y-2">
                {TOPICS.map((topic) => (
                  <div
                    key={topic}
                    className="flex items-center space-x-2"
                    data-testid={`filter-topic-${topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    <Checkbox
                      id={`topic-${topic}`}
                      checked={selectedTopics.includes(topic)}
                      onCheckedChange={() => onTopicToggle(topic)}
                    />
                    <label
                      htmlFor={`topic-${topic}`}
                      className="text-sm cursor-pointer flex-1 leading-tight"
                    >
                      {topic}
                    </label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <Collapsible open={regionsOpen} onOpenChange={setRegionsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                Regions
                {selectedRegions.length > 0 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded-full">
                    {selectedRegions.length}
                  </span>
                )}
              </h3>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${regionsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="space-y-2">
                {REGIONS.map((region) => (
                  <div
                    key={region}
                    className="flex items-center space-x-2"
                    data-testid={`filter-region-${region.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    <Checkbox
                      id={`region-${region}`}
                      checked={selectedRegions.includes(region)}
                      onCheckedChange={() => onRegionToggle(region)}
                    />
                    <label
                      htmlFor={`region-${region}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {region}
                    </label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-blue-500" />
                Sources
                {selectedSources.length > 0 && (
                  <span className="text-xs bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded-full">
                    {selectedSources.length}
                  </span>
                )}
              </h3>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${sourcesOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <SourceFilter
                sources={sources}
                selectedSources={selectedSources}
                onSourceToggle={onSourceToggle}
                isLoading={isLoadingSources}
              />
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Time Period</h3>
            </div>
            <TimeFilter value={timeFilter} onChange={onTimeFilterChange} />
          </div>

          {hasActiveFilters && (
            <>
              <Separator />
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="w-full"
                data-testid="button-clear-filters"
              >
                Clear all filters
              </Button>
            </>
          )}

          {onSavePreferences && (
            <>
              <Separator />
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSavePreferences}
                  disabled={isSavingPreferences}
                  className="w-full"
                  data-testid="button-save-preferences"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingPreferences ? "Saving..." : "Save as Default Filters"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Save your current filter settings as defaults.
                </p>
              </div>
            </>
          )}

          <Separator />

          <Link href="/settings">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              data-testid="link-settings"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings & Digests
            </Button>
          </Link>
        </div>
      </ScrollArea>
    </aside>
  );
}
