// 构建脚本 - 将Markdown文件转换为HTML
const fs = require('fs');
const path = require('path');
const marked = require('marked');

// 配置marked选项
marked.setOptions({
    gfm: true, // GitHub风格的Markdown
    breaks: true, // 将换行符转换为<br>
    smartLists: true, // 使用更智能的列表行为
});

// 主目录
const contentDir = path.join(__dirname, '..', 'content');
const templatesDir = path.join(__dirname, '..', 'templates');
const outputDir = path.join(__dirname, '..');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * 从Markdown文件中提取front matter
 * @param {string} content - Markdown内容
 * @returns {Object} 包含元数据和内容的对象
 */
function extractFrontMatter(content) {
    const frontMatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontMatterRegex);
    
    if (!match) {
        return { metadata: {}, content };
    }
    
    const frontMatter = match[1];
    const metadata = {};
    
    // 解析YAML格式的front matter
    const lines = frontMatter.split('\n');
    for (const line of lines) {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            metadata[key] = value;
        }
    }
    
    // 移除front matter，只保留内容部分
    const contentWithoutFrontMatter = content.replace(match[0], '');
    
    return { metadata, content: contentWithoutFrontMatter };
}

/**
 * 将Markdown内容转换为HTML
 * @param {string} content - Markdown内容
 * @returns {string} HTML内容
 */
function convertMarkdownToHtml(content) {
    return marked.parse(content);
}

/**
 * 应用模板到HTML内容
 * @param {string} templateName - 模板名称
 * @param {Object} data - 要插入模板的数据
 * @returns {string} 完整的HTML页面
 */
function applyTemplate(templateName, data) {
    const templatePath = path.join(templatesDir, `${templateName}.html`);
    
    if (!fs.existsSync(templatePath)) {
        console.error(`模板不存在: ${templatePath}`);
        return null;
    }
    
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // 替换简单的变量 {{variable}}
    template = template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        return data[trimmedKey] !== undefined ? data[trimmedKey] : match;
    });
    
    // 处理数组/条件块 {{#variable}}...{{/variable}}
    template = template.replace(/\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
        const trimmedKey = key.trim();
        if (Array.isArray(data[trimmedKey])) {
            return data[trimmedKey].map(item => {
                let itemContent = content;
                // 替换项目中的变量
                Object.keys(item).forEach(itemKey => {
                    itemContent = itemContent.replace(
                        new RegExp(`\\{\\{${itemKey}\\}\\}`, 'g'),
                        item[itemKey]
                    );
                });
                return itemContent;
            }).join('\n');
        }
        return data[trimmedKey] ? content : '';
    });
    
    return template;
}

/**
 * 处理首页
 */
function processHomePage() {
    const indexPath = path.join(contentDir, 'index.md');
    
    if (!fs.existsSync(indexPath)) {
        console.error('首页Markdown文件不存在');
        return;
    }
    
    const content = fs.readFileSync(indexPath, 'utf8');
    const { metadata, content: markdownContent } = extractFrontMatter(content);
    
    // 解析Markdown内容
    const htmlContent = convertMarkdownToHtml(markdownContent);
    
    // 提取各个部分
    // 从Markdown提取部分信息
    const sections = [];
    const lines = markdownContent.split('\n');
    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检测二级标题作为新部分的开始
        if (line.startsWith('## ')) {
            if (currentSection) {
                sections.push(currentSection);
            }
            currentSection = {
                heading: line.substring(3).trim(),
                description: '',
                link: '',
                linkText: ''
            };
        } 
        // 如果有当前部分，且不是标题或链接行，则为描述
        else if (currentSection && !line.startsWith('[') && line.trim() !== '') {
            currentSection.description = line.trim();
        }
        // 检测链接
        else if (currentSection && line.startsWith('[')) {
            const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
            if (linkMatch) {
                currentSection.linkText = linkMatch[1];
                currentSection.link = linkMatch[2];
            }
        }
    }
    
    // 添加最后一个部分
    if (currentSection) {
        sections.push(currentSection);
    }
    
    // 提取介绍部分
    const introMatch = htmlContent.match(/<h1>.*?<\/h1>\s*<p>(.*?)<\/p>/);
    const intro = introMatch ? `<p>${introMatch[1]}</p>` : '';
    
    // 应用模板
    const data = {
        title: metadata.title || '异世界编年史',
        subtitle: metadata.subtitle || '冷兵器与魔法的奇幻世界',
        intro: intro,
        sections: sections
    };
    
    const html = applyTemplate('home', data);
    
    if (html) {
        fs.writeFileSync(path.join(outputDir, 'index.html'), html);
        console.log('首页生成成功');
    }
}

/**
 * 处理角色页面
 */
function processCharactersPage() {
    const charactersPath = path.join(contentDir, 'characters.md');
    
    if (!fs.existsSync(charactersPath)) {
        console.error('角色Markdown文件不存在');
        return;
    }
    
    const content = fs.readFileSync(charactersPath, 'utf8');
    const { metadata, content: markdownContent } = extractFrontMatter(content);
    
    // 解析Markdown内容
    const htmlContent = convertMarkdownToHtml(markdownContent);
    
    // 提取介绍部分
    const introMatch = htmlContent.match(/<h1>.*?<\/h1>\s*<p>(.*?)<\/p>/);
    const intro = introMatch ? `<p>${introMatch[1]}</p>` : '';
    
    // 提取角色信息
    const characters = [];
    const characterRegex = /<h2>(.*?)<\/h2>\s*<p><strong>种族：<\/strong> (.*?)<br>\s*<strong>职业：<\/strong> (.*?)<br>\s*<strong>年龄：<\/strong> (.*?)<br>\s*<strong>势力：<\/strong> (.*?)<\/p>\s*<p>(.*?)<\/p>/g;
    let match;
    
    while ((match = characterRegex.exec(htmlContent)) !== null) {
        characters.push({
            name: match[1],
            race: match[2],
            profession: match[3],
            age: match[4],
            faction: match[5],
            description: match[6]
        });
    }
    
    // 提取占位符信息
    const placeholderMatch = htmlContent.match(/<hr>\s*<p><strong>(.*?)<\/strong><\/p>\s*<p>(.*?)<\/p>/);
    const placeholder = placeholderMatch ? {
        placeholderTitle: placeholderMatch[1],
        placeholderText: placeholderMatch[2]
    } : null;
    
    // 应用模板
    const data = {
        title: metadata.title || '人物',
        subtitle: metadata.subtitle || '人物志',
        intro: intro,
        characters: characters,
        placeholder: placeholder
    };
    
    const html = applyTemplate('characters', data);
    
    if (html) {
        fs.writeFileSync(path.join(outputDir, 'characters.html'), html);
        console.log('角色页面生成成功');
    }
}

// 执行构建
function build() {
    console.log('开始构建...');
    processHomePage();
    processCharactersPage();
    // 可以添加其他页面的处理函数
    console.log('构建完成');
}

// 运行构建
build();
