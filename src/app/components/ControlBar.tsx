import { FileUp, Save, Rocket } from 'lucide-react';

interface ControlBarProps {
  onLoadFile: () => void;
  onSaveFile: () => void;
  onCompile: () => void;
  isCompiling: boolean;
}

export function ControlBar({ onLoadFile, onSaveFile, onCompile, isCompiling }: ControlBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-[#25262B] backdrop-blur-sm border-b border-[#363944]">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#2D5A27] to-[#50FA7B] rounded-lg flex items-center justify-center">
          <span className="text-xl">🦀</span>
        </div>
        <div>
          <h1 className="text-xl text-[#E8E8E8]">WYLTJ-Rust-Compiler</h1>
          <p className="text-xs text-[#9CA3AF]">Lexical → AST → IR → Target</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onLoadFile}
          className="flex items-center gap-2 px-4 py-2 bg-[#363944] text-[#E8E8E8] rounded-lg hover:bg-[#404152] transition-colors"
        >
          <FileUp className="w-4 h-4" />
          <span>Load File</span>
        </button>

        <button
          onClick={onSaveFile}
          className="flex items-center gap-2 px-4 py-2 bg-[#363944] text-[#E8E8E8] rounded-lg hover:bg-[#404152] transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save File</span>
        </button>

        <button
          onClick={onCompile}
          disabled={isCompiling}
          className="flex items-center gap-2 px-6 py-2 bg-[#50FA7B] text-[#1A1B1E] rounded-lg hover:shadow-[0_0_20px_rgba(80,250,123,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Rocket className="w-4 h-4" />
          <span>{isCompiling ? 'Compiling...' : 'Compile'}</span>
        </button>
      </div>
    </div>
  );
}
