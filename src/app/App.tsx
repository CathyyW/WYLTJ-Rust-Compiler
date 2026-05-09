import { useRef, useState, type ChangeEvent } from 'react';
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
  type LogEntry = { type: 'info' | 'success' | 'warning' | 'error'; message: string };
  const browserWindow = window as Window & {
    showOpenFilePicker?: (options?: unknown) => Promise<Array<{ getFile: () => Promise<File> }>>;
    showSaveFilePicker?: (options?: unknown) => Promise<{
      createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
    }>;
  };

  const [code, setCode] = useState(SAMPLE_CODE);
  const [isCompiling, setIsCompiling] = useState(false);
  const [logs, setLogs] = useState<Array<LogEntry>>([]);
  const [astTree, setAstTree] = useState<any>(null);
  const [lexicalTokens, setLexicalTokens] = useState<Array<{ type: string; value: string; line: number }>>([]);
  const [intermediateCode, setIntermediateCode] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appendLog = (entry: LogEntry) => {
    setLogs((prevLogs) => [...prevLogs, entry]);
  };

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

  const handleLoadFile = async () => {
    try {
      if (browserWindow.showOpenFilePicker) {
        const [fileHandle] = await browserWindow.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: 'Rust and text files',
              accept: {
                'text/plain': ['.rs', '.txt'],
              },
            },
          ],
        });

        if (!fileHandle) {
          return;
        }

        const file = await fileHandle.getFile();
        const fileContent = await file.text();
        setCode(fileContent);
        appendLog({ type: 'success', message: `Loaded file: ${file.name}` });
        return;
      }

      fileInputRef.current?.click();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        appendLog({ type: 'info', message: 'Load file cancelled.' });
        return;
      }

      appendLog({
        type: 'error',
        message: `Failed to load file: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const handleSaveFile = async () => {
    try {
      if (browserWindow.showSaveFilePicker) {
        const fileHandle = await browserWindow.showSaveFilePicker({
          suggestedName: 'source.rs',
          types: [
            {
              description: 'Rust source',
              accept: {
                'text/plain': ['.rs', '.txt'],
              },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(code);
        await writable.close();
        appendLog({ type: 'success', message: 'File saved successfully.' });
        return;
      }

      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'source.rs';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      appendLog({ type: 'success', message: 'File downloaded as source.rs.' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        appendLog({ type: 'info', message: 'Save file cancelled.' });
        return;
      }

      appendLog({
        type: 'error',
        message: `Failed to save file: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const handleFallbackFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      appendLog({ type: 'info', message: 'No file selected.' });
      return;
    }

    try {
      const content = await selectedFile.text();
      setCode(content);
      appendLog({ type: 'success', message: `Loaded file: ${selectedFile.name}` });
    } catch (error) {
      appendLog({
        type: 'error',
        message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      event.target.value = '';
    }
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".rs,.txt,text/plain"
        onChange={handleFallbackFileSelected}
        className="hidden"
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