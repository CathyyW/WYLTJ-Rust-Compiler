export interface DisplayASTNode {
  type: 'Program' | 'Statement' | 'Expression' | 'Literal' | 'Identifier';
  label: string;
  children?: DisplayASTNode[];
}

export interface ProgramNode {
  kind: 'Program';
  statements: StatementNode[];
}

export type StatementNode =
  | LetStatement
  | ReturnStatement
  | ExpressionStatement
  | BlockStatement
  | FunctionDeclaration
  | IfStatement
  | WhileStatement
  | ForStatement
  | LoopStatement
  | BreakStatement
  | ContinueStatement
  | AssignmentStatement;

export interface LetStatement {
  kind: 'LetStatement';
  name: IdentifierExpression;
  mutable: boolean;
  typeName?: string;
  value?: ExpressionNode;
}

export interface ReturnStatement {
  kind: 'ReturnStatement';
  value?: ExpressionNode;
}

export interface ExpressionStatement {
  kind: 'ExpressionStatement';
  expression: ExpressionNode;
}

export interface BlockStatement {
  kind: 'BlockStatement';
  statements: StatementNode[];
}

export interface FunctionParameter {
  name: string;
  mutable: boolean;
  typeName?: string;
}

export interface FunctionDeclaration {
  kind: 'FunctionDeclaration';
  name: IdentifierExpression;
  params: FunctionParameter[];
  returnType?: string;
  body: BlockStatement;
}

export interface IfStatement {
  kind: 'IfStatement';
  condition: ExpressionNode;
  consequence: BlockStatement;
  alternative?: BlockStatement | IfStatement;
}

export interface WhileStatement {
  kind: 'WhileStatement';
  condition: ExpressionNode;
  body: BlockStatement;
}

export interface ForStatement {
  kind: 'ForStatement';
  variable: IdentifierExpression;
  mutable: boolean;
  typeName?: string;
  iterator: ExpressionNode;
  body: BlockStatement;
}

export interface LoopStatement {
  kind: 'LoopStatement';
  body: BlockStatement;
}

export interface BreakStatement {
  kind: 'BreakStatement';
}

export interface ContinueStatement {
  kind: 'ContinueStatement';
}

export interface AssignmentStatement {
  kind: 'AssignmentStatement';
  target: IdentifierExpression;
  value: ExpressionNode;
}

export type ExpressionNode =
  | IdentifierExpression
  | IntegerLiteral
  | PrefixExpression
  | InfixExpression
  | CallExpression
  | RangeExpression;

export interface IdentifierExpression {
  kind: 'Identifier';
  value: string;
}

export interface IntegerLiteral {
  kind: 'IntegerLiteral';
  value: number;
}

export interface PrefixExpression {
  kind: 'PrefixExpression';
  operator: string;
  right: ExpressionNode;
}

export interface InfixExpression {
  kind: 'InfixExpression';
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface CallExpression {
  kind: 'CallExpression';
  function: ExpressionNode;
  args: ExpressionNode[];
}

export interface RangeExpression {
  kind: 'RangeExpression';
  start: ExpressionNode;
  end: ExpressionNode;
  inclusive: boolean;
}
