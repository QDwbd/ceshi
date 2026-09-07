# Lucky

## 项目结构

```text
lucky/
├── backend/                    # Rust 后端（Cargo workspace）
│   ├── tauri/                  # Tauri 应用主程序
│   │   ├── src/                #   Rust 源码（配置 / 核心 / 任务 / 托盘 / 增强脚本）
│   │   ├── icons/              #   应用与托盘图标
│   │   ├── templates/          #   NSIS / MSI 安装包模板
│   │   ├── sidecar/            #   mihomo 核心（由 pnpm check 下载）
│   │   └── resources/          #   运行时资源（由 pnpm check 下载）
│   ├── sysproxy-rs/            # 系统代理设置库（workspace 成员）
│   └── tauri-plugin-deep-link/ # 深链插件（vendored）
├── src/                        # React 前端
│   ├── assets/                 #   样式 / 字体 / 图片
│   ├── components/             #   UI 组件（base / proxy / profile / setting 等）
│   ├── hooks/                  #   自定义 hooks
│   ├── locales/                #   前端 i18n（en / ru / zh）
│   ├── pages/                  #   页面（generouted 文件式路由）
│   ├── services/               #   Tauri 命令与 Clash API 封装
│   └── utils/                  #   工具函数
├── locales/                    # Rust 端 i18n（en / zh）
├── manifest/                   # mihomo 版本清单
├── scripts/                    # 构建 / 发布辅助脚本
└── .github/workflows/          # CI 工作流
```

## 环境要求

请先安装以下工具：

1. [Git](https://git-scm.com/)
2. [Node.js](https://nodejs.org/)（建议使用当前 LTS 版本）
3. [pnpm](https://pnpm.io/installation)
4. [Rust / Cargo](https://www.rust-lang.org/tools/install)（仓库包含 `rust-toolchain`，自动锁定 `stable` 工具链）
5. [Tauri v1 系统依赖](https://tauri.app/v1/guides/getting-started/prerequisites)
6. Windows 构建环境：Visual Studio Build Tools / MSVC、WebView2、LLVM 等

安装 pnpm：

```bash
npm install -g pnpm
```

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/QDwbd/lucky.git
cd lucky
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 准备 sidecar 与资源文件

开发或打包前，需要下载 mihomo 核心、系统服务、GeoIP / GeoSite 数据等运行时文件：

```bash
pnpm check
```

脚本会将以下内容分别下载到 `backend/tauri/sidecar/` 与 `backend/tauri/resources/`：

| 文件 | 用途 |
| --- | --- |
| `mihomo-*.exe` / `mihomo-alpha-*.exe` | Clash 核心 sidecar |
| `wintun.dll` | TUN 模式虚拟网卡驱动（Windows） |
| `clash-verge-service.exe` 等 | 系统服务（Windows） |
| `Country.mmdb` / `geosite.dat` / `geoip.dat` | 规则数据 |
| `enableLoopback.exe` | UWP 回环工具（Windows） |

如需强制重新下载（覆盖已存在文件），可附加 `--force`：

```bash
pnpm check --force
```

### 4. 启动开发环境

启动完整的 Tauri 桌面应用：

```bash
pnpm dev
```

仅启动 Web 前端预览：

```bash
pnpm web:dev
```

默认 Vite 开发服务端口为 `3000`。

## 常用命令

| 命令                   | 说明                               |
| ---------------------- | ---------------------------------- |
| `pnpm dev`             | 启动 Tauri 开发环境                |
| `pnpm dev:diff`        | 以附加 feature（verge-dev、死锁检测）启动开发环境 |
| `pnpm web:dev`         | 启动 Vite 前端开发服务             |
| `pnpm web:build`       | 构建前端静态资源                   |
| `pnpm web:serve`       | 本地预览前端构建产物               |
| `pnpm build`           | 构建 Windows x64 安装包（NSIS / MSI） |
| `pnpm check`           | 检查并下载 sidecar 与运行时资源    |
| `pnpm lint`            | 运行全部 lint 检查                 |
| `pnpm lint:ts`         | TypeScript 类型检查                |
| `pnpm lint:eslint`     | ESLint 检查                        |
| `pnpm lint:styles`     | Stylelint 检查                     |
| `pnpm lint:clippy`     | Rust Clippy 检查                   |
| `pnpm lint:rustfmt`    | Rust 格式检查                       |
| `pnpm test`            | 运行全部测试                       |
| `pnpm test:backend`    | 运行 Rust 后端测试                 |
| `pnpm fmt`             | 格式化前端与后端代码               |
| `pnpm portable`        | 生成便携版压缩包                   |
| `pnpm generate:manifest:latest-version` | 更新 mihomo 版本清单  |
| `pnpm prepare:release` | 准备发布版本                       |

## 构建打包

### 前端构建

```bash
pnpm web:build
```

构建产物输出到 `dist/`，Tauri 配置会将其作为桌面端打包资源。

### 桌面应用构建

```bash
pnpm build
```

当前构建脚本指定的目标平台为 `x86_64-pc-windows-msvc`，打包产物为 NSIS 安装包与 MSI
安装包，安装包模板位于 `backend/tauri/templates/`。构建完成后可在
`backend/target/x86_64-pc-windows-msvc/release/bundle/` 下找到产物。

### 便携版

构建完成后，可在 CI 环境中使用以下命令生成绿色便携版压缩包：

```bash
pnpm portable
```

## 代码检查与测试

提交前建议运行：

```bash
pnpm lint
pnpm test:backend
```

如果只修改文档，可仅运行格式检查：

```bash
pnpm lint:prettier
```

CI（`.github/workflows/build.yml`）会在每次 push 到 `main` 或定时任务中自动检查 mihomo
版本更新、构建应用并发布 GitHub Release。

## 常见问题

### `pnpm dev` / `pnpm build` 提示找不到 sidecar

请先运行 `pnpm check` 下载 mihomo 核心与运行时资源。若下载缓慢，可在运行前通过
`HTTP_PROXY` / `HTTPS_PROXY` 环境变量指定代理。

### Rust 工具链版本

仓库根目录的 `rust-toolchain` 文件固定使用 `stable` 工具链，`cargo` 会自动按该文件选择版本。

### 数据存储位置

应用数据（配置、订阅缓存、日志）存储在系统用户目录下；Windows 下如需使用自定义数据目录，
可在设置中指定，或使用便携版模式（在程序目录创建 `.config/PORTABLE` 标记文件）。

## 许可证

本项目使用 [GPL-3.0](./LICENSE) 许可证。
