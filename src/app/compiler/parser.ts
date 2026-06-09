import type {
  AssignmentStatement,
  BlockExpression,
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
  IfExpression,
  IfStatement,
  LetStatement,
  LoopExpression,
  LoopStatement,
  ProgramNode,
  ReturnStatement,
  StatementNode,
  TypeAnnotation,
  WhileStatement,
} from './ast';
import { Lexer } from './lexer';
import type { Token, TokenType } from './token';
import { I32_TYPE, UNIT_TYPE, typeToString, type ValueType } from './typeSystem';

const PRECEDENCE: Partial<Record<TokenType, number>> = {
  DOTDOT: 1,
  DOTDOT_EQ: 1,
  EQ: 2,
  NOT_EQ: 2,
  LT: 2,
  LTE: 2,
  GT: 2,
  GTE: 2,
  PLUS: 3,
  MINUS: 3,
  ASTERISK: 4,
  SLASH: 4,
  LPAREN: 7,
  LBRACKET: 8,
  DOT: 9,
};

const PREFIX_PRECEDENCE = 6;

export class Parser {
  private readonly tokens: Token[] = [];
  private position = 0;
  public readonly errors: string[] = [];

  constructor(lexer: Lexer) {
    while (true) {
      const token = lexer.nextToken();
      this.tokens.push(token);
      if (token.type === 'EOF') break;
    }
  }

  public parseProgram(): ProgramNode {
    const statements: FunctionDeclaration[] = [];
    while (!this.at('EOF') && !this.at('HASH')) {
      if (this.at('FN')) {
        const declaration = this.parseFunctionDeclaration();
        if (declaration) {
          statements.push(declaration);
          continue;
        }
        this.synchronizeTopLevel();
        continue;
      }
      this.addError(this.current(), '顶层仅允许函数声明');
      this.advance();
    }
    return { kind: 'Program', statements };
  }

  private parseFunctionDeclaration(): FunctionDeclaration | null {
    this.consume('FN', "期望 'fn'");
    const nameToken = this.consume('IDENT', '函数名应为标识符');
    if (!nameToken) return null;
    const name: IdentifierExpression = { kind: 'Identifier', value: nameToken.literal };
    if (!this.consume('LPAREN', '函数名后期望左括号')) return null;

    const params = this.parseFunctionParameters();
    if (!params) return null;

    let returnType: TypeAnnotation | undefined;
    if (this.match('ARROW')) {
      returnType = this.parseTypeAnnotation();
      if (!returnType) return null;
    }

    const body = this.parseBlockStatement();
    if (!body) return null;

    return { kind: 'FunctionDeclaration', name, params, returnType, body };
  }

  private parseFunctionParameters(): FunctionParameter[] | null {
    const params: FunctionParameter[] = [];
    if (this.match('RPAREN')) return params;

    while (!this.at('EOF')) {
      const mutable = this.match('MUT');
      const name = this.consume('IDENT', '参数名应为标识符');
      if (!name) return null;
      if (!this.consume('COLON', '参数名后期望冒号')) return null;
      const typeAnnotation = this.parseTypeAnnotation();
      if (!typeAnnotation) return null;
      params.push({ name: name.literal, mutable, typeAnnotation });

      if (this.match('COMMA')) {
        if (this.match('RPAREN')) break;
        continue;
      }
      if (this.match('RPAREN')) break;
      this.addError(this.current(), "参数列表期望 ',' 或 ')'");
      return null;
    }

    return params;
  }

  private parseStatement(): StatementNode | null {
    if (this.at('LET')) return this.parseLetStatement();
    if (this.at('RETURN')) return this.parseReturnStatement();
    if (this.at('IF')) return this.parseIfStatement();
    if (this.at('WHILE')) return this.parseWhileStatement();
    if (this.at('FOR')) return this.parseForStatement();
    if (this.at('LOOP')) return this.parseLoopStatement();
    if (this.at('BREAK')) return this.parseBreakStatement();
    if (this.at('CONTINUE')) return this.parseContinueStatement();
    if (this.at('LBRACE')) return this.parseBlockStatement();
    if (this.match('SEMICOLON')) return null;

    return this.parseAssignmentOrExpressionStatement();
  }

  private parseLetStatement(): LetStatement | null {
    this.consume('LET', "期望 'let'");
    const mutable = this.match('MUT');
    const nameToken = this.consume('IDENT', 'let 后期望标识符');
    if (!nameToken) return null;
    const name: IdentifierExpression = { kind: 'Identifier', value: nameToken.literal };

    let typeAnnotation: TypeAnnotation | undefined;
    if (this.match('COLON')) {
      typeAnnotation = this.parseTypeAnnotation();
      if (!typeAnnotation) return null;
    }

    let value: ExpressionNode | undefined;
    if (this.match('ASSIGN')) {
      value = this.parseExpression(0);
      if (!value) return null;
    }

    if (!this.consume('SEMICOLON', "let 语句缺少 ';'")) return null;
    return { kind: 'LetStatement', name, mutable, typeAnnotation, value };
  }

  private parseReturnStatement(): ReturnStatement | null {
    this.consume('RETURN', "期望 'return'");
    if (this.match('SEMICOLON')) {
      return { kind: 'ReturnStatement' };
    }
    const value = this.parseExpression(0);
    if (!value) return null;
    if (!this.consume('SEMICOLON', "return 语句缺少 ';'")) return null;
    return { kind: 'ReturnStatement', value };
  }

  private parseAssignmentOrExpressionStatement(): AssignmentStatement | ExpressionStatement | null {
    const expression = this.parseExpression(0);
    if (!expression) return null;

    if (this.match('ASSIGN')) {
      const value = this.parseExpression(0);
      if (!value) return null;
      if (!this.consume('SEMICOLON', "赋值语句缺少 ';'")) return null;
      return { kind: 'AssignmentStatement', target: expression, value };
    }

    if (!this.consume('SEMICOLON', "表达式语句缺少 ';'")) return null;
    return { kind: 'ExpressionStatement', expression };
  }

  private parseIfStatement(): IfStatement | null {
    this.consume('IF', "期望 'if'");
    const condition = this.parseExpression(0);
    if (!condition) return null;
    const consequence = this.parseBlockStatement();
    if (!consequence) return null;

    let alternative: BlockStatement | IfStatement | undefined;
    if (this.match('ELSE')) {
      if (this.at('IF')) {
        alternative = this.parseIfStatement() ?? undefined;
      } else if (this.at('LBRACE')) {
        alternative = this.parseBlockStatement() ?? undefined;
      } else {
        this.addError(this.current(), "else 后期望 if 或 '{'");
        return null;
      }
    }

    return { kind: 'IfStatement', condition, consequence, alternative };
  }

  private parseWhileStatement(): WhileStatement | null {
    this.consume('WHILE', "期望 'while'");
    const condition = this.parseExpression(0);
    if (!condition) return null;
    const body = this.parseBlockStatement();
    if (!body) return null;
    return { kind: 'WhileStatement', condition, body };
  }

  private parseForStatement(): ForStatement | null {
    this.consume('FOR', "期望 'for'");
    const mutable = this.match('MUT');
    const nameToken = this.consume('IDENT', 'for 后期望迭代变量');
    if (!nameToken) return null;

    let typeAnnotation: TypeAnnotation | undefined;
    if (this.match('COLON')) {
      typeAnnotation = this.parseTypeAnnotation();
      if (!typeAnnotation) return null;
    }

    if (!this.consume('IN', "for 变量后期望 'in'")) return null;
    const iterator = this.parseExpression(0);
    if (!iterator) return null;
    const body = this.parseBlockStatement();
    if (!body) return null;

    return {
      kind: 'ForStatement',
      variable: { kind: 'Identifier', value: nameToken.literal },
      mutable,
      typeAnnotation,
      iterator,
      body,
    };
  }

  private parseLoopStatement(): LoopStatement | null {
    this.consume('LOOP', "期望 'loop'");
    const body = this.parseBlockStatement();
    if (!body) return null;
    return { kind: 'LoopStatement', body };
  }

  private parseBreakStatement(): BreakStatement | null {
    this.consume('BREAK', "期望 'break'");
    let value: ExpressionNode | undefined;
    if (!this.at('SEMICOLON')) {
      value = this.parseExpression(0) ?? undefined;
    }
    if (!this.consume('SEMICOLON', "break 语句缺少 ';'")) return null;
    return { kind: 'BreakStatement', value };
  }

  private parseContinueStatement(): ContinueStatement | null {
    this.consume('CONTINUE', "期望 'continue'");
    if (!this.consume('SEMICOLON', "continue 语句缺少 ';'")) return null;
    return { kind: 'ContinueStatement' };
  }

  private parseBlockStatement(): BlockStatement | null {
    if (!this.consume('LBRACE', "期望 '{'")) return null;
    const statements: StatementNode[] = [];
    let tailExpression: ExpressionNode | undefined;

    while (!this.at('RBRACE') && !this.at('EOF')) {
      if (this.canStartTailExpression()) {
        const checkpoint = this.position;
        const expression = this.parseExpression(0);
        if (expression && this.at('RBRACE')) {
          tailExpression = expression;
          break;
        }
        this.position = checkpoint;
      }

      const statement = this.parseStatement();
      if (statement) {
        statements.push(statement);
      } else if (!this.at('RBRACE')) {
        this.synchronizeStatement();
      }
    }

    if (!this.consume('RBRACE', "块缺少 '}'")) return null;
    return { kind: 'BlockStatement', statements, tailExpression };
  }

  private parseExpression(precedence: number): ExpressionNode | null {
    let left = this.parsePrefix();
    if (!left) return null;

    while (!this.at('SEMICOLON') && !this.at('RBRACE') && precedence < this.currentPrecedence()) {
      if (this.at('LPAREN')) {
        left = this.parseCallExpression(left);
        continue;
      }
      if (this.at('LBRACKET')) {
        this.advance();
        const index = this.parseExpression(0);
        if (!index) return null;
        if (!this.consume('RBRACKET', "数组索引缺少 ']'")) return null;
        left = { kind: 'IndexExpression', target: left, index };
        continue;
      }
      if (this.at('DOT')) {
        this.advance();
        if (!this.at('INT') && !this.at('IDENT')) {
          this.addError(this.current(), "'.' 后期望元组索引");
          return null;
        }
        const member = this.advance().literal;
        left = { kind: 'MemberExpression', target: left, member };
        continue;
      }

      const operator = this.advance();
      const operatorPrecedence = PRECEDENCE[operator.type] ?? 0;
      const right = this.parseExpression(operatorPrecedence);
      if (!right) return null;

      if (operator.type === 'DOTDOT' || operator.type === 'DOTDOT_EQ') {
        left = { kind: 'RangeExpression', start: left, end: right, inclusive: operator.type === 'DOTDOT_EQ' };
      } else {
        left = { kind: 'InfixExpression', operator: operator.literal, left, right };
      }
    }

    return left;
  }

  private parsePrefix(): ExpressionNode | null {
    if (this.at('IDENT')) {
      return { kind: 'Identifier', value: this.advance().literal };
    }
    if (this.at('INT')) {
      return { kind: 'IntegerLiteral', value: Number(this.advance().literal) };
    }
    if (this.at('FLOAT')) {
      return { kind: 'FloatLiteral', value: Number(this.advance().literal) };
    }
    if (this.at('LPAREN')) {
      return this.parseTupleOrGroupedExpression();
    }
    if (this.at('LBRACKET')) {
      return this.parseArrayLiteral();
    }
    if (this.at('LBRACE')) {
      const block = this.parseBlockStatement();
      if (!block) return null;
      return { kind: 'BlockExpression', block } satisfies BlockExpression;
    }
    if (this.at('IF')) {
      return this.parseIfExpression();
    }
    if (this.at('LOOP')) {
      return this.parseLoopExpression();
    }
    if (this.at('AMPERSAND')) {
      this.advance();
      const mutable = this.match('MUT');
      const target = this.parseExpression(PREFIX_PRECEDENCE);
      if (!target) return null;
      return { kind: 'ReferenceExpression', mutable, target };
    }
    if (this.at('ASTERISK')) {
      this.advance();
      const target = this.parseExpression(PREFIX_PRECEDENCE);
      if (!target) return null;
      return { kind: 'DereferenceExpression', target };
    }
    if (this.at('MINUS') || this.at('BANG')) {
      const operator = this.advance().literal;
      const right = this.parseExpression(PREFIX_PRECEDENCE);
      if (!right) return null;
      return { kind: 'PrefixExpression', operator, right };
    }

    this.addError(this.current(), `无法解析 token ${this.current().type} ('${this.current().literal}')`);
    return null;
  }

  private parseTupleOrGroupedExpression(): ExpressionNode | null {
    this.consume('LPAREN', "期望 '('");
    if (this.match('RPAREN')) {
      return { kind: 'TupleLiteral', elements: [] };
    }

    const first = this.parseExpression(0);
    if (!first) return null;

    if (!this.match('COMMA')) {
      if (!this.consume('RPAREN', "表达式缺少 ')'")) return null;
      return first;
    }

    const elements: ExpressionNode[] = [first];
    while (!this.at('RPAREN') && !this.at('EOF')) {
      const next = this.parseExpression(0);
      if (!next) return null;
      elements.push(next);
      if (!this.match('COMMA')) break;
    }
    if (!this.consume('RPAREN', "元组表达式缺少 ')'")) return null;
    return { kind: 'TupleLiteral', elements };
  }

  private parseArrayLiteral(): ExpressionNode | null {
    this.consume('LBRACKET', "期望 '['");
    const elements: ExpressionNode[] = [];
    if (this.match('RBRACKET')) {
      return { kind: 'ArrayLiteral', elements };
    }

    while (!this.at('EOF')) {
      const element = this.parseExpression(0);
      if (!element) return null;
      elements.push(element);
      if (this.match('COMMA')) {
        if (this.match('RBRACKET')) break;
        continue;
      }
      if (this.match('RBRACKET')) break;
      this.addError(this.current(), "数组元素列表期望 ',' 或 ']'");
      return null;
    }

    return { kind: 'ArrayLiteral', elements };
  }

  private parseIfExpression(): IfExpression | null {
    this.consume('IF', "期望 'if'");
    const condition = this.parseExpression(0);
    if (!condition) return null;
    const consequence = this.parseBlockStatement();
    if (!consequence) return null;
    if (!this.consume('ELSE', '选择表达式必须包含 else 分支')) return null;
    const alternative = this.parseBlockStatement();
    if (!alternative) return null;
    return { kind: 'IfExpression', condition, consequence, alternative };
  }

  private parseLoopExpression(): LoopExpression | null {
    this.consume('LOOP', "期望 'loop'");
    const body = this.parseBlockStatement();
    if (!body) return null;
    return { kind: 'LoopExpression', body };
  }

  private parseCallExpression(func: ExpressionNode): CallExpression {
    this.consume('LPAREN', "期望 '('");
    const args: ExpressionNode[] = [];
    if (this.match('RPAREN')) {
      return { kind: 'CallExpression', function: func, args };
    }

    while (!this.at('EOF')) {
      const arg = this.parseExpression(0);
      if (!arg) break;
      args.push(arg);
      if (this.match('COMMA')) {
        if (this.match('RPAREN')) break;
        continue;
      }
      if (this.match('RPAREN')) break;
      this.addError(this.current(), "实参列表期望 ',' 或 ')'");
      break;
    }

    return { kind: 'CallExpression', function: func, args };
  }

  private parseTypeAnnotation(): TypeAnnotation | null {
    const type = this.parseType();
    if (!type) return null;
    return { text: typeToString(type), type };
  }

  private parseType(): ValueType | null {
    if (this.match('I32')) return I32_TYPE;

    if (this.match('AMPERSAND')) {
      const mutable = this.match('MUT');
      const to = this.parseType();
      if (!to) return null;
      return { kind: 'ref', mutable, to };
    }

    if (this.match('LBRACKET')) {
      const element = this.parseType();
      if (!element) return null;
      if (!this.consume('SEMICOLON', "数组类型中元素类型后期望 ';'")) return null;
      const lengthToken = this.consume('INT', '数组长度必须是正整数常量');
      if (!lengthToken) return null;
      const length = Number(lengthToken.literal);
      if (!Number.isInteger(length) || length <= 0) {
        this.addError(lengthToken, '数组长度必须是正整数常量');
        return null;
      }
      if (!this.consume('RBRACKET', "数组类型缺少 ']'")) return null;
      return { kind: 'array', element, length };
    }

    if (this.match('LPAREN')) {
      const elements: ValueType[] = [];
      if (this.match('RPAREN')) {
        return UNIT_TYPE;
      }

      while (!this.at('EOF')) {
        const element = this.parseType();
        if (!element) return null;
        elements.push(element);

        if (this.match('COMMA') || this.match('SEMICOLON')) {
          if (this.match('RPAREN')) break;
          continue;
        }
        if (this.match('RPAREN')) break;
        this.addError(this.current(), "元组类型期望 ','、';' 或 ')'");
        return null;
      }

      return { kind: 'tuple', elements };
    }

    this.addError(this.current(), '不支持的类型');
    return null;
  }

  private canStartTailExpression(): boolean {
    return [
      'IDENT',
      'INT',
      'FLOAT',
      'LPAREN',
      'LBRACKET',
      'LBRACE',
      'AMPERSAND',
      'ASTERISK',
      'MINUS',
      'BANG',
    ].includes(this.current().type);
  }

  private currentPrecedence(): number {
    return PRECEDENCE[this.current().type] ?? 0;
  }

  private match(...types: TokenType[]): boolean {
    if (!types.some((type) => this.at(type))) return false;
    this.advance();
    return true;
  }

  private consume(type: TokenType, message: string): Token | null {
    if (this.at(type)) return this.advance();
    this.addError(this.current(), message);
    return null;
  }

  private at(type: TokenType): boolean {
    return this.current().type === type;
  }

  private current(): Token {
    return this.tokens[this.position] ?? this.tokens[this.tokens.length - 1];
  }

  private advance(): Token {
    const token = this.current();
    if (!this.at('EOF')) this.position += 1;
    return token;
  }

  private synchronizeStatement() {
    while (!this.at('EOF') && !this.at('RBRACE')) {
      if (this.match('SEMICOLON')) return;
      this.advance();
    }
  }

  private synchronizeTopLevel() {
    while (!this.at('EOF') && !this.at('FN')) {
      this.advance();
    }
  }

  private addError(token: Token, message: string) {
    this.errors.push(`语法错误 (L${token.line} C${token.col}): ${message}`);
  }
}
