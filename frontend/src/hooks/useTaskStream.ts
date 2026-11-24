import { useEffect, useRef, useState } from 'react';
import { Task, TaskStep } from '../types/api';

export function useTaskStream(initialTask: Task | null) {
  const [task, setTask] = useState<Task | null>(initialTask);
  const [steps, setSteps] = useState<TaskStep[]>(initialTask?.steps || []);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!initialTask) return;
    setTask(initialTask);
    setSteps(initialTask.steps || []);

    // Only stream if task is currently active
    if (initialTask.status !== 'queued' && initialTask.status !== 'running') {
      return;
    }

    const es = new EventSource(`/api/v1/tasks/${initialTask.id}/events`, {
      withCredentials: true,
    });
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    es.addEventListener('task_started', () => {
      setTask((prev) => (prev ? { ...prev, status: 'running' } : null));
    });

    es.addEventListener('step_started', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const data = payload.data || {};
        const newStep: TaskStep = {
          id: payload.event_id || Date.now(),
          seq: data.seq,
          tool_label: data.tool,
          status: 'started',
          summary: data.summary,
          cost_inr: 0,
          duration_ms: 0,
          cached: false,
        };
        setSteps((prev) => {
          const idx = prev.findIndex((s) => s.seq === data.seq);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...newStep };
            return updated;
          }
          return [...prev, newStep];
        });
      } catch (err) {
        console.error('Error parsing step_started event', err);
      }
    });

    es.addEventListener('step_completed', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const data = payload.data || {};
        setSteps((prev) => {
          const idx = prev.findIndex((s) => s.seq === data.seq);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              status: data.ok ? 'completed' : 'failed',
              summary: data.summary,
              cost_inr: data.cost_inr,
              duration_ms: data.duration_ms,
              cached: data.cached,
            };
            return updated;
          }
          return prev;
        });
      } catch (err) {
        console.error('Error parsing step_completed event', err);
      }
    });

    es.addEventListener('budget_update', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const data = payload.data || {};
        setTask((prev) =>
          prev
            ? {
                ...prev,
                steps_used: data.steps_used ?? prev.steps_used,
                cost_inr: data.cost_inr ?? prev.cost_inr,
                elapsed_seconds: data.elapsed_seconds ?? prev.elapsed_seconds,
              }
            : null
        );
      } catch (err) {
        console.error('Error parsing budget_update event', err);
      }
    });

    es.addEventListener('task_finished', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const data = payload.data || {};
        setTask((prev) =>
          prev
            ? {
                ...prev,
                status: data.status || 'completed',
                elapsed_seconds: data.elapsed_seconds ?? prev.elapsed_seconds,
                report_markdown: data.summary || prev.report_markdown,
              }
            : null
        );
        es.close();
        setIsConnected(false);
      } catch (err) {
        console.error('Error parsing task_finished event', err);
      }
    });

    es.addEventListener('task_failed', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const data = payload.data || {};
        setTask((prev) =>
          prev
            ? {
                ...prev,
                status: 'failed',
                error_message: data.error || 'Execution failed',
              }
            : null
        );
        es.close();
        setIsConnected(false);
      } catch (err) {
        console.error('Error parsing task_failed event', err);
      }
    });

    es.onerror = () => {
      setIsConnected(false);
      // Fallback/close on fatal error
      es.close();
    };

    return () => {
      es.close();
    };
  }, [initialTask?.id]);

  return { task, steps, isConnected, error };
}
