import React, { useEffect, useState } from 'react';
import { useTaskStream } from '../hooks/useTaskStream';
import { BudgetMeter } from '../components/BudgetMeter';
import { StepTimeline } from '../components/StepTimeline';
import { MarkdownReport } from '../components/MarkdownReport';
import { ArtifactList } from '../components/ArtifactList';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import { Task } from '../types/api';
import { ArrowLeft, RefreshCw, Volume2 } from 'lucide-react';

interface TaskDetailPageProps {
  taskId: string;
  onBack: () => void;
}

export const TaskDetailPage: React.FC<TaskDetailPageProps> = ({ taskId, onBack }) => {
  const [initialTask, setInitialTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTask = () => {
    api.tasks
      .get(taskId)
      .then((t) => setInitialTask(t))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const { task, steps, isConnected } = useTaskStream(initialTask);

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading task details...</div>;
  }

  if (!task) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-rose-600 font-medium text-sm">Task not found or access denied.</p>
        <button
          onClick={onBack}
          className="text-xs text-indigo-600 hover:underline font-semibold"
        >
          &larr; Back to Workspace
        </button>
      </div>
    );
  }

  const audioArtifact = task.artifacts?.find((a) => a.kind === 'audio');

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workspace</span>
        </button>

        <div className="flex items-center space-x-3">
          {isConnected && (
            <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live SSE Stream</span>
            </span>
          )}
          <button
            onClick={fetchTask}
            title="Refresh"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded border border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Task Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <StatusBadge status={task.status} />
            <span className="text-xs text-slate-400 font-mono">ID: {task.id}</span>
          </div>
          <span className="text-xs text-slate-500">
            {task.created_at ? new Date(task.created_at).toLocaleString() : ''}
          </span>
        </div>

        <p className="text-base font-semibold text-slate-900 leading-snug">
          {task.prompt}
        </p>

        {task.error_message && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs">
            {task.error_message}
          </div>
        )}
      </div>

      {/* Live Budget Meter */}
      <BudgetMeter
        stepsUsed={task.steps_used}
        maxSteps={task.max_steps}
        costInr={task.cost_inr}
        maxCostInr={task.max_cost_inr}
        elapsedSeconds={task.elapsed_seconds}
        maxSeconds={task.max_seconds}
      />

      {/* Inline Audio Player if speech output generated */}
      {audioArtifact && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-emerald-600" />
            <span>Audio Deliverable Preview ({audioArtifact.display_name})</span>
          </h3>
          <audio
            controls
            className="w-full"
            src={`/api/v1/tasks/${task.id}/artifacts/${audioArtifact.id}`}
          />
        </div>
      )}

      {/* Report Markdown (on finish) */}
      {task.report_markdown && (
        <MarkdownReport content={task.report_markdown} />
      )}

      {/* Output Deliverables & Artifacts */}
      {task.artifacts && task.artifacts.length > 0 && (
        <ArtifactList taskId={task.id} artifacts={task.artifacts} />
      )}

      {/* Step Timeline */}
      <StepTimeline steps={steps} />
    </div>
  );
};
