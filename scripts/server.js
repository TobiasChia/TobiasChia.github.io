// 简易HTTP服务器 - 用于本地预览
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.md': 'text/markdown'
};

const server = http.createServer((req, res) => {
    console.log(`请求: ${req.url}`);
    
    // 处理根路径请求
    let filePath = req.url === '/' 
        ? path.join(__dirname, '..', 'index.html')
        : path.join(__dirname, '..', req.url);
    
    // 获取文件扩展名
    const extname = path.extname(filePath);
    
    // 设置默认的内容类型
    let contentType = MIME_TYPES[extname] || 'text/plain';
    
    // 读取文件
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 文件不存在
                console.log(`文件不存在: ${filePath}`);
                res.writeHead(404);
                res.end('404 - 文件不存在');
            } else {
                // 服务器错误
                console.log(`服务器错误: ${err.code}`);
                res.writeHead(500);
                res.end(`服务器错误: ${err.code}`);
            }
        } else {
            // 成功响应
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}/`);
    console.log(`可以访问以下页面:`);
    console.log(`- 首页: http://localhost:${PORT}/`);
    console.log(`- Markdown查看器: http://localhost:${PORT}/md-viewer.html`);
});
