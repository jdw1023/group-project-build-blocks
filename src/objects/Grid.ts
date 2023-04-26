import { GridData } from './../interfaces/GridData';
import Phaser from "phaser";
import Crane from './Crane';
import Crate from './Crate';
import Level from './Level';
import { GridVars } from '../interfaces/GridVars';

export default class Grid {

    private scene: Phaser.Scene;

    // Grid Variables
    private gridData: GridData;
    private isPrimaryGrid: boolean;
    
    private gridSquares?: Phaser.GameObjects.Image[][];
    public crane?: Crane;
    public crates?: Phaser.Physics.Arcade.Group
    public endCrates?: Phaser.Physics.Arcade.Group
    private toggleVisibleButton?: Phaser.GameObjects.Text;

    public gridVars: GridVars

    /**
     * A grid object
     * @param GridData - GridData
     * @param isPrimaryGrid - boolean: is grid with movable blocks or the solution template
     * @param world - Phaser.Physics.Arcade.World
     * @param scene - Phaser.Scene
     */
    constructor (GridData: GridData, isPrimaryGrid: boolean, scene: Phaser.Scene) {
        this.scene = scene;
        this.isPrimaryGrid = isPrimaryGrid;
        this.gridData = GridData;
        if (this.isPrimaryGrid) {
            this.gridVars = Level.PrimaryGridVars;
        } else {
            this.gridVars = Level.SecondaryGridVars;
        }
    }
    /* HELPER FUNCTIONS */

    public makeGrid() {

        // makes the grid overlay
        for (let x = 0; x < this.gridData.width; x++) {
            
            const newRow = [];
            
            for (let y = 0; y < this.gridData.height; y++) {
                const newSquare = this.scene.add.image(
                    this.gridVars.GRID_START_LEFT + this.gridVars.GRID_SQUARE_SIZE*x, 
                    (this.scene.sys.game.canvas.height - this.gridVars.GRID_START_BOTTOM) - this.gridVars.GRID_SQUARE_SIZE*y, 
                    'gridSquare'
                );
                
                newRow.push(newSquare);
            }

            this.gridSquares?.push(newRow);
        }

        // makes the game objects
        this.endCrates = this.placeBlocks(false);
        this.endCrates.setAlpha(0.5);
        if (this.isPrimaryGrid) {
            this.crates = this.placeBlocks(true);
        }
    }

    private placeBlocks(isBlocks: boolean) {
        const crates = this.scene.physics.add.group({ collideWorldBounds: true });
        for (let x = 0; x < this.gridData.width; x++) {
            for (let y = this.gridData.height - 1; y >= 0; y--) {
                console.log("test");
                switch(isBlocks ? this.gridData.gridObjects[4-y][x] : this.gridData.gridObjectives[4-y][x]) {
                    case "none":
                        break;
                    case "crane":{
                        this.crane = new Crane(
                            this.scene, 
                            this.gridVars.GRID_START_LEFT + this.gridVars.GRID_SQUARE_SIZE*x, 
                            (this.scene.sys.game.canvas.height - this.gridVars.GRID_START_BOTTOM) - this.gridVars.GRID_SQUARE_SIZE*y,  
                            false
                        );
                        break;
                    }
                    case "crate-brown": {
                        const oneGuy = new Crate(
                            this.scene, 
                            this.gridVars.GRID_START_LEFT + this.gridVars.GRID_SQUARE_SIZE*x,
                            (this.scene.sys.game.canvas.height - this.gridVars.GRID_START_BOTTOM) - this.gridVars.GRID_SQUARE_SIZE*y,
                            "regCrate",
                            "none"
                        );
                        if (!isBlocks) {
                            oneGuy.setAlpha(0.5);
                        }
                        oneGuy.refreshBody();
                        crates.add(oneGuy);
                        break;
                    }    
                    case "crate-red": {
                        const oneGuy = new Crate(
                            this.scene, 
                            this.gridVars.GRID_START_LEFT + this.gridVars.GRID_SQUARE_SIZE*x,
                            (this.scene.sys.game.canvas.height - this.gridVars.GRID_START_BOTTOM) - this.gridVars.GRID_SQUARE_SIZE*y,
                            "regCrate",
                            "red"
                        );
                        
                        oneGuy.refreshBody();
                        crates.add(oneGuy);
                        break;
                    } 
                    case "crate-green": {
                        const oneGuy = new Crate(
                            this.scene, 
                            this.gridVars.GRID_START_LEFT + this.gridVars.GRID_SQUARE_SIZE*x,
                            (this.scene.sys.game.canvas.height - this.gridVars.GRID_START_BOTTOM) - this.gridVars.GRID_SQUARE_SIZE*y,
                            "regCrate",
                            "green"
                        );
                        
                        oneGuy.refreshBody();
                        crates.add(oneGuy);
                        break;
                    } 
                    case "crate-blue":  {
                        const oneGuy = new Crate(
                            this.scene, 
                            this.gridVars.GRID_START_LEFT + this.gridVars.GRID_SQUARE_SIZE*x,
                            (this.scene.sys.game.canvas.height - this.gridVars.GRID_START_BOTTOM) - this.gridVars.GRID_SQUARE_SIZE*y,
                            "regCrate",
                            "blue"
                        );
                        
                        oneGuy.refreshBody();
                        crates.add(oneGuy);
                        break;
                    } 
                    default: {
                        break;
                    }
                }
            }
        }
        this.scene.physics.add.collider(crates, crates)
        if(this.crane !== undefined && isBlocks) {
            this.scene.physics.add.collider(this.crane, crates);
        }
        return crates;
    }
}