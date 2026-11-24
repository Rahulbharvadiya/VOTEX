import React from 'react';
import { ShieldCheck, IndianRupee, Clock, Zap } from 'lucide-react';

interface BudgetMeterProps {
  stepsUsed: number;
  maxSteps: number;
  costInr: number;
  maxCostInr: number;
  elapsedSeconds: number;
  maxSeconds: number;
}

export const BudgetMeter: React.FC<BudgetMeterProps> = ({
  stepsUsed,
  maxSteps,
  costInr,
  maxCostInr,
  elapsedSeconds,
  maxSeconds,
}) => {
  const stepsPct = Math.min(100, Math.round((stepsUsed / maxSteps) * 100));
  const costPct = Math.min(100, Math.round((costInr / maxCostInr) * 100));
  const timePct = Math.min(100, Math.round((elapsedSeconds / maxSeconds) * 100));

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-1.5">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <span>Execution Budget & Cost Controls</span>
        </h3>
        <span className="text-xs text-slate-500 font-mono">Caps Enforced</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Steps Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 font-medium flex items-center space-x-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Steps Used</span>
            </span>
            <span className="font-semibold text-slate-800">
              {stepsUsed} / {maxSteps}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                stepsPct > 80 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${stepsPct}%` }}
            />
          </div>
        </div>

        {/* Cost INR Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 font-medium flex items-center space-x-1">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
              <span>Accrued Cost</span>
            </span>
            <span className="font-semibold text-slate-800">
              ₹{costInr.toFixed(2)} / ₹{maxCostInr.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                costPct > 80 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${costPct}%` }}
            />
          </div>
        </div>

        {/* Elapsed Seconds Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 font-medium flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <span>Elapsed Time</span>
            </span>
            <span className="font-semibold text-slate-800">
              {Math.round(elapsedSeconds)}s / {maxSeconds}s
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                timePct > 80 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${timePct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
