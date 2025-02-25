# ip_location_app
在 Deno 上创建一个新项目并部署这个“显示 IP 和地理位置”的程序。
以下是分步说明，包括创建项目、配置环境和部署到 Deno Deploy（Deno 的云平台）。

---

### 第一步：在本地创建 Deno 项目

#### 1. 创建项目文件夹
创建一个新文件夹作为项目根目录。例如：
```bash
mkdir ip-location-app
cd ip-location-app
```

#### 2. 初始化项目
Deno 不需要像 Node.js 那样的 `package.json`，但我们可以创建一个简单的配置文件来管理依赖（可选）。不过对于这个简单项目，我们直接创建主文件即可。

创建一个名为 `main.ts` 的文件，将之前提供的代码复制进去：
```bash
touch main.ts
```
然后将以下代码粘贴到 `main.ts`（这是稍作调整后的版本，适配 Deno Deploy）：

```typescript
// main.ts
interface GeoData {
  ip: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

async function getGeoLocation(ip: string): Promise<GeoData> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=ip,country,regionName,city,lat,lon`);
    const data = await response.json();
    return {
      ip: data.ip || ip,
      country: data.country || '未知',
      region: data.regionName || '未知',
      city: data.city || '未知',
      latitude: data.lat || 0,
      longitude: data.lon || 0
    };
  } catch (error) {
    console.error('获取地理位置失败:', error);
    return {
      ip,
      country: '未知',
      region: '未知',
      city: '未知',
      latitude: 0,
      longitude: 0
    };
  }
}

function createHtmlResponse(geo: GeoData): string {
  return `
    <!DOCTYPE html>
    <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <title>你的位置信息</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .info { margin: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>你的位置信息</h1>
      <div class="info">
        <p>IP 地址: ${geo.ip}</p>
        <p>国家: ${geo.country}</p>
        <p>地区: ${geo.region}</p>
        <p>城市: ${geo.city}</p>
        <p>经纬度: ${geo.latitude}, ${geo.longitude}</p>
      </div>
    </body>
    </html>
  `;
}

// Deno Deploy 使用标准 Web API（如 Fetch API）处理请求
Deno.serve(async (req: Request) => {
  // 从请求头获取客户端 IP（Deno Deploy 提供 X-Forwarded-For）
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "未知";
  
  // 获取地理位置
  const geoData = await getGeoLocation(clientIp);
  
  // 返回 HTML 响应
  const body = createHtmlResponse(geoData);
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
});
```

#### 3. 本地测试
在项目文件夹中运行：
```bash
deno run --allow-net main.ts
```
- `--allow-net` 允许网络访问。
- 默认监听 8000 端口，打开浏览器访问 `http://localhost:8000`，你应该能看到自己的 IP 和地理位置信息（本地测试时 IP 通常是 `127.0.0.1`）。

---

### 第二步：部署到 Deno Deploy

Deno Deploy 是一个免费的云平台，可以轻松部署 Deno 应用。把这个项目部署上去，让它在线运行。

#### 1. 准备工作
- **注册 Deno Deploy**：访问 [deno.com/deploy](https://deno.com/deploy)，使用 GitHub 账号登录。
- **安装 Deno Deploy CLI（可选）**：如果你想通过命令行部署，可以安装 `deployctl`：
  ```bash
  deno install -A -f --unstable -n deployctl https://deno.land/x/deploy/deployctl.ts
  ```

#### 2. 使用 GitHub 部署（推荐）
Deno Deploy 支持直接从 GitHub 仓库部署，这是最简单的方式。

1. **创建 GitHub 仓库**：
   - 在 GitHub 上创建一个新仓库（例如 `ip-location-app`）。
   - 将本地项目推送到 GitHub：
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin https://github.com/你的用户名/ip-location-app.git
     git push -u origin main
     ```

2. **连接到 Deno Deploy**：
   - 登录 Deno Deploy 仪表盘。
   - 点击 “New Project”。
   - 选择 “Deploy from GitHub”。
   - 授权 Deno Deploy 访问你的 GitHub 账号。
   - 选择刚刚创建的 `ip-location-app` 仓库。
   - 设置入口文件为 `main.ts`。
   - 点击 “Deploy”。

3. **配置环境**：
   - Deno Deploy 会自动检测代码并分配一个域名（例如 `https://ip-location-app-abc123.deno.dev`）。
   - 无需额外配置，因为我们使用的是标准 Web API，且不需要环境变量。

4. **测试线上版本**：
   - 部署完成后，访问 Deno Deploy 提供的 URL，你应该能看到你的公网 IP 和地理位置信息。

#### 3. 通过 CLI 部署（可选）
如果你不想用 GitHub，也可以用 `deployctl` 直接部署：
```bash
deployctl deploy --project=ip-location-app main.ts --allow-net
```
- `--project` 指定项目名称（在 Deno Deploy 仪表盘创建后获取）。
- 部署后会返回一个 URL。

---

### 第三步：项目管理和扩展

#### 1. 项目结构
目前项目很简单，只有一个 `main.ts`。如果想扩展，可以这样组织：
```
ip-location-app/
├── main.ts          # 主服务器文件
├── geo.ts          # 地理位置相关函数（可以分离出来）
├── html.ts         # HTML 生成函数（可以分离出来）
└── README.md       # 项目说明
```

#### 2. 添加功能（可选扩展）
- **模块化**：将 `getGeoLocation` 和 `createHtmlResponse` 分离到单独文件，用 `export` 和 `import` 管理。
  ```typescript
  // geo.ts
  export async function getGeoLocation(ip: string): Promise<GeoData> { ... }
  ```
  ```typescript
  // main.ts
  import { getGeoLocation } from './geo.ts';
  ```

- **访问日志**：添加简单的内存日志，记录每次访问。
- **自定义域名**：在 Deno Deploy 中绑定你自己的域名。

#### 3. 提交更改
每次修改代码后，推送到 GitHub，Deno Deploy 会自动重新部署：
```bash
git add .
git commit -m "Update features"
git push
```

---

### 注意事项
1. **权限**：本地运行需要 `--allow-net`，但 Deno Deploy 自动处理网络权限。
2. **IP 来源**：
   - 本地测试显示 `127.0.0.1`。
   - Deno Deploy 使用 `x-forwarded-for` 获取真实 IP。
3. **API 限制**：`ip-api.com` 免费版有限额（45次/分钟），若需更高频率，可切换其他 API 或缓存结果。

---

### 完成！
项目已经部署到 Deno 上！本地运行可以用来开发和调试，线上版本通过 Deno Deploy 提供服务。访问你的 Deno Deploy URL（例如 `https://ip-location-app-abc123.deno.dev`），你会看到类似：
- IP 地址: 你的公网IP
- 国家: 中国
- 地区: 北京
- 城市: 北京

