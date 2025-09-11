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
import { createEditorRoutes, EditorController } from './modules/editor';
import { EditorApplicationService } from './modules/editor/application/services/EditorApplicationService.js';
import { EditorDomainService } from './modules/editor/domain/services/EditorDomainService.js';
import { RepositoryController, createRepositoryRoutes } from './modules/repository';
import { RepositoryApplicationService } from './modules/repository/application/services/RepositoryApplicationService.js';
import { RepositoryDomainService } from './modules/repository/domain/services/RepositoryDomainService.js';

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// 挂载认证路由到 api 路由器 (登录/登出/刷新等)
api.use('', authenticationRoutes);

// 挂载任务管理路由
api.use('/tasks', taskRouter);

// 挂载目标管理路由
api.use('/goals', goalRouter);

// 挂载目标目录管理路由
api.use('/goal-dirs', goalDirRouter);

// 挂载提醒管理路由
api.use('/reminders', reminderRouter);

// 挂载编辑器路由
const editorDomainService = new EditorDomainService();
const editorApplicationService = new EditorApplicationService(editorDomainService);
EditorController.initialize(editorApplicationService);
const editorRoutes = createEditorRoutes();
api.use('/editor', editorRoutes);

// TODO: 挂载仓储路由 - 待完整实现
// import { RepositoryController, createRepositoryRoutes } from './modules/repository';
// import { RepositoryApplicationService } from './modules/repository/application/services/RepositoryApplicationService.js';
// import { RepositoryDomainService } from './modules/repository/domain/services/RepositoryDomainService.js';
//
// const repositoryDomainService = new RepositoryDomainService();
// const repositoryApplicationService = new RepositoryApplicationService(repositoryDomainService);
// RepositoryController.initialize(repositoryApplicationService);
// const repositoryRoutes = createRepositoryRoutes();
// api.use('/repositories', repositoryRoutes);

app.use('/api/v1', api);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Not Found' });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = Number(err?.status ?? 500);
  res.status(status).json({
    code: err?.code ?? 'INTERNAL_ERROR',
    message: err?.message ?? 'Internal Server Error',
  });
});

export default app;
