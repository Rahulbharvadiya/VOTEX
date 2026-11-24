import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Task } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { Trash2 } from 'lucide-react';

interface HistoryPageProps {
  onSelectTask: (taskId: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectTask }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTasks = () => {
    setLoading(true);
    api.tasks
      .list(page, 15, statusFilter || undefined)
      .then((res) => {
        setTasks(res.tasks);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, [page, statusFilter]);

  const handleDelete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task and purge its workspace files?')) {
      return;
    }
    setDeletingId(taskId);
    try {
      await api.tasks.delete(taskId);
      loadTasks();
    } catch (err: any) {
      alert(err?.message || 'Could not delete task.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Task History</h2>
          <p className="text-xs text-slate-500 mt-1">Review all your submitted automation runs and costs.</p>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-medium text-slate-600">Filter status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="queued">Queued</option>
            <option value="halted_budget">Halted (Budget)</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading history...</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No tasks found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Task Prompt</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Steps</th>
                  <th className="px-6 py-3">Cost</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {tasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTask(t.id)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 max-w-xs truncate font-semibold text-slate-900">
                      {t.prompt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      {t.steps_used} / {t.max_steps}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      ₹{t.cost_inr.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-500">
                      {Math.round(t.elapsed_seconds)}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => handleDelete(e, t.id)}
                        disabled={deletingId === t.id}
                        title="Delete task"
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > 15 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Showing {tasks.length} of {total} tasks</span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page * 15 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
