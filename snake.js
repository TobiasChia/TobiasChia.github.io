document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('startButton');
    
    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    
    let snake = [];
    let food = {};
    let dx = gridSize;
    let dy = 0;
    let score = 0;
    let gameInterval;
    let gameSpeed = 150;
    let isGameRunning = false;

    function initGame() {
        snake = [
            { x: 5 * gridSize, y: 5 * gridSize }
        ];
        score = 0;
        scoreElement.textContent = `分数: ${score}`;
        createFood();
        dx = gridSize;
        dy = 0;
    }

    function createFood() {
        food = {
            x: Math.floor(Math.random() * tileCount) * gridSize,
            y: Math.floor(Math.random() * tileCount) * gridSize
        };
        
        // 确保食物不会出现在蛇身上
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                createFood();
                break;
            }
        }
    }

    function drawGame() {
        // 清空画布
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 画蛇
        ctx.fillStyle = '#4CAF50';
        for (let segment of snake) {
            ctx.fillRect(segment.x, segment.y, gridSize - 2, gridSize - 2);
        }

        // 画食物
        ctx.fillStyle = 'red';
        ctx.fillRect(food.x, food.y, gridSize - 2, gridSize - 2);
    }

    function moveSnake() {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // 检查是否撞墙
        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
            gameOver();
            return;
        }

        // 检查是否撞到自己
        for (let segment of snake) {
            if (head.x === segment.x && head.y === segment.y) {
                gameOver();
                return;
            }
        }

        snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            scoreElement.textContent = `分数: ${score}`;
            createFood();
            // 加快游戏速度
            if (gameSpeed > 50) {
                gameSpeed -= 2;
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, gameSpeed);
            }
        } else {
            snake.pop();
        }
    }

    function gameLoop() {
        moveSnake();
        drawGame();
    }

    function gameOver() {
        clearInterval(gameInterval);
        isGameRunning = false;
        startButton.textContent = '重新开始';
        alert(`游戏结束！你的得分是: ${score}`);
    }

    function handleKeyPress(e) {
        if (!isGameRunning) return;

        switch(e.key) {
            case 'ArrowUp':
                if (dy === 0) {
                    dx = 0;
                    dy = -gridSize;
                }
                break;
            case 'ArrowDown':
                if (dy === 0) {
                    dx = 0;
                    dy = gridSize;
                }
                break;
            case 'ArrowLeft':
                if (dx === 0) {
                    dx = -gridSize;
                    dy = 0;
                }
                break;
            case 'ArrowRight':
                if (dx === 0) {
                    dx = gridSize;
                    dy = 0;
                }
                break;
        }
    }

    startButton.addEventListener('click', () => {
        if (isGameRunning) {
            clearInterval(gameInterval);
            isGameRunning = false;
            startButton.textContent = '开始游戏';
        } else {
            initGame();
            isGameRunning = true;
            startButton.textContent = '暂停';
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    });

    document.addEventListener('keydown', handleKeyPress);
});
