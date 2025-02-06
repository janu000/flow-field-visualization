# Visualizing Flow Fields

A web-based simulation that visualizes flow fields and particle interactions in real-time. This project demonstrates various physics concepts through an interactive and visually appealing interface.

## Features
- Interactive flow field visualization
- Customizable particle behavior
- Adjustable simulation parameters
- Smooth particle trails with configurable decay
- Real-time performance optimization
- Spatial partitioning for efficient collision detection

## Live Demo
The application can be tested live at:  
[https://janu000.github.io/flow-field-visualization](https://janu000.github.io/flow-field-visualization/)

## Key Controls

### Settings Widget
- **Particle Size**: Adjust the size of individual particles
- **Friction**: Control the resistance to movement
- **Flow Field Strength**: Modify the intensity of the flow field
- **Flow Field Scale**: Change the scale of the flow field pattern
- **Flow Field Speed**: Adjust the speed of the flow field animation
- **Directional Force**: Apply a constant directional force to all particles
- **Spawn Interval**: Control how frequently new particles are generated

### Visual Controls
- **Trails**: Toggle particle trails on/off
- **Trail Decay**: Adjust how quickly trails fade
- **Trail Alpha**: Control the transparency of trails
- **Show Particles**: Toggle particle visibility
- **Show Arrows**: Toggle flow field arrow visualization
- **Color Picker**: Select particle and trail colors

### Physics Controls
- **Collisions**: Enable/disable particle collisions
- **Reset Simulation**: Clear all particles and restart the simulation

## Technical Details
- Built with vanilla JavaScript
- Uses Perlin noise for flow field generation
- Optimized spatial partitioning for collision detection
- Canvas-based rendering for smooth animations
- Responsive design with dynamic scaling

## Installation
1. Clone the repository
2. Open `index.html` in your browser

## License
This project is licensed under the MIT License.