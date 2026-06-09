import type { ValueType } from './typeSystem';

export interface DisplayASTNode {
  type: 'Program' | 'Statement' | 'Expression' | 'Literal' | 'Identifier' | 'Type' | 'Attribute' | 'Parameter' | 'Operator' | 'List';
  label: string;
  children?: DisplayASTNode[];
}

export interface TypeAnnotation {
  text: string;
  type: ValueType;
}

export interface ProgramNode {
  kind: 'Program';
  statements: FunctionDeclaration[];
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
  typeAnnotation?: TypeAnnotation;
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
  tailExpression?: ExpressionNode;
}

export interface FunctionParameter {
  name: string;
  mutable: boolean;
  typeAnnotation: TypeAnnotation;
}

export interface FunctionDeclaration {
  kind: 'FunctionDeclaration';
  name: IdentifierExpression;
  params: FunctionParameter[];
  returnType?: TypeAnnotation;
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
  typeAnnotation?: TypeAnnotation;
  iterator: ExpressionNode;
  body: BlockStatement;
}

export interface LoopStatement {
  kind: 'LoopStatement';
  body: BlockStatement;
}

export interface BreakStatement {
  kind: 'BreakStatement';
  value?: ExpressionNode;
}

export interface ContinueStatement {
  kind: 'ContinueStatement';
}

export interface AssignmentStatement {
  kind: 'AssignmentStatement';
  target: ExpressionNode;
  value: ExpressionNode;
}

export type ExpressionNode =
  | IdentifierExpression
  | IntegerLiteral
  | FloatLiteral
  | PrefixExpression
  | InfixExpression
  | CallExpression
  | RangeExpression
  | ReferenceExpression
  | DereferenceExpression
  | IndexExpression
  | MemberExpression
  | ArrayLiteral
  | TupleLiteral
  | BlockExpression
  | IfExpression
  | LoopExpression;

export interface IdentifierExpression {
  kind: 'Identifier';
  value: string;
}

export interface IntegerLiteral {
  kind: 'IntegerLiteral';
  value: number;
}

export interface FloatLiteral {
  kind: 'FloatLiteral';
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

export interface ReferenceExpression {
  kind: 'ReferenceExpression';
  mutable: boolean;
  target: ExpressionNode;
}

export interface DereferenceExpression {
  kind: 'DereferenceExpression';
  target: ExpressionNode;
}

export interface IndexExpression {
  kind: 'IndexExpression';
  target: ExpressionNode;
  index: ExpressionNode;
}

export interface MemberExpression {
  kind: 'MemberExpression';
  target: ExpressionNode;
  member: string;
}

export interface ArrayLiteral {
  kind: 'ArrayLiteral';
  elements: ExpressionNode[];
}

export interface TupleLiteral {
  kind: 'TupleLiteral';
  elements: ExpressionNode[];
}

export interface BlockExpression {
  kind: 'BlockExpression';
  block: BlockStatement;
}

export interface IfExpression {
  kind: 'IfExpression';
  condition: ExpressionNode;
  consequence: BlockStatement;
  alternative: BlockStatement;
}

export interface LoopExpression {
  kind: 'LoopExpression';
  body: BlockStatement;
}
