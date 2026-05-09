import { KEYWORDS, type Token, type TokenType } from './token';

export class Lexer {
  private readonly input: string;
  private position = 0;
  private readPosition = 0;
  private ch = '';
  private line = 1;
  private col = 0;

  constructor(input: string) {
    this.input = input;
    this.readChar();
  }

  public nextToken(): Token {
    this.skipWhitespaceAndComments();
    const startLine = this.line;
    const startCol = this.col;

    switch (this.ch) {
      case '=':
        if (this.peekChar() === '=') {
          const literal = this.ch + this.peekChar();
          this.readChar();
          this.readChar();
          return this.makeToken('EQ', literal, startLine, startCol);
        }
        return this.readSingle('ASSIGN', startLine, startCol);
      case '+':
        return this.readSingle('PLUS', startLine, startCol);
      case '-':
        if (this.peekChar() === '>') {
          const literal = this.ch + this.peekChar();
          this.readChar();
          this.readChar();
          return this.makeToken('ARROW', literal, startLine, startCol);
        }
        return this.readSingle('MINUS', startLine, startCol);
      case '*':
        return this.readSingle('ASTERISK', startLine, startCol);
      case '/':
        return this.readSingle('SLASH', startLine, startCol);
      case '<':
        if (this.peekChar() === '=') {
          const literal = this.ch + this.peekChar();
          this.readChar();
          this.readChar();
          return this.makeToken('LTE', literal, startLine, startCol);
        }
        return this.readSingle('LT', startLine, startCol);
      case '>':
        if (this.peekChar() === '=') {
          const literal = this.ch + this.peekChar();
          this.readChar();
          this.readChar();
          return this.makeToken('GTE', literal, startLine, startCol);
        }
        return this.readSingle('GT', startLine, startCol);
      case '!':
        if (this.peekChar() === '=') {
          const literal = this.ch + this.peekChar();
          this.readChar();
          this.readChar();
          return this.makeToken('NOT_EQ', literal, startLine, startCol);
        }
        return this.readSingle('BANG', startLine, startCol);
      case '&':
        return this.readSingle('AMPERSAND', startLine, startCol);
      case '.':
        if (this.peekChar() === '.') {
          this.readChar();
          if (this.peekChar() === '=') {
            this.readChar();
            this.readChar();
            return this.makeToken('DOTDOT_EQ', '..=', startLine, startCol);
          }
          this.readChar();
          return this.makeToken('DOTDOT', '..', startLine, startCol);
        }
        return this.readSingle('DOT', startLine, startCol);
      case '(':
        return this.readSingle('LPAREN', startLine, startCol);
      case ')':
        return this.readSingle('RPAREN', startLine, startCol);
      case '{':
        return this.readSingle('LBRACE', startLine, startCol);
      case '}':
        return this.readSingle('RBRACE', startLine, startCol);
      case '[':
        return this.readSingle('LBRACKET', startLine, startCol);
      case ']':
        return this.readSingle('RBRACKET', startLine, startCol);
      case ',':
        return this.readSingle('COMMA', startLine, startCol);
      case ':':
        return this.readSingle('COLON', startLine, startCol);
      case ';':
        return this.readSingle('SEMICOLON', startLine, startCol);
      case '"':
        return this.readStringToken(startLine, startCol);
      case '':
        return this.makeToken('EOF', '', startLine, startCol);
      default:
        if (this.isLetter(this.ch)) {
          const ident = this.readIdentifier();
          return this.makeToken(KEYWORDS[ident] ?? 'IDENT', ident, startLine, startCol);
        }
        if (this.isDigit(this.ch)) {
          const num = this.readNumber();
          return this.makeToken('INT', num, startLine, startCol);
        }
        const illegal = this.ch;
        this.readChar();
        return this.makeToken('ILLEGAL', illegal, startLine, startCol);
    }
  }

  private readSingle(type: TokenType, line: number, col: number): Token {
    const literal = this.ch;
    this.readChar();
    return this.makeToken(type, literal, line, col);
  }

  private readStringToken(line: number, col: number): Token {
    this.readChar();
    const start = this.position;
    while (this.ch !== '"' && this.ch !== '') {
      if (this.ch === '\n') {
        break;
      }
      this.readChar();
    }
    const content = this.input.slice(start, this.position);
    if (this.ch === '"') {
      this.readChar();
      return this.makeToken('STRING', content, line, col);
    }
    return this.makeToken('ILLEGAL', `"${content}`, line, col);
  }

  private readIdentifier(): string {
    const start = this.position;
    while (this.isLetter(this.ch) || this.isDigit(this.ch)) {
      this.readChar();
    }
    if (this.ch === '!') {
      this.readChar();
    }
    return this.input.slice(start, this.position);
  }

  private readNumber(): string {
    const start = this.position;
    while (this.isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.slice(start, this.position);
  }

  private skipWhitespaceAndComments() {
    while (true) {
      if (/\s/.test(this.ch)) {
        this.readChar();
        continue;
      }
      if (this.ch === '/' && this.peekChar() === '/') {
        while (this.ch !== '\n' && this.ch !== '') {
          this.readChar();
        }
        continue;
      }
      if (this.ch === '/' && this.peekChar() === '*') {
        this.readChar();
        this.readChar();
        while (!(this.ch === '*' && this.peekChar() === '/') && this.ch !== '') {
          this.readChar();
        }
        if (this.ch === '*') {
          this.readChar();
        }
        if (this.ch === '/') {
          this.readChar();
        }
        continue;
      }
      break;
    }
  }

  private readChar() {
    if (this.readPosition >= this.input.length) {
      this.ch = '';
    } else {
      this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition += 1;
    if (this.ch === '\n') {
      this.line += 1;
      this.col = 0;
    } else {
      this.col += 1;
    }
  }

  private peekChar(): string {
    if (this.readPosition >= this.input.length) {
      return '';
    }
    return this.input[this.readPosition];
  }

  private isLetter(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private makeToken(type: TokenType, literal: string, line: number, col: number): Token {
    return { type, literal, line, col };
  }
}
