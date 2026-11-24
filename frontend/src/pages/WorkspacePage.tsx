import React, { useEffect, useState } from 'react';
import { TaskComposerForm } from '../components/TaskComposerForm';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import { Task } from '../types/api';
import { Clock, IndianRupee } from 'lucide-react';

interface WorkspacePageProps {
  onSelectTask: (taskId: string) => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onSelectTask }) => {
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecent = () => {
    api.tasks
      .list(1, 5)
      .then((res) => setRecentTasks(res.tasks))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecent();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left 2 Cols: Task Composer */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Run Indic Language Task</h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit multi-step transcription, translation, voice synthesis, or document OCR pipelines.
          </p>
        </div>
        <TaskComposerForm onTaskCreated={(task) => onSelectTask(task.id)} />
      </div>

      {/* Right Col: Recent Runs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Tasks</h2>
          <p className="text-xs text-slate-500 mt-1">Your latest 5 submitted jobs.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm divide-y divide-slate-100">
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading tasks...</div>
          ) : recentTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No tasks created yet.</div>
          ) : (
            recentTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTask(t.id)}
                className="py-3 cursor-pointer group hover:bg-slate-50 -mx-4 px-4 transition"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <StatusBadge status={t.status} />
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</span>
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition">
                  {t.prompt}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                  <span>{t.steps_used} steps</span>
                  <span className="flex items-center text-slate-700 font-semibold">
                    <IndianRupee className="h-3 w-3" />
                    <span>{t.cost_inr.toFixed(2)}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
