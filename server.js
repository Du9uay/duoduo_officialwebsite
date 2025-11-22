const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.csv': 'text/csv'
};

const server = http.createServer((req, res) => {
    // 解析请求的URL并解码（支持中文文件名）
    let filePath = '.' + decodeURIComponent(req.url);
    if (filePath === './') {
        filePath = './index.html';
    }

    // 获取文件扩展名
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // 读取文件
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // 文件不存在
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - 文件未找到</h1>', 'utf-8');
            } else {
                // 服务器错误
                res.writeHead(500);
                res.end('服务器错误: ' + error.code, 'utf-8');
            }
        } else {
            // 成功返回文件
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// 获取本机IP地址
const os = require('os');
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('========================================');
    console.log('🚀 本地服务器已启动（局域网模式）！');
    console.log('========================================');
    console.log('');
    console.log(`📍 本机访问: http://localhost:${PORT}`);
    console.log(`📍 局域网访问: http://${localIP}:${PORT}`);
    console.log('');
    console.log('🌐 同一局域网内的其他设备可以通过局域网地址访问');
    console.log('');
    console.log('💡 提示: 按 Ctrl+C 停止服务器');
    console.log('');
    console.log('========================================');
    console.log('');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n\n服务器已关闭');
    process.exit(0);
});
