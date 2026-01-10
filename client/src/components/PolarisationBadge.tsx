import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  AlertTriangle, 
  Flame, 
  TrendingUp, 
  Zap,
  Target,
  MessageSquareWarning,
  Megaphone,
  Landmark,
  GitFork,
  MessageCircle,
  Globe
} from "lucide-react";
import type { PolarisationReasonType } from "@shared/schema";

interface PolarisationBadgeProps {
  score: number | null | undefined;
  reasons: PolarisationReasonType[] | null | undefined;
  showScore?: boolean;
  compact?: boolean;
}

function getScoreLevel(score: number): { label: string; color: string; icon: typeof Flame } {
  if (score >= 70) {
    return { label: "High", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: Flame };
  } else if (score >= 50) {
    return { label: "Moderate", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: TrendingUp };
  } else if (score >= 30) {
    return { label: "Low", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Zap };
  }
  return { label: "Minimal", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: AlertTriangle };
}

function getTypeIcon(type: PolarisationReasonType["type"]) {
  const iconClass = "w-3.5 h-3.5 shrink-0";
  switch (type) {
    case "topic": return <Target className={iconClass} />;
    case "controversy": return <MessageSquareWarning className={iconClass} />;
    case "sensationalism": return <Megaphone className={iconClass} />;
    case "entity": return <Landmark className={iconClass} />;
    case "framing": return <GitFork className={iconClass} />;
    case "sentiment": return <MessageCircle className={iconClass} />;
    case "diversity": return <Globe className={iconClass} />;
    default: return <AlertTriangle className={iconClass} />;
  }
}

export function PolarisationBadge({ score, reasons, showScore = true, compact = false }: PolarisationBadgeProps) {
  if (!score || score < 25) return null;
  
  const { label, color, icon: Icon } = getScoreLevel(score);
  const hasReasons = reasons && reasons.length > 0;
  
  if (compact) {
    return (
      <Badge 
        variant="outline" 
        className={`text-[10px] gap-1 px-1.5 py-0.5 ${color}`}
        data-testid="badge-polarisation-compact"
      >
        <Icon className="w-2.5 h-2.5" />
        {score}
      </Badge>
    );
  }
  
  const badgeContent = (
    <Badge 
      variant="outline" 
      className={`text-xs gap-1.5 cursor-help ${color}`}
      data-testid="badge-polarisation"
    >
      <Icon className="w-3 h-3" />
      {showScore && <span>{score}</span>}
      <span className="hidden sm:inline">{label}</span>
    </Badge>
  );
  
  if (!hasReasons) {
    return badgeContent;
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        {badgeContent}
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-3 dark:bg-[#1a1a1f] dark:border-[#3a3a3f]" 
        align="start"
        data-testid="popover-polarisation-reasons"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold dark:text-white">Why this is polarised</h4>
            <span className="text-xs font-mono bg-muted/30 px-2 py-0.5 rounded dark:bg-white/10">
              Score: {score}
            </span>
          </div>
          <div className="space-y-2">
            {reasons.slice(0, 5).map((reason, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2 text-xs"
                data-testid={`polarisation-reason-${idx}`}
              >
                <span className="text-muted-foreground mt-0.5">{getTypeIcon(reason.type)}</span>
                <span className="text-muted-foreground dark:text-white/70 flex-1">
                  {reason.label}
                </span>
                <span className="text-green-500 dark:text-green-400 font-mono shrink-0">
                  +{reason.points}
                </span>
              </div>
            ))}
          </div>
          {reasons.length > 5 && (
            <p className="text-xs text-muted-foreground dark:text-white/50">
              ...and {reasons.length - 5} more factors
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PolarisationPanel({ score, reasons }: { score: number | null | undefined; reasons: PolarisationReasonType[] | null | undefined }) {
  if (!score || !reasons || reasons.length === 0) return null;
  
  const { label, color } = getScoreLevel(score);
  
  return (
    <div 
      className="p-4 rounded-lg border dark:border-[#3a3a3f] dark:bg-[#1a1a1f]/50 space-y-3"
      data-testid="panel-polarisation"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold dark:text-white flex items-center gap-2">
          <Flame className="w-4 h-4" />
          Controversy Analysis
        </h4>
        <Badge variant="outline" className={`text-xs ${color}`}>
          {label} ({score}/100)
        </Badge>
      </div>
      <div className="space-y-2">
        {reasons.map((reason, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{getTypeIcon(reason.type)}</span>
              <span className="text-muted-foreground dark:text-white/70">{reason.label}</span>
            </div>
            <span className="text-green-500 dark:text-green-400 font-mono text-xs">
              +{reason.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
