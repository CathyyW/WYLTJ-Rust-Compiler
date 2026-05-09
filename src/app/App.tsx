import { useState } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { ConsoleOutput } from './components/ConsoleOutput';
import { AnalysisTabs } from './components/AnalysisTabs';
import { ControlBar } from './components/ControlBar';

const SAMPLE_CODE = `fn main() {
    let x = 5;
    let y = 10;
    let sum = x + y;
    println!("Sum: {}", sum);
}`;

const SAMPLE_AST = {
  type: 'Program' as const,
  label: 'main.rs',
  children: [
    {
      type: 'Statement' as const,
      label: 'FunctionDeclaration: main',
      children: [
        {
          type: 'Statement' as const,
          label: 'VariableDeclaration: x',
          children: [
            { type: 'Literal' as const, label: '5' },
          ],
        },
        {
          type: 'Statement' as const,
          label: 'VariableDeclaration: y',
          children: [
            { type: 'Literal' as const, label: '10' },
          ],
        },
        {
          type: 'Statement' as const,
          label: 'VariableDeclaration: sum',
          children: [
            {
              type: 'Expression' as const,
              label: 'BinaryExpression: +',
              children: [
                { type: 'Identifier' as const, label: 'x' },
                { type: 'Identifier' as const, label: 'y' },
              ],
            },
          ],
        },
        {
          type: 'Statement' as const,
          label: 'MacroCall: println!',
          children: [
            { type: 'Literal' as const, label: '"Sum: {}"' },
            { type: 'Identifier' as const, label: 'sum' },
          ],
        },
      ],
    },
  ],
};

const SAMPLE_TOKENS = [
  { type: 'KEYWORD', value: 'fn', line: 1 },
  { type: 'IDENTIFIER', value: 'main', line: 1 },
  { type: 'LPAREN', value: '(', line: 1 },
  { type: 'RPAREN', value: ')', line: 1 },
  { type: 'LBRACE', value: '{', line: 1 },
  { type: 'KEYWORD', value: 'let', line: 2 },
  { type: 'IDENTIFIER', value: 'x', line: 2 },
  { type: 'ASSIGN', value: '=', line: 2 },
  { type: 'INTEGER', value: '5', line: 2 },
  { type: 'SEMICOLON', value: ';', line: 2 },
  { type: 'KEYWORD', value: 'let', line: 3 },
  { type: 'IDENTIFIER', value: 'y', line: 3 },
  { type: 'ASSIGN', value: '=', line: 3 },
  { type: 'INTEGER', value: '10', line: 3 },
  { type: 'SEMICOLON', value: ';', line: 3 },
  { type: 'KEYWORD', value: 'let', line: 4 },
  { type: 'IDENTIFIER', value: 'sum', line: 4 },
  { type: 'ASSIGN', value: '=', line: 4 },
  { type: 'IDENTIFIER', value: 'x', line: 4 },
  { type: 'OPERATOR', value: '+', line: 4 },
  { type: 'IDENTIFIER', value: 'y', line: 4 },
  { type: 'SEMICOLON', value: ';', line: 4 },
];

const SAMPLE_IR = `%1 = alloc i32
%2 = alloc i32
%3 = alloc i32
store i32 5, ptr %1
store i32 10, ptr %2
%4 = load i32, ptr %1
%5 = load i32, ptr %2
%6 = add i32 %4, %5
store i32 %6, ptr %3
%7 = load i32, ptr %3
call void @print_int(i32 %7)`;

const SAMPLE_TARGET = `main:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 16
    mov     DWORD PTR [rbp-4], 5
    mov     DWORD PTR [rbp-8], 10
    mov     eax, DWORD PTR [rbp-4]
    add     eax, DWORD PTR [rbp-8]
    mov     DWORD PTR [rbp-12], eax
    mov     edi, DWORD PTR [rbp-12]
    call    print_int
    add     rsp, 16
    pop     rbp
    ret`;

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

    setTimeout(() => {
      setLogs([
        { type: 'info', message: 'Starting compilation...' },
        { type: 'success', message: 'Lexical analysis completed' },
        { type: 'success', message: 'Syntax analysis completed' },
        { type: 'success', message: 'AST generation completed' },
        { type: 'success', message: 'Intermediate code generation completed' },
        { type: 'success', message: 'Target code generation completed' },
        { type: 'success', message: 'Compilation successful!' },
      ]);
      setAstTree(SAMPLE_AST);
      setLexicalTokens(SAMPLE_TOKENS);
      setIntermediateCode(SAMPLE_IR);
      setTargetCode(SAMPLE_TARGET);
      setIsCompiling(false);
    }, 1500);
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