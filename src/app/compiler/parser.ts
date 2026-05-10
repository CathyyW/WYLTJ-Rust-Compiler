import type {
  AssignmentStatement,
  BlockStatement,
  BreakStatement,
  CallExpression,
  ContinueStatement,
  ExpressionNode,
  ExpressionStatement,
  ForStatement,
  FunctionDeclaration,
  FunctionParameter,
  IdentifierExpression,
  IfStatement,
  LetStatement,
  LoopStatement,
  ProgramNode,
  ReturnStatement,
  StatementNode,
  WhileStatement,
} from './ast';
import { Lexer } from './lexer';
import type { Token, TokenType } from './token';

const PRECEDENCE: Record<TokenType, number> = {
  EOF: 0,
  ILLEGAL: 0,
  LET: 0,
  MUT: 0,
  FN: 0,
  RETURN: 0,
  IF: 0,
  ELSE: 0,
  WHILE: 0,
  FOR: 0,
  IN: 0,
  LOOP: 0,
  BREAK: 0,
  CONTINUE: 0,
  I32: 0,
  IDENT: 0,
  INT: 0,
  STRING: 0,
  ASSIGN: 0,
  COMMA: 0,
  COLON: 0,
  SEMICOLON: 0,
  HASH: 0,
  RBRACE: 0,
  RBRACKET: 0,
  RPAREN: 0,
  EQ: 1,
  NOT_EQ: 1,
  LT: 2,
  GT: 2,
  LTE: 2,
  GTE: 2,
  DOTDOT: 3,
  DOTDOT_EQ: 3,
  PLUS: 4,
  MINUS: 4,
  SLASH: 5,
  ASTERISK: 5,
  LPAREN: 7,
  LBRACKET: 8,
  DOT: 9,
  BANG: 0,
  AMPERSAND: 0,
  ARROW: 0,
  LBRACE: 0,
};

export class Parser {
  private readonly lexer: Lexer;
  private currentToken: Token;
  private peekToken: Token;
  public readonly errors: string[] = [];

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.nextToken();
    this.peekToken = this.lexer.nextToken();
  }

  public parseProgram(): ProgramNode {
    const statements: StatementNode[] = [];
    while (!this.currentTokenIs('EOF') && !this.currentTokenIs('HASH')) {
      if (this.currentTokenIs('FN')) {
        const fn = this.parseFunctionDeclaration();
        if (fn) {
          statements.push(fn);
        } else {
          this.nextToken();
        }
        continue;
      }
      this.addError(
        `语法错误 (L${this.currentToken.line} C${this.currentToken.col}): 顶层仅允许函数声明`,
      );
      this.nextToken();
    }
    return { kind: 'Program', statements };
  }

  private parseStatement(): StatementNode | null {
    if (this.currentTokenIs('LET')) return this.parseLetStatement();
    if (this.currentTokenIs('RETURN')) return this.parseReturnStatement();
    if (this.currentTokenIs('IF')) return this.parseIfStatement();
    if (this.currentTokenIs('WHILE')) return this.parseWhileStatement();
    if (this.currentTokenIs('FOR')) return this.parseForStatement();
    if (this.currentTokenIs('LOOP')) return this.parseLoopStatement();
    if (this.currentTokenIs('BREAK')) return this.parseBreakStatement();
    if (this.currentTokenIs('CONTINUE')) return this.parseContinueStatement();
    if (this.currentTokenIs('LBRACE')) return this.parseBlockStatement();
    if (this.currentTokenIs('IDENT') && this.peekTokenIs('ASSIGN')) return this.parseAssignmentStatement();
    if (this.currentTokenIs('SEMICOLON')) {
      this.nextToken();
      return null;
    }
    return this.parseExpressionStatement();
  }

  private parseLetStatement(): LetStatement | null {
    this.nextToken();
    let mutable = false;
    if (this.currentTokenIs('MUT')) {
      mutable = true;
      this.nextToken();
    }
    if (!this.currentTokenIs('IDENT')) {
      this.addError(`语法错误 (L${this.currentToken.line} C${this.currentToken.col}): let 后期望标识符`);
      return null;
    }
    const name: IdentifierExpression = { kind: 'Identifier', value: this.currentToken.literal };

    let typeName: string | undefined;
    this.nextToken();
    if (this.currentTokenIs('COLON')) {
      this.nextToken();
      typeName = this.parseTypeName();
      if (!typeName) return null;
      this.nextToken();
    }

    let value: ExpressionNode | undefined;
    if (this.currentTokenIs('ASSIGN')) {
      this.nextToken();
      value = this.parseExpression(0);
      if (!value) return null;
      this.nextToken();
    }

    if (!this.currentTokenIs('SEMICOLON')) {
      this.addError(`语法错误 (L${this.currentToken.line} C${this.currentToken.col}): let 语句缺少 ';'`);
      return null;
    }
    this.nextToken();
    return { kind: 'LetStatement', name, mutable, typeName, value };
  }

  private parseReturnStatement(): ReturnStatement | null {
    this.nextToken();
    if (this.currentTokenIs('SEMICOLON')) {
      this.nextToken();
      return { kind: 'ReturnStatement' };
    }
    const value = this.parseExpression(0);
    if (!value) return null;
    this.nextToken();
    if (!this.currentTokenIs('SEMICOLON')) {
      this.addError(`语法错误 (L${this.currentToken.line} C${this.currentToken.col}): return 语句缺少 ';'`);
      return null;
    }
    this.nextToken();
    return { kind: 'ReturnStatement', value };
  }

  private parseExpressionStatement(): ExpressionStatement | null {
    const expression = this.parseExpression(0);
    if (!expression) return null;
    this.nextToken();
    if (!this.currentTokenIs('SEMICOLON')) {
      this.addError(`语法错误 (L${this.currentToken.line} C${this.currentToken.col}): 表达式语句缺少 ';'`);
      return null;
    }
    this.nextToken();
    return { kind: 'ExpressionStatement', expression };
  }

  private parseAssignmentStatement(): AssignmentStatement | null {
    const target: IdentifierExpression = { kind: 'Identifier', value: this.currentToken.literal };
    this.nextToken();
    this.nextToken();
    const value = this.parseExpression(0);
    if (!value) return null;
    this.nextToken();
    if (!this.currentTokenIs('SEMICOLON')) {
      this.addError(`语法错误 (L${this.currentToken.line} C${this.currentToken.col}): 赋值语句缺少 ';'`);
      return null;
    }
    this.nextToken();
    return { kind: 'AssignmentStatement', target, value };
  }

  private parseFunctionDeclaration(): FunctionDeclaration | null {
    if (!this.expectPeek('IDENT')) return null;
    const name: IdentifierExpression = { kind: 'Identifier', value: this.currentToken.literal };
    if (!this.expectPeek('LPAREN')) return null;
    const params = this.parseFunctionParameters();
    if (!params) return null;

    let returnType: string | undefined;
    if (this.peekTokenIs('ARROW')) {
      this.nextToken();
      this.nextToken();
      returnType = this.parseTypeName();
      if (!returnType) return null;
    }

    if (!this.expectPeek('LBRACE')) return null;
    const body = this.parseBlockStatement();
    if (!body) return null;
    this.nextToken();

    return { kind: 'FunctionDeclaration', name, params, returnType, body };
  }

  private parseFunctionParameters(): FunctionParameter[] | null {
    const params: FunctionParameter[] = [];
    if (this.peekTokenIs('RPAREN')) {
      this.nextToken();
      return params;
    }
    this.nextToken();
    while (true) {
      let mutable = false;
      if (this.currentTokenIs('MUT')) {
        mutable = true;
        this.nextToken();
      }
      if (!this.currentTokenIs('IDENT')) {
        this.addError(`语法错误 (L${this.currentToken.line} C${this.currentToken.col}): 参数名应为标识符`);
        return null;
      }
      const name = this.currentToken.literal;
      if (!this.expectPeek('COLON')) return null;
      this.nextToken();
      const typeName = this.parseTypeName();
      if (!typeName) return null;
      params.push({ name, mutable, typeName });
      if (this.peekTokenIs('COMMA')) {
        this.nextToken();
        this.nextToken();
        continue;
      }
      if (this.peekTokenIs('RPAREN')) {
        this.nextToken();
        break;
      }
      this.addError(`语法错误 (L${this.peekToken.line} C${this.peekToken.col}): 参数列表期望 ',' 或 ')'`);
      return null;
    }
    return params;
  }

  private parseIfStatement(): IfStatement | null {
    this.nextToken();
    const condition = this.parseExpression(0);
    if (!condition) return null;
    if (!this.peekTokenIs('LBRACE')) {
      this.addError(`语法错误 (L${this.peekToken.line} C${this.peekToken.col}): if 条件后期望 '{'`);
      return null;
    }
    this.nextToken();
    const consequence = this.parseBlockStatement();
    if (!consequence) return null;
    this.nextToken();

    let alternative: BlockStatement | IfStatement | undefined;
    if (this.currentTokenIs('ELSE')) {
      this.nextToken();
      if (this.currentTokenIs('IF')) {
        alternative = this.parseIfStatement() ?? undefined;
      } else if (this.currentTokenIs('LBRACE')) {
        alternative = this.parseBlockStatement() ?? undefined;
        this.nextToken();
      } else {
        this.addError(`语法错误 (L${this.currentToken.line} C${this.currentToken.col}): else 后期望 if 或 '{'`);
        return null;
      }
    }

    return { kind: 'IfStatement', condition, consequence, alternative };
  }

  private parseWhileStatement(): WhileStatement | null {
    this.nextToken();
    const condition = this.parseExpression(0);
    if (!condition) return null;
    if (!this.peekTokenIs('LBRACE')) {
      this.addError(`语法错误 (L${this.peekToken.line} C${this.peekToken.col}): while 条件后期望 '{'`);
      return null;
    }
    this.nextToken();
    const body = this.parseBlockStatement();
    if (!body) return null;
    this.nextToken();
    return { kind: 'WhileStatement', condition, body };
  }

  private parseForStatement(): ForStatement | null {
    this.nextToken();
    let mutable = false;
    if (this.currentTokenIs('MUT')) {
      mutable = true;
      this.nextToken();
    }
    if (!this.currentTokenIs('IDENT')) {
      this.addError(`语法错误 (L${this.currentToken.line} C${this.currentToken.col}): for 后期望变量名`);
      return null;
    }
    const variable: IdentifierExpression = { kind: 'Identifier', value: this.currentToken.literal };
    let typeName: string | undefined;
    if (this.peekTokenIs('COLON')) {
      this.nextToken();
      this.nextToken();
      typeName = this.parseTypeName();
      if (!typeName) return null;
    }
    if (!this.expectPeek('IN')) return null;
    this.nextToken();
    const start = this.parseExpression(0);
    if (!start) return null;
    if (!this.peekTokenIs('DOTDOT') && !this.peekTokenIs('DOTDOT_EQ')) {
      this.addError(`语法错误 (L${this.peekToken.line} C${this.peekToken.col}): for 迭代器期望 '..'`);
      return null;
    }
    this.nextToken();
    const inclusive = this.currentTokenIs('DOTDOT_EQ');
    this.nextToken();
    const end = this.parseExpression(0);
    if (!end) return null;
    const iterator: ExpressionNode = { kind: 'RangeExpression', start, end, inclusive };
    if (!this.peekTokenIs('LBRACE')) {
      this.addError(`语法错误 (L${this.peekToken.line} C${this.peekToken.col}): for 迭代器后期望 '{'`);
      return null;
    }
    this.nextToken();
    const body = this.parseBlockStatement();
    if (!body) return null;
    this.nextToken();
    return { kind: 'ForStatement', variable, mutable, typeName, iterator, body };
  }

  private parseLoopStatement(): LoopStatement | null {
    if (!this.expectPeek('LBRACE')) return null;
    const body = this.parseBlockStatement();
    if (!body) return null;
    this.nextToken();
    return { kind: 'LoopStatement', body };
  }

  private parseBreakStatement(): BreakStatement | null {
    if (!this.expectPeek('SEMICOLON')) return null;
    this.nextToken();
    return { kind: 'BreakStatement' };
  }

  private parseContinueStatement(): ContinueStatement | null {
    if (!this.expectPeek('SEMICOLON')) return null;
    this.nextToken();
    return { kind: 'ContinueStatement' };
  }

  private parseBlockStatement(): BlockStatement | null {
    if (!this.currentTokenIs('LBRACE')) {
      this.addError(`语法错误 (L${this.currentToken.line} C${this.currentToken.col}): 期望 '{'`);
      return null;
    }
    this.nextToken();
    const statements: StatementNode[] = [];
    while (!this.currentTokenIs('RBRACE') && !this.currentTokenIs('EOF')) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      } else {
        this.nextToken();
      }
    }
    if (!this.currentTokenIs('RBRACE')) {
      this.addError(`语法错误 (L${this.currentToken.line} C${this.currentToken.col}): 块缺少 '}'`);
      return null;
    }
    return { kind: 'BlockStatement', statements };
  }

  private parseExpression(precedence: number): ExpressionNode | null {
    const prefix = this.parsePrefix();
    if (!prefix) return null;
    let left = prefix;

    while (
      !this.peekTokenIs('SEMICOLON') &&
      !this.peekTokenIs('RBRACE') &&
      precedence < this.peekPrecedence()
    ) {
      if (!this.isInfixOperator(this.peekToken.type)) {
        break;
      }
      this.nextToken();
      const infix = this.parseInfix(left);
      if (!infix) return null;
      left = infix;
    }

    return left;
  }

  private parsePrefix(): ExpressionNode | null {
    if (this.currentTokenIs('IDENT')) return { kind: 'Identifier', value: this.currentToken.literal };
    if (this.currentTokenIs('INT')) return { kind: 'IntegerLiteral', value: Number(this.currentToken.literal) };
    if (this.currentTokenIs('LPAREN')) {
      this.nextToken();
      const expr = this.parseExpression(0);
      if (!expr) return null;
      if (!this.expectPeek('RPAREN')) return null;
      return expr;
    }

    this.addError(
      `语法错误 (L${this.currentToken.line} C${this.currentToken.col}): 无法解析 token ${this.currentToken.type} ('${this.currentToken.literal}')`,
    );
    return null;
  }

  private parseInfix(left: ExpressionNode): ExpressionNode | null {
    if (this.currentTokenIs('LPAREN')) {
      return this.parseCallExpression(left);
    }
    const operator = this.currentToken.literal;
    const precedence = this.currentPrecedence();
    this.nextToken();
    const right = this.parseExpression(precedence);
    if (!right) return null;
    return { kind: 'InfixExpression', operator, left, right };
  }

  private parseCallExpression(func: ExpressionNode): CallExpression | null {
    const args: ExpressionNode[] = [];
    if (this.peekTokenIs('RPAREN')) {
      this.nextToken();
      return { kind: 'CallExpression', function: func, args };
    }
    this.nextToken();
    const firstArg = this.parseExpression(0);
    if (!firstArg) return null;
    args.push(firstArg);
    while (this.peekTokenIs('COMMA')) {
      this.nextToken();
      this.nextToken();
      const arg = this.parseExpression(0);
      if (!arg) return null;
      args.push(arg);
    }
    if (!this.expectPeek('RPAREN')) return null;
    return { kind: 'CallExpression', function: func, args };
  }

  private parseTypeName(): string | null {
    if (this.currentTokenIs('I32')) return 'i32';
    this.addError(`语法错误 (L${this.currentToken.line} C${this.currentToken.col}): 不支持的类型`);
    return null;
  }

  private isInfixOperator(type: TokenType): boolean {
    return ['PLUS', 'MINUS', 'SLASH', 'ASTERISK', 'EQ', 'NOT_EQ', 'LT', 'GT', 'LTE', 'GTE', 'LPAREN'].includes(type);
  }

  private nextToken() {
    this.currentToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  private expectPeek(type: TokenType): boolean {
    if (this.peekToken.type === type) {
      this.nextToken();
      return true;
    }
    this.addError(`语法错误 (L${this.peekToken.line} C${this.peekToken.col}): 期望 ${type}, 得到 ${this.peekToken.type}`);
    return false;
  }

  private currentTokenIs(type: TokenType): boolean {
    return this.currentToken.type === type;
  }

  private peekTokenIs(type: TokenType): boolean {
    return this.peekToken.type === type;
  }

  private peekPrecedence(): number {
    return PRECEDENCE[this.peekToken.type] ?? 0;
  }

  private currentPrecedence(): number {
    return PRECEDENCE[this.currentToken.type] ?? 0;
  }

  private addError(message: string) {
    this.errors.push(message);
  }
}
