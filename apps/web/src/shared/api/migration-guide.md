# 前端API系统迁移指南

## 概述

本文档指导如何从旧的axios配置迁移到新的统一API系统。

## 迁移步骤

### 1. 替换导入语句

#### 旧方式
```typescript
import axios from 'axios';
import { httpFactory } from '@/shared/http/http-factory';
```

#### 新方式
```typescript
import { api, AuthService, AccountService } from '@/shared/api';
```

### 2. 请求方式对比

#### 基础请求

**旧方式:**
```typescript
// 需要手动配置认证头
const response = await axios.get('/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = response.data;
```

**新方式:**
```typescript
// 自动处理认证和响应数据提取
const data = await api.get('/users');
```

#### 错误处理

**旧方式:**
```typescript
try {
  const response = await axios.get('/api/data');
  return response.data;
} catch (error) {
  if (error.response?.status === 401) {
    // 手动处理认证错误
    router.push('/login');
  }
  throw error;
}
```

**新方式:**
```typescript
try {
  const data = await api.get('/data');
  return data;
} catch (error) {
  // 统一错误格式，自动处理认证失败
  console.error('业务错误:', error.message);
  if (error.errors) {
    error.errors.forEach(err => {
      console.error(`${err.field}: ${err.message}`);
    });
  }
}
```

#### 文件上传

**旧方式:**
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await axios.post('/api/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  onUploadProgress: (progressEvent) => {
    const progress = (progressEvent.loaded / progressEvent.total) * 100;
    console.log(`上传进度: ${progress}%`);
  }
});
```

**新方式:**
```typescript
const result = await api.upload('/upload', file, {
  onUploadProgress: ({ progress }) => {
    console.log(`上传进度: ${progress}%`);
  }
});
```

### 3. Vue组件迁移

#### 数据获取组件

**旧组件:**
```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <UserCard 
        v-for="user in users" 
        :key="user.id" 
        :user="user" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const users = ref([]);
const loading = ref(false);
const error = ref(null);

const fetchUsers = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await axios.get('/api/users');
    users.value = response.data;
  } catch (err) {
    error.value = err.message || '获取用户列表失败';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsers);
</script>
```

**新组件:**
```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <UserCard 
        v-for="user in users" 
        :key="user.id" 
        :user="user" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { AccountService, useRequest } from '@/shared/api';

const { 
  data: users, 
  loading, 
  error 
} = useRequest(AccountService.getAccounts, { 
  immediate: true 
});
</script>
```

#### 认证状态管理

**旧方式:**
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const user = ref(null);
const token = ref(localStorage.getItem('token'));

const isAuthenticated = computed(() => !!token.value);

const login = async (credentials) => {
  try {
    const response = await axios.post('/api/auth/login', credentials);
    token.value = response.data.token;
    user.value = response.data.user;
    localStorage.setItem('token', token.value);
    
    // 设置默认请求头
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
  } catch (error) {
    throw error;
  }
};

const logout = () => {
  token.value = null;
  user.value = null;
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
  router.push('/login');
};

// 初始化时设置请求头
onMounted(() => {
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
  }
});
</script>
```

**新方式:**
```vue
<script setup lang="ts">
import { useAuth } from '@/shared/api';

const { 
  user, 
  isAuthenticated, 
  login, 
  logout 
} = useAuth();

// 所有认证逻辑都已封装好，无需手动管理
</script>
```

#### 分页列表组件

**旧组件:**
```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else>
      <UserList :users="users" />
      <Pagination 
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const users = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const totalPages = ref(0);
const pageSize = 10;

const fetchUsers = async (page = 1) => {
  try {
    loading.value = true;
    const response = await axios.get('/api/users', {
      params: { page, size: pageSize }
    });
    users.value = response.data.items;
    totalPages.value = Math.ceil(response.data.total / pageSize);
    currentPage.value = page;
  } catch (error) {
    console.error('获取用户失败:', error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  fetchUsers(page);
};

onMounted(() => fetchUsers());
</script>
```

**新组件:**
```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else>
      <UserList :users="items" />
      <Pagination 
        :current-page="page"
        :total-pages="totalPages"
        @page-change="goToPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { AccountService, usePagination } from '@/shared/api';

const {
  items,
  loading,
  page,
  totalPages,
  goToPage,
} = usePagination(AccountService.getAccounts);
</script>
```

### 4. 业务服务重构

#### 旧的服务类

```typescript
// services/userService.ts
import axios from 'axios';

export class UserService {
  private static baseURL = '/api/users';

  static async getUsers(params?: any) {
    const response = await axios.get(this.baseURL, { params });
    return response.data;
  }

  static async getUserById(id: string) {
    const response = await axios.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  static async createUser(userData: any) {
    const response = await axios.post(this.baseURL, userData);
    return response.data;
  }

  static async updateUser(id: string, userData: any) {
    const response = await axios.put(`${this.baseURL}/${id}`, userData);
    return response.data;
  }

  static async deleteUser(id: string) {
    await axios.delete(`${this.baseURL}/${id}`);
  }
}
```

#### 新的服务类

```typescript
// 直接使用现有的 AccountService
import { AccountService } from '@/shared/api';

// 或者扩展现有服务
export class UserService extends AccountService {
  // 添加额外的业务方法
  static async getUserProfile(id: string) {
    return this.getAccountById(id);
  }

  static async updateUserProfile(id: string, profile: any) {
    return this.updateAccount(id, profile);
  }
}
```

### 5. 配置迁移

#### 环境变量配置

**旧配置:**
```bash
VUE_APP_API_BASE_URL=http://localhost:3000/api
VUE_APP_TIMEOUT=10000
```

**新配置:**
```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_UPLOAD_BASE_URL=http://localhost:3000/api/v1/upload
VITE_API_TIMEOUT=10000
VITE_ENABLE_MOCK=false
VITE_LOG_LEVEL=debug
```

#### 应用初始化

**旧方式:**
```typescript
// main.ts
import axios from 'axios';

// 配置axios
axios.defaults.baseURL = import.meta.env.VUE_APP_API_BASE_URL;
axios.defaults.timeout = Number(import.meta.env.VUE_APP_TIMEOUT);

// 请求拦截器
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**新方式:**
```typescript
// main.ts
// 无需手动配置，API客户端自动初始化
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);
// API系统会自动根据环境变量配置
app.mount('#app');
```

## 迁移检查清单

### 必须替换的文件

- [ ] `src/shared/http/` 目录下的所有文件
- [ ] 直接使用 `axios` 的组件
- [ ] 手动管理认证状态的代码
- [ ] 自定义的错误处理逻辑

### 需要更新的配置

- [ ] 环境变量从 `VUE_APP_*` 改为 `VITE_*`
- [ ] API路径前缀统一为 `/api/v1`
- [ ] 移除手动的axios配置代码

### 功能验证

- [ ] 登录/登出功能正常
- [ ] API请求自动携带认证头
- [ ] 错误处理符合预期
- [ ] 文件上传功能正常
- [ ] 缓存功能工作正常
- [ ] 重试机制生效

### 性能优化验证

- [ ] 请求缓存减少重复请求
- [ ] 自动重试提高成功率
- [ ] 响应拦截器正确处理数据
- [ ] 上传进度回调正常

## 常见问题

### Q: 如何处理现有的axios拦截器？
A: 新系统已内置完整的拦截器功能，包括认证、错误处理、重试等。如需自定义，可通过配置选项调整。

### Q: 如何迁移复杂的错误处理逻辑？
A: 使用新系统的 `errorHandler` 和 `authFailHandler` 配置选项来自定义错误处理逻辑。

### Q: 原有的请求取消功能如何处理？
A: 新系统支持AbortController，可通过 `signal` 选项传入取消信号。

### Q: 如何处理不同环境的API地址？
A: 通过 `VITE_API_BASE_URL` 等环境变量配置，支持开发、测试、生产环境。

### Q: Mock数据功能如何集成？
A: 通过 `VITE_ENABLE_MOCK` 环境变量控制，可与MSW等Mock库集成。

## 迁移建议

1. **分阶段迁移**: 建议先迁移新开发的功能，再逐步替换现有代码
2. **保持兼容**: 迁移期间可以两套系统并存，确保稳定性
3. **充分测试**: 每个迁移的功能都要进行完整的功能测试
4. **文档更新**: 及时更新相关的开发文档和API文档

## 技术支持

如在迁移过程中遇到问题，可参考：
- [API使用指南](./README.md)
- [测试文件](./tests.ts)
- 项目内的示例代码
