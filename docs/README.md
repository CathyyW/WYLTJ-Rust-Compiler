# WYLTJ-Rust-Compiler

一个基于 Vite + React 的 Rust 编译原理演示项目。

## 使用命令

克隆项目：

```bash
git clone https://github.com/CathyyW/WYLTJ-Rust-Compiler.git
cd WYLTJ-Rust-Compiler
```

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

构建产物会输出到 `dist/` 目录。

## PPT 功能实现位置索引

以下行号对应当前 `yjs` 分支源码。每一项列出主要实现函数区，词法、语法、语义和四元式生成中共享的公共入口不重复展开：编译流水线入口在 `src/app/compiler/analyzer.ts:199` 的 `analyzeSource`，类型表示与等价判断在 `src/app/compiler/typeSystem.ts:1` 的 `ValueType` 和 `src/app/compiler/typeSystem.ts:45` 的 `sameType`。

| PPT 编号 | 功能/样例 | 主要实现函数区 |
| --- | --- | --- |
| 0.1 | `mut` 变量属性 | `src/app/compiler/parser.ts:102` `parseFunctionParameters`；`src/app/compiler/parser.ts:142` `parseLetStatement`；`src/app/compiler/semantic.ts:664` `analyzePlace` |
| 0.2 | 基础类型 `i32` | `src/app/compiler/token.ts:56` `KEYWORDS`；`src/app/compiler/parser.ts:493` `parseType`；`src/app/compiler/typeSystem.ts:1` `ValueType` |
| 0.3 | 标识符左值/可取引用/可取元素 | `src/app/compiler/parser.ts:346` `parsePrefix`；`src/app/compiler/semantic.ts:634` `analyzeReference`；`src/app/compiler/semantic.ts:664` `analyzePlace` |
| 1.1 | 基础程序和空函数 | `src/app/compiler/parser.ts:62` `parseProgram`；`src/app/compiler/parser.ts:80` `parseFunctionDeclaration`；`src/app/compiler/parser.ts:273` `parseBlockStatement`；`src/app/compiler/ir.ts:51` `generateFunction` |
| 1.2 | 空语句 `;` | `src/app/compiler/parser.ts:127` `parseStatement`；`src/app/compiler/semantic.ts:168` `analyzeStatement`；`src/app/compiler/ir.ts:75` `generateStatement` |
| 1.3 | `return ;` | `src/app/compiler/parser.ts:165` `parseReturnStatement`；`src/app/compiler/semantic.ts:264` `analyzeReturn`；`src/app/compiler/ir.ts:75` `generateStatement` |
| 1.4 | 函数形参 | `src/app/compiler/parser.ts:102` `parseFunctionParameters`；`src/app/compiler/semantic.ts:119` `analyzeFunction`；`src/app/compiler/ir.ts:51` `generateFunction` |
| 1.5.1 | 有返回值函数正确返回 | `src/app/compiler/parser.ts:80` `parseFunctionDeclaration`；`src/app/compiler/parser.ts:165` `parseReturnStatement`；`src/app/compiler/semantic.ts:264` `analyzeReturn` |
| 1.5.2 | 返回空值但声明 `i32` 报错 | `src/app/compiler/semantic.ts:264` `analyzeReturn`；`src/app/compiler/semantic.ts:772` `expectType` |
| 1.5.3 | 未声明返回类型但返回 `i32` 报错 | `src/app/compiler/semantic.ts:264` `analyzeReturn`；`src/app/compiler/semantic.ts:772` `expectType` |
| 2.1.1 | 带类型变量声明 | `src/app/compiler/parser.ts:142` `parseLetStatement`；`src/app/compiler/parser.ts:493` `parseType`；`src/app/compiler/semantic.ts:210` `analyzeLet` |
| 2.1.2 | 未标注类型后续赋值推断 | `src/app/compiler/semantic.ts:236` `analyzeAssignment`；`src/app/compiler/semantic.ts:664` `analyzePlace` |
| 2.1.3 | 无法推断类型报错 | `src/app/compiler/semantic.ts:119` `analyzeFunction` |
| 2.1.4 | 变量重影 | `src/app/compiler/semantic.ts:210` `analyzeLet`；`src/app/compiler/semantic.ts:762` `defineBinding` |
| 2.2.1 | 普通赋值 | `src/app/compiler/parser.ts:176` `parseAssignmentOrExpressionStatement`；`src/app/compiler/semantic.ts:236` `analyzeAssignment`；`src/app/compiler/ir.ts:121` `generateAssignment` |
| 2.2.2 | 左值未声明报错 | `src/app/compiler/semantic.ts:664` `analyzePlace` |
| 2.2.3 | 赋值类型不一致报错 | `src/app/compiler/semantic.ts:236` `analyzeAssignment`；`src/app/compiler/semantic.ts:772` `expectType` |
| 2.2.4 | 右值未声明报错 | `src/app/compiler/semantic.ts:356` `analyzeExpression` |
| 2.2.5 | 右值未赋值报错 | `src/app/compiler/semantic.ts:356` `analyzeExpression` |
| 2.3.1 | 声明同时初始化/类型推断 | `src/app/compiler/parser.ts:142` `parseLetStatement`；`src/app/compiler/semantic.ts:210` `analyzeLet`；`src/app/compiler/ir.ts:75` `generateStatement` |
| 2.3.2 | 初始化声明重影 | `src/app/compiler/semantic.ts:210` `analyzeLet`；`src/app/compiler/semantic.ts:762` `defineBinding` |
| 3.1.1 | 整数字面量和括号表达式 | `src/app/compiler/lexer.ts:155` `readNumber`；`src/app/compiler/parser.ts:397` `parseTupleOrGroupedExpression`；`src/app/compiler/semantic.ts:356` `analyzeExpression` |
| 3.1.2 | 标识符表达式和括号表达式 | `src/app/compiler/parser.ts:346` `parsePrefix`；`src/app/compiler/semantic.ts:356` `analyzeExpression` |
| 3.2 | 比较运算 | `src/app/compiler/parser.ts:303` `parseExpression`；`src/app/compiler/semantic.ts:459` `analyzeInfix`；`src/app/compiler/ir.ts:221` `generateExpression` |
| 3.3 | 加减运算 | `src/app/compiler/parser.ts:303` `parseExpression`；`src/app/compiler/semantic.ts:459` `analyzeInfix`；`src/app/compiler/ir.ts:221` `generateExpression` |
| 3.4 | 乘除运算 | `src/app/compiler/parser.ts:303` `parseExpression`；`src/app/compiler/semantic.ts:459` `analyzeInfix`；`src/app/compiler/ir.ts:221` `generateExpression` |
| 3.5.1 | 无参函数调用 | `src/app/compiler/parser.ts:464` `parseCallExpression`；`src/app/compiler/semantic.ts:483` `analyzeCall`；`src/app/compiler/ir.ts:221` `generateExpression` |
| 3.5.2 | 实参表达式调用 | `src/app/compiler/parser.ts:464` `parseCallExpression`；`src/app/compiler/semantic.ts:483` `analyzeCall` |
| 3.5.3 | 实参数量不一致报错 | `src/app/compiler/semantic.ts:483` `analyzeCall` |
| 3.5.4 | 实参类型不一致报错 | `src/app/compiler/semantic.ts:483` `analyzeCall`；`src/app/compiler/semantic.ts:772` `expectType` |
| 3.5.5 | 无返回值函数作为右值报错 | `src/app/compiler/semantic.ts:356` `analyzeExpression`；`src/app/compiler/semantic.ts:483` `analyzeCall` |
| 4.1 | `if` 语句 | `src/app/compiler/parser.ts:191` `parseIfStatement`；`src/app/compiler/semantic.ts:273` `analyzeIfStatement`；`src/app/compiler/ir.ts:126` `generateIfStatement` |
| 4.2 | `else` 分支 | `src/app/compiler/parser.ts:191` `parseIfStatement`；`src/app/compiler/semantic.ts:273` `analyzeIfStatement`；`src/app/compiler/ir.ts:126` `generateIfStatement` |
| 4.3 | `else if` 分支 | `src/app/compiler/parser.ts:191` `parseIfStatement`；`src/app/compiler/semantic.ts:273` `analyzeIfStatement`；`src/app/compiler/ir.ts:126` `generateIfStatement` |
| 5.1 | `while` 循环 | `src/app/compiler/parser.ts:213` `parseWhileStatement`；`src/app/compiler/semantic.ts:286` `analyzeWhile`；`src/app/compiler/ir.ts:144` `generateWhile` |
| 5.2.1 | 区间 `for` 循环 | `src/app/compiler/parser.ts:222` `parseForStatement`；`src/app/compiler/parser.ts:303` `parseExpression`；`src/app/compiler/semantic.ts:294` `analyzeFor`；`src/app/compiler/ir.ts:157` `generateFor` |
| 5.2.2 | 非整型区间终点报错 | `src/app/compiler/lexer.ts:155` `readNumber`；`src/app/compiler/semantic.ts:294` `analyzeFor`；`src/app/compiler/semantic.ts:772` `expectType` |
| 5.3 | `loop` 循环 | `src/app/compiler/parser.ts:250` `parseLoopStatement`；`src/app/compiler/semantic.ts:328` `analyzeLoop`；`src/app/compiler/ir.ts:194` `generateLoop` |
| 5.4.1 | 循环内 `break` | `src/app/compiler/parser.ts:257` `parseBreakStatement`；`src/app/compiler/semantic.ts:334` `analyzeBreak`；`src/app/compiler/ir.ts:206` `generateBreak` |
| 5.4.2 | 循环外 `break` 报错 | `src/app/compiler/semantic.ts:334` `analyzeBreak` |
| 5.4.3 | 循环内 `continue` | `src/app/compiler/parser.ts:267` `parseContinueStatement`；`src/app/compiler/semantic.ts:350` `analyzeContinue`；`src/app/compiler/ir.ts:215` `generateContinue` |
| 5.4.4 | 循环外 `continue` 报错 | `src/app/compiler/semantic.ts:350` `analyzeContinue` |
| 6.1.1 | 不可变变量声明 | `src/app/compiler/parser.ts:142` `parseLetStatement`；`src/app/compiler/semantic.ts:210` `analyzeLet` |
| 6.1.2 | 不可变变量二次赋值报错 | `src/app/compiler/semantic.ts:236` `analyzeAssignment`；`src/app/compiler/semantic.ts:664` `analyzePlace` |
| 6.2.1 | 不可变引用类型和取引用 | `src/app/compiler/parser.ts:493` `parseType`；`src/app/compiler/parser.ts:346` `parsePrefix`；`src/app/compiler/semantic.ts:634` `analyzeReference` |
| 6.2.2 | 多个不可变引用共存 | `src/app/compiler/semantic.ts:634` `analyzeReference` |
| 6.3.1 | 可变引用 | `src/app/compiler/parser.ts:493` `parseType`；`src/app/compiler/semantic.ts:634` `analyzeReference` |
| 6.3.4 | 可变引用与其他引用冲突报错 | `src/app/compiler/semantic.ts:634` `analyzeReference` |
| 6.3.5 | 从不可变变量创建可变引用报错 | `src/app/compiler/semantic.ts:634` `analyzeReference` |
| 6.4.1 | 解引用赋值 | `src/app/compiler/parser.ts:346` `parsePrefix`；`src/app/compiler/semantic.ts:664` `analyzePlace`；`src/app/compiler/ir.ts:340` `storePlace` |
| 6.4.2 | 非引用类型解引用报错 | `src/app/compiler/semantic.ts:356` `analyzeExpression`；`src/app/compiler/semantic.ts:664` `analyzePlace` |
| 6.4.3 | 不可变引用写入报错 | `src/app/compiler/semantic.ts:236` `analyzeAssignment`；`src/app/compiler/semantic.ts:664` `analyzePlace` |
| 7.1 | 块表达式作为右值 | `src/app/compiler/parser.ts:273` `parseBlockStatement`；`src/app/compiler/parser.ts:346` `parsePrefix`；`src/app/compiler/semantic.ts:157` `analyzeBlock`；`src/app/compiler/ir.ts:65` `generateBlock` |
| 7.2 | 函数体尾表达式 | `src/app/compiler/parser.ts:273` `parseBlockStatement`；`src/app/compiler/semantic.ts:119` `analyzeFunction`；`src/app/compiler/ir.ts:51` `generateFunction` |
| 7.3 | `if` 表达式 | `src/app/compiler/parser.ts:445` `parseIfExpression`；`src/app/compiler/semantic.ts:603` `analyzeIfExpression`；`src/app/compiler/ir.ts:307` `generateIfExpression` |
| 7.4.1 | `loop` 表达式和 `break` 值 | `src/app/compiler/parser.ts:457` `parseLoopExpression`；`src/app/compiler/semantic.ts:617` `analyzeLoopExpression`；`src/app/compiler/ir.ts:327` `generateLoopExpression` |
| 7.4.2 | 循环外 `break <expr>` 报错 | `src/app/compiler/parser.ts:257` `parseBreakStatement`；`src/app/compiler/semantic.ts:334` `analyzeBreak` |
| 8.1 | 数组类型 | `src/app/compiler/parser.ts:493` `parseType`；`src/app/compiler/typeSystem.ts:1` `ValueType` |
| 8.2.1 | 数组长度不一致报错 | `src/app/compiler/parser.ts:422` `parseArrayLiteral`；`src/app/compiler/semantic.ts:556` `analyzeArrayLiteral` |
| 8.2.2 | 数组元素类型不一致报错 | `src/app/compiler/semantic.ts:556` `analyzeArrayLiteral`；`src/app/compiler/semantic.ts:772` `expectType` |
| 8.3.1 | 嵌套数组元素访问 | `src/app/compiler/parser.ts:303` `parseExpression`；`src/app/compiler/semantic.ts:514` `analyzeIndex`；`src/app/compiler/ir.ts:221` `generateExpression` |
| 8.3.2 | 数组元素参与计算 | `src/app/compiler/semantic.ts:514` `analyzeIndex`；`src/app/compiler/semantic.ts:459` `analyzeInfix` |
| 8.3.3 | 数组元素作为左值 | `src/app/compiler/semantic.ts:664` `analyzePlace`；`src/app/compiler/ir.ts:340` `storePlace` |
| 8.3.4 | 数组索引类型错误 | `src/app/compiler/semantic.ts:514` `analyzeIndex` |
| 8.3.5 | 数组索引越界 | `src/app/compiler/semantic.ts:514` `analyzeIndex` |
| 8.3.6 | 不可变数组元素赋值报错 | `src/app/compiler/semantic.ts:236` `analyzeAssignment`；`src/app/compiler/semantic.ts:664` `analyzePlace` |
| 9.1 | 元组类型 | `src/app/compiler/parser.ts:493` `parseType`；`src/app/compiler/typeSystem.ts:1` `ValueType` |
| 9.2.1 | 元组长度不一致报错 | `src/app/compiler/parser.ts:397` `parseTupleOrGroupedExpression`；`src/app/compiler/semantic.ts:578` `analyzeTupleLiteral` |
| 9.2.2 | 元组元素类型不一致报错 | `src/app/compiler/semantic.ts:578` `analyzeTupleLiteral`；`src/app/compiler/semantic.ts:772` `expectType` |
| 9.3.1 | 嵌套元组元素访问 | `src/app/compiler/lexer.ts:155` `readNumber`；`src/app/compiler/parser.ts:303` `parseExpression`；`src/app/compiler/semantic.ts:531` `analyzeMember` |
| 9.3.2 | 元组元素参与计算 | `src/app/compiler/semantic.ts:531` `analyzeMember`；`src/app/compiler/semantic.ts:459` `analyzeInfix`；`src/app/compiler/ir.ts:221` `generateExpression` |
| 9.3.3 | 元组元素作为左值；兼容 PPT 原文 `数组.NUM` | `src/app/compiler/semantic.ts:531` `analyzeMember`；`src/app/compiler/semantic.ts:664` `analyzePlace`；`src/app/compiler/ir.ts:340` `storePlace` |
| 9.3.4 | 元组索引非整数字面量报错 | `src/app/compiler/parser.ts:303` `parseExpression`；`src/app/compiler/semantic.ts:531` `analyzeMember` |
| 9.3.5 | 元组索引越界 | `src/app/compiler/semantic.ts:531` `analyzeMember` |
| 9.3.6 | 不可变元组元素赋值报错 | `src/app/compiler/semantic.ts:236` `analyzeAssignment`；`src/app/compiler/semantic.ts:664` `analyzePlace` |
