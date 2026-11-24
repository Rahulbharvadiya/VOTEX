import React from 'react';
import { TaskStep } from '../types/api';
import { CheckCircle2, CircleDashed, XCircle, Database } from 'lucide-react';

interface StepTimelineProps {
  steps: TaskStep[];
}

export const StepTimeline: React.FC<StepTimelineProps> = ({ steps }) => {
  if (steps.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500 text-sm">
        Waiting for agent plan and step execution...
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
        Sequential Step Execution
      </h3>

      <div className="flow-root" aria-live="polite">
        <ul className="-mb-8">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            return (
              <li key={step.seq}>
                <div className="relative pb-8">
                  {!isLast && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3 items-start">
                    <div>
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 bg-white" />
                      ) : step.status === 'failed' ? (
                        <XCircle className="h-8 w-8 text-rose-500 bg-white" />
                      ) : (
                        <CircleDashed className="h-8 w-8 text-blue-500 animate-spin bg-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-slate-900">
                            {step.tool_label}
                          </span>
                          {step.cached && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              <Database className="h-3 w-3 text-indigo-500" />
                              <span>Cached</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{step.summary}</p>
                      </div>
                      <div className="text-right whitespace-nowrap text-xs text-slate-500 font-mono">
                        {step.cost_inr > 0 && <span>₹{step.cost_inr.toFixed(2)} · </span>}
                        <span>{step.duration_ms}ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
