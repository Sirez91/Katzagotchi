// src/ui/NeedBar.ts
import Phaser from 'phaser';

class NeedBar {
    private scene: Phaser.Scene;
    private x: number;
    private y: number;
    private bar!: Phaser.GameObjects.Graphics;
    private text!: Phaser.GameObjects.Text;
    private label: string;
    private value: number = 100;
    private barWidth: number = 160;
    private barHeight: number = 16;
    private pixelSize: number = 2;
    private labelWidth: number = 70; // Fixed width for labels to ensure alignment

    constructor(scene: Phaser.Scene, x: number, y: number, label: string) {
        this.scene = scene;
        this.x = x + this.labelWidth; // Offset x by label width for proper alignment
        this.y = y;
        this.label = label;
        this.createBar();
    }

    private getBarColors(): { main: number, light: number, dark: number, bg: number } {
        switch (this.label) {
            case 'Hunger':
                return {
                    main: 0xff6b6b,   // Coral red
                    light: 0xff8585,   // Light coral
                    dark: 0xcc5555,    // Dark coral
                    bg: 0x332222      // Very dark red-tinted background
                };
            case 'Sleep':
                return {
                    main: 0x6c5ce7,   // Purple
                    light: 0x8f87ff,   // Light purple
                    dark: 0x5849c2,    // Dark purple
                    bg: 0x221e33      // Very dark purple-tinted background
                };
            case 'Play':
                return {
                    main: 0x26de81,   // Green
                    light: 0x46fc9f,   // Light green
                    dark: 0x20b568,    // Dark green
                    bg: 0x223328      // Very dark green-tinted background
                };
            default:
                return {
                    main: 0x6c757d,   // Gray
                    light: 0x868e96,   // Light gray
                    dark: 0x495057,    // Dark gray
                    bg: 0x2a2a2a      // Very dark gray background
                };
        }
    }

    private createBar() {
        this.bar = this.scene.add.graphics();
        
        // Create pixel-style text background
        const textBg = this.scene.add.graphics();
        const colors = this.getBarColors();
        
        // Draw text background with pixel border
        textBg.lineStyle(this.pixelSize, 0x2d3436);
        textBg.fillStyle(colors.bg);
        textBg.fillRect(this.x - this.labelWidth - 8, this.y, this.labelWidth, this.barHeight);
        textBg.strokeRect(this.x - this.labelWidth - 8, this.y, this.labelWidth, this.barHeight);

        const textStyle = {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#ffffff',
            align: 'right',
            backgroundColor: 'transparent'
        };

        this.text = this.scene.add.text(
            this.x - 12,  // Position text right before the bar
            this.y + this.barHeight/2,
            this.label,
            textStyle
        )
        .setOrigin(1, 0.5);  // Right-align text vertically centered

        this.redrawBar();
    }

    setValue(value: number): void {
        this.value = Phaser.Math.Clamp(value, 0, 100);
        this.redrawBar();
    }

    private redrawBar(): void {
        this.bar.clear();
        const colors = this.getBarColors();
        const fillWidth = Math.floor((this.value / 100) * this.barWidth);

        // Draw pixel-style background (darker color)
        this.bar.fillStyle(colors.bg);
        this.bar.fillRect(this.x, this.y, this.barWidth, this.barHeight);

        // Draw main bar fill with pixel segments
        const segmentWidth = this.pixelSize * 3;
        const numSegments = Math.floor(fillWidth / segmentWidth);
        
        for (let i = 0; i < numSegments; i++) {
            // Main color segment
            this.bar.fillStyle(colors.main);
            this.bar.fillRect(
                this.x + (i * segmentWidth),
                this.y,
                segmentWidth - this.pixelSize,
                this.barHeight - this.pixelSize
            );
            
            // Light edge highlight
            this.bar.fillStyle(colors.light);
            this.bar.fillRect(
                this.x + (i * segmentWidth),
                this.y,
                segmentWidth - this.pixelSize,
                this.pixelSize
            );
        }

        // Border
        this.bar.lineStyle(this.pixelSize, 0x2d3436);
        this.bar.strokeRect(this.x, this.y, this.barWidth, this.barHeight);
    }

    destroy(): void {
        this.bar.destroy();
        this.text.destroy();
    }
}

export default NeedBar;