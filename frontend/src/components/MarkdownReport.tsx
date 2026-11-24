import React from 'react';
import { FileText, Copy, Check } from 'lucide-react';

interface MarkdownReportProps {
  content: string;
}

export const MarkdownReport: React.FC<MarkdownReportProps> = ({ content }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          <span>Execution Report Summary</span>
        </h3>
        <button
          onClick={handleCopy}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Markdown</span>
            </>
          )}
        </button>
      </div>

      <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
        {content}
      </div>
    </div>
  );
};
