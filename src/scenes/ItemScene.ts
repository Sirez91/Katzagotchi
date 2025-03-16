// src/scenes/ItemScene.ts
import Phaser from 'phaser';

class ItemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ItemScene' });
    }

    preload() {
        // Load both the sprite sheet and its atlas
        this.load.atlas('items', 
            '../assets/Catromm/Catroompaid.png',
            '../assets/Catromm/items.json'
        );
    }

    create() {
        // Example usage of sprites
        this.add.sprite(100, 100, 'items', 'isoSquareBlueLight');
        this.add.sprite(200, 100, 'items', 'catBedGray');
        this.add.sprite(300, 200, 'items', 'catSleeping');

        // Interactive example
        const text = this.add.text(400, 400, 'Click to change frame', {color: 'white', fontSize: '16px'})
            .setInteractive();

        let currentFrame = 'catBedBlue';
        text.on('pointerdown', () => {
            currentFrame = (currentFrame === 'catBedBlue') ? 'catBedGray' : 'catBedBlue';
            text.setText(currentFrame);
        });
    }
}

export default ItemScene;