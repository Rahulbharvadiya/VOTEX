import React from 'react';
import { TaskArtifact } from '../types/api';
import { Download, FileText, Music, FileCode, Paperclip } from 'lucide-react';

interface ArtifactListProps {
  taskId: string;
  artifacts: TaskArtifact[];
}

export const ArtifactList: React.FC<ArtifactListProps> = ({ taskId, artifacts }) => {
  if (artifacts.length === 0) return null;

  const getIcon = (kind: string) => {
    switch (kind) {
      case 'audio':
        return <Music className="h-4 w-4 text-emerald-600" />;
      case 'report_md':
      case 'text':
        return <FileText className="h-4 w-4 text-indigo-600" />;
      case 'report_json':
      case 'trace_jsonl':
        return <FileCode className="h-4 w-4 text-blue-600" />;
      default:
        return <Paperclip className="h-4 w-4 text-slate-600" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
        Generated Output Deliverables
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {artifacts.map((art) => {
          const downloadUrl = `/api/v1/tasks/${taskId}/artifacts/${art.id}`;
          return (
            <div
              key={art.id}
              className="flex items-center justify-between p-3 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-2.5 truncate mr-2">
                {getIcon(art.kind)}
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {art.display_name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    {formatSize(art.size_bytes)}
                  </p>
                </div>
              </div>

              <a
                href={downloadUrl}
                download={art.display_name}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
