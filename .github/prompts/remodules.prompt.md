---
mode: agent
---
Define the task to achieve, including specific requirements, constraints, and success criteria.

# 这是有关模块重构，或者说模块新增的提示词

## 任务目标

重新设计并实现模块

主要部分包括：
- contracts 包
- domain-server 包
- domain-client 包
- api 项目
- web 项目

## 任务流程

我一般会先生成基础的定义文档，确认差不多后，再生成 contracts 包，然后是 domain-server、domain-client 包，最后是 api 和 web 项目

## 任务说明

我一般会直接说要你帮我实现哪些模块的哪些部分，
我需要你知道是的一定要注意代码规范、设计原则、项目结构等，一定要严格参考已有的代码风格和设计原则，一定要参考 repository 模块。

## 易错点

我将记录下你犯过的一些错误，避免你再犯

### 细节问题

某个模块比如 goal 要使用 sharedContracts 里面的类型，可以直接在 contracts 包的模块中重新导出,在 contracts 的 index 中导出命名空间就不会冲突了

```ts
/**
 * Goal Module Enums
 * 目标模块枚举定义
 *
 * 注意：枚举定义放在独立文件中，因为枚举通常是通用的，
 * 可以在 Server、Client、Persistence 层之间共享
 */

// ============ 目标相关枚举 ============
import { ImportanceLevel,UrgencyLevel } from '../../shared/index';

export { ImportanceLevel,UrgencyLevel };
```

在 domain-client、domain-server 包中导入 contracts 包的类型时，应该**使用命名空间的方式**从 `xxxContracts` 中导入，而不是直接导入具体的类型，并且**直接在顶部使用别名**比如：
```ts
import { goalContracts } from '@dailyuse/contracts';
type ImportanceLevel = goalContracts.ImportanceLevel;
type UrgencyLevel = goalContracts.UrgencyLevel;
const ImportanceLevel = goalContracts.ImportanceLevel;
const UrgencyLevel = goalContracts.UrgencyLevel;
```

### 时间字段问题

在 persistenceDTO 和 仓储层 和 其他DTO 数据中，时间字段都使用时间戳（timestamp）格式，number 类型！！！

### contracts 包

**注意文件结构**：
- 每个模块放在 `modules/模块名/` 目录下
- 每个模块有 `enums.ts`、`value-objects/`、`entities/`、`aggregates/`、`api-requests.ts`、`index.ts` 文件
- 每个值对象、实体、聚合根都有 ServerDTO、ClientDTO、PersistenceDTO 三种 DTO
- 每个值对象、实体、聚合根都有两套接口，分别是 Server 和 Client，应该分成两个文件。

### domain-server 包

**注意文件结构**：
- 每个模块放在 `modules/模块名/` 目录下
- 每个模块有 `repositories/`（仓储接口）、`services/`（领域服务）、`aggregates/`（聚合根实现）、`entities/`（实体实现）、`value-objects/`（值对象实现）、`index.ts` 文件，只有领域层内容，不需要其他内容比如应用服务、控制器、持久层等
- 每个聚合根、实体、值对象应该继承领域基类，并且实现 contracts 包中的接口
- 构造函数中 uuid 不一定要传入，可以通过基类的 `generateUUID()` 方法生成
- 类型要严格对应 contracts 包中的定义

### domain-client 包

**注意文件结构**：
- 每个模块放在 `modules/模块名/` 目录下
- 每个模块有 `aggregates/`（聚合根实现）、`entities/`（实体实现）、`value-objects/`（值对象实现）、`index.ts` 文件，只有客户端领域层内容
- 每个聚合根、实体、值对象应该继承领域基类，并且实现 contracts 包中的接口
- 构造函数中 uuid 不一定要传入，可以通过基类的 `generateUUID()` 方法生成
- 类型要严格对应 contracts 包中的定义

### api 项目

**注意文件结构**：
- 每个模块放在 `modules/模块名/` 目录下，具体参考 repository 模块
- api 服务返回给客户端的数据应该是 contracts 包中的 ClientDTO 类型，所以在return 是应该调用 toClientDTO() 方法，而非 toServerDTO() 方法
- 仓储层中的 prisma 应该直接使用 prisma client 进行操作，不需要 new PrismaClient()，映射应该利用 toPersistenceDTO() 方法 和 fromPersistenceDTO() 方法

#### application 层

```ts
// applicationService 类要有 getInstance() 静态方法，返回单例
// applicationService 类要有 createInstance() 静态方法，支持依赖注入

export class RepositoryApplicationService {
  private static instance: RepositoryApplicationService;
  private domainService: RepositoryDomainService;
  private repositoryRepository: IRepositoryRepository;

  private constructor(repositoryRepository: IRepositoryRepository) {
    this.domainService = new RepositoryDomainService(repositoryRepository);
    this.repositoryRepository = repositoryRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    repositoryRepository?: IRepositoryRepository,
  ): Promise<RepositoryApplicationService> {
    const container = RepositoryContainer.getInstance();
    const repo = repositoryRepository || container.getRepositoryAggregateRepository();

    RepositoryApplicationService.instance = new RepositoryApplicationService(repo);
    return RepositoryApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<RepositoryApplicationService> {
    if (!RepositoryApplicationService.instance) {
      RepositoryApplicationService.instance = await RepositoryApplicationService.createInstance();
    }
    return RepositoryApplicationService.instance;
  }
}
```

### web 项目

**注意文件结构**：
- 每个模块放在 `modules/模块名/` 目录下，具体参考 repository 模块
