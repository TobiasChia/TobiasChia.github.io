// 异世界编年史 - 主脚本
// 用于将Markdown内容转换为HTML并应用模板

// 使用marked库来解析Markdown
// 如果需要，可以通过CDN引入: <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

document.addEventListener('DOMContentLoaded', function() {
    // 检查当前页面是否是从Markdown生成的
    const mdContentElement = document.getElementById('md-content');
    if (mdContentElement) {
        // 获取要加载的Markdown文件路径
        const mdPath = mdContentElement.getAttribute('data-md-path');
        if (mdPath) {
            loadMarkdownContent(mdPath);
        }
    }
});

/**
 * 加载Markdown内容并转换为HTML
 * @param {string} path - Markdown文件路径
 */
async function loadMarkdownContent(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const mdContent = await response.text();
        
        // 解析Markdown内容
        const htmlContent = parseMarkdown(mdContent);
        
        // 将HTML内容插入到页面中
        const contentElement = document.getElementById('md-content');
        if (contentElement) {
            contentElement.innerHTML = htmlContent;
        }
    } catch (error) {
        console.error('加载Markdown内容失败:', error);
        const contentElement = document.getElementById('md-content');
        if (contentElement) {
            contentElement.innerHTML = `<div class="error">加载内容失败: ${error.message}</div>`;
        }
    }
}

/**
 * 解析Markdown内容为HTML
 * @param {string} markdown - Markdown文本
 * @returns {string} HTML内容
 */
function parseMarkdown(markdown) {
    // 如果使用marked库
    if (typeof marked !== 'undefined') {
        return marked.parse(markdown);
    }
    
    // 简单的Markdown解析实现（如果没有使用外部库）
    // 这只是一个非常基础的实现，实际应用中应该使用成熟的库
    let html = markdown;
    
    // 解析元数据（YAML front matter）
    const frontMatterMatch = html.match(/^---\n([\s\S]*?)\n---\n/);
    if (frontMatterMatch) {
        // 移除front matter
        html = html.replace(frontMatterMatch[0], '');
    }
    
    // 解析标题
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    
    // 解析粗体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 解析斜体
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 解析链接
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    // 解析段落
    html = html.replace(/^(?!<h|<ul|<ol|<li|<blockquote|<pre)(.*$)/gm, '<p>$1</p>');
    
    // 解析水平线
    html = html.replace(/^---$/gm, '<hr>');
    
    return html;
}

/**
 * 从Markdown的front matter中提取元数据
 * @param {string} markdown - Markdown文本
 * @returns {Object} 元数据对象
 */
function extractFrontMatter(markdown) {
    const frontMatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontMatterMatch) {
        return {};
    }
    
    const frontMatter = frontMatterMatch[1];
    const metadata = {};
    
    // 解析YAML格式的front matter
    const lines = frontMatter.split('\n');
    for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
            const [, key, value] = match;
            metadata[key] = value.trim();
        }
    }
    
    return metadata;
}
