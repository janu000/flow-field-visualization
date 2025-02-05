class Game {
    constructor() {
        // Initialize Perlin noise instance
        this.perlin = new Perlin();
        
        this.initializeSettings();
        this.initializeCanvas();
        this.initializeDots();
        this.initializeWidget();
        this.initializeEventListeners();
        this.startGameLoop();

        // Create FPS display
        this.fpsElement = document.createElement('div');
        this.fpsElement.style.position = 'fixed';
        this.fpsElement.style.top = '10px';
        this.fpsElement.style.right = '10px';
        this.fpsElement.style.fontSize = '12px';
        this.fpsElement.style.fontFamily = 'Inter, sans-serif';
        this.fpsElement.style.backgroundColor = 'white';
        this.fpsElement.style.padding = '4px 8px';
        this.fpsElement.style.borderRadius = '3px';
        this.fpsElement.style.zIndex = '1000';
        document.body.appendChild(this.fpsElement);

        // FPS calculation variables
        this.lastFpsUpdate = performance.now();
        this.frameCount = 0;
        this.currentFps = 0;

        // Create minimize button
        this.minimizeButton = document.createElement('div');
        this.minimizeButton.classList.add('minimized-widget');
        this.minimizeButton.textContent = '>';
        this.minimizeButton.style.display = 'none'; // Initially hidden
        document.body.appendChild(this.minimizeButton);

        // Add event listener for minimize button
        this.minimizeButton.addEventListener('click', () => {
            this.widget.style.display = 'block';
            this.minimizeButton.style.display = 'none';
        });

        // Add minimize button to settings widget
        const minimizeButton = document.createElement('div');
        minimizeButton.style.position = 'absolute';
        minimizeButton.style.right = '10px';
        minimizeButton.style.top = '10px';
        minimizeButton.style.width = '12px';
        minimizeButton.style.height = '12px';
        minimizeButton.style.backgroundColor = '#ffffff';
        minimizeButton.style.borderRadius = '2px';
        minimizeButton.style.cursor = 'pointer';
        minimizeButton.textContent = '<';
        this.widget.appendChild(minimizeButton);

        // Add event listener for minimize button
        minimizeButton.addEventListener('click', () => {
            this.widget.style.display = 'none';
            this.minimizeButton.style.display = 'block';
        });
    }

    initializeSettings() {
        // Initialize all settings and default values
        this.pixelRatio = window.devicePixelRatio || 1;
        this.dotRadius = 5 * this.pixelRatio;
        this.dots = [];
        this.dragging = false;
        this.startPos = null;
        this.currentPos = null;
        this.sizeScale = 1;
        this.friction = 1.0;
        this.constantForce = { x: -200, y: 0 };
        this.spawnInterval = 5;
        this.lastSpawnTime = performance.now();
        this.trailEnabled = false;
        this.trailFade = 0.98;
        this.trailAlpha = 0.1;
        this.initialDotCount = 0;
        this.enableCollisions = false;
        this.showDots = true;
        this.showArrows = true;
        this.dotColor = '#000000';
        this.trailColor = '#000000';
        this.forceFieldScale = 0.005;
        this.forceFieldTime = 0;
        this.forceFieldSpeed = 0.1;
        this.forceFieldStrength = 100;
        this.gridSize = 50;
        this.grid = new Map();
    }

    initializeCanvas() {
        // Initialize main canvas and trail buffer
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);

        this.trailCanvas = document.createElement('canvas');
        this.trailCtx = this.trailCanvas.getContext('2d');
        this.resize();

        window.addEventListener('resize', this.resize.bind(this));
    }

    initializeDots() {
        // Initialize dots with default values
        const cols = Math.ceil(Math.sqrt(this.initialDotCount));
        const rows = Math.ceil(this.initialDotCount / cols);
        const spacingX = this.canvas.width / cols;
        const spacingY = this.canvas.height / rows;

        for (let i = 0; i < this.initialDotCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * spacingX + spacingX / 2;
            const y = row * spacingY + spacingY / 2;

            this.dots.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                ax: 0,
                ay: 0,
                friction: this.friction,
                sizeScale: this.sizeScale,
                mass: Math.pow(this.sizeScale, 3)
            });
        }
    }

    initializeWidget() {
        // Initialize settings widget
        this.widget = document.createElement('div');
        this.widget.style.position = 'fixed';
        this.widget.style.left = '10px';
        this.widget.style.top = '10px';
        this.widget.style.backgroundColor = 'white';
        this.widget.style.border = '1px solid #ccc';
        this.widget.style.padding = '15px';
        this.widget.style.borderRadius = '5px';
        this.widget.style.zIndex = '1000';
        this.widget.style.width = '250px';
        document.body.appendChild(this.widget);

        this.initializeWidgetContent();
    }

    initializeWidgetContent() {
        // Initialize widget content
        const initialLogValue = 5;
        const initialLinearValue = (Math.log10(initialLogValue) + 1) / 3 * 1000;

        this.widget.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">Settings</h3>
            <div class="setting">
                <label>Dot Size: <span id="sizeValue">1.0</span></label>
                <input type="range" min="0.1" max="5" step="0.1" value="1" id="sizeScale">
            </div>
            <div class="setting">
                <label>Friction: <span id="frictionValue">1.0</span></label>
                <input type="range" min="0" max="2" step="0.1" value="1" id="frictionScale">
            </div>
            <div class="setting">
                <label>Force Field Strength: <span id="forceFieldStrengthValue">100</span></label>
                <input type="range" min="0" max="1000" step="10" value="100" id="forceFieldStrength">
            </div>
            <div class="setting">
                <label>Force Field Scale: <span id="forceFieldScaleValue">0.005</span></label>
                <input type="range" min="0.001" max="0.01" step="0.0001" value="0.005" id="forceFieldScale">
            </div>
            <div class="setting">
                <label>Force Field Speed: <span id="forceFieldSpeedValue">0.1</span></label>
                <input type="range" min="0" max="1" step="0.01" value="0.1" id="forceFieldSpeed">
            </div>
            <div class="setting">
                <label>Constant Force: <span id="constantForceValue">-200</span></label>
                <input type="range" min="-1000" max="1000" step="10" value="-200" id="constantForce">
            </div>
            <div class="setting">
                <label>Spawn Interval (ms): <span id="spawnIntervalValue">5.00</span></label>
                <input type="range" min="0" max="1000" step="1" value="${initialLinearValue}" id="spawnInterval">
            </div>
            <div class="setting">
                <label>Trails: <input type="checkbox" id="trails"></label>
            </div>
            <div class="setting">
                <label>Trail Decay: <span id="trailDecayValue">0.98</span></label>
                <input type="range" min="0" max="1" step="0.01" value="0.98" id="trailDecay">
            </div>
            <div class="setting">
                <label>Trail Alpha: <span id="trailAlphaValue">0.1</span></label>
                <input type="range" min="0" max="1" step="0.01" value="0.1" id="trailAlpha">
            </div>
            <div class="color-picker-container">
                <span class="color-picker-label">Color:</span>
                <div class="color-picker-preview" style="background-color: ${this.dotColor};"></div>
                <input type="color" id="colorPicker" value="${this.dotColor}" class="color-picker-input">
            </div>
            <div class="setting">
                <label>Collisions: <input type="checkbox" id="collisions"></label>
            </div>
            <div class="setting">
                <label>Show Dots: <input type="checkbox" id="showDots" checked></label>
            </div>
            <div class="setting">
                <label>Show Arrows: <input type="checkbox" id="showArrows" checked></label>
            </div>
        `;
    }

    initializeEventListeners() {
        // Size scale
        this.widget.querySelector('#sizeScale').addEventListener('input', (e) => {
            this.sizeScale = parseFloat(e.target.value);
            this.widget.querySelector('#sizeValue').textContent = e.target.value;
        });

        // Friction
        this.widget.querySelector('#frictionScale').addEventListener('input', (e) => {
            const newFriction = parseFloat(e.target.value);
            for (const dot of this.dots) {
                dot.friction = newFriction;
            }
            this.friction = newFriction;
            this.widget.querySelector('#frictionValue').textContent = e.target.value;
        });

        // Force field strength
        this.widget.querySelector('#forceFieldStrength').addEventListener('input', (e) => {
            this.forceFieldStrength = parseFloat(e.target.value);
            this.widget.querySelector('#forceFieldStrengthValue').textContent = e.target.value;
        });

        // Force field scale
        this.widget.querySelector('#forceFieldScale').addEventListener('input', (e) => {
            this.forceFieldScale = parseFloat(e.target.value);
            this.widget.querySelector('#forceFieldScaleValue').textContent = e.target.value;
        });

        // Force field speed
        this.widget.querySelector('#forceFieldSpeed').addEventListener('input', (e) => {
            this.forceFieldSpeed = parseFloat(e.target.value);
            this.widget.querySelector('#forceFieldSpeedValue').textContent = e.target.value;
        });

        // Constant force
        this.widget.querySelector('#constantForce').addEventListener('input', (e) => {
            this.constantForce.x = parseFloat(e.target.value);
            this.widget.querySelector('#constantForceValue').textContent = e.target.value;
        });

        // Spawn interval
        this.widget.querySelector('#spawnInterval').addEventListener('input', (e) => {
            const linearValue = parseFloat(e.target.value);
            const logValue = Math.pow(10, (linearValue / 1000 * 3) - 1);
            this.spawnInterval = logValue;
            this.widget.querySelector('#spawnIntervalValue').textContent = logValue.toFixed(2);
        });

        // Trails
        this.widget.querySelector('#trails').addEventListener('change', (e) => {
            this.trailEnabled = e.target.checked;
            if (!this.trailEnabled) {
                this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
            }
        });

        // Trail decay
        this.widget.querySelector('#trailDecay').addEventListener('input', (e) => {
            const linearValue = parseFloat(e.target.value);
            // Map linear value to exponential scale between 0.9 and 1 with steeper curve near 1
            const exponentialValue = linearValue === 1 ? 1 : 0.9 + Math.pow(linearValue, 0.2) * 0.1;
            this.trailFade = exponentialValue;
            this.widget.querySelector('#trailDecayValue').textContent = exponentialValue.toFixed(3);
        });

        // Trail alpha
        this.widget.querySelector('#trailAlpha').addEventListener('input', (e) => {
            this.trailAlpha = parseFloat(e.target.value);
            this.widget.querySelector('#trailAlphaValue').textContent = e.target.value;
        });

        // Collisions
        this.widget.querySelector('#collisions').addEventListener('change', (e) => {
            this.enableCollisions = e.target.checked;
        });

        // Show dots
        this.widget.querySelector('#showDots').addEventListener('change', (e) => {
            this.showDots = e.target.checked;
        });

        // Show arrows
        this.widget.querySelector('#showArrows').addEventListener('change', (e) => {
            this.showArrows = e.target.checked;
        });

        this.widget.querySelector('.color-picker-preview').addEventListener('click', () => {
            this.widget.querySelector('#colorPicker').click();
        });

        this.widget.querySelector('#colorPicker').addEventListener('input', (e) => {
            this.dotColor = e.target.value;
            this.trailColor = e.target.value;
            this.widget.querySelector('.color-picker-preview').style.backgroundColor = e.target.value;
        });
    }

    startGameLoop() {
        // Start the game loop
        setTimeout(() => {
            this.lastTime = performance.now();
            this.loop();
        }, 100);
    }

    resize() {
        // Get actual display size
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;
        
        // Set canvas size accounting for pixel ratio
        this.canvas.width = displayWidth * this.pixelRatio;
        this.canvas.height = displayHeight * this.pixelRatio;
        
        // Scale canvas using CSS
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;
        
        // Scale context to account for pixel ratio
        this.ctx.scale(this.pixelRatio, this.pixelRatio);

        // Resize trail buffer
        this.trailCanvas.width = this.canvas.width;
        this.trailCanvas.height = this.canvas.height;
    }

    loop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update FPS counter
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            this.fpsElement.textContent = `FPS: ${this.currentFps}`;
        }

        // Calculate how many dots to spawn based on elapsed time
        const elapsedSinceLastSpawn = currentTime - this.lastSpawnTime;
        if (elapsedSinceLastSpawn >= this.spawnInterval) {
            const spawnCount = Math.floor(elapsedSinceLastSpawn / this.spawnInterval);
            for (let i = 0; i < spawnCount; i++) {
                this.spawnDotOnRight();
            }
            this.lastSpawnTime = currentTime;
        }

        this.update(deltaTime);
        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }

    spawnDotOnRight() {
        const x = this.canvas.width; // Right edge of canvas
        const y = Math.random() * this.canvas.height; // Random y position
        const velocity = {
            x: -100, // Initial velocity to the left
            y: (Math.random() - 0.5) * 50 // Random vertical velocity
        };
        
        this.dots.push({
            x: x,
            y: y,
            vx: velocity.x,
            vy: velocity.y,
            ax: 0,
            ay: 0,
            friction: this.friction,
            sizeScale: this.sizeScale,
            mass: Math.pow(this.sizeScale, 3)
        });
    }

    update(deltaTime) {
        // Update spatial grid
        this.updateSpatialGrid();

        // Update force field time
        this.forceFieldTime += deltaTime * this.forceFieldSpeed;
        
        // Apply force field to dots
        for (const dot of this.dots) {
            const force = this.getForceAt(dot.x, dot.y);
            const forceStrength = this.forceFieldStrength;
            dot.vx += force.x * forceStrength * deltaTime;
            dot.vy += force.y * forceStrength * deltaTime;
        }

        // Apply constant force to dots
        for (const dot of this.dots) {
            dot.vx += this.constantForce.x * deltaTime;
            dot.vy += this.constantForce.y * deltaTime;
        }
        
        // Update dot positions
        for (const dot of this.dots) {
            dot.x += dot.vx * deltaTime;
            dot.y += dot.vy * deltaTime;
            
            // Apply friction
            dot.vx *= 1 - dot.friction * deltaTime;
            dot.vy *= 1 - dot.friction * deltaTime;
        }
        
        // Remove dots outside the canvas with a certain margin
        const margin = 100; // Margin outside the canvas
        this.dots = this.dots.filter(dot => 
            dot.x >= -margin && dot.x <= this.canvas.width + margin &&
            dot.y >= -margin && dot.y <= this.canvas.height + margin
        );
        
        // Check collisions if enabled
        if (this.enableCollisions) {
            this.checkCollisionsWithGrid();
        }
    }

    updateSpatialGrid() {
        this.grid.clear();
        for (const dot of this.dots) {
            const gridX = Math.floor(dot.x / this.gridSize);
            const gridY = Math.floor(dot.y / this.gridSize);
            const key = `${gridX},${gridY}`;
            
            if (!this.grid.has(key)) {
                this.grid.set(key, []);
            }
            this.grid.get(key).push(dot);
        }
    }

    getForceAt(x, y) {
        if (!this.perlin) {
            console.error('Perlin instance not found', { perlin: this.perlin });
            return { x: 0, y: 0 };
        }
        if (!this.perlin.noise) {
            console.error('Perlin noise method not found', { perlin: this.perlin });
            return { x: 0, y: 0 };
        }
        
        try {
            // Use separate noise samples for x and y components
            const angleX = this.perlin.noise(
                x * this.forceFieldScale, 
                y * this.forceFieldScale, 
                this.forceFieldTime
            ) * Math.PI * 2;
            
            const angleY = this.perlin.noise(
                y * this.forceFieldScale, 
                x * this.forceFieldScale, 
                this.forceFieldTime + 1000 // Offset to create variation
            ) * Math.PI * 2;
            
            return {
                x: Math.cos(angleX),
                y: Math.sin(angleY)
            };
        } catch (e) {
            console.error('Error calculating force:', e);
            return { x: 0, y: 0 };
        }
    }

    render() {
        // Clear main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Handle trails if enabled
        if (this.trailEnabled) {
            // Get image data from trail buffer
            const imageData = this.trailCtx.getImageData(0, 0, this.trailCanvas.width, this.trailCanvas.height);
            const data = imageData.data;
            
            // Apply combined exponential and linear decay
            const exponentialFade = this.trailFade;
            
            for (let i = 3; i < data.length; i += 4) {
                // Apply exponential decay
                data[i] = data[i] * exponentialFade - 1;
            }
            
            // Put modified image data back into trail buffer
            this.trailCtx.putImageData(imageData, 0, 0);

            // Draw dots to the trail buffer with alpha
            this.trailCtx.globalCompositeOperation = 'source-over';
            const [r, g, b] = this.hexToRgb(this.trailColor);
            this.trailCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.trailAlpha})`;
            this.trailCtx.beginPath();
            for (const dot of this.dots) {
                const radius = this.dotRadius * dot.sizeScale;
                this.trailCtx.moveTo(dot.x + radius, dot.y);
                this.trailCtx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
            }
            this.trailCtx.fill();

            // Draw the trail buffer to the main canvas
            this.ctx.drawImage(this.trailCanvas, 0, 0);
        }

        // Draw dots if enabled
        if (this.showDots) {
            this.ctx.fillStyle = this.dotColor;
            this.ctx.beginPath();
            for (const dot of this.dots) {
                const radius = this.dotRadius * dot.sizeScale;
                this.ctx.moveTo(dot.x + radius, dot.y);
                this.ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
            }
            this.ctx.fill();
        }

        // Draw force field arrows if enabled
        if (this.showArrows) {
            this.drawForceField();
        }
    }

    drawForceField() {
        const gridSize = 20;
        const arrowSize = 10;
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            for (let y = 0; y < this.canvas.height; y += gridSize) {
                const force = this.getForceAt(x, y);
                
                // Draw arrow
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + force.x * arrowSize, y + force.y * arrowSize);
                
                // Draw arrowhead
                const arrowAngle = Math.atan2(force.y, force.x);
                this.ctx.moveTo(x + force.x * arrowSize, y + force.y * arrowSize);
                this.ctx.lineTo(
                    x + force.x * arrowSize - Math.cos(arrowAngle - Math.PI/6) * arrowSize/3,
                    y + force.y * arrowSize - Math.sin(arrowAngle - Math.PI/6) * arrowSize/3
                );
                this.ctx.moveTo(x + force.x * arrowSize, y + force.y * arrowSize);
                this.ctx.lineTo(
                    x + force.x * arrowSize - Math.cos(arrowAngle + Math.PI/6) * arrowSize/3,
                    y + force.y * arrowSize - Math.sin(arrowAngle + Math.PI/6) * arrowSize/3
                );
                
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.stroke();
            }
        }
    }

    // Add helper method to convert hex to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }

    checkCollisionsWithGrid() {
        for (const [key, dots] of this.grid) {
            const [gridX, gridY] = key.split(',').map(Number);
            
            // Check current cell and neighboring cells
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    const neighborKey = `${gridX + x},${gridY + y}`;
                    if (this.grid.has(neighborKey)) {
                        this.checkCollisionsBetween(dots, this.grid.get(neighborKey));
                    }
                }
            }
        }
    }

    checkCollisionsBetween(dots1, dots2) {
        for (const dot1 of dots1) {
            for (const dot2 of dots2) {
                if (dot1 === dot2) continue;
                
                const dx = dot1.x - dot2.x;
                const dy = dot1.y - dot2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = (dot1.sizeScale + dot2.sizeScale) * this.dotRadius;
                
                if (distance < minDistance) {
                    this.resolveCollision(dot1, dot2);
                }
            }
        }
    }

    resolveCollision(dot1, dot2) {
        const dx = dot1.x - dot2.x;
        const dy = dot1.y - dot2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (dot1.sizeScale + dot2.sizeScale) * this.dotRadius;
        
        if (distance === 0) return;
        
        const overlap = minDistance - distance;
        const angle = Math.atan2(dy, dx);
        const force = overlap * 0.5;
        
        dot1.x += Math.cos(angle) * force;
        dot1.y += Math.sin(angle) * force;
        dot2.x -= Math.cos(angle) * force;
        dot2.y -= Math.sin(angle) * force;
    }
}

// Start the game
window.addEventListener('load', () => {
    const game = new Game();
});