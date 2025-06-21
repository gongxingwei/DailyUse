# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## 功能

- 用户管理  
  账户管理  
  数据管理 
- 知识仓库
  用于存储 markdown 文档  
  存储资源等的容器  
  可以创建 文档仓库、图片仓库  
  仓库的添加、修改、删除、展示
- 待办任务  
  任务的添加、修改、删除、展示  
  桌面弹窗提醒  
  任务留档  
- Markdown 编辑器  
  编辑功能  
  支持分屏、预览、窗口大小拖拽调整  
  实现可视化 git 功能  
- OKR目标管理  
  管理目标  
- 提醒功能
  添加提醒事项  
  提醒事项管理  
  弹窗提醒  
- 快速启动器  
  alt + space 唤醒快速启动窗口，通过拖拽或文件选择的方式添加快捷方式  
  创建工具快捷方式  
  工具分类  
  工具删除  
- 应用设置  
  深色和浅色主题切换
  中英文切换  
  编辑器相关设置  
  开机自启动  

待实现
- 学习内容推荐
  关联目标  
  自定义推荐关键字  
  删除关联目标  
- b站等的订阅消息转发  
- 收藏页面  
- RSS  
- 动作脚本  
- 知识分享平台  
  分享仓库文档  
  点赞  
  收藏  
  搜索知识  
