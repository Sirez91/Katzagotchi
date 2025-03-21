import Phaser from 'phaser';

interface PlacedItem {
    name: string;
    key: string;
    x: number;
    y: number;
    sprite?: Phaser.GameObjects.Sprite;
    scaleX: number;
    scaleY: number;
    naturalWall?: 'left' | 'right'; // Which wall the item naturally belongs on
    collisionBox?: {
        points: Array<{ x: number, y: number }>; // Polygon points relative to sprite center
    };
}

interface ItemCategory {
    name: string;
    zone: 'floor' | 'wall' | 'ceiling' | 'any';
    items: {
        name: string;
        key: string;
        naturalWall?: 'left' | 'right';
        collisionBox?: {
            points: Array<{ x: number, y: number }>; // Polygon points relative to sprite center
        };
    }[];
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

// Add type definition for saved config items
interface SavedConfigItem {
    name: string;
    key?: string;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    naturalWall?: 'left' | 'right';
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
    private selectedPlacedItem: Phaser.GameObjects.Sprite | null = null;
    private deleteButton: Phaser.GameObjects.Container | null = null;
    private showCollisionBoxes: boolean = false;
    private collisionBoxGraphics!: Phaser.GameObjects.Graphics;
    private categories: ItemCategory[] = [
        {
            name: 'Beds',
            items: [
                {
                    name: 'bed_teal.png',
                    key: 'bed_teal.png',
                    collisionBox: {
                        points: [
                            { x: -55, y: 14 },
                            { x: -55, y: 15 },
                            { x: 3, y: -16 },
                            { x: 56, y: 13 },
                            { x: 16, y: 42 },
                            { x: -14, y: 42 }
                        ]
                    }
                },
                {
                    name: 'bed_purple.png', key: 'bed_purple.png',
                    collisionBox: {
                        points: [
                            { x: -55, y: 14 },
                            { x: -55, y: 15 },
                            { x: 3, y: -16 },
                            { x: 56, y: 13 },
                            { x: 16, y: 42 },
                            { x: -14, y: 42 }
                        ]
                    }
                },
                {
                    name: 'bed_green.png', key: 'bed_green.png',
                    collisionBox: {
                        points: [
                            { x: -55, y: 14 },
                            { x: -55, y: 15 },
                            { x: 3, y: -16 },
                            { x: 56, y: 13 },
                            { x: 16, y: 42 },
                            { x: -14, y: 42 }
                        ]
                    }
                }
            ],
            zone: 'floor'
        },
        {
            name: 'Food & Water',
            items: [
                {
                    name: 'foodbowl_blue.png',
                    key: 'foodbowl_blue.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'foodbowl_green.png', key: 'foodbowl_green.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'foodbowl_purple.png', key: 'foodbowl_purple.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'foodbowl_red.png', key: 'foodbowl_red.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'foodbowl_white.png', key: 'foodbowl_white.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'foodbowl_yellow.png', key: 'foodbowl_yellow.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'waterbowl_green.png', key: 'waterbowl_green.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'waterbowl_purple.png', key: 'waterbowl_purple.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'waterbowl_red.png', key: 'waterbowl_red.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'waterbowl_white.png', key: 'waterbowl_white.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'waterbowl_yellow.png', key: 'waterbowl_yellow.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'whaterbowl_blue.png', key: 'whaterbowl_blue.png',
                    collisionBox: {
                        points: [
                            { x: -21, y: 10 },
                            { x: -20, y: 0 },
                            { x: -7, y: -9 },
                            { x: 8, y: -8 },
                            { x: 22, y: 8 },
                            { x: 17, y: 17 },
                            { x: 12, y: 19 },
                            { x: -12, y: 19 }
                        ]
                    }
                },
                {
                    name: 'foodbag.png', key: 'foodbag.png',
                    collisionBox: {
                        points: [
                            { x: -15, y: 14 },
                            { x: 4, y: 21 },
                            { x: 17, y: 19 },
                            { x: -2, y: 9 }]
                    }
                },
                {
                    name: 'foodbag_large.png', key: 'foodbag_large.png',
                    collisionBox: {
                        points: [
                            { x: -15, y: 21 },
                            { x: 6, y: 32 },
                            { x: 17, y: 24 },
                            { x: -1, y: 14 }
                        ]
                    }
                }
            ],
            zone: 'floor'
        },
        {
            name: 'Scratchers',
            items: [
                {
                    name: 'scratcher_round_blue.png', key: 'scratcher_round_blue.png', collisionBox: {
                        points: [
                            { x: -10, y: 47 },
                            { x: 8, y: 47 },
                            { x: 27, y: 34 },
                            { x: 0, y: 11 },
                            { x: -27, y: 26 },
                            { x: -27, y: 37 }
                        ]
                    }
                },
                {
                    name: 'scratcher_round_green.png', key: 'scratcher_round_green.png', collisionBox: {
                        points: [
                            { x: -10, y: 47 },
                            { x: 8, y: 47 },
                            { x: 27, y: 34 },
                            { x: 0, y: 11 },
                            { x: -27, y: 26 },
                            { x: -27, y: 37 }
                        ]
                    }
                },
                {
                    name: 'scratcher_round_red.png', key: 'scratcher_round_red.png', collisionBox: {
                        points: [
                            { x: -10, y: 47 },
                            { x: 8, y: 47 },
                            { x: 27, y: 34 },
                            { x: 0, y: 11 },
                            { x: -27, y: 26 },
                            { x: -27, y: 37 }
                        ]
                    }
                },
                {
                    name: 'scratcher_round_white.png', key: 'scratcher_round_white.png', collisionBox: {
                        points: [
                            { x: -10, y: 47 },
                            { x: 8, y: 47 },
                            { x: 27, y: 34 },
                            { x: 0, y: 11 },
                            { x: -27, y: 26 },
                            { x: -27, y: 37 }
                        ]
                    }
                },
                {
                    name: 'scratcher_round_yellow.png', key: 'scratcher_round_yellow.png', collisionBox: {
                        points: [
                            { x: -10, y: 47 },
                            { x: 8, y: 47 },
                            { x: 27, y: 34 },
                            { x: 0, y: 11 },
                            { x: -27, y: 26 },
                            { x: -27, y: 37 }
                        ]
                    }
                },
                {
                    name: 'scratcher_simple_beige.png', key: 'scratcher_simple_beige.png', collisionBox: {
                        points: [
                            { x: -10, y: 38 },
                            { x: 8, y: 38 },
                            { x: 27, y: 27 },
                            { x: 1, y: 3 },
                            { x: -26, y: 17 },
                            { x: -27, y: 29 }
                        ]
                    }
                },
                {
                    name: 'scratcher_simple_white.png', key: 'scratcher_simple_white.png', collisionBox: {
                        points: [
                            { x: -10, y: 38 },
                            { x: 8, y: 38 },
                            { x: 27, y: 27 },
                            { x: 1, y: 3 },
                            { x: -26, y: 17 },
                            { x: -27, y: 29 }
                        ]
                    }
                },
                {
                    name: 'scratcher_ledder_white.png', key: 'scratcher_ledder_white.png', collisionBox: {
                        points: [
                            { x: -46, y: 49 },
                            { x: -12, y: 72 },
                            { x: 32, y: 80 },
                            { x: 56, y: 64 },
                            { x: 17, y: 51 },
                            { x: -14, y: 34 }
                        ]
                    }
                },
                {
                    name: 'scratcher_ledder_yellow.png', key: 'scratcher_ledder_yellow.png', collisionBox: {
                        points: [
                            { x: -46, y: 49 },
                            { x: -12, y: 72 },
                            { x: 32, y: 80 },
                            { x: 56, y: 64 },
                            { x: 17, y: 51 },
                            { x: -14, y: 34 }
                        ]
                    }
                }
            ],
            zone: 'floor'
        },
        {
            name: 'Plants',
            items: [
                { name: 'plant_big_blue.png', key: 'plant_big_blue.png', collisionBox: {
                    points: [
                        {x: -10, y: 56},
                        {x: 6, y: 55},
                        {x: 14, y: 51},
                        {x: 10, y: 44},
                        {x: -11, y: 42},
                        {x: -18, y: 49}
                    ]
                } },
                { name: 'plant_big_lightblue.png', key: 'plant_big_lightblue.png', collisionBox: {
                    points: [
                        {x: -10, y: 56},
                        {x: 6, y: 55},
                        {x: 14, y: 51},
                        {x: 10, y: 44},
                        {x: -11, y: 42},
                        {x: -18, y: 49}
                    ]
                }  },
                { name: 'plant_big_purple.png', key: 'plant_big_purple.png', collisionBox: {
                    points: [
                        {x: -10, y: 56},
                        {x: 6, y: 55},
                        {x: 14, y: 51},
                        {x: 10, y: 44},
                        {x: -11, y: 42},
                        {x: -18, y: 49}
                    ]
                }  },
                { name: 'plant_large_brown.png', key: 'plant_large_brown.png', collisionBox: {
                    points: [
                        {x: -10, y: 56},
                        {x: 6, y: 55},
                        {x: 14, y: 51},
                        {x: 10, y: 44},
                        {x: -11, y: 42},
                        {x: -18, y: 49}
                    ]
                }  },
                { name: 'plant_lightblue.png', key: 'plant_lightblue.png', collisionBox: {
                    points: [
                        {x: -4, y: 15},
                        {x: 5, y: 15},
                        {x: 10, y: 12},
                        {x: -5, y: 9},
                        {x: -8, y: 12}
                    ]
                } },
                { name: 'plant_lightgreen.png', key: 'plant_lightgreen.png', collisionBox: {
                    points: [
                        {x: -4, y: 15},
                        {x: 5, y: 15},
                        {x: 10, y: 12},
                        {x: -5, y: 9},
                        {x: -8, y: 12}
                    ]
                } }
            ],
            zone: 'floor'
        },
        {
            name: 'Wall Decor',
            items: [
                {
                    name: 'image_heart_blue.png',
                    naturalWall: 'left',
                    key: 'image_heart_blue.png',
                    collisionBox: {
                        points: [
                            {x: -6, y: 16},
                            {x: 9, y: 9},
                            {x: 8, y: -17},
                            {x: -8, y: -11}
                        ]
                    }
                },
                { name: 'image_heart_brown.png', naturalWall: 'left', key: 'image_heart_brown.png',
                    collisionBox: {
                        points: [
                            {x: -6, y: 16},
                            {x: 9, y: 9},
                            {x: 8, y: -17},
                            {x: -8, y: -11}
                        ]
                    } },
                { name: 'image_heart_green.png', naturalWall: 'left', key: 'image_heart_green.png',
                    collisionBox: {
                        points: [
                            {x: -6, y: 16},
                            {x: 9, y: 9},
                            {x: 8, y: -17},
                            {x: -8, y: -11}
                        ]
                    } },
                { name: 'image_heart_grey.png', naturalWall: 'left', key: 'image_heart_grey.png',
                    collisionBox: {
                        points: [
                            {x: -6, y: 16},
                            {x: 9, y: 9},
                            {x: 8, y: -17},
                            {x: -8, y: -11}
                        ]
                    } },
                { name: 'image_heart_ocker.png', naturalWall: 'left', key: 'image_heart_ocker.png',
                    collisionBox: {
                        points: [
                            {x: -6, y: 16},
                            {x: 9, y: 9},
                            {x: 8, y: -17},
                            {x: -8, y: -11}
                        ]
                    } },
                { name: 'image_heart_pink.png', naturalWall: 'left', key: 'image_heart_pink.png',
                    collisionBox: {
                        points: [
                            {x: -6, y: 16},
                            {x: 9, y: 9},
                            {x: 8, y: -17},
                            {x: -8, y: -11}
                        ]
                    } },
                { name: 'image_heart_purple.png', naturalWall: 'left', key: 'image_heart_purple.png',
                    collisionBox: {
                        points: [
                            {x: -6, y: 16},
                            {x: 9, y: 9},
                            {x: 8, y: -17},
                            {x: -8, y: -11}
                        ]
                    } },
                { name: 'image_heart_white.png', naturalWall: 'left', key: 'image_heart_white.png',
                    collisionBox: {
                        points: [
                            {x: -6, y: 16},
                            {x: 9, y: 9},
                            {x: 8, y: -17},
                            {x: -8, y: -11}
                        ]
                    } },
                { name: 'image_heart_yellow.png', naturalWall: 'left', key: 'image_heart_yellow.png',
                    collisionBox: {
                        points: [
                            {x: -6, y: 16},
                            {x: 9, y: 9},
                            {x: 8, y: -17},
                            {x: -8, y: -11}
                        ]
                    } },
                { name: 'image_cat_pink.png', naturalWall: 'right', key: 'image_cat_pink.png',
                    collisionBox: {
                        points: [
                            {x: -12, y: 12},
                            {x: 12, y: 24},
                            {x: 14, y: -18},
                            {x: -10, y: -27}
                        ]
                    }
                 },
                { name: 'image_cat_teal.png', naturalWall: 'right', key: 'image_cat_teal.png',
                    collisionBox: {
                        points: [
                            {x: -12, y: 12},
                            {x: 12, y: 24},
                            {x: 14, y: -18},
                            {x: -10, y: -27}
                        ]
                    } },
                { name: 'image_cat_white.png', naturalWall: 'right', key: 'image_cat_white.png',
                    collisionBox: {
                        points: [
                            {x: -12, y: 12},
                            {x: 12, y: 24},
                            {x: 14, y: -18},
                            {x: -10, y: -27}
                        ]
                    } }
            ],
            zone: 'wall'
        },
        {
            name: 'Windows',
            items: [
                { name: 'window_curtain_blue.png', naturalWall: 'left', key: 'window_curtain_blue.png',
                    collisionBox: {
                        points: [
                            {x: 46, y: -69},
                            {x: -47, y: -19},
                            {x: -45, y: 83},
                            {x: 47, y: 34}
                        ]
                    }
                 },
                { name: 'window_curtain_red.png', naturalWall: 'left', key: 'window_curtain_red.png',
                    collisionBox: {
                        points: [
                            {x: 46, y: -69},
                            {x: -47, y: -19},
                            {x: -45, y: 83},
                            {x: 47, y: 34}
                        ]
                    } },
                { name: 'window_curtain_beige.png', naturalWall: 'left', key: 'window_curtain_beige.png',
                    collisionBox: {
                        points: [
                            {x: 46, y: -69},
                            {x: -47, y: -19},
                            {x: -45, y: 83},
                            {x: 47, y: 34}
                        ]
                    } }
            ],
            zone: 'wall'
        },
        {
            name: 'Furniture',
            items: [
                { name: 'shelve_yellow.png', key: 'shelve_yellow.png', collisionBox: {
                    points: [
                        {x: -8, y: 65},
                        {x: 50, y: 36},
                        {x: 6, y: 13},
                        {x: -52, y: 43}
                    ]
                } },
                { name: 'shelve_purple.png', key: 'shelve_purple.png', collisionBox: {
                    points: [
                        {x: -8, y: 65},
                        {x: 50, y: 36},
                        {x: 6, y: 13},
                        {x: -52, y: 43}
                    ]
                } }
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
        // Clear any existing placed items to prevent duplicates
        this.placedItems.forEach(item => {
            if (item.sprite) {
                item.sprite.destroy();
            }
        });
        this.placedItems = [];

        // Load saved room configuration
        this.loadSavedConfig();

        // Initialize zone graphics
        this.zoneGraphics = this.add.graphics();

        // Initialize collision box graphics
        this.collisionBoxGraphics = this.add.graphics();

        // Add keyboard listener for collision editor
        this.input.keyboard?.on('keydown-C', () => {
            this.scene.launch('CollisionEditorScene', { categories: this.categories });
            this.scene.pause();
        });

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
            const textObj = this.add.text(buttonWidth / 2, buttonHeight / 2, text, buttonStyle)
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
            text: this.add.text(navButtonWidth / 2, navButtonHeight / 2, '🐱 Return', navButtonStyle)
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
            text: this.add.text(saveButtonWidth / 2, navButtonHeight / 2, '💾 Save', navButtonStyle)
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

        // Add collision box toggle button
        const boxesBtn = createButton(bottomButtonSpacing * 1.5 + sideMargin, bottomMargin, '📐 Collision Boxes');
        boxesBtn.text.on('pointerdown', () => {
            this.toggleCollisionBoxes();
        });

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

        // Add deselect when clicking on background
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Check if the pointer hit any interactive game objects
            const hitObjects = this.input.hitTestPointer(pointer);

            // Only deselect if no interactive objects were clicked
            if (hitObjects.length === 0) {
                this.deselectItem();
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

    private isCollisionBoxInZone(sprite: Phaser.GameObjects.Sprite, zoneName: string, naturalWall?: 'left' | 'right'): boolean {
        if (!this.zones) return false;

        // If zoneName is 'any', always return true (no restrictions)
        if (zoneName === 'any') return true;

        // First check if the sprite has collision box data directly attached
        let collisionPoints: Array<{ x: number, y: number }>;
        const directCollisionBox = sprite.getData('collisionBox');

        if (directCollisionBox && directCollisionBox.points && directCollisionBox.points.length >= 3) {
            // Use the collision box stored directly on the sprite
            collisionPoints = directCollisionBox.points;
        } else {
            // Get the category based on sprite's texture
            const itemKey = sprite.getData('itemKey') || sprite.texture.key;
            const itemCategory = this.findItemCategory(itemKey);
            if (!itemCategory) return false;

            // Find the item definition to get its collision box
            const itemDefinition = itemCategory.items.find(i =>
                i.key === itemKey ||
                i.name.replace('.png', '') === itemKey
            );

            if (itemDefinition?.collisionBox?.points && itemDefinition.collisionBox.points.length >= 3) {
                // Use predefined polygon points from the item definition
                collisionPoints = itemDefinition.collisionBox.points;
            } else {
                // Default to rectangle (as polygon) based on sprite dimensions
                const width = sprite.width * 0.8; // Use 80% of sprite width for better fit
                const height = sprite.height * 0.8; // Use 80% of sprite height for better fit

                // Create a rectangle as 4 corner points
                collisionPoints = [
                    { x: -width / 2, y: -height / 2 }, // Top left
                    { x: width / 2, y: -height / 2 },  // Top right
                    { x: width / 2, y: height / 2 },   // Bottom right
                    { x: -width / 2, y: height / 2 }   // Bottom left
                ];
            }
        }

        // Transform points based on sprite position, scale, and rotation
        const worldPoints = collisionPoints.map(point => {
            // Handle flipped sprites (negative scale)
            const adjustedX = point.x * Math.abs(sprite.scaleX) * (sprite.scaleX < 0 ? -1 : 1);
            const adjustedY = point.y * Math.abs(sprite.scaleY);

            return {
                x: sprite.x + adjustedX,
                y: sprite.y + adjustedY
            };
        });

        // Check if zoneName is wall and handle wall zones appropriately
        if (zoneName === 'wall') {
            // For wall items, check if in the correct wall zone
            const currentWallZone = this.getCurrentWallZone(sprite.x, sprite.y);

            // If no wall zone found, or wrong natural wall, it's invalid
            if (!currentWallZone) return false;

            // For items with a natural wall side, ensure it's on the correct side or mirrored correctly
            if (naturalWall) {
                // If the natural wall doesn't match the current zone
                if (currentWallZone.side !== naturalWall) {
                    // Only valid if the item is mirrored (negative scaleX)
                    if (sprite.scaleX > 0) return false;
                } else {
                    // Only valid if the item is NOT mirrored (positive scaleX)
                    if (sprite.scaleX < 0) return false;
                }
            }

            // Check if all points are within the wall zone polygon
            return worldPoints.every(point =>
                this.isPointInPolygon(point.x, point.y, currentWallZone.polygon)
            );
        } else {
            // For floor, ceiling, etc. items, find the matching zone
            const currentZones = this.zones[this.currentRoom] || [];
            const matchingZones = currentZones.filter((z: Zone) => z.name === zoneName);
            if (matchingZones.length === 0) return false;

            // Check if all points are within any matching zone polygon
            return matchingZones.some((zone: Zone) =>
                worldPoints.every(point =>
                    this.isPointInPolygon(point.x, point.y, zone.polygon)
                )
            );
        }
    }

    private isRectangleInPolygon(rect: Phaser.Geom.Rectangle, polygon: Phaser.Geom.Polygon): boolean {
        // Check if all four corners of the rectangle are inside the polygon
        const corners = [
            { x: rect.x, y: rect.y },                           // top-left
            { x: rect.x + rect.width, y: rect.y },              // top-right
            { x: rect.x, y: rect.y + rect.height },             // bottom-left
            { x: rect.x + rect.width, y: rect.y + rect.height } // bottom-right
        ];

        return corners.every(corner => polygon.contains(corner.x, corner.y));
    }

    private getItemCollisionBox(sprite: Phaser.GameObjects.Sprite): Phaser.Geom.Rectangle {
        // Get stored collision box if available
        if (sprite.getData('collisionBox')) {
            const box = sprite.getData('collisionBox');
            return new Phaser.Geom.Rectangle(
                sprite.x + box.x * sprite.scaleX,
                sprite.y + box.y * sprite.scaleY,
                box.width * Math.abs(sprite.scaleX),
                box.height * Math.abs(sprite.scaleY)
            );
        }

        // By default, use the sprite's dimensions as the collision box
        // This approximates using non-transparent pixels
        const width = sprite.width * 0.8; // Slightly smaller than the full sprite
        const height = sprite.height * 0.8;

        return new Phaser.Geom.Rectangle(
            sprite.x - width / 2,
            sprite.y - height / 2,
            width,
            height
        );
    }

    private isPointInZone(x: number, y: number, zoneName: string, naturalWall?: 'left' | 'right'): boolean {
        // This method is kept for backward compatibility
        // For point checks, we just check if the point is inside any zone

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

                    // Store the actual item info directly on the selectedItem for proper lookup
                    this.selectedItem.setData('itemKey', item.key);
                    this.selectedItem.setData('naturalWall', item.naturalWall);

                    // Store collision box if available
                    if (item.collisionBox) {
                        this.selectedItem.setData('collisionBox', item.collisionBox);
                    }
                });

                // Handle drag
                itemSprite.on('drag', (pointer: Phaser.Input.Pointer) => {
                    if (this.selectedItem) {
                        this.selectedItem.x = pointer.x;
                        this.selectedItem.y = pointer.y;

                        // Check if in valid zone
                        const isInValidZone = this.isCollisionBoxInZone(this.selectedItem, this.selectedItemZone, item.naturalWall);
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
                        // Use isCollisionBoxInZone for validation
                        const isInValidZone = this.isCollisionBoxInZone(this.selectedItem, this.selectedItemZone, item.naturalWall);
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

                            // Remove grid snapping for pixel-perfect placement
                            placedItem.setAlpha(1);
                            placedItem.clearTint();

                            this.placedItems.push({
                                sprite: placedItem,
                                name: this.selectedItem.texture.key,
                                key: this.selectedItem.texture.key,
                                x: placedItem.x,
                                y: placedItem.y,
                                scaleX: placedItem.scaleX,
                                scaleY: placedItem.scaleY,
                                naturalWall: item.naturalWall,
                                // Copy any collision box definition from the item definition
                                collisionBox: this.findItemDefinition(this.selectedItem.texture.key)?.collisionBox
                            });

                            // Setup placed item handlers with correct collision checks
                            this.setupPlacedItemHandlers(placedItem, category, item);
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
            items: this.placedItems
                .filter(item => item.sprite) // Only include items with valid sprites
                .map(item => {
                    // Ensure the name always includes .png
                    const itemName = item.name.endsWith('.png') ? item.name : `${item.name}.png`;
                    return {
                        name: itemName,
                        x: item.sprite!.x,
                        y: item.sprite!.y,
                        scaleX: item.sprite!.scaleX,
                        scaleY: item.sprite!.scaleY
                    };
                })
        };

        localStorage.setItem(this.saveKey, JSON.stringify(config));
    }

    private selectItem(sprite: Phaser.GameObjects.Sprite) {
        // Clear any previous selection
        this.deselectItem();

        // Set the selected item and highlight it
        this.selectedPlacedItem = sprite;
        sprite.setTint(0xffff00); // Yellow highlight

        // Create delete button
        const buttonX = sprite.x + 30;
        const buttonY = sprite.y - 30;

        // Create a container for the button
        this.deleteButton = this.add.container(buttonX, buttonY);

        // Create the red circle background
        const circle = this.add.circle(0, 0, 18, 0xff0000); // Red circle

        // Create white X
        const xText = this.add.text(0, 0, 'X', {
            fontSize: '18px',
            color: '#ffffff', // White text
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add components to the button container
        this.deleteButton.add([circle, xText]);

        // Make the button interactive
        circle.setInteractive({ useHandCursor: true });

        // Add delete functionality
        circle.on('pointerdown', () => {
            if (this.selectedPlacedItem) {
                // Find and remove the item from the placedItems array
                const index = this.placedItems.findIndex(item => item.sprite === this.selectedPlacedItem);
                if (index !== -1) {
                    this.placedItems.splice(index, 1);
                }

                // Destroy the sprite
                this.selectedPlacedItem.destroy();

                // Clean up
                this.deselectItem();
            }
        });

        // Add hover effects
        circle.on('pointerover', () => {
            circle.setFillStyle(0xff3333); // Lighter red on hover
            circle.setScale(1.1); // Slightly bigger
        });

        circle.on('pointerout', () => {
            circle.setFillStyle(0xff0000); // Back to normal red
            circle.setScale(1.0); // Normal size
        });

        // Set depth to ensure it's visible - use a very high value
        this.deleteButton.setDepth(1000);
    }

    private deselectItem() {
        // Clear highlighting on previously selected item
        if (this.selectedPlacedItem) {
            this.selectedPlacedItem.clearTint();
            this.selectedPlacedItem = null;
        }

        // Remove the delete button if it exists
        if (this.deleteButton) {
            this.deleteButton.destroy();
            this.deleteButton = null;
        }
    }

    private setupPlacedItemHandlers(sprite: Phaser.GameObjects.Sprite, category: ItemCategory | string, itemInfo?: any) {
        // If category is a string, find the category object
        let foundCategory: ItemCategory | undefined;
        let foundItemInfo: any;

        if (typeof category === 'string') {
            // Find the category for this item
            for (const cat of this.categories) {
                // Check both with and without .png extension
                if (cat.items.some(i =>
                    i.name === category ||
                    i.name === `${category}.png` ||
                    i.name.replace('.png', '') === category
                )) {
                    foundCategory = cat;
                    foundItemInfo = cat.items.find(i =>
                        i.name === category ||
                        i.name === `${category}.png` ||
                        i.name.replace('.png', '') === category
                    );
                    break;
                }
            }

            if (!foundCategory) {
                console.error(`Could not find category for item: ${category}`);
                return;
            }
        } else {
            foundCategory = category;
            foundItemInfo = itemInfo;
        }

        // Add specific collision box to the sprite's data if available
        if (foundItemInfo?.collisionBox) {
            sprite.setData('collisionBox', foundItemInfo.collisionBox);
        }

        // Set the selected item zone when starting to drag 
        sprite.on('dragstart', () => {
            this.selectedItemZone = foundCategory!.zone;
            sprite.setDepth(100);
        });

        sprite.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            sprite.x = dragX;
            sprite.y = dragY;

            // Move delete button with the item if it's selected
            if (this.selectedPlacedItem === sprite && this.deleteButton) {
                this.deleteButton.x = dragX + 30;
                this.deleteButton.y = dragY - 30;
            }

            // Visual feedback for valid/invalid zones - use collision box for validation
            const isValid = this.isCollisionBoxInZone(sprite, foundCategory!.zone, foundItemInfo?.naturalWall);
            sprite.setAlpha(isValid ? 1 : 0.4);
            sprite.setTint(isValid ? 0xffffff : 0xff0000);

            // Update collision box visualization
            if (this.showCollisionBoxes) {
                this.drawCollisionBoxes();
            }

            // Update mirroring for wall items
            if (foundCategory!.zone === 'wall' && foundItemInfo?.naturalWall) {
                const currentWallZone = this.getCurrentWallZone(dragX, dragY);
                if (currentWallZone && currentWallZone.side !== foundItemInfo.naturalWall) {
                    sprite.setScale(-0.8, 0.8);
                } else {
                    sprite.setScale(0.8);
                }
            }

            // Update stored position and scale in PlacedItem record
            const itemData = this.placedItems.find(i => i.sprite === sprite);
            if (itemData) {
                itemData.x = dragX;
                itemData.y = dragY;
                itemData.scaleX = sprite.scaleX;
                itemData.scaleY = sprite.scaleY;
            }
        });

        sprite.on('dragend', (pointer: Phaser.Input.Pointer) => {
            // Reset the selected item zone after dragging
            this.selectedItemZone = 'any';

            // Check if the item is valid in its current position using collision box
            const isValid = this.isCollisionBoxInZone(sprite, foundCategory!.zone, foundItemInfo?.naturalWall);
            const isInCatalog = sprite.x > this.cameras.main.width - 300 && this.catalogContainer.x < this.cameras.main.width;

            if (isValid && !isInCatalog) {
                // Pixel-perfect placement (no grid snapping)
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
                    `Can only place on ${foundCategory!.zone}!`,
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

        // Add pointer down for selection and right-click removal
        sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                // Right-click to delete
                const index = this.placedItems.findIndex(i => i.sprite === sprite);
                if (index !== -1) {
                    this.placedItems.splice(index, 1);
                }
                sprite.destroy();

                // Clean up if the deleted item was selected
                if (this.selectedPlacedItem === sprite) {
                    this.deselectItem();
                }
            } else {
                // Left-click to select
                this.selectItem(sprite);
            }
        });
    }

    private drawCollisionBoxes() {
        if (!this.showCollisionBoxes || !this.collisionBoxGraphics) return;

        // Clear previous drawings
        this.collisionBoxGraphics.clear();

        // Draw collision boxes for all placed items
        this.placedItems.forEach(item => {
            // Skip items without a sprite
            if (!item.sprite) return;

            const sprite = item.sprite;

            // Get the item category first for zone validation later
            const itemCategory = this.findItemCategory(item.key);
            if (!itemCategory) return;

            // First check if the sprite has collision box data directly attached
            let collisionPoints: Array<{ x: number, y: number }>;
            const directCollisionBox = sprite.getData('collisionBox');

            if (directCollisionBox && directCollisionBox.points && directCollisionBox.points.length >= 3) {
                // Use the collision box stored directly on the sprite
                collisionPoints = directCollisionBox.points;
            } else {
                // Find the item definition to get its collision box
                const itemKey = item.key;
                const itemDefinition = itemCategory.items.find(i =>
                    i.key === itemKey ||
                    i.name.replace('.png', '') === itemKey
                );

                if (itemDefinition?.collisionBox?.points && itemDefinition.collisionBox.points.length >= 3) {
                    // Use predefined polygon points from the item definition
                    collisionPoints = itemDefinition.collisionBox.points;
                } else {
                    // Default to rectangle (as polygon) based on sprite dimensions
                    const width = sprite.width * 0.8; // Use 80% of sprite width for better fit
                    const height = sprite.height * 0.8; // Use 80% of sprite height for better fit

                    // Create a rectangle as 4 corner points
                    collisionPoints = [
                        { x: -width / 2, y: -height / 2 }, // Top left
                        { x: width / 2, y: -height / 2 },  // Top right
                        { x: width / 2, y: height / 2 },   // Bottom right
                        { x: -width / 2, y: height / 2 }   // Bottom left
                    ];
                }
            }

            // Transform points based on sprite position, scale, and rotation
            const worldPoints = collisionPoints.map(point => {
                // Handle flipped sprites (negative scale)
                const adjustedX = point.x * Math.abs(sprite.scaleX) * (sprite.scaleX < 0 ? -1 : 1);
                const adjustedY = point.y * Math.abs(sprite.scaleY);

                return {
                    x: sprite.x + adjustedX,
                    y: sprite.y + adjustedY
                };
            });

            // Check if collision box is in valid zone
            const spriteNaturalWall = sprite.getData('naturalWall') || item.naturalWall;
            const isValid = this.isCollisionBoxInZone(
                sprite,
                itemCategory.zone,
                spriteNaturalWall
            );

            // Draw the collision box polygon - magenta for regular items
            this.collisionBoxGraphics.lineStyle(2, isValid ? 0xff00ff : 0xff0000);

            // Draw the polygon
            if (worldPoints.length > 0) {
                this.collisionBoxGraphics.beginPath();
                this.collisionBoxGraphics.moveTo(worldPoints[0].x, worldPoints[0].y);

                for (let i = 1; i < worldPoints.length; i++) {
                    this.collisionBoxGraphics.lineTo(worldPoints[i].x, worldPoints[i].y);
                }

                // Close the polygon
                this.collisionBoxGraphics.lineTo(worldPoints[0].x, worldPoints[0].y);
                this.collisionBoxGraphics.closePath();
                this.collisionBoxGraphics.strokePath();
            }
        });

        // Draw collision box for currently dragged item if any
        if (this.selectedItem) {
            const sprite = this.selectedItem;

            // First check if the sprite has collision box data directly attached
            let collisionPoints: Array<{ x: number, y: number }>;
            const directCollisionBox = sprite.getData('collisionBox');

            if (directCollisionBox && directCollisionBox.points && directCollisionBox.points.length >= 3) {
                // Use the collision box stored directly on the sprite
                collisionPoints = directCollisionBox.points;
            } else {
                // Fallback to category lookup
                const itemKey = sprite.getData('itemKey') || sprite.texture.key;
                const category = this.findItemCategory(itemKey);
                if (!category) return;

                // Find the item definition to get its collision box
                const itemDefinition = category.items.find(i =>
                    i.key === itemKey ||
                    i.name.replace('.png', '') === itemKey
                );

                if (itemDefinition?.collisionBox?.points && itemDefinition.collisionBox.points.length >= 3) {
                    // Use predefined polygon points
                    collisionPoints = itemDefinition.collisionBox.points;
                } else {
                    // Default to rectangle (as polygon) based on sprite dimensions
                    const width = sprite.width * 0.8; // Use 80% of sprite width for better fit
                    const height = sprite.height * 0.8; // Use 80% of sprite height for better fit

                    // Create a rectangle as 4 corner points
                    collisionPoints = [
                        { x: -width / 2, y: -height / 2 }, // Top left
                        { x: width / 2, y: -height / 2 },  // Top right
                        { x: width / 2, y: height / 2 },   // Bottom right
                        { x: -width / 2, y: height / 2 }   // Bottom left
                    ];
                }
            }

            // Transform points based on sprite position, scale, and rotation
            const worldPoints = collisionPoints.map(point => {
                // Handle flipped sprites (negative scale)
                const adjustedX = point.x * Math.abs(sprite.scaleX) * (sprite.scaleX < 0 ? -1 : 1);
                const adjustedY = point.y * Math.abs(sprite.scaleY);

                return {
                    x: sprite.x + adjustedX,
                    y: sprite.y + adjustedY
                };
            });

            // Check if collision box is in valid zone
            const spriteNaturalWall = sprite.getData('naturalWall');
            const isValid = this.isCollisionBoxInZone(
                sprite,
                this.selectedItemZone,
                spriteNaturalWall
            );

            // Draw the collision box polygon - yellow for selected item
            this.collisionBoxGraphics.lineStyle(2, isValid ? 0xffff00 : 0xff0000);

            // Draw the polygon
            if (worldPoints.length > 0) {
                this.collisionBoxGraphics.beginPath();
                this.collisionBoxGraphics.moveTo(worldPoints[0].x, worldPoints[0].y);

                for (let i = 1; i < worldPoints.length; i++) {
                    this.collisionBoxGraphics.lineTo(worldPoints[i].x, worldPoints[i].y);
                }

                // Close the polygon
                this.collisionBoxGraphics.lineTo(worldPoints[0].x, worldPoints[0].y);
                this.collisionBoxGraphics.closePath();
                this.collisionBoxGraphics.strokePath();
            }
        }
    }

    private findItemCategory(itemName: string): ItemCategory | undefined {
        for (const category of this.categories) {
            if (category.items.some(i =>
                i.name === itemName ||
                i.name === `${itemName}.png` ||
                i.name.replace('.png', '') === itemName
            )) {
                return category;
            }
        }
        return undefined;
    }

    // Helper method to check if a point is inside a polygon
    private isPointInPolygon(x: number, y: number, polygon: Phaser.Geom.Polygon): boolean {
        // Use Phaser's built-in method to check if a point is inside a polygon
        return Phaser.Geom.Polygon.Contains(polygon, x, y);
    }

    // Add the update method
    update() {
        if (this.showCollisionBoxes) {
            this.drawCollisionBoxes();
        }
    }

    // Add the loadSavedConfig method
    private loadSavedConfig() {
        try {
            const savedConfig = localStorage.getItem(this.saveKey);
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.currentRoom = config.room;

                this.background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, this.currentRoom)
                    .setOrigin(0.5);

                // Place all saved items
                config.items.forEach((item: SavedConfigItem) => {
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

                    // Find the item definition
                    const itemDefinition = foundCategory.items.find(i =>
                        i.name === item.name ||
                        i.name === `${item.name}.png` ||
                        i.name.replace('.png', '') === item.name
                    );

                    if (!itemDefinition) {
                        console.error(`Could not find item definition for: ${item.name}`);
                        return;
                    }

                    // Ensure the key is set
                    const itemKey = item.key || item.name;

                    const sprite = this.add.sprite(item.x, item.y, itemKey.replace('.png', ''))
                        .setScale(item.scaleX, item.scaleY);

                    // Set collision box data if available from the item definition
                    if (itemDefinition.collisionBox) {
                        sprite.setData('collisionBox', itemDefinition.collisionBox);
                    }

                    // Make the sprite draggable
                    sprite.setInteractive({ draggable: true, useHandCursor: true });

                    // Add the sprite to placed items with collision box info
                    this.placedItems.push({
                        name: item.name,
                        key: itemKey,
                        x: item.x,
                        y: item.y,
                        sprite: sprite,
                        scaleX: item.scaleX || 0.8,
                        scaleY: item.scaleY || 0.8,
                        naturalWall: item.naturalWall || itemDefinition.naturalWall,
                        collisionBox: itemDefinition.collisionBox
                    });

                    // Setup handlers for the placed item
                    this.setupPlacedItemHandlers(sprite, foundCategory, itemDefinition);
                });
            } else {
                this.background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, this.currentRoom)
                    .setOrigin(0.5);
            }
        } catch (e) {
            console.error('Error loading saved config:', e);
            this.background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, this.currentRoom)
                .setOrigin(0.5);
        }
    }

    // Add helper method for extracting collision polygons from sprites
    private addPolygonHelperTool() {
        // Only available when collision boxes are visible
        if (!this.showCollisionBoxes) return;

        // Add a text instruction at the top of the screen
        const instructions = this.add.text(
            this.cameras.main.centerX,
            50,
            'Click on sprite to generate polygon points.\nPress P to print to console.\nPress ESC to exit polygon tool.',
            {
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 },
                align: 'center'
            }
        ).setOrigin(0.5, 0);

        // Temporary storage for points
        const points: Array<{ x: number, y: number }> = [];
        let selectedSprite: Phaser.GameObjects.Sprite | null = null;
        let polygonGraphics = this.add.graphics();

        // Function to draw current polygon
        const drawCurrentPolygon = () => {
            polygonGraphics.clear();

            if (!selectedSprite || points.length < 2) return;

            // Draw the points and lines
            polygonGraphics.lineStyle(2, 0x00ff00);

            // Draw the polygon
            polygonGraphics.beginPath();
            polygonGraphics.moveTo(points[0].x, points[0].y);

            for (let i = 1; i < points.length; i++) {
                polygonGraphics.lineTo(points[i].x, points[i].y);
            }

            // Close the polygon if we have 3+ points
            if (points.length >= 3) {
                polygonGraphics.lineTo(points[0].x, points[0].y);
            }

            polygonGraphics.strokePath();

            // Draw points
            points.forEach((point, index) => {
                polygonGraphics.fillStyle(0x00ff00);
                polygonGraphics.fillCircle(point.x, point.y, 4);

                // Add point number
                this.add.text(point.x + 10, point.y - 10, index.toString(), {
                    fontSize: '14px',
                    color: '#00ff00',
                    backgroundColor: '#000000',
                    padding: { x: 3, y: 1 }
                }).setDepth(1000);
            });
        };

        // Click handler for adding points
        const clickHandler = (pointer: Phaser.Input.Pointer) => {
            if (!selectedSprite) {
                // Try to find a sprite under the pointer
                this.placedItems.forEach(item => {
                    if (item.sprite && item.sprite.getBounds().contains(pointer.x, pointer.y)) {
                        selectedSprite = item.sprite;
                        instructions.setText(`Selected: ${item.name}\nClick to add points to polygon. Press P to print, ESC to exit.`);
                    }
                });
                return;
            }

            // Add point relative to the sprite's center
            const relativeX = pointer.x - selectedSprite.x;
            const relativeY = pointer.y - selectedSprite.y;

            // When using scale, adjust the point coordinates
            const adjustedX = selectedSprite.scaleX < 0 ? -relativeX : relativeX;

            points.push({
                x: Math.round(adjustedX / Math.abs(selectedSprite.scaleX)),
                y: Math.round(relativeY / Math.abs(selectedSprite.scaleY))
            });

            drawCurrentPolygon();
        };

        // Key handler for print and exit
        const keyHandler = (event: KeyboardEvent) => {
            if (event.key === 'p' || event.key === 'P') {
                if (selectedSprite && points.length >= 3) {
                    // Print the points as a collisionBox definition
                    console.log(`collisionBox: {
    points: [
        ${points.map(p => `{x: ${p.x}, y: ${p.y}}`).join(',\n        ')}
    ]
}`);
                    // Add a temporary message
                    const msg = this.add.text(
                        this.cameras.main.centerX,
                        this.cameras.main.centerY,
                        'Polygon points printed to console!',
                        {
                            fontSize: '24px',
                            color: '#00ff00',
                            backgroundColor: '#000000',
                            padding: { x: 20, y: 10 }
                        }
                    ).setOrigin(0.5);

                    // Fade out the message
                    this.tweens.add({
                        targets: msg,
                        alpha: 0,
                        y: msg.y - 50,
                        duration: 1500,
                        onComplete: () => msg.destroy()
                    });
                }
            } else if (event.key === 'Escape') {
                // Clean up
                instructions.destroy();
                polygonGraphics.destroy();
                window.removeEventListener('keydown', keyHandler);
                this.input.off('pointerdown', clickHandler);
            }
        };

        // Register handlers
        this.input.on('pointerdown', clickHandler);
        window.addEventListener('keydown', keyHandler);
    }

    // Add the toggleCollisionBoxes method
    private toggleCollisionBoxes() {
        this.showCollisionBoxes = !this.showCollisionBoxes;

        // When enabling, check if SHIFT is held to also enable polygon helper
        const isShiftDown = this.input.keyboard &&
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT).isDown;

        if (this.showCollisionBoxes && isShiftDown) {
            this.addPolygonHelperTool();
        }

        this.drawCollisionBoxes();
    }

    // Add helper method to find item definition with collision box
    private findItemDefinition(itemKey: string): any {
        for (const category of this.categories) {
            const item = category.items.find(i =>
                i.key === itemKey ||
                i.name.replace('.png', '') === itemKey
            );
            if (item) return item;
        }
        return undefined;
    }
}

export default RoomEditorScene; 