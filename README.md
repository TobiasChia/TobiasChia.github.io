# 异世界编年史 - 内容与样式分离系统

这个项目实现了内容与样式分离的网站系统，让你可以像编辑Markdown一样简单地更新网站内容，而不必直接处理复杂的HTML和CSS代码。

## 系统结构

- `content/` - 存放Markdown格式的内容文件
- `templates/` - 存放HTML模板文件
- `styles/` - 存放CSS样式文件
- `scripts/` - 存放JavaScript脚本文件

## 如何编辑内容

1. 所有内容都存储在 `content/` 目录下的Markdown文件中
2. 每个页面对应一个Markdown文件，例如：
   - `content/index.md` - 首页内容
   - `content/characters.md` - 人物页面内容
   - 等等...
3. Markdown文件的格式如下：
   ```markdown
   ---
   title: 页面标题
   subtitle: 页面副标题
   ---

   # 主标题

   正文内容...

   ## 二级标题

   更多内容...
   ```

4. 编辑完Markdown文件后，需要运行构建脚本生成HTML文件

## 如何生成HTML文件

有两种方式可以将Markdown内容转换为HTML：

### 方式1：使用Node.js构建脚本（推荐）

1. 确保已安装Node.js
2. 运行以下命令安装依赖（仅首次需要）：
   ```
   npm install marked
   ```
3. 运行构建脚本：
   ```
   node scripts/build.js
   ```
   或者使用不依赖外部库的简易版本：
   ```
   node scripts/simple-build.js
   ```
4. 构建脚本会读取`content/`目录下的Markdown文件，应用模板，并生成相应的HTML文件

### 方式2：使用本地服务器实时预览

由于浏览器安全限制，直接打开HTML文件无法加载本地Markdown文件。需要通过本地服务器来预览：

1. 启动本地服务器：
   ```
   node scripts/server.js
   ```
2. 在浏览器中访问：
   ```
   http://localhost:3000/md-viewer.html
   ```
3. 从下拉菜单中选择要查看的Markdown文件
4. 点击"加载内容"按钮
5. 页面将显示转换后的HTML内容

注意：这种方式只是用于预览，不会生成实际的HTML文件

## 模板系统

模板文件位于 `templates/` 目录下，使用简单的变量替换语法：

- `{{变量名}}` - 插入变量值
- `{{#条件}}...{{/条件}}` - 条件块，当条件为真时显示内容

主要模板文件：
- `templates/base.html` - 基础模板，包含页面结构和导航
- `templates/home.html` - 首页专用模板
- `templates/characters.html` - 人物页面专用模板

## 样式系统

所有样式都集中在 `styles/main.css` 文件中，便于统一管理和修改。

## 添加新页面

要添加新页面，需要：

1. 在 `content/` 目录下创建新的Markdown文件
2. 在 `templates/` 目录下创建对应的模板文件（可选，也可以使用现有模板）
3. 在 `scripts/build.js` 或 `scripts/simple-build.js` 中添加处理新页面的函数
4. 更新导航菜单以包含新页面的链接

## 优势

- **内容与样式分离**：可以专注于编写内容，而不必担心HTML和CSS
- **易于维护**：内容以Markdown格式存储，易于阅读和编辑
- **灵活性**：可以根据需要自定义模板和样式
- **版本控制友好**：Markdown文件更适合进行版本控制和比较差异
