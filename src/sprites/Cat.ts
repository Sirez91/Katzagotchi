// src/sprites/Cat.ts
import Phaser from 'phaser';

class Cat extends Phaser.GameObjects.Sprite {
    private hunger: number;
    private sleepiness: number;
    private playfulness: number;

    private isSleeping: boolean = false;
    private lastUpdateTime: number = 0;
    private readonly NEED_INCREASE_RATE = 0.002; // per millisecond
    private readonly NEED_DECREASE_RATE_FEED = 50;
    private readonly NEED_DECREASE_RATE_SLEEP = 0.01;
    private readonly NEED_DECREASE_RATE_PLAY = 50;



    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'cat'); // Use the 'cat' atlas
        this.hunger = 100;
        this.sleepiness = 100;
        this.playfulness = 100;
        this.setInteractive(); // Make the cat clickable
        console.log('Cat constructor');
    }

    public create(): void {
        this.createAnimations();
        this.play('idle');  // NOW we can play the animation
    }

    private createAnimations() {
        //Idle animation
        if (!this.anims.exists('idle')) {
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNames('cat', { prefix: 'idle_', start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Sleep animation
        if (!this.anims.exists('sleep')) {
            this.anims.create({
                key: 'sleep',
                frames: this.anims.generateFrameNames('cat', { prefix: 'sleep_', start: 0, end: 3 }),
                frameRate: 2, // adjust frame rate to look more relaxed
                repeat: -1
            });
        }

        if (!this.anims.exists('happy')) {
            this.anims.create({
                key: 'happy',
                frames: this.anims.generateFrameNames('cat', { prefix: 'happy_', start: 0, end: 9 }),
                frameRate: 8,
                repeat: 1
            });
        }

        if (!this.anims.exists('cry')) {
            this.anims.create({
                key: 'cry',
                frames: this.anims.generateFrameNames('cat', { prefix: 'cry_', start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!this.anims.exists('run')) {
            this.anims.create({
                key: 'run',
                frames: this.anims.generateFrameNames('cat', { prefix: 'run_', start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            })
        }
    }


    update(time: number, delta: number): void {
        if (this.lastUpdateTime === 0) {
            this.lastUpdateTime = time;
        }

        const elapsed = time - this.lastUpdateTime;
        this.lastUpdateTime = time;

        // Decrease needs over time
        this.changeNeeds(elapsed);

        if (this.sleepiness == 0) {
            console.log('cat is done sleeping', this.sleepiness);
            this.isSleeping = false;
        }

        // Update animation based on needs, only if not in a forced animation.
        if (!this.anims.isPlaying || (this.anims.currentAnim && (this.anims.currentAnim.key !== 'happy'))) {
            if (this.isSleeping) {
                if (this.anims.currentAnim?.key !== 'sleep') {
                    console.log('cat is sleeping');
                    this.play('sleep');
                }
            }
            else if (this.hunger > 70 && this.anims.currentAnim?.key !== 'cry') {
                this.play('cry');
            }
            else {
                if ((this.anims.currentAnim && !['idle', 'cry'].includes(this.anims.currentAnim.key))) {//only play idle if not already playing
                    this.play('idle');
                }
            }
        }
    }

    private changeNeeds(elapsed: number): void {
        const increaseAmount = this.NEED_INCREASE_RATE * elapsed * (this.isSleeping ? 0.05 : 1); //increase rate is halved when sleeping
        this.hunger = Phaser.Math.Clamp(this.hunger + increaseAmount, 0, 100);
        if (!this.isSleeping) { //sleepiness should not decrease while sleeping
            this.sleepiness = Phaser.Math.Clamp(this.sleepiness + increaseAmount, 0, 100);
        } else {
            this.sleepiness = Phaser.Math.Clamp(this.sleepiness - this.NEED_DECREASE_RATE_SLEEP * elapsed, 0, 100);
        }
        this.playfulness = Phaser.Math.Clamp(this.playfulness + increaseAmount, 0, 100);
        this.emit('need_change'); //emit signal to update UI
    }

    // Public getters for needs.
    public getHunger(): number {
        return this.hunger;
    }

    public getSleepiness(): number {
        return this.sleepiness;
    }

    public getPlayfulness(): number {
        return this.playfulness;
    }

    // Public setters for needs (used for initial setup/loading saved game).
    public setHunger(value: number): void {
        this.hunger = Phaser.Math.Clamp(value, 0, 100);
        this.emit('need_change'); //emit signal to update UI
    }

    public setSleepiness(value: number): void {
        this.sleepiness = Phaser.Math.Clamp(value, 0, 100);
        this.emit('need_change'); //emit signal to update UI
    }

    public setPlayfulness(value: number): void {
        this.playfulness = Phaser.Math.Clamp(value, 0, 100);
        this.emit('need_change'); //emit signal to update UI
    }


    feed(): void {
        if (!this.isSleeping && this.anims.currentAnim?.key !== 'happy') { // Prevent actions while sleeping
            this.hunger = Phaser.Math.Clamp(this.hunger - this.NEED_DECREASE_RATE_FEED, 0, 100);
            this.playHappyAnimation();
            this.emit('need_change');
        }

    }

    toggleSleep(): void {
        // Allow waking up from any state, but only allow going to sleep from idle or cry
        if (!this.isSleeping || (!this.anims.currentAnim || ['cry', 'idle'].includes(this.anims.currentAnim.key))) {
            this.isSleeping = !this.isSleeping;
            if (!this.isSleeping) {
                this.play('idle');  // Immediately play idle animation when waking up
            }
            this.emit('change_sleep_state', this.isSleeping);
        }
    }

    playWith(): void {
        if (!this.isSleeping && this.anims.currentAnim?.key !== 'happy') {
            this.playfulness = Phaser.Math.Clamp(this.playfulness - this.NEED_DECREASE_RATE_PLAY, 0, 100);
            this.playHappyAnimation();
            this.emit('need_change');
        }
    }

    pet(): void {
        if (!this.isSleeping) {
            this.playHappyAnimation();
            this.emit('need_change');
        }
    }

    private playHappyAnimation(): void {
        this.anims.play('happy');
        this.once('animationcomplete', () => { //listen to only once
            if (this.isSleeping) {
                this.play('sleep');
            }
            else {
                this.play('idle')
            }
        })
    }
}

export default Cat;