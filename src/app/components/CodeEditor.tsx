import { useState } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  const lines = code.split('\n');

  return (
    <div className="flex h-full bg-[#25262B] rounded-lg overflow-hidden border border-[#363944]">
      {/* Line numbers */}
      <div className="bg-[#1A1B1E] px-3 py-4 select-none">
        <div className="font-mono text-sm text-[#9CA3AF] leading-6">
          {lines.map((_, index) => (
            <div key={index} className="text-right">
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 relative">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full bg-transparent text-[#E8E8E8] font-mono text-sm p-4 leading-6 resize-none focus:outline-none"
          spellCheck={false}
          style={{
            caretColor: '#50FA7B',
            tabSize: 4,
          }}
        />
      </div>
    </div>
  );
}
