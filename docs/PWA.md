# 家庭 / 访客 PWA

## 当前入口与实现

- index.html 是内联 V15 家庭首页；v16.html 为旧版独立家庭入口；v17.html 是 assets 驱动的家庭入口；guest.html 是公共馆。
- 四个入口在 head 使用同一份 defer assets/js/pwa.js，独立于课程/云脚本是否成功执行。以脚本地址推导站点根目录，支持 GitHub Pages 子路径与根路径，注册根目录 sw.js，updateViaCache: none。
- 家庭 manifest 的 start_url 为 ./；guest.webmanifest 使用独立 id 与 ./guest.html，避免访客安装后自动打开家庭首页。两者共用站点范围的 worker。安装入口在 hero 内，Chromium 支持 beforeinstallprompt 时显示原生提示；其他情况显示浏览器菜单说明；iPad 使用 Safari 分享菜单。独立窗口隐藏安装入口。
- 增加 192/512 PNG 与 180 Apple 图标。保留家庭现有身份 ./。
- 删除旧 worker 的 v10.js 响应注入和硬编码 /family-growth-hub/ 匹配。v10.js 保留原文件但不再加载/预缓存。V17 缺失的 longform-depth-public2-a.js 改为仓库已有的 longform-depth-batch1.js。

## 更新策略

每次修改入口、manifest、静态脚本、样式、图标或 sw.js 后执行：

```sh
python scripts/update-pwa-cache.py
node --check sw.js
node --check assets/js/pwa.js
node --test tests/pwa.test.cjs
```

生成器读取入口实际 src/href 与 manifest 图标，路径不存在立即失败；清单与内容哈希写入 pwa-assets.js，随资源同一次提交、发布。无需手工递增版本号，不扫描缓存整个 assets 目录。新增动态静态依赖时显式加入生成器，避免漏掉页面未直接引用的依赖。

安装先完整预缓存 42 个静态资源；任何失败删除不完整的新缓存并保留旧 worker。JS/CSS 使用当前 shell 缓存，HTML/manifest 联网优先、断网读取各自预缓存。新 worker 默认等待；用户暂停播放、保存编辑后点击“更新并重新打开”才 skipWaiting，不自动打断播放。已打开的其他窗口应关闭重开或刷新以使用完整新版本。

激活仅清理同一 scope 的本应用旧缓存与已确认的 family-hub-v10-* 遗留缓存，保留其他应用缓存。未知路由不回退家庭首页；API、POST、云数据、照片、视频、外部圣经/音频不进入 worker 缓存。已下载静态课程文本可离线打开；语音离线可用性取决于系统语音包，外部音频与云同步仍需网络。

这不是权限隔离机制：同源家庭/访客共享 worker 和浏览器存储。访客页面不调用家庭模块；真正的家庭数据访问权限必须由现有服务端授权控制。

托管必须 HTTPS（开发可 localhost），sw.js 和 pwa-assets.js 应配置 Cache-Control: no-cache，HTML/manifest 也建议重新验证，JS 返回 JavaScript MIME。不能直接双击 file:// 安装。发布全部文件后联网刷新一次；已被旧 worker 注入的页面可能需要再刷新或关闭重开一次。

## 最小测试清单（需在实际 HTTPS 发布地址执行）

| 平台 / 检查 | 步骤与通过标准 |
| --- | --- |
| 电脑 Chrome / Edge：首次注册 | 使用干净浏览器配置打开家庭首页；Application → Manifest 无错误、192/512 图标加载；Service Workers 根目录 scope 正确且 active；Network 无缺失脚本或 v10.js 请求。 |
| 电脑：访客直接访问 | 使用另一干净配置直接打开 guest.html；可独立注册；安装后从桌面启动仍是 guest.html；可浏览公开课程，无家庭云请求。 |
| Android 平板 Chrome | 联网打开家庭页与访客页，点击安装（若浏览器未触发提示按菜单说明）；主屏幕图标和独立窗口正常；两种安装入口启动页正确。 |
| iPad Safari | 分别从家庭页和访客页“分享 → 添加到主屏幕”；图标正确，点击后独立窗口打开预期入口；安装不依赖 beforeinstallprompt。 |
| 离线 shell | 等 worker 激活后关闭页面，断网重开已安装应用；家庭首页、v17.html、guest.html、公开课程列表可打开；guest.html?v=17 也可打开，未知路径不得返回家庭页；外部音频/云同步不宣称离线可用。 |
| 版本更新 | 旧版窗口保持播放，发布修改后的完整清单；联网重开页面触发检查；显示更新按钮但不强制刷新；点击更新后新内容可见、旧本应用缓存清理、其他应用缓存保留。 |
| 失败更新 | 在测试部署使一个必需资源 404；安装失败，旧 worker/缓存仍可离线打开；补齐资源并重新生成清单后更新恢复。 |
| 隐私与兼容 | Cache Storage 仅有清单静态资源，无 API 响应/照片/家庭动态；无 serviceWorker 或非安全上下文时主页面仍能正常使用。 |

## 已执行与待验证

已执行：清单资源存在性检查、生成可重复性、JS 语法检查、worker 生命周期/路由/缓存策略模拟测试。实际平板、电脑安装 UI 与生产 HTTPS 离线启动未在本环境执行，按上表验收。
