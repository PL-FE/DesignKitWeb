# DesignKit Web

> 面向设计与工程领域的现代化超轻量在线工具引擎

[![Vue](https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-646cff?logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 简介

DesignKit Web 是配套 [DesignKit](https://github.com/PL-FE/DesignKit) 后端的前端界面，提供无需安装、开箱即用的在线工具集，目标是让设计师和工程师以最低成本完成文件处理。

**隐私优先**：所有文件仅在处理期间短暂使用，完成后立即释放或删除，服务器不留存任何副本。

## 功能

| 工具         | 说明                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| CAD 版本转换 | 在线将 `.dwg` / `.dxf` 文件转换至指定低版本，依托 ODA File Converter            |
| 图片压缩     | 指定目标大小（KB）自动二分调整质量，支持 JPEG / PNG / WebP 格式转换及 EXIF 清除 |

## 技术栈

- **框架**：Vue 3 + `<script setup>` + Composition API
- **语言**：TypeScript
- **构建**：Vite 6
- **UI 组件**：Element Plus
- **图标**：Iconify (`@iconify/vue`)
- **样式**：Tailwind CSS
- **路由**：Vue Router 4
- **HTTP**：Axios

## 快速开始

### 环境要求

- Node.js >= 18
- 后端服务（[DesignKit](../DesignKit)）已启动并运行在 `http://localhost:8000`

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173)

### 生产构建

```bash
npm run build
```

### 预览构建产物

```bash
npm run preview
```

## 项目结构

```
src/
├── api/           # API 请求封装
│   ├── converter.ts   # CAD 转换接口
│   ├── image.ts       # 图片压缩接口
│   └── request.ts     # Axios 实例配置
├── components/    # 公共组件
│   ├── AppHeader.vue  # 顶部导航
│   └── AppFooter.vue  # 底部信息栏
├── router/        # 路由配置
├── views/         # 页面视图
│   ├── Home.vue         # 首页
│   ├── CadConverter.vue # CAD 转换页
│   └── ImageCompressor.vue # 图片压缩页
└── App.vue        # 根组件
```

## 后端配合

本项目依赖 [DesignKit](../DesignKit) Python 后端（FastAPI）提供 API：

```
POST /api/convert          # CAD 文件版本转换
POST /api/image/compress   # 图片压缩
```

## License

[MIT](LICENSE)

## 联系方式

作者：**pengliang**  
邮箱：[penglianger@qq.com](mailto:penglianger@qq.com)  
GitHub：[https://github.com/PL-FE/DesignKitWeb](https://github.com/PL-FE/DesignKitWeb)
