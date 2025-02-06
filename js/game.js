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
        this.fpsElement.className = 'fps-display';
        document.body.appendChild(this.fpsElement);

        // FPS calculation variables
        this.lastFpsUpdate = performance.now();
        this.frameCount = 0;
        this.currentFps = 0;

        // Create widget toggle button
        this.widgetToggle = document.createElement('div');
        this.widgetToggle.className = 'widget-toggle material-icons';
        this.widgetToggle.textContent = 'settings'; // Settings icon
        document.body.appendChild(this.widgetToggle);

        // Add event listener for widget toggle
        this.widgetToggle.addEventListener('click', () => {
            const isVisible = this.widget.style.display === 'block';
            this.widget.style.display = isVisible ? 'none' : 'block';
            this.widgetToggle.textContent = isVisible ? 'settings' : 'close'; // Change icon
        });

        // Hide widget initially
        this.widget.style.display = 'none';
    }

    initializeSettings() {
        // Calculate base dot radius based on canvas dimensions
        this.baseDotRadius = Math.max(2, Math.min(window.innerWidth, window.innerHeight) / 200);
        this.dotRadius = this.baseDotRadius;
        this.dots = [];
        this.dragging = false;
        this.startPos = null;
        this.currentPos = null;
        this.sizeScale = 1;
        this.friction = 1.0;
        this.directionalForce = { x: -200, y: 0 };
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
        this.flowFieldScale = 0.005;
        this.flowFieldTime = 0;
        this.flowFieldSpeed = 0.1;
        this.flowFieldStrength = 100;
        this.gridSize = 50;
        this.grid = new Map();
        this.wrapParticles = false;
    }

    initializeCanvas() {
        // Initialize main canvas and trail buffer
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);

        this.trailCanvas = document.createElement('canvas');
        this.trailCtx = this.trailCanvas.getContext('2d', { willReadFrequently: true });
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
        this.widget.className = 'widget';
        document.body.appendChild(this.widget);

        this.initializeWidgetContent();
    }

    initializeWidgetContent() {
        // Initialize widget content
        const initialLogValue = this.spawnInterval
        const initialLinearValue = (Math.log10(initialLogValue) + 1) / 3 * 1000;

        // Calculate initial trail decay value
        const initialTrailDecay = this.trailFade
        const initialTrailDecayLinear = Math.pow((initialTrailDecay - 0.9) / 0.1, 1/0.2);

        // Calculate initial flow field scale slider value
        const initialflowFieldScale = this.flowFieldScale
        const initialflowFieldScaleLinear = 0.01 + (Math.log10(initialflowFieldScale / 0.001) / Math.log10(25)) * (1 - 0.01);

        this.widget.innerHTML = `
            <h3 style="margin: 0 0 10px 0; text-align: center;">Settings</h3>
            <div class="setting">
                <label>Particle Size: <span id="sizeValue">1.00</span></label>
                <input type="range" min="0.1" max="5" step="0.05" value="1" id="sizeScale">
            </div>
            <div class="setting">
                <label>Friction: <span id="frictionValue">1.0</span></label>
                <input type="range" min="0" max="1" step="0.01" value="1" id="frictionScale">
            </div>
            <div class="setting">
                <label>Flow Field Strength: <span id="flowFieldStrengthValue">100</span></label>
                <input type="range" min="0" max="1000" step="10" value="100" id="flowFieldStrength">
            </div>
            <div class="setting">
                <label>Flow Field Scale: <span id="flowFieldScaleValue">${initialflowFieldScaleLinear.toFixed(2)}</span></label>
                <input type="range" min="0.01" max="1" step="0.01" value="${initialflowFieldScaleLinear}" id="flowFieldScale">
            </div>
            <div class="setting">
                <label>Flow Field Speed: <span id="flowFieldSpeedValue">0.10</span></label>
                <input type="range" min="0" max="1" step="0.01" value="0.1" id="flowFieldSpeed">
            </div>
            <div class="setting">
                <label>Directional Force: <span id="directionalForceValue">-200</span></label>
                <input type="range" min="-1000" max="1000" step="10" value="-200" id="directionalForce">
            </div>
            <div class="setting">
                <label>Spawn Interval<br>(ms): <span id="spawnIntervalValue">5.00</span></label>
                <input type="range" min="0" max="1000" step="1" value="${initialLinearValue}" id="spawnInterval">
            </div>
            <div class="setting">
                <label>Trails: <input type="checkbox" id="trails"></label>
            </div>
            <div class="setting">
                <label>Trail Decay: <span id="trailDecayValue">0.980</span></label>
                <input type="range" min="0" max="1" step="0.01" value="${initialTrailDecayLinear.toFixed(3)}" id="trailDecay">
            </div>
            <div class="setting">
                <label>Trail Alpha: <span id="trailAlphaValue">0.10</span></label>
                <input type="range" min="0" max="1" step="0.01" value="0.1" id="trailAlpha">
            </div>
            <div class="setting color-picker-container">
                <label>Color:</label>
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
            <div class="setting">
                <label>Wrap Particles: <input type="checkbox" id="wrapParticles"></label>
            </div>
            <div class="setting">
                <button id="resetSimulation">Reset Simulation</button>
            </div>
        `;
    }

    initializeEventListeners() {
        // Size scale
        this.widget.querySelector('#sizeScale').addEventListener('input', (e) => {
            const newSizeScale = parseFloat(e.target.value);
            
            // Update size of all existing particles
            for (const dot of this.dots) {
                dot.sizeScale = newSizeScale;
                dot.mass = Math.pow(newSizeScale, 3); // Update mass based on new size
            }
            
            // Update global size scale
            this.sizeScale = newSizeScale;
            this.widget.querySelector('#sizeValue').textContent = newSizeScale.toFixed(2);
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

        // flow field strength
        this.widget.querySelector('#flowFieldStrength').addEventListener('input', (e) => {
            this.flowFieldStrength = parseFloat(e.target.value);
            this.widget.querySelector('#flowFieldStrengthValue').textContent = e.target.value;
        });

        // flow field scale
        this.widget.querySelector('#flowFieldScale').addEventListener('input', (e) => {
            const linearValue = parseFloat(e.target.value);
            // Map linear value (0.01-1) to logarithmic scale (0.001-0.025)
            const logValue = 0.001 * Math.pow(10, (linearValue - 0.01) / (1 - 0.01) * Math.log10(25));
            this.flowFieldScale = logValue;
            this.widget.querySelector('#flowFieldScaleValue').textContent = linearValue.toFixed(2);
        });

        // flow field speed
        this.widget.querySelector('#flowFieldSpeed').addEventListener('input', (e) => {
            this.flowFieldSpeed = parseFloat(e.target.value);
            this.widget.querySelector('#flowFieldSpeedValue').textContent = parseFloat(e.target.value).toFixed(2);
        });

        // Constant flow
        this.widget.querySelector('#directionalForce').addEventListener('input', (e) => {
            this.directionalForce.x = parseFloat(e.target.value);
            this.widget.querySelector('#directionalForceValue').textContent = e.target.value;
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
            this.widget.querySelector('#trailAlphaValue').textContent = parseFloat(e.target.value).toFixed(2);
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

        // Wrap particles
        this.widget.querySelector('#wrapParticles').addEventListener('change', (e) => {
            this.wrapParticles = e.target.checked;
        });

        this.widget.querySelector('.color-picker-preview').addEventListener('click', () => {
            this.widget.querySelector('#colorPicker').click();
        });

        this.widget.querySelector('#colorPicker').addEventListener('input', (e) => {
            this.dotColor = e.target.value;
            this.trailColor = e.target.value;
            this.widget.querySelector('.color-picker-preview').style.backgroundColor = e.target.value;
        });

        // Reset simulation
        this.widget.querySelector('#resetSimulation').addEventListener('click', () => {
            this.dots = [];
            this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
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
        
        // Recalculate dot radius based on new dimensions
        this.baseDotRadius = Math.max(2, Math.min(displayWidth, displayHeight) / 200);
        this.dotRadius = this.baseDotRadius;
        
        // Set canvas size accounting for pixel ratio
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight

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

        this.update(deltaTime, currentTime);
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

    update(deltaTime, currentTime) {
        // Update spatial grid
        this.updateSpatialGrid();

        // Update flow field time
        this.flowFieldTime += deltaTime * this.flowFieldSpeed;
        
        // Apply flow field to dots
        for (const dot of this.dots) {
            const flow = this.getflowAt(dot.x, dot.y);
            const flowStrength = this.flowFieldStrength;
            dot.vx += flow.x * flowStrength * deltaTime;
            dot.vy += flow.y * flowStrength * deltaTime;
        }

        // Apply constant flow to dots
        for (const dot of this.dots) {
            dot.vx += this.directionalForce.x * deltaTime;
            dot.vy += this.directionalForce.y * deltaTime;
        }
        
        // Update dot positions
        for (const dot of this.dots) {
            dot.x += dot.vx * deltaTime;
            dot.y += dot.vy * deltaTime;
            
            // Apply friction
            dot.vx *= 1 - dot.friction * deltaTime;
            dot.vy *= 1 - dot.friction * deltaTime;
        }
        
        // Handle particle wrapping
        if (this.wrapParticles) {
            for (const dot of this.dots) {
                if (dot.x < 0) dot.x += this.canvas.width;
                if (dot.x > this.canvas.width) dot.x -= this.canvas.width;
                if (dot.y < 0) dot.y += this.canvas.height;
                if (dot.y > this.canvas.height) dot.y -= this.canvas.height;
            }
        } else {
            // Remove particles outside canvas with margin
            const margin = 100;
            this.dots = this.dots.filter(dot => 
                dot.x >= -margin && dot.x <= this.canvas.width + margin &&
                dot.y >= -margin && dot.y <= this.canvas.height + margin
            );
        }
        
        // Only spawn particles if wrapping is disabled
        if (!this.wrapParticles) {
            const elapsedSinceLastSpawn = currentTime - this.lastSpawnTime;
            if (elapsedSinceLastSpawn >= this.spawnInterval) {
                const spawnCount = Math.floor(elapsedSinceLastSpawn / this.spawnInterval);
                for (let i = 0; i < spawnCount; i++) {
                    this.spawnDotOnRight();
                }
                this.lastSpawnTime = currentTime;
            }
        }
        
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

    getflowAt(x, y) {
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
                x * this.flowFieldScale, 
                y * this.flowFieldScale, 
                this.flowFieldTime
            ) * Math.PI * 2;
            
            const angleY = this.perlin.noise(
                y * this.flowFieldScale, 
                x * this.flowFieldScale, 
                this.flowFieldTime + 1000 // Offset to create variation
            ) * Math.PI * 2;
            
            return {
                x: Math.cos(angleX),
                y: Math.sin(angleY)
            };
        } catch (e) {
            console.error('Error calculating flow:', e);
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

        // Draw flow field arrows if enabled
        if (this.showArrows) {
            this.drawflowField();
        }
    }

    drawflowField() {
        // Calculate grid size based on canvas dimensions
        const gridSize = Math.max(10, Math.min(this.canvas.width, this.canvas.height) / 50);
        const arrowSize = gridSize * 0.5;
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            for (let y = 0; y < this.canvas.height; y += gridSize) {
                const flow = this.getflowAt(x, y);
                
                // Draw arrow
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + flow.x * arrowSize, y + flow.y * arrowSize);
                
                // Draw arrowhead
                const arrowAngle = Math.atan2(flow.y, flow.x);
                this.ctx.moveTo(x + flow.x * arrowSize, y + flow.y * arrowSize);
                this.ctx.lineTo(
                    x + flow.x * arrowSize - Math.cos(arrowAngle - Math.PI/6) * arrowSize/3,
                    y + flow.y * arrowSize - Math.sin(arrowAngle - Math.PI/6) * arrowSize/3
                );
                this.ctx.moveTo(x + flow.x * arrowSize, y + flow.y * arrowSize);
                this.ctx.lineTo(
                    x + flow.x * arrowSize - Math.cos(arrowAngle + Math.PI/6) * arrowSize/3,
                    y + flow.y * arrowSize - Math.sin(arrowAngle + Math.PI/6) * arrowSize/3
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
        const flow = overlap * 0.5;
        
        dot1.x += Math.cos(angle) * flow;
        dot1.y += Math.sin(angle) * flow;
        dot2.x -= Math.cos(angle) * flow;
        dot2.y -= Math.sin(angle) * flow;
    }
}

// Start the game
window.addEventListener('load', () => {
    const game = new Game();
});