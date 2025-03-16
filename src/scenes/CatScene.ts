// src/scenes/CatScene.ts
import Phaser from 'phaser';
import Cat from '../sprites/Cat';
import NeedBar from '../ui/NeedBar';

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

class CatScene extends Phaser.Scene {
    private cat!: Cat;
    private hungerBar!: NeedBar;
    private sleepBar!: NeedBar;
    private playBar!: NeedBar;
    private feedButton!: Phaser.GameObjects.Text;
    private sleepButton!: Phaser.GameObjects.Text;
    private playButton!: Phaser.GameObjects.Text;
    private background!: Phaser.GameObjects.Image;
    private saveKey = 'savedRoomConfig';
    private roomItems: Phaser.GameObjects.Sprite[] = [];

    constructor() {
        super({ key: 'CatScene' });
        console.log('CatScene constructor');
    }

    preload() {
        this.load.atlas('cat', 'assets/Cats/AllCats.png', 'assets/Cats/atlas.json');
        
        // Load all room images
        this.load.image('Room1', 'assets/Catroom/Rooms/Room1.png');
        this.load.image('Room2', 'assets/Catroom/Rooms/Room2.png');
        this.load.image('Room3', 'assets/Catroom/Rooms/Room3.png');

        // Load all possible room items
        const itemCategories = [
            'bed_teal', 'bed_purple', 'bed_green',
            'foodbowl_blue', 'foodbowl_green', 'foodbowl_purple', 'foodbowl_red',
            'foodbowl_white', 'foodbowl_yellow', 'waterbowl_green', 'waterbowl_purple',
            'waterbowl_red', 'waterbowl_white', 'waterbowl_yellow', 'whaterbowl_blue',
            'foodbag', 'foodbag_large',
            'scratcher_round_blue', 'scratcher_round_green', 'scratcher_round_red',
            'scratcher_round_white', 'scratcher_round_yellow', 'scratcher_simple_beige',
            'scratcher_simple_white', 'scratcher_ledder_white', 'scratcher_ledder_yellow',
            'plant_big_blue', 'plant_big_lightblue', 'plant_big_purple',
            'plant_large_brown', 'plant_lightblue', 'plant_lightgreen',
            'image_heart_blue', 'image_heart_brown', 'image_heart_green',
            'image_heart_grey', 'image_heart_ocker', 'image_heart_pink',
            'image_heart_purple', 'image_heart_white', 'image_heart_yellow',
            'image_cat_pink', 'image_cat_teal', 'image_cat_white',
            'window_curtain_blue', 'window_curtain_red', 'window_curtain_beige'
        ];

        itemCategories.forEach(item => {
            this.load.image(item, `assets/Catroom/Items/${item}.png`);
        });
    }

    create() {
        // Load saved room configuration or use default
        const savedConfig = localStorage.getItem(this.saveKey);
        if (savedConfig) {
            const config: SavedRoomConfig = JSON.parse(savedConfig);
            
            // Set the background to the saved room
            this.background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, config.room)
                .setOrigin(0.5);

            // Place all saved items
            config.items.forEach(item => {
                const sprite = this.add.sprite(item.x, item.y, item.name.replace('.png', ''))
                    .setScale(item.scaleX, item.scaleY);
                this.roomItems.push(sprite);
            });
        } else {
            // Default room if no configuration is saved
            this.background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'Room1')
                .setOrigin(0.5);
        }

        // Create the cat in the center
        this.cat = new Cat(this, this.sys.game.config.width as number / 2, this.sys.game.config.height as number / 2);
        this.add.existing(this.cat);
        this.cat.create();

        // UI - Needs bars
        this.hungerBar = new NeedBar(this, 100, 50, 'Hunger');
        this.sleepBar = new NeedBar(this, 100, 80, 'Sleep');
        this.playBar = new NeedBar(this, 100, 110, 'Play');

        // UI - Buttons
        const buttonStyle = {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#f8f8f8',
            padding: { x: 16, y: 8 },
            align: 'center'
        };

        const buttonSpacing = 140;
        const buttonY = 540;
        const startX = this.sys.game.config.width as number / 2 - buttonSpacing;

        // Helper function to create pixel-style button background
        const createPixelButton = (x: number, y: number, width: number, height: number, isPressed: boolean = false) => {
            const graphics = this.add.graphics();
            
            if (isPressed) {
                // Pressed state
                graphics.fillStyle(0x4a3d68);
                graphics.fillRect(x + 2, y + 2, width - 2, height - 2);
                graphics.fillStyle(0x6e5c9d);
                graphics.fillRect(x, y, width - 2, height - 2);
            } else {
                // Normal state
                // Main button color
                graphics.fillStyle(0x6e5c9d);
                graphics.fillRect(x, y, width, height);
                
                // Light edge (top, left)
                graphics.fillStyle(0x8b74c0);
                graphics.fillRect(x, y, width, 2); // top
                graphics.fillRect(x, y, 2, height); // left
                
                // Dark edge (bottom, right)
                graphics.fillStyle(0x4a3d68);
                graphics.fillRect(x, y + height - 2, width, 2); // bottom
                graphics.fillRect(x + width - 2, y, 2, height); // right
            }

            return graphics;
        };

        // Create button backgrounds
        const buttonWidth = 100;
        const buttonHeight = 40;
        const createButton = (x: number, text: string) => {
            const centerX = x - buttonWidth / 2;
            const centerY = buttonY - buttonHeight / 2;
            const bg = createPixelButton(0, 0, buttonWidth, buttonHeight);
            const textObj = this.add.text(buttonWidth/2, buttonHeight/2, text, buttonStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            
            const container = this.add.container(centerX, centerY, [bg, textObj]);
            return { bg, text: textObj, container };
        };

        const feedBtn = createButton(startX, 'Feed');
        const sleepBtn = createButton(startX + buttonSpacing, 'Sleep');
        const playBtn = createButton(startX + buttonSpacing * 2, 'Play');

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

        // Add Edit Room button in top right with new style
        const navButtonWidth = 80;
        const navButtonHeight = 36;
        const navButtonX = this.sys.game.config.width as number - navButtonWidth - 20;
        const navButtonY = 20;

        const navButtonStyle = {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff',
            padding: { x: 10, y: 5 },
            align: 'center'
        };

        const editorBtn = {
            bg: createNavButton(0, 0, navButtonWidth, navButtonHeight),
            text: this.add.text(navButtonWidth/2, navButtonHeight/2, '🏠 Edit', navButtonStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
        };
        const editorContainer = this.add.container(navButtonX, navButtonY, [editorBtn.bg, editorBtn.text]);

        this.feedButton = feedBtn.text;
        this.sleepButton = sleepBtn.text;
        this.playButton = playBtn.text;

        // Add hover and click effects
        [
            { text: this.feedButton, bg: feedBtn.bg, container: feedBtn.container },
            { text: this.sleepButton, bg: sleepBtn.bg, container: sleepBtn.container },
            { text: this.playButton, bg: playBtn.bg, container: playBtn.container }
        ].forEach(button => {
            button.text.on('pointerover', () => {
                button.bg.clear();
                button.bg = createPixelButton(0, 0, buttonWidth, buttonHeight, true);
                button.container.removeAll();
                button.container.add([button.bg, button.text]);
                button.container.y += 2;
            });

            button.text.on('pointerout', () => {
                button.bg.clear();
                button.bg = createPixelButton(0, 0, buttonWidth, buttonHeight, false);
                button.container.removeAll();
                button.container.add([button.bg, button.text]);
                button.container.y -= 2;
            });
        });

        // Add hover and click effects for nav button
        editorBtn.text.on('pointerover', () => {
            editorBtn.bg.clear();
            editorBtn.bg = createNavButton(0, 0, navButtonWidth, navButtonHeight, true);
            editorContainer.removeAll();
            editorContainer.add([editorBtn.bg, editorBtn.text]);
            editorContainer.y += 2;
        });

        editorBtn.text.on('pointerout', () => {
            editorBtn.bg.clear();
            editorBtn.bg = createNavButton(0, 0, navButtonWidth, navButtonHeight, false);
            editorContainer.removeAll();
            editorContainer.add([editorBtn.bg, editorBtn.text]);
            editorContainer.y -= 2;
        });

        // Add click handlers
        this.feedButton.on('pointerdown', () => this.cat.feed());
        this.sleepButton.on('pointerdown', () => this.cat.toggleSleep());
        this.playButton.on('pointerdown', () => this.cat.playWith());
        editorBtn.text.on('pointerdown', () => this.scene.start('RoomEditorScene'));
      
        this.cat.on('need_change', () => {
            this.updateNeedBars();
        })
        this.cat.on('change_sleep_state', (isSleeping: boolean) => {
            this.sleepButton.setText(isSleeping ? 'Wake up' : 'Sleep');
        })
        this.updateNeedBars();

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if(pointer.x > this.cat.x - this.cat.width/2 &&
               pointer.x < this.cat.x + this.cat.width/2 &&
               pointer.y > this.cat.y - this.cat.height/2 &&
               pointer.y < this.cat.y + this.cat.height/2){
                this.cat.pet(); //Pet the cat when clicked
            }

        });
      
        // Initial state.  Could be loaded from saved data.
        this.cat.setHunger(75);
        this.cat.setSleepiness(50);
        this.cat.setPlayfulness(60);
    }

    update(time: number, delta: number) {
        this.cat.update(time, delta);  //Crucial: update the cat every frame

    }

    private updateNeedBars() {
        this.hungerBar.setValue(100 - this.cat.getHunger());
        this.sleepBar.setValue(100 - this.cat.getSleepiness());
        this.playBar.setValue(100 -this.cat.getPlayfulness());
    }
}

export default CatScene;