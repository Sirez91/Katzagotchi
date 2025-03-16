import Phaser from 'phaser';

interface PlacedItem {
    sprite: Phaser.GameObjects.Sprite;
    name: string;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
}

interface ItemCategory {
    name: string;
    items: Array<{
        name: string;
        naturalWall?: 'left' | 'right';  // Only for wall items
    }>;
    zone: 'floor' | 'wall' | 'any';
}

interface Zone {
    name: 'floor' | 'wall';
    side?: 'left' | 'right';  // Only for wall zones
    polygon: Phaser.Geom.Polygon;
}

interface SavedRoomConfig {
    room: string;
    items: Array<{
        name: string;
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
    }>;
}

class RoomEditorScene extends Phaser.Scene {
    private background!: Phaser.GameObjects.Image;
    private catalogContainer!: Phaser.GameObjects.Container;
    private roomPanel!: Phaser.GameObjects.Container;
    private selectedItem: Phaser.GameObjects.Sprite | null = null;
    private selectedItemZone: string = 'any';
    private placedItems: PlacedItem[] = [];
    private currentRoom: string = 'Room1';
    private isPanelOpen: boolean = false;
    private zones: Record<string, Zone[]> = {};
    private showZones: boolean = false;
    private zoneGraphics!: Phaser.GameObjects.Graphics;
    private isDrawingZone: boolean = false;
    private currentZoneType: 'floor' | 'wall' = 'floor';
    private currentZonePoints: Phaser.Math.Vector2[] = [];
    private categories: ItemCategory[] = [
        {
            name: 'Beds',
            items: [
                { name: 'bed_teal.png' },
                { name: 'bed_purple.png' },
                { name: 'bed_green.png' }
            ],
            zone: 'floor'
        },
        {
            name: 'Food & Water',
            items: [
                { name: 'foodbowl_blue.png' },
                { name: 'foodbowl_green.png' },
                { name: 'foodbowl_purple.png' },
                { name: 'foodbowl_red.png' },
                { name: 'foodbowl_white.png' },
                { name: 'foodbowl_yellow.png' },
                { name: 'waterbowl_green.png' },
                { name: 'waterbowl_purple.png' },
                { name: 'waterbowl_red.png' },
                { name: 'waterbowl_white.png' },
                { name: 'waterbowl_yellow.png' },
                { name: 'whaterbowl_blue.png' },
                { name: 'foodbag.png' },
                { name: 'foodbag_large.png' }
            ],
            zone: 'floor'
        },
        {
            name: 'Scratchers',
            items: [
                { name: 'scratcher_round_blue.png' },
                { name: 'scratcher_round_green.png' },
                { name: 'scratcher_round_red.png' },
                { name: 'scratcher_round_white.png' },
                { name: 'scratcher_round_yellow.png' },
                { name: 'scratcher_simple_beige.png' },
                { name: 'scratcher_simple_white.png' },
                { name: 'scratcher_ledder_white.png' },
                { name: 'scratcher_ledder_yellow.png' }
            ],
            zone: 'floor'
        },
        {
            name: 'Plants',
            items: [
                { name: 'plant_big_blue.png' },
                { name: 'plant_big_lightblue.png' },
                { name: 'plant_big_purple.png' },
                { name: 'plant_large_brown.png' },
                { name: 'plant_lightblue.png' },
                { name: 'plant_lightgreen.png' }
            ],
            zone: 'floor'
        },
        {
            name: 'Wall Decor',
            items: [
                { name: 'image_heart_blue.png', naturalWall: 'left' },
                { name: 'image_heart_brown.png', naturalWall: 'left' },
                { name: 'image_heart_green.png', naturalWall: 'left' },
                { name: 'image_heart_grey.png', naturalWall: 'left' },
                { name: 'image_heart_ocker.png', naturalWall: 'left' },
                { name: 'image_heart_pink.png', naturalWall: 'left' },
                { name: 'image_heart_purple.png', naturalWall: 'left' },
                { name: 'image_heart_white.png', naturalWall: 'left' },
                { name: 'image_heart_yellow.png', naturalWall: 'left' },
                { name: 'image_cat_pink.png', naturalWall: 'right' },
                { name: 'image_cat_teal.png', naturalWall: 'right' },
                { name: 'image_cat_white.png', naturalWall: 'right' }
            ],
            zone: 'wall'
        },
        {
            name: 'Windows',
            items: [
                { name: 'window_curtain_blue.png', naturalWall: 'left' },
                { name: 'window_curtain_red.png', naturalWall: 'left' },
                { name: 'window_curtain_beige.png', naturalWall: 'left' }
            ],
            zone: 'wall'
        },
        {
            name: 'Furniture',
            items: [
                { name: 'shelves.png' },
                { name: 'shelve_yellow.png' },
                { name: 'shelve_purple.png' }
            ],
            zone: 'floor'
        }
    ];
    private saveKey = 'savedRoomConfig';

    constructor() {
        super({ key: 'RoomEditorScene' });
    }

    preload() {
        // Load rooms
        this.load.image('Room1', 'assets/Catroom/Rooms/Room1.png');
        this.load.image('Room2', 'assets/Catroom/Rooms/Room2.png');
        this.load.image('Room3', 'assets/Catroom/Rooms/Room3.png');
        
        // Load all items
        this.categories.forEach(category => {
            category.items.forEach(item => {
                this.load.image(item.name.replace('.png', ''), `assets/Catroom/Items/${item.name}`);
            });
        });
    }

    create() {
        // Load saved room configuration
        const savedConfig = localStorage.getItem(this.saveKey);
        if (savedConfig) {
            const config: SavedRoomConfig = JSON.parse(savedConfig);
            this.currentRoom = config.room;

            this.background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, this.currentRoom)
                .setOrigin(0.5);
            
            // Place all saved items
            config.items.forEach(item => {
                // First, find the category for this item
                let foundCategory: ItemCategory | undefined;
                for (const category of this.categories) {
                    // Check both with and without .png extension
                    if (category.items.some(i => 
                        i.name === item.name || 
                        i.name === `${item.name}.png` || 
                        i.name.replace('.png', '') === item.name
                    )) {
                        foundCategory = category;
                        break;
                    }
                }
                
                if (!foundCategory) {
                    console.error(`Could not find category for item: ${item.name}`);
                    return;
                }
                
                // Create the sprite
                const itemInfo = foundCategory.items.find(i => 
                    i.name === item.name || 
                    i.name === `${item.name}.png` || 
                    i.name.replace('.png', '') === item.name
                );
                const sprite = this.add.sprite(item.x, item.y, item.name.replace('.png', ''))
                    .setScale(item.scaleX, item.scaleY);
                
                // Make the sprite draggable
                sprite.setInteractive({ draggable: true, useHandCursor: true });
                
                // Add the sprite to placed items
                this.placedItems.push({
                    sprite,
                    name: item.name,
                    x: item.x,
                    y: item.y,
                    scaleX: item.scaleX,
                    scaleY: item.scaleY
                });
                
                // Add drag handlers
                sprite.on('dragstart', () => {
                    console.log('Drag started', item.name);
                    sprite.setDepth(100);
                });
                
                sprite.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                    sprite.x = dragX;
                    sprite.y = dragY;
                    
                    // Check if in valid zone
                    const isValid = this.isPointInZone(dragX, dragY, foundCategory.zone, itemInfo?.naturalWall);
                    sprite.setAlpha(isValid ? 1 : 0.4);
                    sprite.setTint(isValid ? 0xffffff : 0xff0000);
                    
                    // Handle mirroring for wall items
                    if (foundCategory.zone === 'wall' && itemInfo?.naturalWall) {
                        const currentWallZone = this.getCurrentWallZone(dragX, dragY);
                        if (currentWallZone && currentWallZone.side !== itemInfo.naturalWall) {
                            sprite.setScale(-0.8, 0.8);
                        } else {
                            sprite.setScale(0.8);
                        }
                    }
                    
                    // Update stored position
                    const itemData = this.placedItems.find(i => i.sprite === sprite);
                    if (itemData) {
                        itemData.x = dragX;
                        itemData.y = dragY;
                        itemData.scaleX = sprite.scaleX;
                        itemData.scaleY = sprite.scaleY;
                    }
                });
                
                sprite.on('dragend', (pointer: Phaser.Input.Pointer) => {
                    console.log('Drag ended', item.name);
                    
                    const isValid = this.isPointInZone(sprite.x, sprite.y, foundCategory.zone, itemInfo?.naturalWall);
                    const isInCatalog = sprite.x > this.cameras.main.width - 300 && this.catalogContainer.x < this.cameras.main.width;
                    
                    if (isValid && !isInCatalog) {
                        // Snap to grid
                        sprite.x = Math.round(sprite.x / 32) * 32;
                        sprite.y = Math.round(sprite.y / 32) * 32;
                        sprite.setAlpha(1);
                        sprite.clearTint();
                        sprite.setDepth(1);
                        
                        // Update stored position
                        const itemData = this.placedItems.find(i => i.sprite === sprite);
                        if (itemData) {
                            itemData.x = sprite.x;
                            itemData.y = sprite.y;
                            itemData.scaleX = sprite.scaleX;
                            itemData.scaleY = sprite.scaleY;
                        }
                    } else {
                        // Remove invalid item
                        const index = this.placedItems.findIndex(i => i.sprite === sprite);
                        if (index !== -1) {
                            this.placedItems.splice(index, 1);
                        }
                        sprite.destroy();
                        
                        // Show error message
                        const errorText = this.add.text(sprite.x, sprite.y - 20, 
                            `Can only place on ${foundCategory.zone}!`, 
                            { fontSize: '16px', color: '#ff0000' });
                        
                        this.tweens.add({
                            targets: errorText,
                            alpha: 0,
                            y: errorText.y - 50,
                            duration: 1500,
                            onComplete: () => errorText.destroy()
                        });
                    }
                });
                
                // Add right-click to remove
                sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    if (pointer.rightButtonDown()) {
                        const index = this.placedItems.findIndex(i => i.sprite === sprite);
                        if (index !== -1) {
                            this.placedItems.splice(index, 1);
                        }
                        sprite.destroy();
                    }
                });
            });
        } else {
            this.background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, this.currentRoom)
                .setOrigin(0.5);
        }

        // Initialize zone graphics
        this.zoneGraphics = this.add.graphics();
        
        // Define zones for each room
        this.defineZones();

        // Create UI panels
        this.createCatalog();
        this.createRoomPanel();
        
        // Helper function to create pixel-style button background
        const createPixelButton = (x: number, y: number, width: number, height: number, isPressed: boolean = false) => {
            const graphics = this.add.graphics();
            
            if (isPressed) {
                // Pressed state
                graphics.fillStyle(0x2d4b4d);  // Darker teal
                graphics.fillRect(x + 2, y + 2, width - 2, height - 2);
                graphics.fillStyle(0x45777a);  // Mid teal
                graphics.fillRect(x, y, width - 2, height - 2);
            } else {
                // Normal state
                // Main button color
                graphics.fillStyle(0x45777a);  // Mid teal
                graphics.fillRect(x, y, width, height);
                
                // Light edge (top, left)
                graphics.fillStyle(0x5ea4a7);  // Light teal
                graphics.fillRect(x, y, width, 2); // top
                graphics.fillRect(x, y, 2, height); // left
                
                // Dark edge (bottom, right)
                graphics.fillStyle(0x2d4b4d);  // Darker teal
                graphics.fillRect(x, y + height - 2, width, 2); // bottom
                graphics.fillRect(x + width - 2, y, 2, height); // right
            }

            return graphics;
        };

        // Button style configuration
        const buttonStyle = {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff',
            padding: { x: 16, y: 8 },
            align: 'center'
        };

        // Create button helper function
        const createButton = (x: number, y: number, text: string) => {
            const buttonWidth = 140;
            const buttonHeight = 36;
            let bg = createPixelButton(0, 0, buttonWidth, buttonHeight);
            const textObj = this.add.text(buttonWidth/2, buttonHeight/2, text, buttonStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            
            const container = this.add.container(x, y, [bg, textObj]);

            // Add hover effects
            textObj.on('pointerover', () => {
                bg.clear();
                bg = createPixelButton(0, 0, buttonWidth, buttonHeight, true);
                container.removeAll();
                container.add([bg, textObj]);
                container.y += 2;
            });

            textObj.on('pointerout', () => {
                bg.clear();
                bg = createPixelButton(0, 0, buttonWidth, buttonHeight, false);
                container.removeAll();
                container.add([bg, textObj]);
                container.y -= 2;
            });

            return { bg, text: textObj, container };
        };

        // Calculate button positions
        const gameWidth = this.cameras.main.width;
        const buttonSpacing = 160;
        const topMargin = 20;
        const sideMargin = 20;

        // Create navigation button with unique style
        const createNavButton = (x: number, y: number, width: number, height: number, isPressed: boolean = false) => {
            const graphics = this.add.graphics();
            
            if (isPressed) {
                // Pressed state
                graphics.fillStyle(0x2d5c3d);  // Darker green
                graphics.fillRect(x + 2, y + 2, width - 2, height - 2);
                graphics.fillStyle(0x3d7a52);  // Mid green
                graphics.fillRect(x, y, width - 2, height - 2);
            } else {
                // Normal state
                graphics.fillStyle(0x3d7a52);  // Mid green
                graphics.fillRect(x, y, width, height);
                
                // Light edge (top, left)
                graphics.fillStyle(0x4e9b68);  // Light green
                graphics.fillRect(x, y, width, 2);
                graphics.fillRect(x, y, 2, height);
                
                // Dark edge (bottom, right)
                graphics.fillStyle(0x2d5c3d);  // Darker green
                graphics.fillRect(x, y + height - 2, width, 2);
                graphics.fillRect(x + width - 2, y, 2, height);
            }
            return graphics;
        };

        // Add Return button in top right with matching style
        const navButtonWidth = 80;
        const navButtonHeight = 36;
        const navButtonX = this.cameras.main.width - navButtonWidth - 20;
        const navButtonY = 20;

        const navButtonStyle = {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff',
            padding: { x: 10, y: 5 },
            align: 'center'
        };

        const returnBtn = {
            bg: createNavButton(0, 0, navButtonWidth, navButtonHeight),
            text: this.add.text(navButtonWidth/2, navButtonHeight/2, '🐱 Return', navButtonStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
        };
        const returnContainer = this.add.container(navButtonX, navButtonY, [returnBtn.bg, returnBtn.text]);

        // Add hover and click effects for nav button
        returnBtn.text.on('pointerover', () => {
            returnBtn.bg.clear();
            returnBtn.bg = createNavButton(0, 0, navButtonWidth, navButtonHeight, true);
            returnContainer.removeAll();
            returnContainer.add([returnBtn.bg, returnBtn.text]);
            returnContainer.y += 2;
        });

        returnBtn.text.on('pointerout', () => {
            returnBtn.bg.clear();
            returnBtn.bg = createNavButton(0, 0, navButtonWidth, navButtonHeight, false);
            returnContainer.removeAll();
            returnContainer.add([returnBtn.bg, returnBtn.text]);
            returnContainer.y -= 2;
        });

        returnBtn.text.on('pointerdown', () => {
            this.scene.start('CatScene');
        });

        // Add save button next to return button
        const saveButtonWidth = 80;
        const saveButtonX = navButtonX - saveButtonWidth - 10;  // 10px spacing between buttons
        const saveButtonY = navButtonY;

        const saveBtn = {
            bg: createNavButton(0, 0, saveButtonWidth, navButtonHeight),
            text: this.add.text(saveButtonWidth/2, navButtonHeight/2, '💾 Save', navButtonStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
        };
        const saveContainer = this.add.container(saveButtonX, saveButtonY, [saveBtn.bg, saveBtn.text]);

        // Add hover and click effects for save button
        saveBtn.text.on('pointerover', () => {
            saveBtn.bg.clear();
            saveBtn.bg = createNavButton(0, 0, saveButtonWidth, navButtonHeight, true);
            saveContainer.removeAll();
            saveContainer.add([saveBtn.bg, saveBtn.text]);
            saveContainer.y += 2;
        });

        saveBtn.text.on('pointerout', () => {
            saveBtn.bg.clear();
            saveBtn.bg = createNavButton(0, 0, saveButtonWidth, navButtonHeight, false);
            saveContainer.removeAll();
            saveContainer.add([saveBtn.bg, saveBtn.text]);
            saveContainer.y -= 2;
        });

        saveBtn.text.on('pointerdown', () => {
            this.saveRoomConfig();
            
            // Show success message
            const successText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, 
                'Room configuration saved!', 
                { 
                    fontSize: '24px',
                    color: '#00ff00',
                    backgroundColor: '#000000',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5);
            
            // Fade out the success message
            this.tweens.add({
                targets: successText,
                alpha: 0,
                y: successText.y - 50,
                duration: 1500,
                onComplete: () => successText.destroy()
            });
        });

        // Create left-side buttons at the top
        const catalogBtn = createButton(sideMargin, topMargin, '📦 Catalog');
        catalogBtn.text.on('pointerdown', () => {
            this.toggleCatalog();
        });

        const roomBtn = createButton(buttonSpacing + sideMargin, topMargin, '🎨 Change Room');
        roomBtn.text.on('pointerdown', () => {
            this.toggleRoomPanel();
        });

        // Calculate bottom button positions
        const bottomMargin = this.cameras.main.height - 60; // 60px from bottom
        const bottomButtonSpacing = 160;

        // Add zone-related buttons at the bottom
        const zonesBtn = createButton(sideMargin, bottomMargin, '🔍 Toggle Zones');
        
        // Create other zone buttons but set their containers' alpha to 0 initially
        const zoneTypeBtn = createButton(bottomButtonSpacing + sideMargin, bottomMargin, '🔄 Floor/Wall');
        zoneTypeBtn.container.setAlpha(0);
        
        const printBtn = createButton(bottomButtonSpacing * 2 + sideMargin, bottomMargin, '🖨️ Print Zones');
        printBtn.container.setAlpha(0);
        
        const clearBtn = createButton(bottomButtonSpacing * 3 + sideMargin, bottomMargin, '🗑️ Clear Zones');
        clearBtn.container.setAlpha(0);
        
        const finishBtn = createButton(bottomButtonSpacing * 4 + sideMargin, bottomMargin, '✅ Finish Zone');
        finishBtn.container.setAlpha(0);

        // Store references to zone button containers
        const zoneButtons = [zoneTypeBtn.container, printBtn.container, clearBtn.container, finishBtn.container];

        zonesBtn.text.on('pointerdown', () => {
            this.showZones = !this.showZones;
            if (this.showZones) {
                this.setupZoneDrawing();
                // Show other zone buttons with tween
                zoneButtons.forEach((btn, index) => {
                    this.tweens.add({
                        targets: btn,
                        alpha: 1,
                        duration: 200,
                        delay: index * 50,
                        ease: 'Power2'
                    });
                });
            } else {
                this.disableZoneDrawing();
                // Hide other zone buttons with tween
                zoneButtons.forEach((btn, index) => {
                    this.tweens.add({
                        targets: btn,
                        alpha: 0,
                        duration: 200,
                        delay: index * 50,
                        ease: 'Power2'
                    });
                });
            }
            this.drawZones();
        });

        zoneTypeBtn.text.on('pointerdown', () => {
            if (this.showZones) {
                this.currentZoneType = this.currentZoneType === 'floor' ? 'wall' : 'floor';
                zoneTypeBtn.text.setText(`🔄 ${this.currentZoneType.charAt(0).toUpperCase() + this.currentZoneType.slice(1)}`);
            }
        });

        printBtn.text.on('pointerdown', () => {
            if (this.showZones) {
                this.printZones();
            }
        });

        clearBtn.text.on('pointerdown', () => {
            if (this.showZones) {
                this.zones[this.currentRoom] = [];
                this.currentZonePoints = [];
                this.drawZones();
            }
        });

        finishBtn.text.on('pointerdown', () => {
            if (this.showZones && this.currentZonePoints.length >= 3) {
                this.finishCurrentZone();
            }
        });
    }

    private defineZones() {
        // Define zones for each room
        this.zones = {
            'Room1': [
                {
                    name: 'floor',
                    polygon: new Phaser.Geom.Polygon([
                        // Bottom area of the room
                        { x: 218, y: 367 },
                        { x: 452, y: 489 },
                        { x: 685, y: 368 },
                        { x: 452, y: 244 }
                    ])
                },
                {
                    name: 'wall',
                    side: 'right',
                    polygon: new Phaser.Geom.Polygon([
                        // Right wall
                        { x: 685, y: 365 },
                        { x: 453, y: 243 },
                        { x: 452, y: 91 },
                        { x: 686, y: 212 },
                    ])
                },
                {
                    name: 'wall',
                    side: 'left',
                    polygon: new Phaser.Geom.Polygon([
                        // Left wall
                        { x: 217, y: 367 },
                        { x: 450, y: 243 },
                        { x: 452, y: 93 },
                        { x: 217, y: 213 }
                    ])
                }
            ],
            'Room2': [
                {
                    name: 'floor',
                    polygon: new Phaser.Geom.Polygon([
                        { x: 100, y: 400 },
                        { x: 700, y: 400 },
                        { x: 700, y: 550 },
                        { x: 100, y: 550 }
                    ])
                },
                {
                    name: 'wall',
                    polygon: new Phaser.Geom.Polygon([
                        // Left wall
                        { x: 100, y: 100 },
                        { x: 200, y: 100 },
                        { x: 200, y: 400 },
                        { x: 100, y: 400 },
                        // Right wall
                        { x: 600, y: 100 },
                        { x: 700, y: 100 },
                        { x: 700, y: 400 },
                        { x: 600, y: 400 }
                    ])
                }
            ],
            'Room3': [
                {
                    name: 'floor',
                    polygon: new Phaser.Geom.Polygon([
                        { x: 100, y: 400 },
                        { x: 700, y: 400 },
                        { x: 700, y: 550 },
                        { x: 100, y: 550 }
                    ])
                },
                {
                    name: 'wall',
                    polygon: new Phaser.Geom.Polygon([
                        // Left wall
                        { x: 100, y: 100 },
                        { x: 200, y: 100 },
                        { x: 200, y: 400 },
                        { x: 100, y: 400 },
                        // Right wall
                        { x: 600, y: 100 },
                        { x: 700, y: 100 },
                        { x: 700, y: 400 },
                        { x: 600, y: 400 }
                    ])
                }
            ]
        };
    }

    private drawZones() {
        this.zoneGraphics.clear();
        
        if (!this.showZones) return;
        
        const currentZones = this.zones[this.currentRoom];
        
        if (currentZones) {
            currentZones.forEach(zone => {
                const color = zone.name === 'floor' ? 0x00ff00 : 0x0000ff;
                this.zoneGraphics.lineStyle(2, color, 0.5);
                this.zoneGraphics.fillStyle(color, 0.2);
                this.zoneGraphics.beginPath();
                
                const points = zone.polygon.points;
                this.zoneGraphics.moveTo(points[0].x, points[0].y);
                
                for (let i = 1; i < points.length; i++) {
                    this.zoneGraphics.lineTo(points[i].x, points[i].y);
                }
                
                this.zoneGraphics.closePath();
                this.zoneGraphics.strokePath();
                this.zoneGraphics.fillPath();
            });
        }

        // Draw current zone in progress
        if (this.currentZonePoints.length > 0) {
            const color = this.currentZoneType === 'floor' ? 0x00ff00 : 0x0000ff;
            this.zoneGraphics.lineStyle(2, color, 0.8);
            this.zoneGraphics.beginPath();
            
            this.zoneGraphics.moveTo(this.currentZonePoints[0].x, this.currentZonePoints[0].y);
            
            for (let i = 1; i < this.currentZonePoints.length; i++) {
                this.zoneGraphics.lineTo(this.currentZonePoints[i].x, this.currentZonePoints[i].y);
            }
            
            if (this.currentZonePoints.length >= 3) {
                this.zoneGraphics.lineTo(this.currentZonePoints[0].x, this.currentZonePoints[0].y);
            }
            
            this.zoneGraphics.strokePath();

            // Draw points
            this.currentZonePoints.forEach((point, index) => {
                this.zoneGraphics.fillStyle(color, 1);
                this.zoneGraphics.fillCircle(point.x, point.y, 4);
                
                // Draw point number
                const text = this.add.text(point.x + 10, point.y + 10, index.toString(), {
                    fontSize: '16px',
                    color: '#ffffff',
                    backgroundColor: '#000000'
                }).setDepth(100);
                
                // Remove the text after a short delay
                this.time.delayedCall(100, () => text.destroy());
            });
        }
    }

    private isPointInZone(x: number, y: number, zoneName: string, naturalWall?: 'left' | 'right'): boolean {
        // If zone is 'any', always return true
        if (zoneName === 'any') return true;
        
        const currentZones = this.zones[this.currentRoom];
        if (!currentZones) return false;
        
        // For wall items, check if we're in any wall zone first
        if (zoneName === 'wall') {
            const wallZones = currentZones.filter(z => z.name === 'wall');
            const isInAnyWall = wallZones.some(zone => zone.polygon.contains(x, y));
            
            // If not in any wall zone, return false
            if (!isInAnyWall) return false;
            
            // If natural wall is specified, check if we're in the correct wall side
            if (naturalWall) {
                const currentWallZone = this.getCurrentWallZone(x, y);
                // Allow placement if either:
                // 1. We're in a wall zone of the natural side
                // 2. We're in a wall zone of the opposite side (item will be mirrored)
                return currentWallZone !== null;
            }
            
            return true;
        }
        
        // For non-wall items
        const zones = currentZones.filter(z => z.name === zoneName);
        return zones.some(zone => zone.polygon.contains(x, y));
    }

    private createCatalog() {
        // Create main container
        this.catalogContainer = this.add.container(this.cameras.main.width, 0);
        
        // Create panel background that extends beyond viewport
        const catalogBg = this.add.rectangle(0, 0, 300, 3000, 0x333333, 0.95)
            .setOrigin(0);
        this.catalogContainer.add(catalogBg);

        // Add a container for content with proper padding
        const contentContainer = this.add.container(20, 20);
        this.catalogContainer.add(contentContainer);

        let yPosition = 0;
        const panelWidth = 260; // 300 - 40px padding
        
        // Add categories and items to the content container
        this.categories.forEach(category => {
            // Add category title with zone indicator
            const categoryTitle = this.add.text(0, yPosition, `${category.name} (${category.zone})`, {
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#555555',
                padding: { x: 10, y: 5 }
            });
            contentContainer.add(categoryTitle);
            yPosition += 50; // More space after title

            // Create item grid for this category
            let xPos = 0;
            const itemSpacing = 70; // Reduced from 80
            const itemsPerRow = Math.floor(panelWidth / itemSpacing);
            
            category.items.forEach(item => {
                const itemSprite = this.add.sprite(xPos, yPosition, item.name.replace('.png', ''))
                    .setScale(0.4)
                    .setOrigin(0, 0)
                    .setInteractive({ draggable: true });

                // Store the zone and natural wall in the sprite's data
                itemSprite.setData('zone', category.zone);
                if (item.naturalWall) {
                    itemSprite.setData('naturalWall', item.naturalWall);
                }

                // Handle drag start
                itemSprite.on('dragstart', (pointer: Phaser.Input.Pointer) => {
                    // Create a new sprite to drag
                    this.selectedItem = this.add.sprite(pointer.x, pointer.y, item.name.replace('.png', ''))
                        .setScale(0.8)
                        .setAlpha(0.8)
                        .setDepth(100);
                    this.selectedItemZone = category.zone;
                    this.selectedItem.setData('naturalWall', item.naturalWall);
                });

                // Handle drag
                itemSprite.on('drag', (pointer: Phaser.Input.Pointer) => {
                    if (this.selectedItem) {
                        this.selectedItem.x = pointer.x;
                        this.selectedItem.y = pointer.y;
                        
                        // Check if in valid zone
                        const isInValidZone = this.isPointInZone(pointer.x, pointer.y, this.selectedItemZone, item.naturalWall);
                        this.selectedItem.setAlpha(isInValidZone ? 0.8 : 0.4);
                        this.selectedItem.setTint(isInValidZone ? 0xffffff : 0xff0000);

                        // Mirror the item if it's on the opposite wall
                        if (this.selectedItemZone === 'wall' && item.naturalWall) {
                            const currentWallZone = this.getCurrentWallZone(pointer.x, pointer.y);
                            if (currentWallZone && currentWallZone.side !== item.naturalWall) {
                                this.selectedItem.setScale(-0.8, 0.8);
                            } else {
                                this.selectedItem.setScale(0.8);
                            }
                        }
                    }
                });

                // Handle drag end
                itemSprite.on('dragend', (pointer: Phaser.Input.Pointer) => {
                    if (this.selectedItem) {
                        const x = pointer.x;
                        const y = pointer.y;
                        const isInValidZone = this.isPointInZone(x, y, this.selectedItemZone, item.naturalWall);
                        const isOutsideCatalog = x < this.cameras.main.width - 300 || this.catalogContainer.x === this.cameras.main.width;
                        
                        if (isInValidZone && isOutsideCatalog) {
                            // Get current wall zone for mirroring
                            const currentWallZone = this.getCurrentWallZone(x, y);
                            const shouldMirror = currentWallZone && item.naturalWall && currentWallZone.side !== item.naturalWall;

                            // Place the item
                            const placedItem = this.add.sprite(x, y, this.selectedItem.texture.key)
                                .setScale(shouldMirror ? -0.8 : 0.8, 0.8)
                                .setInteractive({ draggable: true });
                            
                            // Store natural wall information
                            placedItem.setData('naturalWall', item.naturalWall);
                            
                            // Snap to grid
                            placedItem.x = Math.round(placedItem.x / 32) * 32;
                            placedItem.y = Math.round(placedItem.y / 32) * 32;
                            
                            this.placedItems.push({
                                sprite: placedItem,
                                name: this.selectedItem.texture.key,
                                x: placedItem.x,
                                y: placedItem.y,
                                scaleX: placedItem.scaleX,
                                scaleY: placedItem.scaleY
                            });

                            // Update placedItem drag handlers to maintain position and scale
                            placedItem.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                                placedItem.x = dragX;
                                placedItem.y = dragY;
                                
                                // Visual feedback for valid/invalid zones
                                const isValid = this.isPointInZone(dragX, dragY, this.selectedItemZone, item.naturalWall);
                                placedItem.setAlpha(isValid ? 1 : 0.4);
                                placedItem.setTint(isValid ? 0xffffff : 0xff0000);

                                // Update mirroring
                                if (item.naturalWall) {
                                    const currentWallZone = this.getCurrentWallZone(dragX, dragY);
                                    if (currentWallZone && currentWallZone.side !== item.naturalWall) {
                                        placedItem.setScale(-0.8, 0.8);
                                    } else {
                                        placedItem.setScale(0.8);
                                    }
                                }

                                // Update stored position
                                const itemData = this.placedItems.find(i => i.sprite === placedItem);
                                if (itemData) {
                                    itemData.x = dragX;
                                    itemData.y = dragY;
                                    itemData.scaleX = placedItem.scaleX;
                                    itemData.scaleY = placedItem.scaleY;
                                }
                            });
                            
                            placedItem.on('dragend', (pointer: Phaser.Input.Pointer) => {
                                const isValid = this.isPointInZone(placedItem.x, placedItem.y, this.selectedItemZone, item.naturalWall);
                                
                                if (isValid) {
                                    // Snap to grid
                                    placedItem.x = Math.round(placedItem.x / 32) * 32;
                                    placedItem.y = Math.round(placedItem.y / 32) * 32;
                                    placedItem.setAlpha(1);
                                    placedItem.clearTint();
                                } else {
                                    // Return to original position or remove
                                    placedItem.destroy();
                                    this.placedItems = this.placedItems.filter(i => i.sprite !== placedItem);
                                    
                                    // Show error message
                                    const errorText = this.add.text(placedItem.x, placedItem.y - 20, 
                                        `Can only place on ${this.selectedItemZone}!`, 
                                        { fontSize: '16px', color: '#ff0000' });
                                    
                                    this.tweens.add({
                                        targets: errorText,
                                        alpha: 0,
                                        y: errorText.y - 50,
                                        duration: 1500,
                                        onComplete: () => errorText.destroy()
                                    });
                                }
                            });

                            // Add right-click to remove
                            placedItem.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                                if (pointer.rightButtonDown()) {
                                    placedItem.destroy();
                                    this.placedItems = this.placedItems.filter(i => i.sprite !== placedItem);
                                }
                            });
                        } else if (!isInValidZone && isOutsideCatalog) {
                            // Show error message
                            const errorText = this.add.text(x, y - 20, 
                                `Can only place on ${this.selectedItemZone}!`, 
                                { fontSize: '16px', color: '#ff0000' });
                            
                            this.tweens.add({
                                targets: errorText,
                                alpha: 0,
                                y: errorText.y - 50,
                                duration: 1500,
                                onComplete: () => errorText.destroy()
                            });
                        }
                        
                        // Remove the drag preview
                        this.selectedItem.destroy();
                        this.selectedItem = null;
                    }
                });

                contentContainer.add(itemSprite);

                xPos += itemSpacing;
                if (xPos + itemSpacing > panelWidth) {
                    xPos = 0;
                    yPosition += itemSpacing;
                }
            });
            
            // If the last row wasn't full, advance to the next category
            if (xPos > 0) {
                yPosition += itemSpacing;
            }
            
            // Add extra space between categories
            yPosition += 30;
        });

        // Add wheel scroll handler
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
            const isOverCatalog = pointer.x > this.cameras.main.width - 300;
            const isCatalogOpen = this.catalogContainer.x < this.cameras.main.width;
            
            if (isOverCatalog && isCatalogOpen) {
                contentContainer.y -= deltaY;
                
                // Clamp scrolling
                const minY = -(yPosition - this.cameras.main.height + 60);
                contentContainer.y = Phaser.Math.Clamp(contentContainer.y, minY, 20);
            }
        });
    }

    private createRoomPanel() {
        this.roomPanel = this.add.container(-200, 0);
        const roomPanelBg = this.add.rectangle(0, 0, 200, this.cameras.main.height, 0x333333, 0.9)
            .setOrigin(0);
        this.roomPanel.add(roomPanelBg);

        // Add room options
        const rooms = ['Room1', 'Room2', 'Room3'];
        let y = 50;
        rooms.forEach(room => {
            const roomBtn = this.add.text(20, y, room, {
                color: '#ffffff',
                backgroundColor: '#4a4a4a',
                padding: { x: 10, y: 5 }
            }).setInteractive();
            
            roomBtn.on('pointerdown', () => {
                this.changeRoom(room);
            });
            
            this.roomPanel.add(roomBtn);
            y += 50;
        });
    }

    private toggleCatalog() {
        const targetX = this.catalogContainer.x === this.cameras.main.width - 300 ? this.cameras.main.width : this.cameras.main.width - 300;
        this.tweens.add({
            targets: this.catalogContainer,
            x: targetX,
            duration: 200,
            ease: 'Power2'
        });
        this.isPanelOpen = this.catalogContainer.x !== this.cameras.main.width;
    }

    private toggleRoomPanel() {
        const targetX = this.roomPanel.x === 0 ? -200 : 0;
        this.tweens.add({
            targets: this.roomPanel,
            x: targetX,
            duration: 200,
            ease: 'Power2'
        });
        this.isPanelOpen = this.roomPanel.x === 0;
    }

    private changeRoom(roomName: string) {
        this.currentRoom = roomName;
        this.background.setTexture(roomName);
        this.toggleRoomPanel();
        this.drawZones();
    }

    private setupZoneDrawing() {
        this.input.on('pointerdown', this.handleZoneClick, this);
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-Z', () => {
                if (this.currentZonePoints.length > 0) {
                    this.currentZonePoints.pop();
                    this.drawZones();
                }
            });
        }
    }

    private disableZoneDrawing() {
        this.input.off('pointerdown', this.handleZoneClick, this);
        if (this.input.keyboard) {
            this.input.keyboard.off('keydown-Z');
        }
        this.currentZonePoints = [];
    }

    private handleZoneClick(pointer: Phaser.Input.Pointer) {
        // Ignore clicks in the top and bottom button areas
        if (!this.showZones || 
            pointer.y < 60 || // Top button area
            pointer.y > this.cameras.main.height - 80) return; // Bottom button area

        // Check if click is in panels
        const catalogX = this.catalogContainer?.x ?? this.cameras.main.width;
        const roomPanelX = this.roomPanel?.x ?? -200;
        const isInCatalog = pointer.x > this.cameras.main.width - 300 && catalogX < this.cameras.main.width;
        const isInRoomPanel = pointer.x < 200 && roomPanelX === 0;
        if (isInCatalog || isInRoomPanel) return;

        const newPoint = new Phaser.Math.Vector2(pointer.x, pointer.y);
        this.currentZonePoints.push(newPoint);
        this.drawZones();
    }

    private finishCurrentZone() {
        if (this.currentZonePoints.length >= 3) {
            if (!this.zones[this.currentRoom]) {
                this.zones[this.currentRoom] = [];
            }

            const newZone: Zone = {
                name: this.currentZoneType,
                polygon: new Phaser.Geom.Polygon(this.currentZonePoints)
            };

            // If it's a wall zone, determine which side it's on
            if (this.currentZoneType === 'wall') {
                // Calculate average X position of all points
                const avgX = this.currentZonePoints.reduce((sum, point) => sum + point.x, 0) / this.currentZonePoints.length;
                // If average X is less than center of screen, it's the left wall
                newZone.side = avgX < this.cameras.main.centerX ? 'left' : 'right';
            }

            // Remove existing zone of the same type and side
            this.zones[this.currentRoom] = this.zones[this.currentRoom].filter(z => {
                if (z.name !== this.currentZoneType) return true;
                if (this.currentZoneType === 'wall') {
                    return z.side !== newZone.side;
                }
                return false;
            });
            
            this.zones[this.currentRoom].push(newZone);
            this.currentZonePoints = [];
            this.drawZones();
        }
    }

    private printZones() {
        const zoneDefinitions = Object.entries(this.zones).map(([roomName, zones]) => {
            const zoneStrings = zones.map(zone => {
                const points = zone.polygon.points.map(p => `{ x: ${Math.round(p.x)}, y: ${Math.round(p.y)} }`).join(',\n                        ');
                return `{
                    name: '${zone.name}',
                    polygon: new Phaser.Geom.Polygon([
                        ${points}
                    ])
                }`;
            }).join(',\n                ');

            return `'${roomName}': [
                ${zoneStrings}
            ]`;
        }).join(',\n            ');

        const output = `this.zones = {
            ${zoneDefinitions}
        };`;

        console.log(output);
    }

    private getCurrentWallZone(x: number, y: number): Zone | null {
        const currentZones = this.zones[this.currentRoom];
        if (!currentZones) return null;
        
        return currentZones.find(zone => 
            zone.name === 'wall' && 
            zone.polygon.contains(x, y)
        ) || null;
    }

    private saveRoomConfig() {
        const config: SavedRoomConfig = {
            room: this.currentRoom,
            items: this.placedItems.map(item => {
                // Ensure the name always includes .png
                const itemName = item.name.endsWith('.png') ? item.name : `${item.name}.png`;
                return {
                    name: itemName,
                    x: item.sprite.x,
                    y: item.sprite.y,
                    scaleX: item.sprite.scaleX,
                    scaleY: item.sprite.scaleY
                };
            })
        };
        
        localStorage.setItem(this.saveKey, JSON.stringify(config));
    }

    private setupPlacedItemHandlers(sprite: Phaser.GameObjects.Sprite, itemName: string) {
        // Find the category and item info
        let itemCategory: ItemCategory | undefined;
        let itemInfo: { name: string; naturalWall?: 'left' | 'right' } | undefined;

        for (const category of this.categories) {
            const item = category.items.find(i => i.name === itemName);
            if (item) {
                itemCategory = category;
                itemInfo = item;
                break;
            }
        }

        if (!itemCategory || !itemInfo) return;

        // Store natural wall information
        if (itemInfo.naturalWall) {
            sprite.setData('naturalWall', itemInfo.naturalWall);
        }

        // Add drag functionality
        sprite.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            sprite.x = dragX;
            sprite.y = dragY;
            
            // Visual feedback for valid/invalid zones
            const isValid = this.isPointInZone(dragX, dragY, itemCategory!.zone, itemInfo!.naturalWall);
            sprite.setAlpha(isValid ? 1 : 0.4);
            sprite.setTint(isValid ? 0xffffff : 0xff0000);

            // Update mirroring for wall items
            if (itemCategory!.zone === 'wall' && itemInfo!.naturalWall) {
                const currentWallZone = this.getCurrentWallZone(dragX, dragY);
                if (currentWallZone && currentWallZone.side !== itemInfo!.naturalWall) {
                    sprite.setScale(-0.8, 0.8);
                } else {
                    sprite.setScale(0.8);
                }
            }

            // Update stored position
            const itemData = this.placedItems.find(i => i.sprite === sprite);
            if (itemData) {
                itemData.x = dragX;
                itemData.y = dragY;
                itemData.scaleX = sprite.scaleX;
                itemData.scaleY = sprite.scaleY;
            }
        });

        sprite.on('dragend', (pointer: Phaser.Input.Pointer) => {
            const isValid = this.isPointInZone(sprite.x, sprite.y, itemCategory!.zone, itemInfo!.naturalWall);
            
            if (isValid) {
                // Snap to grid
                sprite.x = Math.round(sprite.x / 32) * 32;
                sprite.y = Math.round(sprite.y / 32) * 32;
                sprite.setAlpha(1);
                sprite.clearTint();
            } else {
                // Remove invalid item
                sprite.destroy();
                this.placedItems = this.placedItems.filter(i => i.sprite !== sprite);
                
                // Show error message
                const errorText = this.add.text(sprite.x, sprite.y - 20, 
                    `Can only place on ${itemCategory!.zone}!`, 
                    { fontSize: '16px', color: '#ff0000' });
                
                this.tweens.add({
                    targets: errorText,
                    alpha: 0,
                    y: errorText.y - 50,
                    duration: 1500,
                    onComplete: () => errorText.destroy()
                });
            }
        });

        // Add right-click to remove
        sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                sprite.destroy();
                this.placedItems = this.placedItems.filter(i => i.sprite !== sprite);
            }
        });
    }
}

export default RoomEditorScene; 