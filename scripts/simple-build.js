// 简易构建脚本 - 将Markdown文件转换为HTML（无外部依赖）
const fs = require('fs');
const path = require('path');

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
 * 简单的Markdown到HTML转换
 * @param {string} markdown - Markdown内容
 * @returns {string} HTML内容
 */
function simpleMarkdownToHtml(markdown) {
    let html = markdown;
    
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
    
    // 解析水平线
    html = html.replace(/^---$/gm, '<hr>');
    
    // 解析段落（需要在最后处理，避免影响其他标记）
    // 将连续的文本行合并为一个段落
    html = html.replace(/^(?!<h|<ul|<ol|<li|<blockquote|<pre|<hr)(.*?)$/gm, '<p>$1</p>');
    
    return html;
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
    
    // 处理所有mustache标签
    let result = template;
    let lastResult = '';
    
    // 循环处理直到所有模板标签都被替换
    while (lastResult !== result) {
        lastResult = result;
        
        // 处理条件块 {{#variable}}...{{/variable}}
        result = result.replace(/\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
            const trimmedKey = key.trim();
            const keyParts = trimmedKey.split('.');
            
            // 获取数据，支持嵌套对象
            let currentData = data;
            for (const part of keyParts) {
                if (currentData && typeof currentData === 'object') {
                    currentData = currentData[part];
                } else {
                    currentData = undefined;
                    break;
                }
            }
            
            if (Array.isArray(currentData)) {
                // 如果是数组，为每个元素重复内容
                return currentData.map(item => {
                    let itemContent = content;
                    
                    // 处理简单替换
                    for (const [itemKey, itemValue] of Object.entries(item)) {
                        if (itemValue !== undefined && itemValue !== null) {
                            const regex = new RegExp(`\\{\\{${itemKey}\\}\\}`, 'g');
                            itemContent = itemContent.replace(regex, itemValue);
                        }
                    }
                    
                    // 处理嵌套数组
                    if (content.includes('{{#')) {
                        const nestData = { ...data, ...item };
                        itemContent = applyNestedTemplate(itemContent, nestData);
                    }
                    
                    return itemContent;
                }).join('');
            } else {
                // 如果是布尔值或对象，根据真值显示内容
                return currentData ? content : '';
            }
        });
        
        // 替换简单的变量 {{variable}}
        result = result.replace(/\{\{([^}#\/]+)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
            const keyParts = trimmedKey.split('.');
            
            // 获取数据，支持嵌套对象
            let value = data;
            for (const part of keyParts) {
                if (value && typeof value === 'object') {
                    value = value[part];
                } else {
                    value = undefined;
                    break;
                }
            }
            
            return value !== undefined ? value : '';
        });
    }
    
    return result;
}

// 处理嵌套模板
function applyNestedTemplate(template, data) {
    // 处理条件块 {{#variable}}...{{/variable}}
    let result = template.replace(/\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
        const trimmedKey = key.trim();
        
        if (Array.isArray(data[trimmedKey])) {
            // 如果是数组，为每个元素重复内容
            return data[trimmedKey].map(item => {
                let itemContent = content;
                
                // 替换项目中的变量
                for (const [itemKey, itemValue] of Object.entries(item)) {
                    if (itemValue !== undefined && itemValue !== null) {
                        const regex = new RegExp(`\\{\\{${itemKey}\\}\\}`, 'g');
                        itemContent = itemContent.replace(regex, itemValue);
                    }
                }
                
                return itemContent;
            }).join('');
        } else {
            // 如果是布尔值或对象，根据真值显示内容
            return data[trimmedKey] ? content : '';
        }
    });
    
    // 替换简单的变量 {{variable}}
    result = result.replace(/\{\{([^}#\/]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        return data[trimmedKey] !== undefined ? data[trimmedKey] : '';
    });
    
    return result;
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
    
    // 解析Markdown内容为HTML
    const htmlContent = simpleMarkdownToHtml(markdownContent);
    
    // 提取各个部分
    const sections = [];
    const lines = markdownContent.split('\n');
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检测二级标题（部分标题）
        if (line.startsWith('## ')) {
            if (currentSection) {
                sections.push(currentSection);
            }
            
            currentSection = {
                title: line.replace('## ', ''),
                description: '',
                link: '',
                linkText: ''
            };
        } 
        // 检测描述（紧跟在标题后的段落）
        else if (currentSection && currentSection.description === '' && line.trim() !== '' && !line.includes('[')) {
            currentSection.description = line;
        }
        // 检测链接
        else if (currentSection && line.match(/\[(.*?)\]\((.*?)\)/)) {
            const match = line.match(/\[(.*?)\]\((.*?)\)/);
            currentSection.linkText = match[1];
            currentSection.link = match[2];
        }
    }
    
    // 添加最后一个部分
    if (currentSection) {
        sections.push(currentSection);
    }
    
    // 提取介绍部分（第一个一级标题后的段落）
    let intro = '';
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ')) {
            // 找到第一个段落
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim() !== '' && !lines[j].startsWith('#')) {
                    intro = `<p>${lines[j]}</p>`;
                    break;
                }
            }
            break;
        }
    }
    
    // 应用模板
    const data = {
        title: metadata.title || '异世界编年史',
        subtitle: metadata.subtitle || '冷兵器与魔法的奇幻世界',
        intro: intro,
        sections: sections.map(section => ({
            title: section.title,
            description: section.description,
            link: section.link,
            linkText: section.linkText
        }))
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
    const htmlContent = simpleMarkdownToHtml(markdownContent);
    
    // 提取介绍部分（第一个一级标题后的段落）
    const lines = markdownContent.split('\n');
    let intro = '';
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ')) {
            // 找到第一个段落
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim() !== '' && !lines[j].startsWith('#')) {
                    intro = `<p>${lines[j]}</p>`;
                    break;
                }
            }
            break;
        }
    }
    
    // 提取角色信息
    const characters = [];
    let currentCharacter = null;
    let inCharacterSection = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检测二级标题（角色名）
        if (line.startsWith('## ') && !line.includes('更多人物')) {
            if (currentCharacter) {
                characters.push(currentCharacter);
            }
            
            currentCharacter = {
                name: line.replace('## ', ''),
                race: '',
                profession: '',
                age: '',
                faction: '',
                description: ''
            };
            inCharacterSection = true;
        }
        // 检测角色属性
        else if (inCharacterSection && line.includes('**种族：**')) {
            currentCharacter.race = line.split('**种族：**')[1].trim();
        }
        else if (inCharacterSection && line.includes('**职业：**')) {
            currentCharacter.profession = line.split('**职业：**')[1].trim();
        }
        else if (inCharacterSection && line.includes('**年龄：**')) {
            currentCharacter.age = line.split('**年龄：**')[1].trim();
        }
        else if (inCharacterSection && line.includes('**势力：**')) {
            currentCharacter.faction = line.split('**势力：**')[1].trim();
        }
        // 检测角色描述（紧跟在属性后的段落）
        else if (inCharacterSection && currentCharacter && currentCharacter.faction && !currentCharacter.description && line.trim() !== '') {
            currentCharacter.description = line;
            inCharacterSection = false;
        }
        // 检测分隔符，表示角色部分结束
        else if (line.trim() === '---') {
            if (currentCharacter) {
                characters.push(currentCharacter);
                currentCharacter = null;
            }
            inCharacterSection = false;
        }
    }
    
    // 添加最后一个角色
    if (currentCharacter) {
        characters.push(currentCharacter);
    }
    
    // 提取占位符信息
    let placeholder = null;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('**更多人物正在整理中**')) {
            placeholder = {
                placeholderTitle: '更多人物正在整理中...',
                placeholderText: i + 1 < lines.length ? lines[i + 1] : '这个世界中还有许多精彩的角色等待被发掘和记录。'
            };
            break;
        }
    }
    
    // 如果没有找到特定格式，尝试其他可能的格式
    if (!placeholder) {
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('更多人物正在整理中')) {
                placeholder = {
                    placeholderTitle: '更多人物正在整理中...',
                    placeholderText: i + 1 < lines.length ? lines[i + 1] : '这个世界中还有许多精彩的角色等待被发掘和记录。'
                };
                break;
            }
        }
    }
    
    // 直接设置占位符（确保始终有占位符）
    if (!placeholder) {
        placeholder = {
            placeholderTitle: '更多人物正在整理中...',
            placeholderText: '这个世界中还有许多精彩的角色等待被发掘和记录。'
        };
    }
    
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

/**
 * 处理时间轴页面
 */
function processTimelinePage() {
    const timelinePath = path.join(contentDir, 'timeline.md');
    
    if (!fs.existsSync(timelinePath)) {
        console.error('时间轴Markdown文件不存在');
        return;
    }
    
    const content = fs.readFileSync(timelinePath, 'utf8');
    const { metadata, content: markdownContent } = extractFrontMatter(content);
    
    // 解析Markdown内容
    const htmlContent = simpleMarkdownToHtml(markdownContent);
    
    // 提取介绍部分
    let intro = '';
    const lines = markdownContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ')) {
            // 找到第一个段落
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim() !== '' && !lines[j].startsWith('#')) {
                    intro = `<p>${lines[j]}</p>`;
                    break;
                }
            }
            break;
        }
    }
    
    // 提取纪元和事件
    const eras = [];
    let currentEra = null;
    let currentEvents = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检测二级标题（纪元标题）
        if (line.startsWith('## ')) {
            // 如果已经有当前纪元，添加到eras数组
            if (currentEra) {
                currentEra.events = currentEvents;
                eras.push(currentEra);
                currentEvents = [];
            }
            
            // 获取纪元标题和描述
            const title = line.replace('## ', '');
            let description = '';
            
            // 寻找描述（紧跟在标题后的段落）
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim() !== '' && !lines[j].startsWith('#')) {
                    description = lines[j];
                    break;
                }
            }
            
            currentEra = {
                title: title,
                description: description,
                events: []
            };
        }
        // 检测三级标题（事件标题）
        else if (line.startsWith('### ') && currentEra) {
            // 解析事件年份和标题
            const eventHeader = line.replace('### ', '');
            const parts = eventHeader.split(' - ');
            
            if (parts.length >= 2) {
                const year = parts[0].trim();
                const title = parts[1].trim();
                let description = '';
                
                // 寻找描述（紧跟在标题后的段落）
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].trim() !== '' && !lines[j].startsWith('#')) {
                        description = lines[j];
                        break;
                    }
                }
                
                currentEvents.push({
                    year: year,
                    event_title: title,
                    event_description: description
                });
            }
        }
    }
    
    // 添加最后一个纪元
    if (currentEra) {
        currentEra.events = currentEvents;
        eras.push(currentEra);
    }
    
    // 应用模板
    const data = {
        title: metadata.title || '时间轴',
        subtitle: metadata.subtitle || '历史时间轴',
        intro: intro,
        eras: eras
    };
    
    const html = applyTemplate('timeline', data);
    
    if (html) {
        fs.writeFileSync(path.join(outputDir, 'timeline.html'), html);
        console.log('时间轴页面生成成功');
    }
}

// 执行构建
function build() {
    console.log('开始构建...');
    processHomePage();
    processCharactersPage();
    processTimelinePage();
    // 可以添加其他页面的处理函数
    console.log('构建完成');
}

// 运行构建
build();
