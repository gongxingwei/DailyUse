# 前端优雅实现模式指南 🎨

> 面向新手的前端最佳实践与优雅模式详解

---

## 目录

1. [Promise 封装模式](#1-promise-封装模式)
2. [组合式函数（Composables）](#2-组合式函数composables)
3. [请求拦截与统一错误处理](#3-请求拦截与统一错误处理)
4. [表单验证的优雅实现](#4-表单验证的优雅实现)
5. [加载状态管理](#5-加载状态管理)
6. [防抖节流封装](#6-防抖节流封装)
7. [事件总线模式](#7-事件总线模式)
8. [类型安全的存储封装](#8-类型安全的存储封装)
9. [优雅的权限控制](#9-优雅的权限控制)
10. [响应式数据流](#10-响应式数据流)

---

## 1. Promise 封装模式

### 1.1 确认框封装（你提到的例子）

```typescript
// ✅ 优雅的确认框封装
export const useMessage = () => {
  // 删除确认
  const delConfirm = (content?: string, tip?: string) => {
    return ElMessageBox.confirm(
      content || t('common.delMessage'),
      tip || t('common.confirmTitle'),
      {
        confirmButtonText: t('common.ok'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        draggable: true, // Element Plus 支持拖拽
        closeOnClickModal: false, // 点击蒙层不关闭
      }
    )
  }

  // 通用确认框
  const confirm = (options: {
    message: string
    title?: string
    type?: 'success' | 'info' | 'warning' | 'error'
  }) => {
    return ElMessageBox.confirm(options.message, options.title || '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: options.type || 'info',
    })
  }

  // 成功提示
  const success = (msg: string) => ElMessage.success(msg)
  
  // 错误提示
  const error = (msg: string) => ElMessage.error(msg)

  return { delConfirm, confirm, success, error }
}

// 使用示例
const message = useMessage()

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm('确定要删除这条记录吗？')
    await deleteApi(id)
    message.success('删除成功')
    await refreshList()
  } catch (e) {
    // 用户取消操作，静默处理
    console.log('用户取消删除')
  }
}
```

**优雅之处**：
- ✅ Promise 让异步代码看起来像同步
- ✅ 统一的 UI 交互风格
- ✅ 国际化支持
- ✅ 可复用，减少重复代码
- ✅ 异常处理清晰（取消操作走 catch）

---

## 2. 组合式函数（Composables）

### 2.1 列表页面通用逻辑

```typescript
// composables/useTable.ts
export const useTable = <T>(apiFn: (params: any) => Promise<PageResult<T>>) => {
  const loading = ref(false)
  const list = ref<T[]>([])
  const total = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)

  // 获取列表
  const getList = async (params = {}) => {
    loading.value = true
    try {
      const res = await apiFn({
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        ...params,
      })
      list.value = res.data.records
      total.value = res.data.total
    } catch (error) {
      console.error('获取列表失败', error)
    } finally {
      loading.value = false
    }
  }

  // 页码改变
  const handlePageChange = (page: number) => {
    pageNum.value = page
    getList()
  }

  // 页大小改变
  const handleSizeChange = (size: number) => {
    pageSize.value = size
    pageNum.value = 1
    getList()
  }

  // 刷新当前页
  const refresh = () => getList()

  // 重置到第一页
  const reset = () => {
    pageNum.value = 1
    getList()
  }

  return {
    loading,
    list,
    total,
    pageNum,
    pageSize,
    getList,
    handlePageChange,
    handleSizeChange,
    refresh,
    reset,
  }
}

// 使用示例
const { 
  loading, 
  list, 
  total, 
  getList, 
  handlePageChange 
} = useTable(getUserListApi)

onMounted(() => getList())
```

**优雅之处**：
- ✅ 复用了分页、加载、刷新等通用逻辑
- ✅ 类型安全（泛型 `<T>`）
- ✅ 响应式状态自动管理
- ✅ 减少 80% 的模板代码

---

## 3. 请求拦截与统一错误处理

### 3.1 Axios 拦截器封装

```typescript
// utils/request.ts
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useMessage } from '@/composables/useMessage'

const message = useMessage()

// 创建实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 自动添加 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 显示全局 loading（可选）
    if (config.showLoading !== false) {
      // showLoadingIndicator()
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 隐藏 loading
    // hideLoadingIndicator()

    const res = response.data
    
    // 根据后端约定的 code 判断
    if (res.code === 2000) {
      return res // 成功直接返回
    }
    
    // 业务错误统一提示
    message.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message))
  },
  (error: AxiosError<ApiResponse>) => {
    // hideLoadingIndicator()

    // HTTP 错误统一处理
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录')
          // 跳转到登录页
          router.push('/login')
          break
        case 403:
          message.error('没有权限访问')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器错误')
          break
        default:
          message.error(data?.message || '网络错误')
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络')
    } else {
      message.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default request
```

**优雅之处**：
- ✅ 统一处理 token、loading、错误提示
- ✅ 避免每个接口都写重复的错误处理
- ✅ 对不同 HTTP 状态码做友好提示
- ✅ 业务层代码更简洁

---

## 4. 表单验证的优雅实现

### 4.1 表单验证规则封装

```typescript
// utils/validate.ts
export const useValidateRules = () => {
  // 必填校验
  const required = (message = '此项为必填项') => ({
    required: true,
    message,
    trigger: 'blur',
  })

  // 邮箱校验
  const email = () => ({
    type: 'email' as const,
    message: '请输入正确的邮箱格式',
    trigger: 'blur',
  })

  // 手机号校验
  const phone = () => ({
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入正确的手机号',
    trigger: 'blur',
  })

  // 密码强度校验
  const password = (min = 6, max = 20) => ({
    validator: (rule: any, value: string, callback: Function) => {
      if (!value) {
        callback(new Error('请输入密码'))
      } else if (value.length < min || value.length > max) {
        callback(new Error(`密码长度为 ${min}-${max} 位`))
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        callback(new Error('密码需包含大小写字母和数字'))
      } else {
        callback()
      }
    },
    trigger: 'blur',
  })

  // 自定义范围校验
  const range = (min: number, max: number, message?: string) => ({
    validator: (rule: any, value: number, callback: Function) => {
      if (value < min || value > max) {
        callback(new Error(message || `请输入 ${min}-${max} 之间的数字`))
      } else {
        callback()
      }
    },
    trigger: 'blur',
  })

  return { required, email, phone, password, range }
}

// 使用示例
const rules = useValidateRules()

const formRules = {
  username: [rules.required('请输入用户名')],
  email: [rules.required(), rules.email()],
  phone: [rules.required(), rules.phone()],
  password: [rules.required(), rules.password(8, 16)],
  age: [rules.required(), rules.range(18, 60)],
}
```

**优雅之处**：
- ✅ 验证规则可复用
- ✅ 链式调用（数组形式）
- ✅ 自定义验证器灵活强大
- ✅ 类型安全

---

## 5. 加载状态管理

### 5.1 自动管理 Loading 状态

```typescript
// composables/useLoading.ts
export const useLoading = () => {
  const loading = ref(false)

  // 自动包装异步函数
  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    loading.value = true
    try {
      return await fn()
    } finally {
      loading.value = false
    }
  }

  return { loading, withLoading }
}

// 使用示例
const { loading, withLoading } = useLoading()

const handleSubmit = async () => {
  await withLoading(async () => {
    await submitFormApi(formData.value)
    message.success('提交成功')
    await getList()
  })
}

// 模板中
<el-button :loading="loading" @click="handleSubmit">
  提交
</el-button>
```

### 5.2 全局 Loading

```typescript
// composables/useGlobalLoading.ts
let loadingInstance: any = null
let requestCount = 0

export const useGlobalLoading = () => {
  const show = () => {
    requestCount++
    if (requestCount === 1) {
      loadingInstance = ElLoading.service({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.7)',
      })
    }
  }

  const hide = () => {
    requestCount = Math.max(0, requestCount - 1)
    if (requestCount === 0) {
      loadingInstance?.close()
      loadingInstance = null
    }
  }

  return { show, hide }
}

// 在 axios 拦截器中使用
const globalLoading = useGlobalLoading()

request.interceptors.request.use(config => {
  if (config.showGlobalLoading !== false) {
    globalLoading.show()
  }
  return config
})

request.interceptors.response.use(
  response => {
    globalLoading.hide()
    return response
  },
  error => {
    globalLoading.hide()
    return Promise.reject(error)
  }
)
```

**优雅之处**：
- ✅ 自动管理 loading 状态，无需手动 true/false
- ✅ 支持多个请求的 loading 计数
- ✅ 避免 loading 闪烁

---

## 6. 防抖节流封装

### 6.1 VueUse 风格的防抖节流

```typescript
// composables/useDebounce.ts
import { ref, watch, unref, type Ref } from 'vue'

export const useDebounceFn = <T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
) => {
  let timer: ReturnType<typeof setTimeout> | null = null

  const debouncedFn = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }

  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { debouncedFn, cancel }
}

export const useDebounce = <T>(value: Ref<T>, delay = 300) => {
  const debounced = ref(unref(value)) as Ref<T>

  let timer: ReturnType<typeof setTimeout> | null = null

  watch(value, (newValue) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = newValue
    }, delay)
  })

  return debounced
}

// 使用示例
const searchText = ref('')
const debouncedSearch = useDebounce(searchText, 500)

watch(debouncedSearch, (value) => {
  // 只有在用户停止输入 500ms 后才触发搜索
  performSearch(value)
})

// 防抖函数
const { debouncedFn } = useDebounceFn(handleSearch, 500)
```

### 6.2 节流封装

```typescript
// composables/useThrottle.ts
export const useThrottleFn = <T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
) => {
  let lastTime = 0

  const throttledFn = (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn(...args)
    }
  }

  return { throttledFn }
}

// 使用示例 - 滚动加载
const { throttledFn: handleScroll } = useThrottleFn(() => {
  const scrollTop = document.documentElement.scrollTop
  const clientHeight = document.documentElement.clientHeight
  const scrollHeight = document.documentElement.scrollHeight

  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadMore()
  }
}, 200)

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
```

**优雅之处**：
- ✅ 提升性能，避免频繁触发
- ✅ 改善用户体验（搜索、滚动）
- ✅ 可取消的防抖

---

## 7. 事件总线模式

### 7.1 类型安全的事件总线

```typescript
// utils/eventBus.ts
import mitt, { type Emitter } from 'mitt'

// 定义事件类型
type Events = {
  'user:login': { userId: string; username: string }
  'user:logout': void
  'notification:new': { id: number; message: string }
  'theme:change': 'light' | 'dark'
}

// 创建类型安全的事件总线
export const eventBus: Emitter<Events> = mitt<Events>()

// 使用示例
// 发送事件
eventBus.emit('user:login', { userId: '123', username: 'John' })

// 监听事件
eventBus.on('user:login', (data) => {
  console.log('用户登录:', data.username) // ✅ TypeScript 自动提示
})

// 一次性监听
eventBus.on('notification:new', (data) => {
  ElNotification({
    title: '新通知',
    message: data.message,
  })
})

// 移除监听
const handler = (theme: 'light' | 'dark') => {
  document.documentElement.className = theme
}
eventBus.on('theme:change', handler)
// ... 稍后
eventBus.off('theme:change', handler)
```

### 7.2 组件间通信

```vue
<!-- ComponentA.vue -->
<script setup lang="ts">
import { eventBus } from '@/utils/eventBus'

const handleLogin = async () => {
  await loginApi()
  eventBus.emit('user:login', { userId: '123', username: 'John' })
}
</script>

<!-- ComponentB.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { eventBus } from '@/utils/eventBus'

const handleUserLogin = (data: { userId: string; username: string }) => {
  console.log('用户已登录:', data.username)
  // 更新用户信息
}

onMounted(() => {
  eventBus.on('user:login', handleUserLogin)
})

onUnmounted(() => {
  eventBus.off('user:login', handleUserLogin)
})
</script>
```

**优雅之处**：
- ✅ 跨组件通信无需 props drilling
- ✅ 类型安全（TypeScript）
- ✅ 解耦组件依赖

---

## 8. 类型安全的存储封装

### 8.1 LocalStorage 封装

```typescript
// utils/storage.ts
interface StorageData {
  token: string
  userInfo: {
    id: number
    username: string
    avatar: string
  }
  settings: {
    theme: 'light' | 'dark'
    language: 'zh-CN' | 'en-US'
  }
}

class Storage {
  private prefix = 'app_'

  // 设置
  set<K extends keyof StorageData>(
    key: K,
    value: StorageData[K],
    expire?: number // 过期时间（秒）
  ) {
    const data = {
      value,
      expire: expire ? Date.now() + expire * 1000 : null,
    }
    localStorage.setItem(this.prefix + key, JSON.stringify(data))
  }

  // 获取
  get<K extends keyof StorageData>(key: K): StorageData[K] | null {
    const item = localStorage.getItem(this.prefix + key)
    if (!item) return null

    try {
      const data = JSON.parse(item)
      
      // 检查是否过期
      if (data.expire && Date.now() > data.expire) {
        this.remove(key)
        return null
      }
      
      return data.value
    } catch {
      return null
    }
  }

  // 删除
  remove<K extends keyof StorageData>(key: K) {
    localStorage.removeItem(this.prefix + key)
  }

  // 清空
  clear() {
    localStorage.clear()
  }
}

export const storage = new Storage()

// 使用示例
storage.set('token', 'xxx-token-xxx', 7200) // 2小时后过期
storage.set('userInfo', { 
  id: 1, 
  username: 'John', 
  avatar: 'avatar.jpg' 
})

const token = storage.get('token') // ✅ TypeScript 知道返回 string | null
const userInfo = storage.get('userInfo') // ✅ TypeScript 知道返回 UserInfo | null
```

**优雅之处**：
- ✅ 类型安全（TypeScript 自动提示）
- ✅ 支持过期时间
- ✅ 统一前缀避免冲突
- ✅ 自动序列化/反序列化

---

## 9. 优雅的权限控制

### 9.1 指令式权限控制

```typescript
// directives/permission.ts
import type { Directive } from 'vue'
import { useUserStore } from '@/stores/user'

export const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()
    const permissions = userStore.permissions

    if (value && value instanceof Array && value.length > 0) {
      const hasPermission = permissions.some((perm) => value.includes(perm))

      if (!hasPermission) {
        // 移除元素
        el.parentNode?.removeChild(el)
      }
    }
  },
}

// main.ts
app.directive('permission', permission)

// 使用示例
<template>
  <!-- 只有拥有 'user:delete' 权限的用户才能看到删除按钮 -->
  <el-button 
    v-permission="['user:delete']" 
    type="danger" 
    @click="handleDelete"
  >
    删除
  </el-button>

  <!-- 多权限（或关系） -->
  <el-button 
    v-permission="['user:edit', 'admin:all']"
  >
    编辑
  </el-button>
</template>
```

### 9.2 函数式权限控制

```typescript
// composables/usePermission.ts
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export const usePermission = () => {
  const userStore = useUserStore()

  const hasPermission = (permission: string | string[]) => {
    const permissions = userStore.permissions
    
    if (typeof permission === 'string') {
      return permissions.includes(permission)
    }
    
    // 数组：只要有一个权限就返回 true
    return permission.some((perm) => permissions.includes(perm))
  }

  const hasAllPermissions = (permissions: string[]) => {
    const userPermissions = userStore.permissions
    return permissions.every((perm) => userPermissions.includes(perm))
  }

  return {
    hasPermission,
    hasAllPermissions,
  }
}

// 使用示例
const { hasPermission } = usePermission()

const canDelete = computed(() => hasPermission('user:delete'))

<el-button 
  v-if="canDelete" 
  type="danger"
  @click="handleDelete"
>
  删除
</el-button>
```

**优雅之处**：
- ✅ 前端权限控制清晰
- ✅ 指令式和函数式两种方式
- ✅ 支持单权限和多权限判断

---

## 10. 响应式数据流

### 10.1 Pinia Store 的优雅实践

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  // Getters
  const isLogin = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '游客')
  const avatar = computed(() => userInfo.value?.avatar || '/default-avatar.png')

  // Actions
  const setToken = (newToken: string) => {
    token.value = newToken
    storage.set('token', newToken)
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
    storage.set('userInfo', info)
  }

  const login = async (credentials: { username: string; password: string }) => {
    const res = await loginApi(credentials)
    setToken(res.data.token)
    setUserInfo(res.data.userInfo)
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    storage.remove('token')
    storage.remove('userInfo')
    router.push('/login')
  }

  // 初始化（从本地存储恢复）
  const init = () => {
    const savedToken = storage.get('token')
    const savedUserInfo = storage.get('userInfo')
    
    if (savedToken) token.value = savedToken
    if (savedUserInfo) userInfo.value = savedUserInfo
  }

  return {
    token,
    userInfo,
    isLogin,
    username,
    avatar,
    setToken,
    setUserInfo,
    login,
    logout,
    init,
  }
})

// App.vue - 应用初始化
onMounted(() => {
  const userStore = useUserStore()
  userStore.init()
})
```

**优雅之处**：
- ✅ Setup 语法更简洁
- ✅ 响应式状态自动同步到组件
- ✅ TypeScript 类型推导完美
- ✅ 持久化存储自动恢复

---

## 总结

### 优雅代码的核心原则

1. **DRY（Don't Repeat Yourself）** - 不要重复自己
   - 封装通用逻辑到 Composables
   - 提取重复的验证规则、API 调用

2. **单一职责** - 每个函数/组件只做一件事
   - `delConfirm` 只负责弹窗
   - `useTable` 只负责表格状态

3. **类型安全** - TypeScript 让代码更健壮
   - 定义清晰的接口和类型
   - 利用泛型提高复用性

4. **异步优雅处理** - Promise/Async-Await
   - 避免回调地狱
   - 统一错误处理

5. **用户体验优先** - Loading、提示、防抖
   - 给用户及时反馈
   - 避免重复请求

### 学习路径建议

1. **基础阶段**
   - 熟悉 Promise、Async/Await
   - 理解 Vue Composition API

2. **进阶阶段**
   - 学习 TypeScript
   - 掌握 Composables 封装

3. **高级阶段**
   - 设计自己的工具库
   - 优化性能（防抖节流、虚拟列表）

### 推荐资源

- [VueUse](https://vueuse.org/) - Vue Composition API 工具集
- [Pinia](https://pinia.vuejs.org/) - Vue 状态管理
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

希望这篇指南能帮助你写出更优雅的前端代码！🚀
