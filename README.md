
  # WYLTJ-Rust-Compiler

  This is a code bundle for WYLTJ-Rust-Compiler.

  ## Running the code
  Run `git clone https://github.com/CathyyW/WYLTJ-Rust-Compiler.git`

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

WYLTJ-Rust-Compiler
├── index.html                    # 项目入口 HTML 文件
├── package.json                  # 项目依赖与脚本配置
├── vite.config.ts                # Vite 构建工具配置
├── postcss.config.mjs            # PostCSS 配置
├── default_shadcn_theme.css      # 默认主题样式配置
├── README.md                     # 项目说明文档
├── dist                          # 项目构建输出目录
├── guidelines                    # 项目开发规范与说明
├── src                           # 源代码目录
│   ├── main.tsx                  # React 应用入口文件
│   ├── styles                    # 全局样式目录
│   └── app                       # 应用主体代码目录
│       ├── App.tsx               # 应用主组件
│       ├── compiler              # 编译分析核心模块
│       │   ├── analyzer.ts       # 分析流程调度模块
│       │   ├── lexer.ts          # 词法分析器
│       │   ├── parser.ts         # 语法分析器
│       │   ├── token.ts          # Token 类型定义
│       │   └── ast.ts            # AST 语法树结构定义
│       └── components           

  