import type { DisplayASTNode, ExpressionNode, ProgramNode, StatementNode } from './ast';
import { Lexer } from './lexer';
import { Parser } from './parser';

export interface CompilerLog {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface AnalyzeResult {
  tokens: Array<{ type: string; value: string; line: number }>;
  astTree: DisplayASTNode | null;
  logs: CompilerLog[];
}

function expressionLabel(node: ExpressionNode): string {
  if (node.kind === 'Identifier') return node.value;
  if (node.kind === 'IntegerLiteral') return String(node.value);
  if (node.kind === 'StringLiteral') return `"${node.value}"`;
  if (node.kind === 'PrefixExpression') return `Prefix: ${node.operator}`;
  if (node.kind === 'InfixExpression') return `Binary: ${node.operator}`;
  return 'CallExpression';
}

function mapExpression(node: ExpressionNode): DisplayASTNode {
  if (node.kind === 'Identifier') {
    return { type: 'Identifier', label: node.value };
  }
  if (node.kind === 'IntegerLiteral') {
    return { type: 'Literal', label: String(node.value) };
  }
  if (node.kind === 'StringLiteral') {
    return { type: 'Literal', label: `"${node.value}"` };
  }
  if (node.kind === 'PrefixExpression') {
    return {
      type: 'Expression',
      label: `PrefixExpression: ${node.operator}`,
      children: [mapExpression(node.right)],
    };
  }
  if (node.kind === 'InfixExpression') {
    return {
      type: 'Expression',
      label: `InfixExpression: ${node.operator}`,
      children: [mapExpression(node.left), mapExpression(node.right)],
    };
  }
  return {
    type: 'Expression',
    label: 'CallExpression',
    children: [mapExpression(node.function), ...node.args.map(mapExpression)],
  };
}

function mapStatement(node: StatementNode): DisplayASTNode {
  switch (node.kind) {
    case 'LetStatement':
      return {
        type: 'Statement',
        label: `Let: ${node.mutable ? 'mut ' : ''}${node.name.value}${node.typeName ? `: ${node.typeName}` : ''}`,
        children: node.value ? [mapExpression(node.value)] : [],
      };
    case 'ReturnStatement':
      return {
        type: 'Statement',
        label: 'ReturnStatement',
        children: node.value ? [mapExpression(node.value)] : [],
      };
    case 'ExpressionStatement':
      return {
        type: 'Statement',
        label: `ExpressionStatement: ${expressionLabel(node.expression)}`,
        children: [mapExpression(node.expression)],
      };
    case 'AssignmentStatement':
      return {
        type: 'Statement',
        label: `Assignment: ${node.target.value}`,
        children: [mapExpression(node.value)],
      };
    case 'BlockStatement':
      return {
        type: 'Statement',
        label: 'BlockStatement',
        children: node.statements.map(mapStatement),
      };
    case 'FunctionDeclaration':
      return {
        type: 'Statement',
        label: `FunctionDeclaration: ${node.name.value}`,
        children: [
          ...node.params.map((param) => ({
            type: 'Identifier' as const,
            label: `${param.mutable ? 'mut ' : ''}${param.name}${param.typeName ? `: ${param.typeName}` : ''}`,
          })),
          mapStatement(node.body),
        ],
      };
    case 'IfStatement': {
      const children: DisplayASTNode[] = [
        {
          type: 'Expression',
          label: 'Condition',
          children: [mapExpression(node.condition)],
        },
        mapStatement(node.consequence),
      ];
      if (node.alternative) {
        children.push(mapStatement(node.alternative));
      }
      return { type: 'Statement', label: 'IfStatement', children };
    }
    case 'WhileStatement':
      return {
        type: 'Statement',
        label: 'WhileStatement',
        children: [mapExpression(node.condition), mapStatement(node.body)],
      };
    case 'ForStatement':
      return {
        type: 'Statement',
        label: `ForStatement: ${node.mutable ? 'mut ' : ''}${node.variable.value}`,
        children: [mapExpression(node.iterator), mapStatement(node.body)],
      };
    case 'LoopStatement':
      return { type: 'Statement', label: 'LoopStatement', children: [mapStatement(node.body)] };
    case 'BreakStatement':
      return { type: 'Statement', label: 'BreakStatement' };
    case 'ContinueStatement':
      return { type: 'Statement', label: 'ContinueStatement' };
    default:
      return { type: 'Statement', label: 'UnknownStatement' };
  }
}

function mapProgram(program: ProgramNode): DisplayASTNode {
  return {
    type: 'Program',
    label: 'Program',
    children: program.statements.map(mapStatement),
  };
}

export function analyzeSource(source: string): AnalyzeResult {
  const lexLogs: CompilerLog[] = [{ type: 'info', message: 'Starting compilation...' }];
  const lexer = new Lexer(source);
  const lexicalTokens: Array<{ type: string; value: string; line: number }> = [];

  while (true) {
    const tok = lexer.nextToken();
    if (tok.type !== 'EOF') {
      lexicalTokens.push({ type: tok.type, value: tok.literal, line: tok.line });
    }
    if (tok.type === 'ILLEGAL') {
      lexLogs.push({
        type: 'error',
        message: `Lexical error at L${tok.line}: illegal token '${tok.literal}'`,
      });
    }
    if (tok.type === 'EOF') break;
  }

  if (lexLogs.some((log) => log.type === 'error')) {
    return {
      tokens: lexicalTokens,
      astTree: null,
      logs: [...lexLogs, { type: 'error', message: 'Compilation failed in lexical analysis.' }],
    };
  }

  const parser = new Parser(new Lexer(source));
  const program = parser.parseProgram();

  if (parser.errors.length > 0) {
    return {
      tokens: lexicalTokens,
      astTree: null,
      logs: [
        ...lexLogs,
        { type: 'success', message: 'Lexical analysis completed' },
        ...parser.errors.map((message) => ({ type: 'error' as const, message })),
        { type: 'error', message: 'Compilation failed in syntax analysis.' },
      ],
    };
  }

  return {
    tokens: lexicalTokens,
    astTree: mapProgram(program),
    logs: [
      ...lexLogs,
      { type: 'success', message: 'Lexical analysis completed' },
      { type: 'success', message: 'Syntax analysis completed' },
      { type: 'success', message: 'AST generation completed' },
      { type: 'warning', message: 'Intermediate code generation backend is not connected yet' },
      { type: 'warning', message: 'Target code generation backend is not connected yet' },
      { type: 'success', message: 'Compilation completed' },
    ],
  };
}
