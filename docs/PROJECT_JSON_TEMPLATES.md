# 推荐的 project.json 模板

## 应用程序模板 (apps/*)

### Web 应用 (apps/web/project.json)
```json
{
  "name": "web",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/web/src",
  "tags": ["scope:web", "type:app", "platform:browser"],
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "defaultConfiguration": "production",
      "options": {
        "outputPath": "dist/apps/web"
      },
      "configurations": {
        "development": {
          "mode": "development",
          "sourcemap": true
        },
        "production": {
          "mode": "production",
          "sourcemap": false
        }
      }
    },
    "serve": {
      "executor": "@nx/vite:dev-server",
      "defaultConfiguration": "development",
      "options": {
        "buildTarget": "web:build"
      },
      "configurations": {
        "development": {
          "buildTarget": "web:build:development",
          "hmr": true
        },
        "production": {
          "buildTarget": "web:build:production"
        }
      }
    },
    "preview": {
      "executor": "@nx/vite:preview-server",
      "defaultConfiguration": "development",
      "options": {
        "buildTarget": "web:build"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "passWithNoTests": true,
        "reportsDirectory": "../../coverage/apps/web"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/web/**/*.{ts,tsx,js,jsx,vue}"]
      }
    }
  }
}
```

### API 应用 (apps/api/project.json)
```json
{
  "name": "api",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/api/src",
  "tags": ["scope:api", "type:app", "platform:node"],
  "targets": {
    "build": {
      "executor": "@nx/esbuild:esbuild",
      "outputs": ["{options.outputPath}"],
      "defaultConfiguration": "production",
      "options": {
        "platform": "node",
        "outputPath": "dist/apps/api",
        "format": ["cjs"],
        "bundle": false,
        "main": "apps/api/src/main.ts",
        "tsConfig": "apps/api/tsconfig.app.json",
        "assets": ["apps/api/src/assets"],
        "generatePackageJson": true,
        "esbuildOptions": {
          "sourcemap": true,
          "outExtension": {
            ".js": ".js"
          }
        }
      },
      "configurations": {
        "development": {},
        "production": {
          "esbuildOptions": {
            "sourcemap": false,
            "outExtension": {
              ".js": ".js"
            }
          }
        }
      }
    },
    "serve": {
      "executor": "@nx/js:node",
      "defaultConfiguration": "development",
      "options": {
        "buildTarget": "api:build"
      },
      "configurations": {
        "development": {
          "buildTarget": "api:build:development"
        },
        "production": {
          "buildTarget": "api:build:production"
        }
      }
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm tsx watch apps/api/src/main.ts",
        "color": true
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "apps/api/jest.config.ts",
        "passWithNoTests": true
      },
      "configurations": {
        "ci": {
          "ci": true,
          "coverage": true
        }
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/api/**/*.ts"]
      }
    },
    "db:migrate": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm prisma migrate dev",
        "cwd": "apps/api"
      }
    },
    "db:generate": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm prisma generate",
        "cwd": "apps/api"
      }
    },
    "db:studio": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm prisma studio",
        "cwd": "apps/api"
      }
    }
  }
}
```

### Desktop 应用 (apps/desktop/project.json)
```json
{
  "name": "desktop",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/desktop/src",
  "tags": ["scope:desktop", "type:app", "platform:electron"],
  "targets": {
    "build": {
      "executor": "@nx/esbuild:esbuild",
      "outputs": ["{options.outputPath}"],
      "defaultConfiguration": "production",
      "options": {
        "platform": "node",
        "outputPath": "dist/apps/desktop",
        "format": ["cjs"],
        "bundle": true,
        "main": "apps/desktop/src/main/main.ts",
        "tsConfig": "apps/desktop/tsconfig.app.json",
        "assets": [
          "apps/desktop/src/assets",
          {
            "input": "apps/desktop/src/preload",
            "glob": "**/*",
            "output": "preload"
          }
        ],
        "generatePackageJson": true
      }
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "nx build desktop",
          "electron dist/apps/desktop/main.js"
        ],
        "parallel": false
      }
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm electron-vite dev",
        "color": true
      }
    },
    "package": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm electron-builder",
        "color": true
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "apps/desktop/jest.config.ts",
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/desktop/**/*.ts"]
      }
    }
  }
}
```

## 库模板 (libs/*)

### 共享库模板 (libs/shared/*/project.json)
```json
{
  "name": "shared-utils",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/shared/utils/src",
  "projectType": "library",
  "tags": ["scope:shared", "type:util"],
  "targets": {
    "build": {
      "executor": "@nx/rollup:rollup",
      "outputs": ["{options.outputPath}"],
      "options": {
        "project": "libs/shared/utils/package.json",
        "entryFile": "libs/shared/utils/src/index.ts",
        "external": ["lodash"],
        "rollupConfig": "@nx/rollup/plugins/bundle-rollup"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "passWithNoTests": true,
        "reportsDirectory": "../../../coverage/libs/shared/utils"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["libs/shared/utils/**/*.ts"]
      }
    }
  }
}
```

### 功能库模板 (libs/feature/*/project.json)
```json
{
  "name": "web-components",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/web/components/src",
  "projectType": "library",
  "tags": ["scope:web", "type:feature"],
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/web/components"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "passWithNoTests": true,
        "reportsDirectory": "../../../coverage/libs/web/components"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["libs/web/components/**/*.{ts,vue}"]
      }
    },
    "storybook": {
      "executor": "@storybook/angular:start-storybook",
      "options": {
        "port": 4400,
        "configDir": "libs/web/components/.storybook"
      }
    },
    "build-storybook": {
      "executor": "@storybook/angular:build-storybook",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/storybook/web-components",
        "configDir": "libs/web/components/.storybook"
      }
    }
  }
}
```

## 标签策略

### 范围标签 (scope:*)
- `scope:shared` - 跨平台共享的代码
- `scope:web` - Web 应用特定代码
- `scope:api` - API 应用特定代码
- `scope:desktop` - Desktop 应用特定代码

### 类型标签 (type:*)
- `type:app` - 应用程序
- `type:feature` - 功能库
- `type:ui` - UI 组件库
- `type:util` - 工具库
- `type:data-access` - 数据访问库

### 平台标签 (platform:*)
- `platform:browser` - 浏览器环境
- `platform:node` - Node.js 环境
- `platform:electron` - Electron 环境

## 依赖规则示例 (nx.json)

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"]
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"]
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json",
      "!{projectRoot}/**/*.stories.@(js|jsx|ts|tsx|mdx)"
    ],
    "sharedGlobals": []
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test", "e2e"]
      }
    }
  }
}
```
