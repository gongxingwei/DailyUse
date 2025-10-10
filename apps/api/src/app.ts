import express, {
  type Express,
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import accountRoutes from './modules/account/interface/http/routes';
import { authenticationRoutes } from './modules/authentication';
import { taskRouter } from './modules/task';
import { goalRouter, goalDirRouter } from './modules/goal';
import { reminderRouter } from './modules/reminder';
import { scheduleRoutes } from './modules/schedule';
import {
  notificationRoutes,
  notificationPreferenceRoutes,
  notificationTemplateRoutes,
  notificationSSERoutes,
} from './modules/notification/interface';
import userPreferencesRoutes from './modules/setting/interface/http/routes/userPreferencesRoutes';
import themeRoutes from './modules/theme/interface/http/routes/themeRoutes';
import { createEditorRoutes, EditorAggregateController } from './modules/editor';
import editorWorkspaceRoutes from './modules/editor/interface/http/routes/editorRoutes';
import { EditorDomainService } from '@dailyuse/domain-server';
import { EditorApplicationService } from './modules/editor/application/services/EditorApplicationService.js';
import { InMemoryDocumentRepository } from './modules/editor/infrastructure/repositories/memory/InMemoryDocumentRepository.js';
import { InMemoryWorkspaceRepository } from './modules/editor/infrastructure/repositories/memory/InMemoryWorkspaceRepository.js';
import { RepositoryController, createRepositoryRoutes } from './modules/repository/index.js';
import { RepositoryApplicationService } from './modules/repository/application/services/ApplicationService.js';
import {
  PrismaRepositoryRepository,
  PrismaResourceRepository,
} from './modules/repository/infrastructure/index.js';
import { prisma } from './config/prisma.js';
import { EventPublisher } from './modules/setting/infrastructure/events/EventPublisher';
import { UserPreferencesApplicationService } from './modules/setting/application/services/UserPreferencesApplicationService';
import { PrismaUserPreferencesRepository } from './modules/setting/infrastructure/repositories/PrismaUserPreferencesRepository';
import { ThemeEventListeners } from './modules/theme/application/events/ThemeEventListeners';
import { ThemeApplicationService } from './modules/theme/application/services/ThemeApplicationService';
import { PrismaUserThemePreferenceRepository } from './modules/theme/infrastructure/repositories/PrismaUserThemePreferenceRepository';
import { authMiddleware, optionalAuthMiddleware } from './shared/middlewares';
import { setupSwagger } from './config/swagger.js';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('Express');
const app: Express = express();

// Env / CORS origins (comma separated)
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin) return callback(null, true); // allow non-browser clients
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);
app.use(compression());

// API v1 router
const api = Router();
api.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// 挂载账户路由到api路由器
api.use('', accountRoutes);

// 挂载认证路由到 api 路由器 (登录/登出/刷新等) - 不需要认证
api.use('', authenticationRoutes);

// 应用认证中间件到需要认证的路由
// 注意：认证相关的路由（如登录、注册）应该放在认证中间件之前

// 挂载任务管理路由 - 需要认证
api.use('/tasks', authMiddleware, taskRouter);

// 挂载目标管理路由 - 需要认证
api.use('/goals', authMiddleware, goalRouter);

// 挂载目标目录管理路由 - 需要认证
api.use('/goal-dirs', authMiddleware, goalDirRouter);

// 挂载提醒管理路由 - 需要认证
api.use('/reminders', authMiddleware, reminderRouter);

// 挂载任务调度管理路由 - 部分需要认证
// SSE事件流端点不需要认证，其他端点需要认证
api.use(
  '/schedules',
  (req, res, next) => {
    // SSE 事件流端点不需要认证
    if (req.path.startsWith('/events')) {
      return next();
    }
    // 其他端点需要认证
    return authMiddleware(req, res, next);
  },
  scheduleRoutes,
);

// 挂载编辑器路由 - 需要认证
const editorDomainService = new EditorDomainService();
const documentRepository = new InMemoryDocumentRepository();
const workspaceRepository = new InMemoryWorkspaceRepository();
const editorApplicationService = new EditorApplicationService(
  editorDomainService,
  documentRepository,
  workspaceRepository,
);
EditorAggregateController.initialize(editorApplicationService);
const editorRoutes = createEditorRoutes();
api.use('/editor', authMiddleware, editorRoutes);

// 挂载新的 EditorWorkspace 路由（DDD 架构）- 需要认证
api.use('/editor-workspaces', authMiddleware, editorWorkspaceRoutes);

// 挂载仓储路由
const repositoryRepository = new PrismaRepositoryRepository(prisma);
const resourceRepository = new PrismaResourceRepository(prisma);
const repositoryApplicationService = new RepositoryApplicationService(
  repositoryRepository,
  resourceRepository,
);
RepositoryController.initialize(repositoryApplicationService);
const repositoryRoutes = createRepositoryRoutes();
api.use('/repositories', authMiddleware, repositoryRoutes);

// 挂载用户偏好设置路由 - 需要认证
api.use('/settings/preferences', authMiddleware, userPreferencesRoutes);

// 挂载主题管理路由 - 需要认证
api.use('/theme', authMiddleware, themeRoutes);

// 挂载通知 SSE 路由 - 必须在 /notifications 之前！（避免被 authMiddleware 拦截）
// token 通过 URL 参数传递，路由内部自行验证
api.use('/notifications/sse', notificationSSERoutes);

// 挂载通知管理路由 - 需要认证
api.use('/notifications', authMiddleware, notificationRoutes);
api.use('/notification-preferences', authMiddleware, notificationPreferenceRoutes);
api.use('/notification-templates', authMiddleware, notificationTemplateRoutes);

// Setup Notification Module - 初始化通知模块
// NotificationController 和 NotificationPreferenceController 使用静态服务实例
// 需要初始化 NotificationTemplateController 使其共享同一服务实例
import {
  NotificationTemplateController,
  NotificationController,
} from './modules/notification/interface';
import { NotificationApplicationService } from './modules/notification/application/services/NotificationApplicationService';
import { NotificationRepository } from './modules/notification/infrastructure/repositories/NotificationRepository';
import { NotificationTemplateRepository } from './modules/notification/infrastructure/repositories/NotificationTemplateRepository';
import { NotificationPreferenceRepository } from './modules/notification/infrastructure/repositories/NotificationPreferenceRepository';

const notificationService = new NotificationApplicationService(
  new NotificationRepository(prisma),
  new NotificationTemplateRepository(prisma),
  new NotificationPreferenceRepository(prisma),
);

// 初始化 NotificationTemplateController
NotificationTemplateController.initialize(notificationService);

logger.info('Notification module initialized successfully');

// Setup event system - 设置事件系统
// 初始化事件发布器
const eventPublisher = new EventPublisher();

// 初始化 UserPreferencesApplicationService 并设置事件发布器
const userPreferencesRepository = new PrismaUserPreferencesRepository(prisma);
const userPreferencesService = new UserPreferencesApplicationService(userPreferencesRepository);
userPreferencesService.setEventPublisher(eventPublisher);

// 初始化 ThemeApplicationService
const themeRepository = new PrismaUserThemePreferenceRepository(prisma);
const themeService = new ThemeApplicationService(themeRepository);

// 注册 Theme 事件监听器
const themeEventListeners = new ThemeEventListeners(themeService);
themeEventListeners.registerListeners();

logger.info('Event system initialized successfully');

// Setup Swagger documentation
setupSwagger(app);

app.use('/api/v1', api);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Not Found' });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Express error handler caught error', err, {
    status: err?.status,
    code: err?.code,
    message: err?.message,
  });
  const status = Number(err?.status ?? 500);
  res.status(status).json({
    code: err?.code ?? 'INTERNAL_ERROR',
    message: err?.message ?? 'Internal Server Error',
  });
});

export default app;
