import type {
  AssignmentStatement,
  BlockStatement,
  BreakStatement,
  ExpressionNode,
  ForStatement,
  FunctionDeclaration,
  IfStatement,
  LoopStatement,
  ProgramNode,
  StatementNode,
  WhileStatement,
} from './ast';

export interface Quadruple {
  index: number;
  op: string;
  arg1: string;
  arg2: string;
  result: string;
}

interface LoopLabels {
  breakLabel: string;
  continueLabel: string;
  result?: string;
}

export class IRGenerator {
  private readonly quads: Quadruple[] = [];
  private tempCount = 0;
  private labelCount = 0;
  private readonly loopStack: LoopLabels[] = [];

  public generate(program: ProgramNode): Quadruple[] {
    for (const declaration of program.statements) {
      this.generateFunction(declaration);
    }
    return this.quads;
  }

  public format(): string {
    if (this.quads.length === 0) {
      return '# No intermediate code generated.';
    }
    return this.quads
      .map((quad) => `${quad.index.toString().padStart(3, '0')}: (${quad.op}, ${quad.arg1}, ${quad.arg2}, ${quad.result})`)
      .join('\n');
  }

  private generateFunction(declaration: FunctionDeclaration) {
    this.emit('func', '-', '-', declaration.name.value);
    for (const param of declaration.params) {
      this.emit('param', param.typeAnnotation.text, '-', param.name);
    }
    const tail = this.generateBlock(declaration.body);
    if (tail) {
      this.emit('return', tail, '-', '-');
    } else {
      this.emit('return', '-', '-', '-');
    }
    this.emit('end', '-', '-', declaration.name.value);
  }

  private generateBlock(block: BlockStatement): string | null {
    for (const statement of block.statements) {
      this.generateStatement(statement);
    }
    if (block.tailExpression) {
      return this.generateExpression(block.tailExpression);
    }
    return null;
  }

  private generateStatement(statement: StatementNode): void {
    switch (statement.kind) {
      case 'LetStatement':
        if (statement.value) {
          this.emit('=', this.generateExpression(statement.value), '-', statement.name.value);
        } else {
          this.emit('decl', statement.typeAnnotation?.text ?? '(infer)', '-', statement.name.value);
        }
        return;
      case 'AssignmentStatement':
        this.generateAssignment(statement);
        return;
      case 'ExpressionStatement':
        this.generateExpression(statement.expression);
        return;
      case 'ReturnStatement':
        this.emit('return', statement.value ? this.generateExpression(statement.value) : '-', '-', '-');
        return;
      case 'BlockStatement':
        this.generateBlock(statement);
        return;
      case 'IfStatement':
        this.generateIfStatement(statement);
        return;
      case 'WhileStatement':
        this.generateWhile(statement);
        return;
      case 'ForStatement':
        this.generateFor(statement);
        return;
      case 'LoopStatement':
        this.generateLoop(statement);
        return;
      case 'BreakStatement':
        this.generateBreak(statement);
        return;
      case 'ContinueStatement':
        this.generateContinue();
        return;
      case 'FunctionDeclaration':
        return;
      default:
        return;
    }
  }

  private generateAssignment(statement: AssignmentStatement) {
    const value = this.generateExpression(statement.value);
    this.storePlace(statement.target, value);
  }

  private generateIfStatement(statement: IfStatement) {
    const elseLabel = this.newLabel('else');
    const endLabel = this.newLabel('endif');
    const condition = this.generateExpression(statement.condition);
    this.emit('jz', condition, '-', elseLabel);
    this.generateBlock(statement.consequence);
    this.emit('jmp', '-', '-', endLabel);
    this.emit('label', '-', '-', elseLabel);
    if (statement.alternative) {
      if (statement.alternative.kind === 'IfStatement') {
        this.generateIfStatement(statement.alternative);
      } else {
        this.generateBlock(statement.alternative);
      }
    }
    this.emit('label', '-', '-', endLabel);
  }

  private generateWhile(statement: WhileStatement) {
    const startLabel = this.newLabel('while');
    const endLabel = this.newLabel('endwhile');
    this.emit('label', '-', '-', startLabel);
    const condition = this.generateExpression(statement.condition);
    this.emit('jz', condition, '-', endLabel);
    this.loopStack.push({ breakLabel: endLabel, continueLabel: startLabel });
    this.generateBlock(statement.body);
    this.loopStack.pop();
    this.emit('jmp', '-', '-', startLabel);
    this.emit('label', '-', '-', endLabel);
  }

  private generateFor(statement: ForStatement) {
    if (statement.iterator.kind !== 'RangeExpression') {
      const iterable = this.generateExpression(statement.iterator);
      this.emit('for_in', iterable, '-', statement.variable.value);
      this.generateBlock(statement.body);
      this.emit('end_for_in', '-', '-', statement.variable.value);
      return;
    }

    const start = this.generateExpression(statement.iterator.start);
    const end = this.generateExpression(statement.iterator.end);
    const startLabel = this.newLabel('for');
    const endLabel = this.newLabel('endfor');
    const stepTemp = this.newTemp();
    const conditionTemp = this.newTemp();

    this.emit('=', start, '-', statement.variable.value);
    this.emit('label', '-', '-', startLabel);
    this.emit(statement.iterator.inclusive ? '<=' : '<', statement.variable.value, end, conditionTemp);
    this.emit('jz', conditionTemp, '-', endLabel);
    this.loopStack.push({ breakLabel: endLabel, continueLabel: startLabel });
    this.generateBlock(statement.body);
    this.loopStack.pop();
    this.emit('+', statement.variable.value, '1', stepTemp);
    this.emit('=', stepTemp, '-', statement.variable.value);
    this.emit('jmp', '-', '-', startLabel);
    this.emit('label', '-', '-', endLabel);
  }

  private generateLoop(statement: LoopStatement): string | null {
    const startLabel = this.newLabel('loop');
    const endLabel = this.newLabel('endloop');
    this.emit('label', '-', '-', startLabel);
    this.loopStack.push({ breakLabel: endLabel, continueLabel: startLabel });
    this.generateBlock(statement.body);
    this.loopStack.pop();
    this.emit('jmp', '-', '-', startLabel);
    this.emit('label', '-', '-', endLabel);
    return null;
  }

  private generateBreak(statement: BreakStatement) {
    const loop = this.loopStack[this.loopStack.length - 1];
    if (!loop) return;
    if (statement.value && loop.result) {
      this.emit('=', this.generateExpression(statement.value), '-', loop.result);
    }
    this.emit('jmp', '-', '-', loop.breakLabel);
  }

  private generateContinue() {
    const loop = this.loopStack[this.loopStack.length - 1];
    if (!loop) return;
    this.emit('jmp', '-', '-', loop.continueLabel);
  }

  private generateExpression(expression: ExpressionNode): string {
    switch (expression.kind) {
      case 'Identifier':
        return expression.value;
      case 'IntegerLiteral':
      case 'FloatLiteral':
        return String(expression.value);
      case 'PrefixExpression': {
        const right = this.generateExpression(expression.right);
        const result = this.newTemp();
        this.emit(expression.operator, right, '-', result);
        return result;
      }
      case 'InfixExpression': {
        const left = this.generateExpression(expression.left);
        const right = this.generateExpression(expression.right);
        const result = this.newTemp();
        this.emit(expression.operator, left, right, result);
        return result;
      }
      case 'CallExpression': {
        for (const arg of expression.args) {
          this.emit('arg', this.generateExpression(arg), '-', '-');
        }
        const result = this.newTemp();
        const callee = expression.function.kind === 'Identifier' ? expression.function.value : this.generateExpression(expression.function);
        this.emit('call', callee, String(expression.args.length), result);
        return result;
      }
      case 'RangeExpression': {
        const start = this.generateExpression(expression.start);
        const end = this.generateExpression(expression.end);
        const result = this.newTemp();
        this.emit(expression.inclusive ? 'range_inclusive' : 'range', start, end, result);
        return result;
      }
      case 'ReferenceExpression': {
        const target = this.placeName(expression.target);
        const result = this.newTemp();
        this.emit(expression.mutable ? '&mut' : '&', target, '-', result);
        return result;
      }
      case 'DereferenceExpression': {
        const target = this.generateExpression(expression.target);
        const result = this.newTemp();
        this.emit('*', target, '-', result);
        return result;
      }
      case 'IndexExpression': {
        const target = this.generateExpression(expression.target);
        const index = this.generateExpression(expression.index);
        const result = this.newTemp();
        this.emit('=[]', target, index, result);
        return result;
      }
      case 'MemberExpression': {
        const target = this.generateExpression(expression.target);
        const result = this.newTemp();
        this.emit('.', target, expression.member, result);
        return result;
      }
      case 'ArrayLiteral': {
        const values = expression.elements.map((element) => this.generateExpression(element));
        const result = this.newTemp();
        this.emit('array', values.join(','), String(values.length), result);
        return result;
      }
      case 'TupleLiteral': {
        const values = expression.elements.map((element) => this.generateExpression(element));
        const result = this.newTemp();
        this.emit('tuple', values.join(','), String(values.length), result);
        return result;
      }
      case 'BlockExpression': {
        const value = this.generateBlock(expression.block);
        return value ?? '()';
      }
      case 'IfExpression':
        return this.generateIfExpression(expression.condition, expression.consequence, expression.alternative);
      case 'LoopExpression':
        return this.generateLoopExpression(expression.body);
      default:
        return '?';
    }
  }

  private generateIfExpression(conditionExpression: ExpressionNode, consequence: BlockStatement, alternative: BlockStatement): string {
    const elseLabel = this.newLabel('ifexpr_else');
    const endLabel = this.newLabel('ifexpr_end');
    const result = this.newTemp();
    const condition = this.generateExpression(conditionExpression);
    this.emit('jz', condition, '-', elseLabel);
    const consequenceValue = this.generateBlock(consequence);
    if (consequenceValue) {
      this.emit('=', consequenceValue, '-', result);
    }
    this.emit('jmp', '-', '-', endLabel);
    this.emit('label', '-', '-', elseLabel);
    const alternativeValue = this.generateBlock(alternative);
    if (alternativeValue) {
      this.emit('=', alternativeValue, '-', result);
    }
    this.emit('label', '-', '-', endLabel);
    return result;
  }

  private generateLoopExpression(body: BlockStatement): string {
    const startLabel = this.newLabel('loopexpr');
    const endLabel = this.newLabel('endloopexpr');
    const result = this.newTemp();
    this.emit('label', '-', '-', startLabel);
    this.loopStack.push({ breakLabel: endLabel, continueLabel: startLabel, result });
    this.generateBlock(body);
    this.loopStack.pop();
    this.emit('jmp', '-', '-', startLabel);
    this.emit('label', '-', '-', endLabel);
    return result;
  }

  private storePlace(target: ExpressionNode, value: string) {
    switch (target.kind) {
      case 'Identifier':
        this.emit('=', value, '-', target.value);
        return;
      case 'DereferenceExpression':
        this.emit('*=', this.generateExpression(target.target), value, '-');
        return;
      case 'IndexExpression':
        this.emit('[]=', this.generateExpression(target.target), this.generateExpression(target.index), value);
        return;
      case 'MemberExpression':
        this.emit('.=', this.generateExpression(target.target), target.member, value);
        return;
      default:
        this.emit('store?', value, '-', this.generateExpression(target));
    }
  }

  private placeName(target: ExpressionNode): string {
    switch (target.kind) {
      case 'Identifier':
        return target.value;
      case 'DereferenceExpression':
        return `*${this.generateExpression(target.target)}`;
      case 'IndexExpression':
        return `${this.generateExpression(target.target)}[${this.generateExpression(target.index)}]`;
      case 'MemberExpression':
        return `${this.generateExpression(target.target)}.${target.member}`;
      default:
        return this.generateExpression(target);
    }
  }

  private emit(op: string, arg1: string, arg2: string, result: string) {
    this.quads.push({ index: this.quads.length, op, arg1, arg2, result });
  }

  private newTemp(): string {
    this.tempCount += 1;
    return `t${this.tempCount}`;
  }

  private newLabel(prefix: string): string {
    this.labelCount += 1;
    return `${prefix}_${this.labelCount}`;
  }
}
