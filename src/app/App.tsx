import { useState } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { ConsoleOutput } from './components/ConsoleOutput';
import { AnalysisTabs } from './components/AnalysisTabs';
import { ControlBar } from './components/ControlBar';
import { analyzeSource } from './compiler/analyzer';

const SAMPLE_CODE = `fn main() {
    let x = 5;
    let y = 10;
    let sum = x + y;
    println!("Sum: {}", sum);
}`;

const IR_PLACEHOLDER = '# IR backend not connected yet.';
const TARGET_PLACEHOLDER = '# Target backend not connected yet.';

export default function App() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [isCompiling, setIsCompiling] = useState(false);
  const [logs, setLogs] = useState<Array<{ type: 'info' | 'success' | 'warning' | 'error'; message: string }>>([]);
  const [astTree, setAstTree] = useState<any>(null);
  const [lexicalTokens, setLexicalTokens] = useState<Array<{ type: string; value: string; line: number }>>([]);
  const [intermediateCode, setIntermediateCode] = useState('');
  const [targetCode, setTargetCode] = useState('');

  const handleCompile = async () => {
    setIsCompiling(true);
    setLogs([{ type: 'info', message: 'Starting compilation...' }]);
    try {
      const result = analyzeSource(code);
      setLogs(result.logs);
      setAstTree(result.astTree);
      setLexicalTokens(result.tokens);
      setIntermediateCode(IR_PLACEHOLDER);
      setTargetCode(TARGET_PLACEHOLDER);
    } catch (error) {
      setAstTree(null);
      setLexicalTokens([]);
      setIntermediateCode(IR_PLACEHOLDER);
      setTargetCode(TARGET_PLACEHOLDER);
      setLogs([
        { type: 'info', message: 'Starting compilation...' },
        {
          type: 'error',
          message: `Unexpected compiler error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ]);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleLoadFile = () => {
    setLogs([...logs, { type: 'info', message: 'File loading functionality would open file dialog' }]);
  };

  const handleSaveFile = () => {
    setLogs([...logs, { type: 'success', message: 'File saved successfully' }]);
  };

  return (
    <div className="h-screen w-screen bg-[#1A1B1E] flex flex-col overflow-hidden dark">
      {/* Control Bar */}
      <ControlBar
        onLoadFile={handleLoadFile}
        onSaveFile={handleSaveFile}
        onCompile={handleCompile}
        isCompiling={isCompiling}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Panel: Code Editor + Console */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Code Editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor code={code} onChange={setCode} />
          </div>

          {/* Console Output */}
          <ConsoleOutput logs={logs} />
        </div>

        {/* Right Panel: Analysis Tabs */}
        <div className="w-[600px] min-h-0">
          <AnalysisTabs
            astTree={astTree}
            lexicalTokens={lexicalTokens}
            intermediateCode={intermediateCode}
            targetCode={targetCode}
          />
        </div>
      </div>
    </div>
  );
}