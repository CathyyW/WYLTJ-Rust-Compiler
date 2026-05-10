import type { DisplayASTNode, ExpressionNode, FunctionParameter, ProgramNode, StatementNode } from './ast';
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

function makeNode(type: DisplayASTNode['type'], label: string, children?: DisplayASTNode[]): DisplayASTNode {
  const node: DisplayASTNode = { type, label };
  if (children !== undefined) {
    node.children = children;
  }
  return node;
}

function mapParameter(param: FunctionParameter): DisplayASTNode {
  return makeNode('Parameter', 'Parameter', [
    makeNode('Attribute', param.mutable ? 'mut' : 'immutable'),
    makeNode('Identifier', param.name),
    makeNode('Type', param.typeName ?? '(none)'),
  ]);
}

function mapExpression(node: ExpressionNode): DisplayASTNode {
  if (node.kind === 'Identifier') {
    return makeNode('Identifier', node.value);
  }
  if (node.kind === 'IntegerLiteral') {
    return makeNode('Literal', String(node.value));
  }
  if (node.kind === 'PrefixExpression') {
    return makeNode('Expression', 'PrefixExpression', [
      makeNode('Operator', node.operator),
      mapExpression(node.right),
    ]);
  }
  if (node.kind === 'InfixExpression') {
    return makeNode('Expression', 'InfixExpression', [
      makeNode('Operator', node.operator),
      mapExpression(node.left),
      mapExpression(node.right),
    ]);
  }
  if (node.kind === 'RangeExpression') {
    return makeNode('Expression', 'RangeExpression', [
      makeNode('Operator', node.inclusive ? '..=' : '..'),
      makeNode('Expression', 'Start', [mapExpression(node.start)]),
      makeNode('Expression', 'End', [mapExpression(node.end)]),
    ]);
  }
  const argsNode = makeNode(
    'List',
    node.args.length > 0 ? 'Arguments' : 'Arguments (empty)',
    node.args.map(mapExpression),
  );
  return makeNode('Expression', 'CallExpression', [
    makeNode('Expression', 'Callee', [mapExpression(node.function)]),
    argsNode,
  ]);
}

function mapStatement(node: StatementNode): DisplayASTNode {
  switch (node.kind) {
    case 'LetStatement':
      return makeNode('Statement', 'LetStatement', [
        makeNode('Attribute', node.mutable ? 'mut' : 'immutable'),
        makeNode('Identifier', node.name.value),
        makeNode('Type', node.typeName ?? '(none)'),
        makeNode(
          'Expression',
          node.value ? 'Initializer' : 'Initializer (none)',
          node.value ? [mapExpression(node.value)] : [],
        ),
      ]);
    case 'ReturnStatement':
      return makeNode('Statement', 'ReturnStatement', [
        makeNode(
          'Expression',
          node.value ? 'ReturnValue' : 'ReturnValue (none)',
          node.value ? [mapExpression(node.value)] : [],
        ),
      ]);
    case 'ExpressionStatement':
      return makeNode('Statement', 'ExpressionStatement', [mapExpression(node.expression)]);
    case 'AssignmentStatement':
      return makeNode('Statement', 'AssignmentStatement', [
        makeNode('Expression', 'Target', [makeNode('Identifier', node.target.value)]),
        makeNode('Expression', 'Value', [mapExpression(node.value)]),
      ]);
    case 'BlockStatement':
      return makeNode('Statement', 'BlockStatement', node.statements.map(mapStatement));
    case 'FunctionDeclaration':
      return makeNode('Statement', 'FunctionDeclaration', [
        makeNode('Identifier', node.name.value),
        makeNode(
          'List',
          node.params.length > 0 ? 'Parameters' : 'Parameters (empty)',
          node.params.map(mapParameter),
        ),
        makeNode('Statement', 'ReturnType', [makeNode('Type', node.returnType ?? '(none)')]),
        mapStatement(node.body),
      ]);
    case 'IfStatement': {
      const children: DisplayASTNode[] = [
        makeNode('Expression', 'Condition', [mapExpression(node.condition)]),
        makeNode('Statement', 'Consequence', [mapStatement(node.consequence)]),
      ];
      if (node.alternative) {
        children.push(makeNode('Statement', 'Alternative', [mapStatement(node.alternative)]));
      } else {
        children.push(makeNode('Statement', 'Alternative (none)', []));
      }
      return makeNode('Statement', 'IfStatement', children);
    }
    case 'WhileStatement':
      return makeNode('Statement', 'WhileStatement', [
        makeNode('Expression', 'Condition', [mapExpression(node.condition)]),
        makeNode('Statement', 'Body', [mapStatement(node.body)]),
      ]);
    case 'ForStatement':
      return makeNode('Statement', 'ForStatement', [
        makeNode('Statement', 'VariableDeclaration', [
          makeNode('Attribute', node.mutable ? 'mut' : 'immutable'),
          makeNode('Identifier', node.variable.value),
          makeNode('Type', node.typeName ?? '(none)'),
        ]),
        makeNode('Expression', 'Iterator', [mapExpression(node.iterator)]),
        makeNode('Statement', 'Body', [mapStatement(node.body)]),
      ]);
    case 'LoopStatement':
      return makeNode('Statement', 'LoopStatement', [makeNode('Statement', 'Body', [mapStatement(node.body)])]);
    case 'BreakStatement':
      return makeNode('Statement', 'BreakStatement', []);
    case 'ContinueStatement':
      return makeNode('Statement', 'ContinueStatement', []);
    default:
      return makeNode('Statement', 'UnknownStatement', []);
  }
}

function mapProgram(program: ProgramNode): DisplayASTNode {
  return makeNode('Program', 'Program', program.statements.map(mapStatement));
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
