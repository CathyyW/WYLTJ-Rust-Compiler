import { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface ConsoleOutputProps {
  logs: Array<{ type: 'info' | 'success' | 'warning' | 'error'; message: string }>;
}

export function ConsoleOutput({ logs }: ConsoleOutputProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-[#1A1B1E] border-t border-[#363944] rounded-b-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-[#25262B] cursor-pointer hover:bg-[#2A2B30] transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#50FA7B]" />
          <span className="text-sm text-[#E8E8E8]">Compilation Output</span>
          <span className="text-xs text-[#9CA3AF] bg-[#363944] px-2 py-0.5 rounded">
            {logs.length} messages
          </span>
        </div>
        {isCollapsed ? (
          <ChevronUp className="w-4 h-4 text-[#9CA3AF]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="h-40 overflow-auto p-4 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-[#9CA3AF] italic">No compilation output yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 flex items-start gap-2">
                <span className={`shrink-0 ${
                  log.type === 'success' ? 'text-[#50FA7B]' :
                  log.type === 'warning' ? 'text-[#FFB86C]' :
                  log.type === 'error' ? 'text-[#FF6B6B]' :
                  'text-[#9CA3AF]'
                }`}>
                  {log.type === 'success' ? '✓' :
                   log.type === 'warning' ? '⚠' :
                   log.type === 'error' ? '✗' : '•'}
                </span>
                <span className={
                  log.type === 'success' ? 'text-[#50FA7B]' :
                  log.type === 'warning' ? 'text-[#FFB86C]' :
                  log.type === 'error' ? 'text-[#FF6B6B]' :
                  'text-[#E8E8E8]'
                }>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
