import type {
  ArrayLiteral,
  AssignmentStatement,
  BlockStatement,
  BreakStatement,
  CallExpression,
  ExpressionNode,
  ForStatement,
  FunctionDeclaration,
  IfStatement,
  LetStatement,
  LoopStatement,
  ProgramNode,
  ReturnStatement,
  StatementNode,
  TupleLiteral,
  WhileStatement,
} from './ast';
import {
  BOOL_TYPE,
  F64_TYPE,
  I32_TYPE,
  NEVER_TYPE,
  UNIT_TYPE,
  UNKNOWN_TYPE,
  isUnit,
  sameType,
  typeToString,
  type ValueType,
} from './typeSystem';

interface Binding {
  name: string;
  mutable: boolean;
  type: ValueType;
  assigned: boolean;
  immutableBorrows: number;
  mutableBorrows: number;
}

interface FunctionSymbol {
  name: string;
  params: Array<{ name: string; mutable: boolean; type: ValueType }>;
  returnType: ValueType;
}

interface ExpressionContext {
  expected?: ValueType;
  requireValue?: boolean;
}

interface PlaceInfo {
  type: ValueType;
  mutable: boolean;
  binding?: Binding;
  root?: Binding;
  immutableReason?: 'binding' | 'reference';
}

interface LoopContext {
  breakTypes: ValueType[];
}

class Scope {
  private readonly bindings = new Map<string, Binding>();

  constructor(private readonly parent?: Scope) {}

  define(binding: Binding) {
    this.bindings.set(binding.name, binding);
  }

  lookup(name: string): Binding | undefined {
    return this.bindings.get(name) ?? this.parent?.lookup(name);
  }
}

export interface SemanticResult {
  errors: string[];
  warnings: string[];
}

export class SemanticAnalyzer {
  public readonly errors: string[] = [];
  public readonly warnings: string[] = [];
  private readonly functions = new Map<string, FunctionSymbol>();
  private readonly allBindings: Binding[] = [];
  private readonly loopStack: LoopContext[] = [];
  private currentFunction: FunctionSymbol | null = null;
  private currentFunctionHasReturn = false;

  public analyze(program: ProgramNode): SemanticResult {
    this.collectFunctionSymbols(program);
    for (const declaration of program.statements) {
      this.analyzeFunction(declaration);
    }
    return { errors: this.errors, warnings: this.warnings };
  }

  private collectFunctionSymbols(program: ProgramNode) {
    for (const declaration of program.statements) {
      const name = declaration.name.value;
      if (this.functions.has(name)) {
        this.error(`函数 ${name} 被重复声明`);
        continue;
      }
      this.functions.set(name, {
        name,
        params: declaration.params.map((param) => ({
          name: param.name,
          mutable: param.mutable,
          type: param.typeAnnotation.type,
        })),
        returnType: declaration.returnType?.type ?? UNIT_TYPE,
      });
    }
  }

  private analyzeFunction(declaration: FunctionDeclaration) {
    const symbol = this.functions.get(declaration.name.value);
    if (!symbol) return;

    this.currentFunction = symbol;
    this.currentFunctionHasReturn = false;
    const bindingStart = this.allBindings.length;
    const scope = new Scope();

    for (const param of symbol.params) {
      this.defineBinding(scope, {
        name: param.name,
        mutable: param.mutable,
        type: param.type,
        assigned: true,
      });
    }

    const bodyType = this.analyzeBlock(declaration.body, scope);
    const returnType = symbol.returnType;
    if (declaration.body.tailExpression) {
      this.expectType(bodyType, returnType, `函数 ${symbol.name} 的尾表达式返回类型`);
    } else if (!isUnit(returnType) && !this.currentFunctionHasReturn) {
      this.error(`函数 ${symbol.name} 声明返回 ${typeToString(returnType)}，但没有返回值`);
    } else if (isUnit(returnType) && !isUnit(bodyType)) {
      this.error(`函数 ${symbol.name} 未声明返回类型，但函数体尾表达式返回 ${typeToString(bodyType)}`);
    }

    for (const binding of this.allBindings.slice(bindingStart)) {
      if (binding.type.kind === 'unknown') {
        this.error(`无法推断变量 ${binding.name} 的类型`);
        binding.type = UNIT_TYPE;
      }
    }

    this.currentFunction = null;
  }

  private analyzeBlock(block: BlockStatement, parent: Scope): ValueType {
    const scope = new Scope(parent);
    for (const statement of block.statements) {
      this.analyzeStatement(statement, scope);
    }
    if (block.tailExpression) {
      return this.analyzeExpression(block.tailExpression, scope, { requireValue: true });
    }
    return UNIT_TYPE;
  }

  private analyzeStatement(statement: StatementNode, scope: Scope): void {
    switch (statement.kind) {
      case 'LetStatement':
        this.analyzeLet(statement, scope);
        return;
      case 'AssignmentStatement':
        this.analyzeAssignment(statement, scope);
        return;
      case 'ExpressionStatement':
        this.analyzeExpression(statement.expression, scope, { requireValue: false });
        return;
      case 'ReturnStatement':
        this.analyzeReturn(statement, scope);
        return;
      case 'BlockStatement':
        this.analyzeBlock(statement, scope);
        return;
      case 'IfStatement':
        this.analyzeIfStatement(statement, scope);
        return;
      case 'WhileStatement':
        this.analyzeWhile(statement, scope);
        return;
      case 'ForStatement':
        this.analyzeFor(statement, scope);
        return;
      case 'LoopStatement':
        this.analyzeLoop(statement, scope);
        return;
      case 'BreakStatement':
        this.analyzeBreak(statement, scope);
        return;
      case 'ContinueStatement':
        this.analyzeContinue();
        return;
      case 'FunctionDeclaration':
        return;
      default:
        return;
    }
  }

  private analyzeLet(statement: LetStatement, scope: Scope) {
    const expected = statement.typeAnnotation?.type;
    let finalType = expected ?? UNKNOWN_TYPE;
    let assigned = false;

    if (statement.value) {
      const valueType = this.analyzeExpression(statement.value, scope, {
        expected,
        requireValue: true,
      });
      if (expected) {
        this.expectType(valueType, expected, `变量 ${statement.name.value} 初始化`);
      } else {
        finalType = valueType;
      }
      assigned = true;
    }

    this.defineBinding(scope, {
      name: statement.name.value,
      mutable: statement.mutable,
      type: finalType,
      assigned,
    });
  }

  private analyzeAssignment(statement: AssignmentStatement, scope: Scope) {
    const place = this.analyzePlace(statement.target, scope);
    const valueType = this.analyzeExpression(statement.value, scope, {
      expected: place?.type,
      requireValue: true,
    });
    if (!place) return;

    if (!place.mutable) {
      this.error(
        place.immutableReason === 'reference'
          ? '不可变引用不可以修改指向数据'
          : '不可变变量不可被二次赋值',
      );
      return;
    }

    if (place.binding && place.binding.type.kind === 'unknown') {
      place.binding.type = valueType;
    } else {
      this.expectType(valueType, place.type, '赋值语句');
    }

    if (place.binding) {
      place.binding.assigned = true;
    }
  }

  private analyzeReturn(statement: ReturnStatement, scope: Scope) {
    const expected = this.currentFunction?.returnType ?? UNIT_TYPE;
    const actual = statement.value
      ? this.analyzeExpression(statement.value, scope, { expected, requireValue: true })
      : UNIT_TYPE;
    this.expectType(actual, expected, `函数 ${this.currentFunction?.name ?? '(unknown)'} 的返回语句`);
    this.currentFunctionHasReturn = true;
  }

  private analyzeIfStatement(statement: IfStatement, scope: Scope) {
    const conditionType = this.analyzeExpression(statement.condition, scope, { requireValue: true });
    this.expectType(conditionType, BOOL_TYPE, 'if 条件');
    this.analyzeBlock(statement.consequence, scope);
    if (statement.alternative) {
      if (statement.alternative.kind === 'IfStatement') {
        this.analyzeIfStatement(statement.alternative, scope);
      } else {
        this.analyzeBlock(statement.alternative, scope);
      }
    }
  }

  private analyzeWhile(statement: WhileStatement, scope: Scope) {
    const conditionType = this.analyzeExpression(statement.condition, scope, { requireValue: true });
    this.expectType(conditionType, BOOL_TYPE, 'while 条件');
    this.loopStack.push({ breakTypes: [] });
    this.analyzeBlock(statement.body, scope);
    this.loopStack.pop();
  }

  private analyzeFor(statement: ForStatement, scope: Scope) {
    let iteratorElementType = I32_TYPE;
    if (statement.iterator.kind === 'RangeExpression') {
      const startType = this.analyzeExpression(statement.iterator.start, scope, { requireValue: true });
      const endType = this.analyzeExpression(statement.iterator.end, scope, { requireValue: true });
      this.expectType(startType, I32_TYPE, 'for 区间起点');
      this.expectType(endType, I32_TYPE, 'for 区间终点');
    } else {
      const iteratorType = this.analyzeExpression(statement.iterator, scope, { requireValue: true });
      if (iteratorType.kind === 'array') {
        iteratorElementType = iteratorType.element;
      } else {
        this.error(`for 可迭代结构必须是整型区间或数组，得到 ${typeToString(iteratorType)}`);
      }
    }

    if (statement.typeAnnotation) {
      this.expectType(iteratorElementType, statement.typeAnnotation.type, `for 变量 ${statement.variable.value}`);
      iteratorElementType = statement.typeAnnotation.type;
    }

    const loopScope = new Scope(scope);
    this.defineBinding(loopScope, {
      name: statement.variable.value,
      mutable: statement.mutable,
      type: iteratorElementType,
      assigned: true,
    });

    this.loopStack.push({ breakTypes: [] });
    this.analyzeBlock(statement.body, loopScope);
    this.loopStack.pop();
  }

  private analyzeLoop(statement: LoopStatement, scope: Scope) {
    this.loopStack.push({ breakTypes: [] });
    this.analyzeBlock(statement.body, scope);
    this.loopStack.pop();
  }

  private analyzeBreak(statement: BreakStatement, scope: Scope) {
    const loop = this.loopStack[this.loopStack.length - 1];
    if (!loop) {
      this.error(statement.value ? 'break <表达式>; 必须出现在循环体内' : 'break; 必须出现在循环体内');
      if (statement.value) {
        this.analyzeExpression(statement.value, scope, { requireValue: true });
      }
      return;
    }

    const breakType = statement.value
      ? this.analyzeExpression(statement.value, scope, { requireValue: true })
      : UNIT_TYPE;
    loop.breakTypes.push(breakType);
  }

  private analyzeContinue() {
    if (this.loopStack.length === 0) {
      this.error('continue; 必须出现在循环体内');
    }
  }

  private analyzeExpression(expression: ExpressionNode, scope: Scope, context: ExpressionContext = {}): ValueType {
    let result: ValueType;

    switch (expression.kind) {
      case 'Identifier': {
        const binding = scope.lookup(expression.value);
        if (!binding) {
          if (this.functions.has(expression.value)) {
            this.error(`函数 ${expression.value} 不能作为普通值使用`);
          } else {
            this.error(`变量 ${expression.value} 未声明`);
          }
          result = UNKNOWN_TYPE;
          break;
        }
        if (!binding.assigned) {
          this.error(`变量 ${expression.value} 未提前赋值`);
        }
        result = binding.type;
        break;
      }
      case 'IntegerLiteral':
        result = I32_TYPE;
        break;
      case 'FloatLiteral':
        result = F64_TYPE;
        break;
      case 'PrefixExpression':
        result = this.analyzePrefix(expression.operator, expression.right, scope);
        break;
      case 'InfixExpression':
        result = this.analyzeInfix(expression.operator, expression.left, expression.right, scope);
        break;
      case 'CallExpression':
        result = this.analyzeCall(expression, scope);
        break;
      case 'RangeExpression': {
        const startType = this.analyzeExpression(expression.start, scope, { requireValue: true });
        const endType = this.analyzeExpression(expression.end, scope, { requireValue: true });
        this.expectType(startType, I32_TYPE, '区间起点');
        this.expectType(endType, I32_TYPE, '区间终点');
        result = UNKNOWN_TYPE;
        break;
      }
      case 'ReferenceExpression':
        result = this.analyzeReference(expression.target, expression.mutable, scope);
        break;
      case 'DereferenceExpression': {
        const targetType = this.analyzeExpression(expression.target, scope, { requireValue: true });
        if (targetType.kind !== 'ref') {
          this.error('不允许对非引用类型进行解引用');
          result = UNKNOWN_TYPE;
        } else {
          result = targetType.to;
        }
        break;
      }
      case 'IndexExpression':
        result = this.analyzeIndex(expression.target, expression.index, scope);
        break;
      case 'MemberExpression':
        result = this.analyzeMember(expression.target, expression.member, scope);
        break;
      case 'ArrayLiteral':
        result = this.analyzeArrayLiteral(expression, scope, context.expected);
        break;
      case 'TupleLiteral':
        result = this.analyzeTupleLiteral(expression, scope, context.expected);
        break;
      case 'BlockExpression':
        result = this.analyzeBlock(expression.block, scope);
        break;
      case 'IfExpression':
        result = this.analyzeIfExpression(expression.condition, expression.consequence, expression.alternative, scope);
        break;
      case 'LoopExpression':
        result = this.analyzeLoopExpression(expression.body, scope);
        break;
      default:
        result = UNKNOWN_TYPE;
        break;
    }

    if (context.requireValue && isUnit(result)) {
      this.error('无返回值函数或空表达式不能作为右值');
    }

    return result;
  }

  private analyzePrefix(operator: string, right: ExpressionNode, scope: Scope): ValueType {
    const rightType = this.analyzeExpression(right, scope, { requireValue: true });
    if (operator === '-') {
      this.expectType(rightType, I32_TYPE, '一元负号');
      return I32_TYPE;
    }
    if (operator === '!') {
      this.expectType(rightType, BOOL_TYPE, '逻辑非');
      return BOOL_TYPE;
    }
    return UNKNOWN_TYPE;
  }

  private analyzeInfix(operator: string, left: ExpressionNode, right: ExpressionNode, scope: Scope): ValueType {
    const leftType = this.analyzeExpression(left, scope, { requireValue: true });
    const rightType = this.analyzeExpression(right, scope, { requireValue: true });

    if (['+', '-', '*', '/'].includes(operator)) {
      this.expectType(leftType, I32_TYPE, `运算符 ${operator} 左操作数`);
      this.expectType(rightType, I32_TYPE, `运算符 ${operator} 右操作数`);
      return I32_TYPE;
    }

    if (['<', '<=', '>', '>='].includes(operator)) {
      this.expectType(leftType, I32_TYPE, `比较运算符 ${operator} 左操作数`);
      this.expectType(rightType, I32_TYPE, `比较运算符 ${operator} 右操作数`);
      return BOOL_TYPE;
    }

    if (['==', '!='].includes(operator)) {
      this.expectType(leftType, rightType, `比较运算符 ${operator}`);
      return BOOL_TYPE;
    }

    return UNKNOWN_TYPE;
  }

  private analyzeCall(expression: CallExpression, scope: Scope): ValueType {
    if (expression.function.kind !== 'Identifier') {
      this.error('函数调用目标必须是函数名');
      return UNKNOWN_TYPE;
    }

    const name = expression.function.value;
    const fn = this.functions.get(name);
    if (!fn) {
      this.error(`函数 ${name} 未声明`);
      for (const arg of expression.args) {
        this.analyzeExpression(arg, scope, { requireValue: true });
      }
      return UNKNOWN_TYPE;
    }

    if (expression.args.length !== fn.params.length) {
      this.error(`函数 ${name} 实参数量与形参数量不一致：期望 ${fn.params.length}，得到 ${expression.args.length}`);
    }

    expression.args.forEach((arg, index) => {
      const expected = fn.params[index]?.type;
      const actual = this.analyzeExpression(arg, scope, { expected, requireValue: true });
      if (expected) {
        this.expectType(actual, expected, `函数 ${name} 第 ${index + 1} 个实参`);
      }
    });

    return fn.returnType;
  }

  private analyzeIndex(target: ExpressionNode, index: ExpressionNode, scope: Scope): ValueType {
    const targetType = this.analyzeExpression(target, scope, { requireValue: true });
    const indexType = this.analyzeExpression(index, scope, { requireValue: true });
    this.expectType(indexType, I32_TYPE, '数组索引');

    if (targetType.kind !== 'array') {
      this.error(`只有数组类型可以按下标取元素，得到 ${typeToString(targetType)}`);
      return UNKNOWN_TYPE;
    }

    if (index.kind === 'IntegerLiteral' && (index.value < 0 || index.value >= targetType.length)) {
      this.error(`数组的索引必须在合法范围 [0, ${targetType.length}) 内`);
    }

    return targetType.element;
  }

  private analyzeMember(target: ExpressionNode, member: string, scope: Scope): ValueType {
    const targetType = this.analyzeExpression(target, scope, { requireValue: true });
    if (!/^\d+$/.test(member)) {
      this.error('元组的索引的类型必须是整数类型');
      return UNKNOWN_TYPE;
    }
    if (targetType.kind !== 'tuple') {
      this.error(`只有元组类型可以按字段取元素，得到 ${typeToString(targetType)}`);
      return UNKNOWN_TYPE;
    }
    const index = Number(member);
    if (index < 0 || index >= targetType.elements.length) {
      this.error(`元组的索引必须在合法范围 [0, ${targetType.elements.length}) 内`);
      return UNKNOWN_TYPE;
    }
    return targetType.elements[index];
  }

  private analyzeArrayLiteral(expression: ArrayLiteral, scope: Scope, expected?: ValueType): ValueType {
    const expectedArray = expected?.kind === 'array' ? expected : undefined;
    if (expectedArray && expression.elements.length !== expectedArray.length) {
      this.error('初始化时的元素数量与数组长度不一致');
    }

    let elementType = expectedArray?.element ?? UNKNOWN_TYPE;
    for (const element of expression.elements) {
      const actual = this.analyzeExpression(element, scope, {
        expected: expectedArray?.element,
        requireValue: true,
      });
      if (elementType.kind === 'unknown') {
        elementType = actual;
      } else if (!sameType(actual, elementType)) {
        this.error('初始化时元素的类型与数组的元素类型不一致');
      }
    }

    return { kind: 'array', element: elementType, length: expression.elements.length };
  }

  private analyzeTupleLiteral(expression: TupleLiteral, scope: Scope, expected?: ValueType): ValueType {
    const expectedTuple = expected && isUnit(expected)
      ? { kind: 'tuple' as const, elements: [] }
      : expected?.kind === 'tuple'
        ? expected
        : undefined;

    if (expectedTuple && expression.elements.length !== expectedTuple.elements.length) {
      this.error('初始化时的元素数量与元组长度不一致');
    }

    const elementTypes = expression.elements.map((element, index) => {
      const actual = this.analyzeExpression(element, scope, {
        expected: expectedTuple?.elements[index],
        requireValue: true,
      });
      if (expectedTuple?.elements[index] && !sameType(actual, expectedTuple.elements[index])) {
        this.error('初始化时元素的类型与元组定义的元素类型不一致');
      }
      return actual;
    });

    return elementTypes.length === 0 ? UNIT_TYPE : { kind: 'tuple', elements: elementTypes };
  }

  private analyzeIfExpression(
    condition: ExpressionNode,
    consequence: BlockStatement,
    alternative: BlockStatement,
    scope: Scope,
  ): ValueType {
    const conditionType = this.analyzeExpression(condition, scope, { requireValue: true });
    this.expectType(conditionType, BOOL_TYPE, '选择表达式条件');
    const consequenceType = this.analyzeBlock(consequence, scope);
    const alternativeType = this.analyzeBlock(alternative, scope);
    this.expectType(consequenceType, alternativeType, '选择表达式两个分支');
    return consequenceType;
  }

  private analyzeLoopExpression(body: BlockStatement, scope: Scope): ValueType {
    const context: LoopContext = { breakTypes: [] };
    this.loopStack.push(context);
    this.analyzeBlock(body, scope);
    this.loopStack.pop();

    if (context.breakTypes.length === 0) {
      return NEVER_TYPE;
    }

    const [first, ...rest] = context.breakTypes;
    for (const type of rest) {
      this.expectType(type, first, '同一 loop 表达式中的 break 返回值');
    }
    return first;
  }

  private analyzeReference(target: ExpressionNode, mutable: boolean, scope: Scope): ValueType {
    const place = this.analyzePlace(target, scope);
    if (!place) return { kind: 'ref', mutable, to: UNKNOWN_TYPE };

    const root = place.root ?? place.binding;
    if (!root) {
      return { kind: 'ref', mutable, to: place.type };
    }
    if (!root.assigned) {
      this.error(`变量 ${root.name} 未提前赋值`);
    }

    if (mutable) {
      if (!root.mutable) {
        this.error('仅支持从可变变量创建可变引用');
      }
      if (root.immutableBorrows > 0 || root.mutableBorrows > 0) {
        this.error('可变引用不能和其他的引用共存');
      }
      root.mutableBorrows += 1;
    } else {
      if (root.mutableBorrows > 0) {
        this.error('不可变引用不能和可变引用共存');
      }
      root.immutableBorrows += 1;
    }

    return { kind: 'ref', mutable, to: place.type };
  }

  private analyzePlace(target: ExpressionNode, scope: Scope): PlaceInfo | null {
    switch (target.kind) {
      case 'Identifier': {
        const binding = scope.lookup(target.value);
        if (!binding) {
          this.error(`变量 ${target.value} 未声明`);
          return null;
        }
        return {
          type: binding.type,
          mutable: binding.mutable || !binding.assigned,
          binding,
          root: binding,
          immutableReason: 'binding',
        };
      }
      case 'DereferenceExpression': {
        const targetType = this.analyzeExpression(target.target, scope, { requireValue: true });
        if (targetType.kind !== 'ref') {
          this.error('不允许对非引用类型进行解引用');
          return null;
        }
        return {
          type: targetType.to,
          mutable: targetType.mutable,
          immutableReason: targetType.mutable ? undefined : 'reference',
        };
      }
      case 'IndexExpression': {
        const containerType = this.analyzeExpression(target.target, scope, { requireValue: true });
        const indexType = this.analyzeExpression(target.index, scope, { requireValue: true });
        this.expectType(indexType, I32_TYPE, '数组索引');
        if (containerType.kind !== 'array') {
          this.error(`只有数组类型可以按下标取元素，得到 ${typeToString(containerType)}`);
          return null;
        }
        if (target.index.kind === 'IntegerLiteral' && (target.index.value < 0 || target.index.value >= containerType.length)) {
          this.error(`数组的索引必须在合法范围 [0, ${containerType.length}) 内`);
        }
        const root = this.findRootBinding(target.target, scope);
        return {
          type: containerType.element,
          mutable: root ? root.mutable : true,
          root,
          immutableReason: 'binding',
        };
      }
      case 'MemberExpression': {
        const containerType = this.analyzeExpression(target.target, scope, { requireValue: true });
        if (!/^\d+$/.test(target.member)) {
          this.error('元组的索引的类型必须是整数类型');
          return null;
        }
        if (containerType.kind !== 'tuple') {
          this.error(`只有元组类型可以按字段取元素，得到 ${typeToString(containerType)}`);
          return null;
        }
        const index = Number(target.member);
        if (index < 0 || index >= containerType.elements.length) {
          this.error(`元组的索引必须在合法范围 [0, ${containerType.elements.length}) 内`);
          return null;
        }
        const root = this.findRootBinding(target.target, scope);
        return {
          type: containerType.elements[index],
          mutable: root ? root.mutable : true,
          root,
          immutableReason: 'binding',
        };
      }
      default:
        this.error('赋值目标必须是左值');
        return null;
    }
  }

  private findRootBinding(target: ExpressionNode, scope: Scope): Binding | undefined {
    if (target.kind === 'Identifier') {
      return scope.lookup(target.value);
    }
    if (target.kind === 'IndexExpression' || target.kind === 'MemberExpression') {
      return this.findRootBinding(target.target, scope);
    }
    return undefined;
  }

  private defineBinding(scope: Scope, binding: Omit<Binding, 'immutableBorrows' | 'mutableBorrows'>) {
    const fullBinding: Binding = {
      ...binding,
      immutableBorrows: 0,
      mutableBorrows: 0,
    };
    scope.define(fullBinding);
    this.allBindings.push(fullBinding);
  }

  private expectType(actual: ValueType, expected: ValueType, context: string) {
    if (!sameType(actual, expected)) {
      this.error(`${context}类型不一致：期望 ${typeToString(expected)}，得到 ${typeToString(actual)}`);
    }
  }

  private error(message: string) {
    this.errors.push(`语义错误: ${message}`);
  }
}
