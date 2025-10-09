# Repository Infrastructure Layer

基础设施层实现，负责持久化、文件系统操作、Git 操作等。

## 目录结构

```
infrastructure/
├── prisma/
│   ├── PrismaRepositoryRepository.ts   # Prisma 仓储实现
│   └── mappers/
│       ├── RepositoryMapper.ts          # 领域对象 <-> Prisma 模型映射
│       ├── ResourceMapper.ts
│       └── RepositoryExplorerMapper.ts
├── filesystem/
│   ├── FileSystemService.ts             # 文件系统操作服务
│   └── FileWatcher.ts                   # 文件监听器
├── git/
│   ├── GitService.ts                    # Git 操作服务
│   └── GitStatusParser.ts               # Git 状态解析器
└── index.ts                             # 导出接口
```

## 设计原则

1. **依赖反转**: 基础设施层依赖领域层的接口
2. **适配器模式**: 将外部技术（Prisma、simple-git）适配到领域接口
3. **关注点分离**: 数据库操作、文件系统、Git 操作分离
4. **错误转换**: 将基础设施错误转换为领域错误
