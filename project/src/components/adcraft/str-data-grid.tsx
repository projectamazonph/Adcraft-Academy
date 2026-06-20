'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Pause,
  XCircle,
  Ban,
  Sliders,
  Clock,
  Trophy,
  CheckCircle2,
  Send,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useStrTriageStore } from '@/stores/str-triage-store';
import type { SearchTermEntry, StrAction } from '@/engine';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Action config
// ---------------------------------------------------------------------------

interface ActionConfig {
  key: StrAction;
  label: string;
  icon: typeof TrendingUp;
  btnClass: string;
  activeClass: string;
}

const ACTION_CONFIGS: ActionConfig[] = [
  {
    key: 'keep',
    label: 'Keep',
    icon: TrendingUp,
    btnClass:
      'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20',
    activeClass:
      'bg-emerald-500/25 border-2 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
  },
  {
    key: 'pause',
    label: 'Pause',
    icon: Pause,
    btnClass:
      'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20',
    activeClass:
      'bg-amber-500/25 border-2 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
  },
  {
    key: 'negate-exact',
    label: 'Negate Exact',
    icon: XCircle,
    btnClass:
      'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20',
    activeClass:
      'bg-rose-500/25 border-2 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
  },
  {
    key: 'negate-phrase',
    label: 'Negate Phrase',
    icon: Ban,
    btnClass:
      'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20',
    activeClass:
      'bg-rose-500/25 border-2 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
  },
  {
    key: 'optimize-bid',
    label: 'Optimize Bid',
    icon: Sliders,
    btnClass:
      'bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20',
    activeClass:
      'bg-sky-500/25 border-2 border-sky-500/50 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.2)]',
  },
];

// ---------------------------------------------------------------------------
// Metric color helpers
// ---------------------------------------------------------------------------

function acosColor(acos: number, target: number): string {
  if (!isFinite(acos)) return 'text-rose-400';
  if (acos <= target) return 'text-emerald-400';
  if (acos <= target * 2) return 'text-amber-400';
  return 'text-rose-400';
}

function roasColor(roas: number, minimum: number): string {
  if (roas === 0 && !isFinite(roas)) return 'text-rose-400';
  if (roas >= minimum) return 'text-emerald-400';
  if (roas >= minimum * 0.5) return 'text-amber-400';
  return 'text-rose-400';
}

function formatAcos(v: number): string {
  if (!isFinite(v)) return '∞';
  return `${(v * 100).toFixed(1)}%`;
}

function formatRoas(v: number): string {
  if (!isFinite(v)) return '∞';
  return `${v.toFixed(2)}x`;
}

function formatCtr(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function formatCurrency(v: number): string {
  return `$${v.toFixed(2)}`;
}

function formatNumber(v: number): string {
  return v.toLocaleString();
}

// ---------------------------------------------------------------------------
// Row action cell
// ---------------------------------------------------------------------------

function RowActions({ row }: { row: SearchTermEntry }) {
  const { userActions, setAction, thresholds } = useStrTriageStore();
  const currentAction = userActions[row.id]?.action ?? null;
  const [bidValue, setBidValue] = useState<string>(
    userActions[row.id]?.newBid?.toFixed(2) ?? (row.cpc * 0.6).toFixed(2)
  );
  const [negKw, setNegKw] = useState<string>(
    userActions[row.id]?.negativeKeyword ?? row.searchTerm
  );

  const handleAction = useCallback(
    (action: StrAction) => {
      if (action === 'optimize-bid') {
        const bid = parseFloat(bidValue);
        if (isNaN(bid) || bid <= 0) return;
        setAction(row.id, action, bid);
      } else if (action === 'negate-exact' || action === 'negate-phrase') {
        setAction(row.id, action, undefined, negKw || row.searchTerm);
      } else {
        setAction(row.id, action);
      }
    },
    [bidValue, negKw, row.id, row.searchTerm, setAction]
  );

  const showBidInput = currentAction === 'optimize-bid';
  const showNegInput =
    currentAction === 'negate-exact' || currentAction === 'negate-phrase';

  return (
    <div className="space-y-2 min-w-0">
      {/* Action buttons row */}
      <div className="flex flex-wrap gap-1.5">
        {ACTION_CONFIGS.map((cfg) => {
          const Icon = cfg.icon;
          const isActive = currentAction === cfg.key;
          return (
            <button
              key={cfg.key}
              type="button"
              onClick={() => handleAction(cfg.key)}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-200 whitespace-nowrap',
                isActive ? cfg.activeClass : cfg.btnClass
              )}
            >
              <Icon className="h-3 w-3" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Bid input */}
      <AnimatePresence>
        {showBidInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                New Bid:
              </span>
              <div className="relative w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  step="0.05"
                  min="0.01"
                  value={bidValue}
                  onChange={(e) => {
                    setBidValue(e.target.value);
                  }}
                  onBlur={() => handleAction('optimize-bid')}
                  className="h-7 text-xs pl-5 pr-1 py-0"
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                Max: {formatCurrency(row.cpc * row.sales / (row.spend || 1) * thresholds.acosTarget)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Negative keyword input */}
      <AnimatePresence>
        {showNegInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                Neg KW:
              </span>
              <Input
                type="text"
                value={negKw}
                onChange={(e) => setNegKw(e.target.value)}
                onBlur={() => handleAction(currentAction as StrAction)}
                className="h-7 text-xs px-2 py-0 w-48"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main data grid
// ---------------------------------------------------------------------------

export function StrDataGrid() {
  const {
    searchTerms,
    userActions,
    previewScore,
    elapsedTime,
    thresholds,
    submitDecisions,
    tick,
  } = useStrTriageStore();

  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tick]);

  const triagedCount = Object.keys(userActions).length;
  const totalTerms = searchTerms.length;
  const allTriaged = triagedCount === totalTerms;

  // Format elapsed time
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Columns
  const columns = useMemo<ColumnDef<SearchTermEntry>[]>(
    () => [
      {
        accessorKey: 'searchTerm',
        header: 'Search Term',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="text-sm font-bold truncate max-w-[200px] lg:max-w-[260px]">
              {row.original.searchTerm}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge
                variant="outline"
                className={cn(
                  'text-[9px] px-1.5 py-0 h-4',
                  row.original.matchType === 'exact'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : row.original.matchType === 'phrase'
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                    : 'bg-muted text-muted-foreground border-border'
                )}
              >
                {row.original.matchType}
              </Badge>
              <span className="text-[10px] text-muted-foreground truncate">
                → {row.original.keyword}
              </span>
            </div>
          </div>
        ),
        size: 240,
      },
      {
        accessorKey: 'impressions',
        header: 'Impr.',
        cell: ({ getValue }) => (
          <span className="text-xs font-mono">{formatNumber(getValue() as number)}</span>
        ),
        size: 70,
      },
      {
        accessorKey: 'clicks',
        header: 'Clicks',
        cell: ({ getValue }) => (
          <span className="text-xs font-mono">{formatNumber(getValue() as number)}</span>
        ),
        size: 60,
      },
      {
        accessorKey: 'ctr',
        header: 'CTR',
        cell: ({ getValue }) => (
          <span className="text-xs font-mono">{formatCtr(getValue() as number)}</span>
        ),
        size: 60,
      },
      {
        accessorKey: 'spend',
        header: 'Spend',
        cell: ({ getValue }) => (
          <span className="text-xs font-mono">{formatCurrency(getValue() as number)}</span>
        ),
        size: 70,
      },
      {
        accessorKey: 'cpc',
        header: 'CPC',
        cell: ({ getValue }) => (
          <span className="text-xs font-mono">{formatCurrency(getValue() as number)}</span>
        ),
        size: 60,
      },
      {
        accessorKey: 'orders',
        header: 'Orders',
        cell: ({ getValue }) => (
          <span className="text-xs font-mono">{getValue() as number}</span>
        ),
        size: 50,
      },
      {
        accessorKey: 'sales',
        header: 'Sales',
        cell: ({ getValue }) => (
          <span className="text-xs font-mono">{formatCurrency(getValue() as number)}</span>
        ),
        size: 70,
      },
      {
        accessorKey: 'acos',
        header: 'ACoS',
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <span className={cn('text-xs font-mono font-semibold', acosColor(val, thresholds.acosTarget))}>
              {formatAcos(val)}
            </span>
          );
        },
        size: 65,
      },
      {
        accessorKey: 'roas',
        header: 'ROAS',
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <span className={cn('text-xs font-mono font-semibold', roasColor(val, thresholds.roasMinimum))}>
              {formatRoas(val)}
            </span>
          );
        },
        size: 65,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => <RowActions row={row.original} />,
        size: 300,
      },
    ],
    [thresholds.acosTarget, thresholds.roasMinimum]
  );

  const table = useReactTable({
    data: searchTerms,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Top bar: stats + timer + score */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="font-mono">
                {triagedCount}/{totalTerms}
              </span>
              <span className="text-muted-foreground text-xs">triaged</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="font-mono">{timeStr}</span>
            </div>
          </div>
          <Progress
            value={(triagedCount / totalTerms) * 100}
            className="h-1.5 mt-2 max-w-xs"
          />
        </div>

        {/* Preview score */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <Trophy className="h-4 w-4 text-rose-400" />
          <span className="text-xs text-muted-foreground">Preview</span>
          <span className="text-lg font-bold font-mono text-rose-400">
            {previewScore}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      {/* Data table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-muted/40 border-b border-border"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, idx) => {
                const isActioned = !!userActions[row.original.id];
                return (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className={cn(
                      'border-b border-border transition-colors',
                      isActioned
                        ? 'bg-emerald-500/3'
                        : 'hover:bg-muted/20'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2.5 whitespace-nowrap align-top"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          className={cn(
            'gap-2 font-semibold',
            allTriaged
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
          disabled={!allTriaged}
          onClick={submitDecisions}
        >
          <Send className="h-4 w-4" />
          Submit Decisions
          {!allTriaged && (
            <span className="text-xs opacity-70">
              ({totalTerms - triagedCount} remaining)
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
