import Phaser from 'phaser';

interface ItemCategory {
    name: string;
    zone: 'floor' | 'wall' | 'ceiling' | 'any';
    items: {
        name: string;
        key: string;
        naturalWall?: 'left' | 'right';
        collisionBox?: {
            points: Array<{x: number, y: number}>;
        };
    }[];
}

class CollisionEditorScene extends Phaser.Scene {
    private categories: ItemCategory[] = [];
    private selectedItem: Phaser.GameObjects.Sprite | null = null;
    private selectedItemInfo: any = null;
    private polygonPoints: Array<{x: number, y: number}> = [];
    private polygonGraphics!: Phaser.GameObjects.Graphics;
    private instructionsText!: Phaser.GameObjects.Text;
    private catalogContainer!: Phaser.GameObjects.Container;
    private itemScale: number = 2; // Larger scale for easier editing
    private pointMarkers: Phaser.GameObjects.Container[] = [];

    constructor() {
        super({ key: 'CollisionEditorScene' });
    }

    init(data: any) {
        // Receive categories data from RoomEditorScene if available
        if (data && data.categories) {
            this.categories = data.categories;
        }
    }

    preload() {
        // Load all item assets if not already loaded
        this.categories.forEach(category => {
            category.items.forEach(item => {
                const key = item.name.replace('.png', '');
                if (!this.textures.exists(key)) {
                    this.load.image(key, `assets/Catroom/Items/${item.name}`);
                }
            });
        });
    }

    create() {
        // Set background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x222222)
            .setOrigin(0);

        // Add title
        this.add.text(this.cameras.main.centerX, 20, 'Collision Polygon Editor', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5, 0);

        // Add instructions
        this.instructionsText = this.add.text(this.cameras.main.centerX, 60, 
            'Select an item from the catalog, then click to add polygon points.\n' +
            'Press P to print polygon to console, ESC to exit, C to clear points.', {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0);

        // Create polygon graphics
        this.polygonGraphics = this.add.graphics();

        // Initialize the catalog
        this.createCatalog();

        // Add exit handler (ESC key)
        this.input.keyboard?.on('keydown-ESC', this.exitEditor, this);
        
        // Add clear handler (C key)
        this.input.keyboard?.on('keydown-C', this.clearPoints, this);
        
        // Add print handler (P key)
        this.input.keyboard?.on('keydown-P', this.printPolygon, this);

        // Setup click handler for adding points
        this.input.on('pointerdown', this.handleClick, this);
    }
    
    private createCatalog() {
        // Create catalog container
        this.catalogContainer = this.add.container(0, 100);
        
        // Add vertical scrolling panel
        const scrollZone = this.add.zone(this.cameras.main.width - 220, 100, 220, this.cameras.main.height - 120);
        const scrollMask = this.make.graphics({});
        scrollMask.fillStyle(0xffffff);
        scrollMask.fillRect(
            this.cameras.main.width - 220, 
            100, 
            220, 
            this.cameras.main.height - 120
        );
        
        const catalogBg = this.add.rectangle(
            this.cameras.main.width - 110, 
            100, 
            220, 
            this.cameras.main.height - 120, 
            0x333333
        ).setOrigin(0.5, 0);
        
        this.catalogContainer.add(catalogBg);
        
        // Add items to catalog
        let yPos = 10;
        this.categories.forEach(category => {
            // Category title
            const title = this.add.text(
                this.cameras.main.width - 210, 
                yPos, 
                category.name, 
                { fontSize: '18px', color: '#ffffff' }
            );
            this.catalogContainer.add(title);
            yPos += 30;
            
            // Category items
            let xPos = this.cameras.main.width - 210;
            const itemWidth = 50;
            const itemsPerRow = 3;
            let itemCount = 0;
            
            category.items.forEach(item => {
                const itemKey = item.name.replace('.png', '');
                const thumbScale = 0.3;
                
                const itemBtn = this.add.sprite(xPos, yPos, itemKey)
                    .setScale(thumbScale)
                    .setOrigin(0)
                    .setInteractive({ useHandCursor: true });
                
                // Item selection handler
                itemBtn.on('pointerdown', () => {
                    this.selectItem(item);
                });
                
                this.catalogContainer.add(itemBtn);
                
                // Position next item
                itemCount++;
                if (itemCount % itemsPerRow === 0) {
                    xPos = this.cameras.main.width - 210;
                    yPos += 60;
                } else {
                    xPos += 70;
                }
            });
            
            // Ensure next category starts on a new row
            if (itemCount % itemsPerRow !== 0) {
                yPos += 60;
            }
            yPos += 20; // Space between categories
        });
        
        // Setup scrolling for catalog
        const contentHeight = yPos + 20;
        const maskHeight = this.cameras.main.height - 120;
        
        if (contentHeight > maskHeight) {
            this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
                if (pointer.x > this.cameras.main.width - 220) {
                    const newY = Phaser.Math.Clamp(
                        this.catalogContainer.y - deltaY,
                        -(contentHeight - maskHeight),
                        0
                    );
                    this.catalogContainer.y = newY;
                }
            });
        }
    }
    
    private selectItem(item: any) {
        // Clear any previous selection
        if (this.selectedItem) {
            this.selectedItem.destroy();
            this.clearPoints();
        }
        
        // Create the selected item in the center of the view
        const itemKey = item.name.replace('.png', '');
        this.selectedItem = this.add.sprite(
            this.cameras.main.centerX - 100,
            this.cameras.main.centerY,
            itemKey
        ).setScale(this.itemScale);
        
        this.selectedItemInfo = item;
        
        // Load existing collision box if available
        if (item.collisionBox && item.collisionBox.points) {
            this.polygonPoints = [...item.collisionBox.points];
            this.drawPolygon();
        }
        
        // Update instructions
        this.instructionsText.setText(
            `Selected: ${item.name}\n` +
            'Click to add points to the polygon. Press P to print, C to clear, ESC to exit.'
        );
    }
    
    private handleClick(pointer: Phaser.Input.Pointer) {
        // Ignore clicks in the catalog area
        if (pointer.x > this.cameras.main.width - 220) return;
        
        // Ensure we have an item selected
        if (!this.selectedItem) {
            this.instructionsText.setText('Please select an item from the catalog first');
            return;
        }
        
        // Add point relative to the sprite's center
        const relativeX = Math.round((pointer.x - this.selectedItem.x) / this.itemScale);
        const relativeY = Math.round((pointer.y - this.selectedItem.y) / this.itemScale);
        
        // Add the point
        this.polygonPoints.push({ x: relativeX, y: relativeY });
        
        // Draw the updated polygon
        this.drawPolygon();
    }
    
    private drawPolygon() {
        // Clear previous graphics
        this.polygonGraphics.clear();
        
        // Clear previous point markers
        this.pointMarkers.forEach(marker => marker.destroy());
        this.pointMarkers = [];
        
        // Ensure we have at least 2 points
        if (this.polygonPoints.length < 2 || !this.selectedItem) return;
        
        // Draw the polygon outline
        this.polygonGraphics.lineStyle(2, 0x00ff00);
        
        // Start polygon path
        this.polygonGraphics.beginPath();
        
        // Calculate world positions for all points
        const worldPoints = this.polygonPoints.map(point => ({
            x: this.selectedItem!.x + point.x * this.itemScale,
            y: this.selectedItem!.y + point.y * this.itemScale
        }));
        
        // Draw the polygon
        this.polygonGraphics.moveTo(worldPoints[0].x, worldPoints[0].y);
        for (let i = 1; i < worldPoints.length; i++) {
            this.polygonGraphics.lineTo(worldPoints[i].x, worldPoints[i].y);
        }
        
        // Close the polygon if we have 3+ points
        if (worldPoints.length >= 3) {
            this.polygonGraphics.lineTo(worldPoints[0].x, worldPoints[0].y);
        }
        
        this.polygonGraphics.strokePath();
        
        // Draw points with numbers
        worldPoints.forEach((point, index) => {
            // Create a container for each point marker
            const markerContainer = this.add.container(point.x, point.y);
            
            // Add circle
            const circle = this.add.circle(0, 0, 6, 0x00ff00);
            
            // Add index number
            const text = this.add.text(10, -10, index.toString(), {
                fontSize: '16px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 3, y: 2 }
            });
            
            markerContainer.add([circle, text]);
            this.pointMarkers.push(markerContainer);
        });
    }
    
    private clearPoints() {
        this.polygonPoints = [];
        this.polygonGraphics.clear();
        
        // Clear point markers
        this.pointMarkers.forEach(marker => marker.destroy());
        this.pointMarkers = [];
    }
    
    private printPolygon() {
        if (this.polygonPoints.length < 3) {
            this.instructionsText.setText('Need at least 3 points to create a polygon!');
            return;
        }
        
        const polygonCode = `collisionBox: {
    points: [
        ${this.polygonPoints.map(p => `{x: ${p.x}, y: ${p.y}}`).join(',\n        ')}
    ]
}`;
        
        console.log(polygonCode);
        
        // Show success message
        const successText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            'Polygon code printed to console!',
            {
                fontSize: '20px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5);
        
        // Fade out success message
        this.tweens.add({
            targets: successText,
            alpha: 0,
            y: successText.y - 50,
            duration: 1500,
            onComplete: () => successText.destroy()
        });
    }
    
    private exitEditor() {
        this.scene.resume('RoomEditorScene');
        this.scene.stop();
    }
}

export default CollisionEditorScene; 