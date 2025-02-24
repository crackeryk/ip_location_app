// ip_location.ts
// 需要 Deno 运行: deno run --allow-net ip_location.ts

// 定义响应数据的类型
interface GeoData {
    ip: string;
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  }
  
  // 获取地理位置的函数
  async function getGeoLocation(ip: string): Promise<GeoData> {
    try {
      // 使用 ip-api.com 的免费服务获取位置信息
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
  
  // 创建简单的 HTML 响应
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
  
  // 主服务器函数
  async function startServer() {
    const port = 8000;
    const server = Deno.listen({ port });
    console.log(`服务器运行在 http://localhost:${port}`);
  
    for await (const conn of server) {
      (async () => {
        const httpConn = Deno.serveHttp(conn);
        for await (const requestEvent of httpConn) {
          // 获取客户端 IP
          const clientIp = conn.remoteAddr.hostname === '127.0.0.1' 
            ? '127.0.0.1' 
            : conn.remoteAddr.hostname;
  
          // 获取地理位置信息
          const geoData = await getGeoLocation(clientIp);
  
          // 创建响应
          const body = createHtmlResponse(geoData);
          await requestEvent.respondWith(
            new Response(body, {
              status: 200,
              headers: { "content-type": "text/html; charset=utf-8" },
            })
          );
        }
      })();
    }
  }
  
  // 运行服务器
  startServer().catch(console.error);