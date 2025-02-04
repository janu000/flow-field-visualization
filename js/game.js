// Game initialization
class Game {
    constructor() {
        if (typeof Perlin === 'undefined') {
            console.error('Perlin class not found. Make sure perlin.js is loaded before game.js');
            return;
        }

        // Initialize Perlin noise generator first
        this.perlin = new Perlin();
        if (!this.perlin || !this.perlin.noise) {
            console.error('Failed to initialize Perlin noise generator');
            return;
        }
        this.forceFieldScale = 0.005; // Reduced scale for more variation
        this.forceFieldTime = 0;
        this.forceFieldSpeed = 0.1; // Adjust this to control the speed of the force field movement
        this.forceFieldStrength = 100;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
        
        this.pixelRatio = window.devicePixelRatio || 1;
        this.dots = []; // Array to store dot objects
        this.dragging = false;
        this.startPos = null;
        this.dotRadius = 5 * this.pixelRatio;
        
        // Default click handler (can be overridden)
        this.clickHandler = this.defaultClickHandler.bind(this);
        
        window.addEventListener('resize', this.resize.bind(this));

        // Initialize trail buffer first
        this.trailCanvas = document.createElement('canvas');
        this.trailCtx = this.trailCanvas.getContext('2d');
        this.trailCanvas.width = this.canvas.width;
        this.trailCanvas.height = this.canvas.height;
        this.trailFade = 0.98; // Default decay rate

        // Now call resize
        this.resize();
        
        // Initialize grid and widget first
        this.gridSize = 50;
        this.grid = new Map();
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

        // Add color settings
        this.dotColor = '#000000'; // Default color
        this.trailColor = '#000000'; // Default color

        // Add trail alpha setting
        this.trailAlpha = 0.1; // Default alpha value

        // Add visibility settings
        this.showDots = true;
        this.showArrows = true;

        // Create widget content
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
                <label>Spawn Interval (ms): <span id="spawnIntervalValue">1</span></label>
                <input type="range" min="1" max="1000" step="1" value="1" id="spawnInterval">
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

        // Store current settings
        this.currentSettings = {
            sizeScale: 1,
            friction: 1.0
        };

        // Add event listeners
        this.widget.querySelector('#sizeScale').addEventListener('input', (e) => {
            this.currentSettings.sizeScale = parseFloat(e.target.value);
            this.widget.querySelector('#sizeValue').textContent = e.target.value;
        });

        this.widget.querySelector('#frictionScale').addEventListener('input', (e) => {
            this.currentSettings.friction = parseFloat(e.target.value);
            this.widget.querySelector('#frictionValue').textContent = e.target.value;
        });

        this.widget.querySelector('#forceFieldStrength').addEventListener('input', (e) => {
            this.forceFieldStrength = parseFloat(e.target.value);
            this.widget.querySelector('#forceFieldStrengthValue').textContent = e.target.value;
        });

        this.widget.querySelector('#forceFieldScale').addEventListener('input', (e) => {
            this.forceFieldScale = parseFloat(e.target.value);
            this.widget.querySelector('#forceFieldScaleValue').textContent = e.target.value;
        });

        this.widget.querySelector('#forceFieldSpeed').addEventListener('input', (e) => {
            this.forceFieldSpeed = parseFloat(e.target.value);
            this.widget.querySelector('#forceFieldSpeedValue').textContent = e.target.value;
        });

        this.widget.querySelector('#constantForce').addEventListener('input', (e) => {
            this.constantForce.x = parseFloat(e.target.value);
            this.widget.querySelector('#constantForceValue').textContent = e.target.value;
        });

        this.widget.querySelector('#spawnInterval').addEventListener('input', (e) => {
            this.spawnInterval = parseFloat(e.target.value);
            this.widget.querySelector('#spawnIntervalValue').textContent = e.target.value;
        });

        this.widget.querySelector('#collisions').addEventListener('change', (e) => {
            this.toggleCollisions(e.target.checked);
        });

        this.widget.querySelector('#trails').addEventListener('change', (e) => {
            this.trailEnabled = e.target.checked;
            if (!this.trailEnabled) {
                // Clear the trail buffer when trails are disabled
                this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
            }
        });

        this.widget.querySelector('#trailDecay').addEventListener('input', (e) => {
            // Map the linear input value to an exponential scale
            const linearValue = parseFloat(e.target.value);
            const exponentialValue = 1 - Math.pow(1 - linearValue, 4); // Higher exponent for finer control
            this.trailFade = exponentialValue;
            this.widget.querySelector('#trailDecayValue').textContent = exponentialValue.toFixed(4);
        });

        // Add event listener for trail alpha
        this.widget.querySelector('#trailAlpha').addEventListener('input', (e) => {
            this.trailAlpha = parseFloat(e.target.value);
            this.widget.querySelector('#trailAlphaValue').textContent = e.target.value;
        });

        // Update the color picker event listener
        this.widget.querySelector('.color-picker-preview').addEventListener('click', () => {
            this.widget.querySelector('#colorPicker').click();
        });

        this.widget.querySelector('#colorPicker').addEventListener('input', (e) => {
            this.dotColor = e.target.value;
            this.trailColor = e.target.value;
            this.widget.querySelector('.color-picker-preview').style.backgroundColor = e.target.value;
        });

        // Add event listeners for visibility settings
        this.widget.querySelector('#showDots').addEventListener('change', (e) => {
            this.showDots = e.target.checked;
        });

        this.widget.querySelector('#showArrows').addEventListener('change', (e) => {
            this.showArrows = e.target.checked;
        });

        this.initialDotCount = 1000; // Easily adjustable hyperparameter
        this.initializeDots();

        // Add collision detection hyperparameter
        this.enableCollisions = false; // Set to false to disable collisions

        // Start the game loop after a small delay
        setTimeout(() => {
            this.lastTime = performance.now();
            this.loop();
        }, 100);

        this.constantForce = { x: -200, y: 0 }; // Increased force strength
        this.spawnInterval = 1; // Spawn a dot every 1000ms
        this.lastSpawnTime = performance.now();

        // Add trail settings
        this.trailEnabled = false; // Default to enabled
        this.trailFade = 0.98; // Default decay rate
    }

    initializeDots() {
        // Calculate grid dimensions
        const cols = Math.ceil(Math.sqrt(this.initialDotCount));
        const rows = Math.ceil(this.initialDotCount / cols);
        
        // Calculate spacing
        const spacingX = this.canvas.width / cols;
        const spacingY = this.canvas.height / rows;
        
        // Create dots
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
                friction: this.currentSettings.friction,
                sizeScale: this.currentSettings.sizeScale,
                mass: Math.pow(this.currentSettings.sizeScale, 3)
            });
        }
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

        // Spawn new dots periodically
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.spawnDotOnRight();
            this.lastSpawnTime = currentTime;
        }

        this.update(deltaTime);
        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }

    update(deltaTime) {
        if (!this.grid) {
            this.grid = new Map(); // Fallback initialization
        }
        this.updateSpatialGrid();

        // Update force field time
        this.forceFieldTime += deltaTime * this.forceFieldSpeed;
        
        // Apply force field to dots
        for (const dot of this.dots) {
            const force = this.getForceAt(dot.x, dot.y);
            const forceStrength = this.forceFieldStrength; // Adjust as needed
            dot.vx += force.x * forceStrength * deltaTime; // Apply directly to velocity
            dot.vy += force.y * forceStrength * deltaTime;
        }

        // Apply constant force to dots
        for (const dot of this.dots) {
            dot.vx += this.constantForce.x * deltaTime;
            dot.vy += this.constantForce.y * deltaTime;
        }
        
        // Update dot positions
        for (const dot of this.dots) {
            // Update position with velocity
            dot.x += dot.vx * deltaTime;
            dot.y += dot.vy * deltaTime;
            
            // Apply friction (optional)
            dot.vx *= 1 - dot.friction * deltaTime;
            dot.vy *= 1 - dot.friction * deltaTime;
        }
        
        // Only check collisions if enabled
        if (this.enableCollisions) {
            this.checkCollisionsWithGrid();
        }
    }

    updateSpatialGrid() {
        if (!this.grid) {
            console.error('Grid not initialized');
            this.grid = new Map(); // Fallback initialization
        }
        this.grid.clear(); // Now safe to call clear
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
        for (let i = 0; i < dots1.length; i++) {
            for (let j = 0; j < dots2.length; j++) {
                if (dots1[i] === dots2[j]) continue;
                
                const dot1 = dots1[i];
                const dot2 = dots2[j];
                
                // Calculate effective radii
                const radius1 = this.dotRadius * dot1.sizeScale;
                const radius2 = this.dotRadius * dot2.sizeScale;
                
                // Calculate distance between centers
                const dx = dot1.x - dot2.x;
                const dy = dot1.y - dot2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Check if circles are overlapping
                if (distance < radius1 + radius2) {
                    this.resolveCollision(dot1, dot2);
                }
            }
        }
    }

    defaultClickHandler(x, y) {
        // Store the dot position in canvas coordinates
        this.dots.push({
            x: endPos.x,
            y: endPos.y,
            vx: 0,
            vy: 0,
            ax: 0,
            ay: 0,
            friction: this.currentSettings.friction,
            sizeScale: this.currentSettings.sizeScale,
            mass: Math.pow(this.currentSettings.sizeScale, 3) // Mass proportional to volume (size^3)
        });
    }

    setClickHandler(handler) {
        // Allow changing the click behavior
        this.clickHandler = handler.bind(this);
    }

    renderDot(x, y, sizeScale) {
        const radius = this.dotRadius * sizeScale;
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    render() {
        // Clear main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Handle trails if enabled
        if (this.trailEnabled) {
            // Linear fade of the trail buffer
            const fadeAmount = (1 - this.trailFade) * 255;
            const imageData = this.trailCtx.getImageData(0, 0, this.trailCanvas.width, this.trailCanvas.height);
            const data = imageData.data;
            
            // Subtract fadeAmount from each pixel's alpha channel
            for (let i = 3; i < data.length; i += 4) {
                data[i] = Math.max(0, data[i] - fadeAmount);
            }
            
            this.trailCtx.putImageData(imageData, 0, 0);

            // Draw dots to the trail buffer
            this.trailCtx.globalCompositeOperation = 'source-over';
            for (const dot of this.dots) {
                const radius = this.dotRadius * dot.sizeScale;
                this.trailCtx.fillStyle = `rgba(${parseInt(this.trailColor.slice(1, 3), 16)}, ${parseInt(this.trailColor.slice(3, 5), 16)}, ${parseInt(this.trailColor.slice(5, 7), 16)}, ${this.trailAlpha})`;
                this.trailCtx.beginPath();
                this.trailCtx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
                this.trailCtx.fill();
            }

            // Draw the trail buffer to the main canvas
            this.ctx.globalAlpha = 1.0;
            this.ctx.drawImage(this.trailCanvas, 0, 0);
        }

        // Draw dots if enabled
        if (this.showDots) {
            this.ctx.beginPath();
            for (const dot of this.dots) {
                const radius = this.dotRadius * dot.sizeScale;
                this.ctx.moveTo(dot.x + radius, dot.y);
                this.ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
            }
            this.ctx.fillStyle = this.dotColor;
            this.ctx.fill();
        }

        // Draw force field arrows if enabled
        if (this.showArrows) {
            this.drawForceField();
        }
        
        // Draw dragging dot if active
        if (this.dragging && this.currentPos) {
            this.renderDot(
                this.currentPos.x, 
                this.currentPos.y, 
                this.currentSettings.sizeScale
            );
        }
        
        // Draw drag line if dragging
        if (this.dragging && this.startPos && this.currentPos) {
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.beginPath();
            this.ctx.moveTo(this.startPos.x, this.startPos.y);
            this.ctx.lineTo(this.currentPos.x, this.currentPos.y);
            this.ctx.stroke();
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

    resolveCollision(dot1, dot2) {
        // Calculate effective radii
        const radius1 = this.dotRadius * dot1.sizeScale;
        const radius2 = this.dotRadius * dot2.sizeScale;
        
        // Calculate collision normal
        const dx = dot2.x - dot1.x;
        const dy = dot2.y - dot1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize the collision vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Relative velocity
        const rvx = dot2.vx - dot1.vx;
        const rvy = dot2.vy - dot1.vy;
        
        // Speed along the normal
        const speed = rvx * nx + rvy * ny;
        
        // If dots are moving apart, do nothing
        if (speed > 0) return;
        
        // Elastic collision response with mass
        const massSum = dot1.mass + dot2.mass;
        const impulse = (-2 * speed) / massSum;
        dot1.vx -= impulse * nx * dot2.mass;
        dot1.vy -= impulse * ny * dot2.mass;
        dot2.vx += impulse * nx * dot1.mass;
        dot2.vy += impulse * ny * dot1.mass;
        
        // Position correction to prevent sticking
        const overlap = (radius1 + radius2) - distance;
        const correction = overlap / 2;
        dot1.x -= nx * correction;
        dot1.y -= ny * correction;
        dot2.x += nx * correction;
        dot2.y += ny * correction;
    }

    // Add method to toggle collisions
    toggleCollisions(enabled) {
        this.enableCollisions = enabled;
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
            friction: this.currentSettings.friction,
            sizeScale: this.currentSettings.sizeScale,
            mass: Math.pow(this.currentSettings.sizeScale, 3)
        });
    }
}

// Start the game
window.addEventListener('load', () => {
    const game = new Game();
    
    // Example of changing the click behavior:
    // game.setClickHandler((x, y) => {
    //     // New click behavior here
    // });
}); 