export type TokenType =
  | 'LET'
  | 'MUT'
  | 'FN'
  | 'RETURN'
  | 'IF'
  | 'ELSE'
  | 'WHILE'
  | 'FOR'
  | 'IN'
  | 'LOOP'
  | 'BREAK'
  | 'CONTINUE'
  | 'I32'
  | 'IDENT'
  | 'INT'
  | 'FLOAT'
  | 'STRING'
  | 'ASSIGN'
  | 'PLUS'
  | 'MINUS'
  | 'ASTERISK'
  | 'SLASH'
  | 'EQ'
  | 'NOT_EQ'
  | 'LT'
  | 'LTE'
  | 'GT'
  | 'GTE'
  | 'BANG'
  | 'AMPERSAND'
  | 'DOT'
  | 'DOTDOT'
  | 'DOTDOT_EQ'
  | 'ARROW'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACE'
  | 'RBRACE'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'COLON'
  | 'SEMICOLON'
  | 'HASH'
  | 'EOF'
  | 'ILLEGAL';

export interface Token {
  type: TokenType;
  literal: string;
  line: number;
  col: number;
}

export const KEYWORDS: Record<string, TokenType> = {
  let: 'LET',
  mut: 'MUT',
  fn: 'FN',
  return: 'RETURN',
  if: 'IF',
  else: 'ELSE',
  while: 'WHILE',
  for: 'FOR',
  in: 'IN',
  loop: 'LOOP',
  break: 'BREAK',
  continue: 'CONTINUE',
  i32: 'I32',
};
