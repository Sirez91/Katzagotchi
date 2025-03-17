console.log('GAME MODULE LOADED - ' + Date.now());
import Phaser from 'phaser';
import CatScene from './scenes/CatScene';
import RoomEditorScene from './scenes/RoomEditorScene';
import CollisionEditorScene from './scenes/CollisionEditorScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x:0, y: 0 },
            debug: false
        }
    },
    scene: [CatScene, RoomEditorScene, CollisionEditorScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

let gameInitialized = false;
let game: Phaser.Game;

function initGame() {
  console.log('initGame called', gameInitialized ? 'AGAIN' : 'FIRST TIME');
  
  if (gameInitialized) {
    console.log('Destroying existing game instance');
    game.destroy(true, false);
  }
  
  game = new Phaser.Game(config);
  gameInitialized = true;
}

// Only initialize if not already initialized
if (!gameInitialized) {
  initGame();
}

if (module.hot) {
  module.hot.dispose(() => {
    console.log('HMR disposing game');
    if (game) {
      game.destroy(true, false);
    }
  });
  
  module.hot.accept();
}

export default initGame;