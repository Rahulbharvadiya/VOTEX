import React, { useState } from 'react';
import { Send, Upload, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';
import { Task } from '../types/api';

interface TaskComposerFormProps {
  onTaskCreated: (task: Task) => void;
}

export const TaskComposerForm: React.FC<TaskComposerFormProps> = ({ onTaskCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxSteps, setMaxSteps] = useState(30);
  const [maxCostInr, setMaxCostInr] = useState(20.0);
  const [maxSeconds, setMaxSeconds] = useState(300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    if (files.length + incoming.length > 5) {
      setError('You can upload a maximum of 5 files.');
      return;
    }
    setFiles((prev) => [...prev, ...incoming]);
    setError(null);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length < 5) {
      setError('Task prompt must be at least 5 characters long.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('prompt', prompt.trim());
    formData.append('max_steps', String(maxSteps));
    formData.append('max_cost_inr', String(maxCostInr));
    formData.append('max_seconds', String(maxSeconds));

    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const task = await api.tasks.create(formData);
      onTaskCreated(task);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit task. Please check your inputs.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
      <div>
        <label htmlFor="task-prompt" className="block text-sm font-semibold text-slate-800 mb-1.5">
          Plain-English Task Instruction
        </label>
        <textarea
          id="task-prompt"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Transcribe this speech audio, translate it into Tamil, and produce synthesized audio summary."
          maxLength={2000}
          className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
        />
        <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
          <span>Supported: 22+ Indian Languages + English</span>
          <span>{prompt.length} / 2000</span>
        </div>
      </div>

      {/* File Upload Drop Area */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
          Input Media or Documents (Optional)
        </label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-indigo-400 transition cursor-pointer relative">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".wav,.mp3,.m4a,.ogg,.flac,.pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="mx-auto h-7 w-7 text-slate-400 mb-1" />
          <p className="text-xs text-slate-600 font-medium">
            Click or drag & drop files here (Max 5 files, 50MB each)
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            WAV, MP3, FLAC, M4A, PDF, PNG, JPG, TXT, MD
          </p>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {files.map((file, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md"
              >
                <span className="truncate max-w-xs font-medium text-slate-700">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Advanced Budget Controls Toggle */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          <span>{showAdvanced ? 'Hide' : 'Customize'} Budget Hard Caps</span>
          {showAdvanced ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-50 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Max Steps (1..30)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={maxSteps}
                onChange={(e) => setMaxSteps(Number(e.target.value))}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Max Cost INR (₹0.50..₹20)</label>
              <input
                type="number"
                step="0.5"
                min={0.5}
                max={20}
                value={maxCostInr}
                onChange={(e) => setMaxCostInr(Number(e.target.value))}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Timeout Seconds (15..300s)</label>
              <input
                type="number"
                min={15}
                max={300}
                value={maxSeconds}
                onChange={(e) => setMaxSeconds(Number(e.target.value))}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-md shadow-sm transition disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        <span>{isSubmitting ? 'Submitting & Sandboxing...' : 'Run Task'}</span>
      </button>
    </form>
  );
};
