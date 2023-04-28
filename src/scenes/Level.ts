import { GridData } from './../interfaces/GridData';
import Phaser from 'phaser'
import Crane from '../objects/Crane';
import { CharStream, CommonTokenStream } from 'antlr4';
import BlockLangLexer from '../ANTLR4/generated/BlockLangLexer';
import BlockLangParser from '../ANTLR4/generated/BlockLangParser';
import BlockVisitor from '../scripts/utils/BlockVisitor';
import Crate from '../objects/Crate';
import Instruction from '../objects/Instruction';
import Grid from '../objects/Grid';

export default class Level extends Phaser.Scene {
    
    /* SCENE CONSTANTS */
    private grid: Grid;
    private secondaryGrid: Grid;

    public static readonly P_GRID_START_BOTTOM = 16;
    public static readonly P_GRID_START_LEFT = 16;
    public static readonly P_GRID_SQUARE_SIZE = 32;    

    
    public static readonly S_GRID_START_BOTTOM = 16;
    public static readonly S_GRID_START_LEFT = 300;
    public static readonly S_GRID_SQUARE_SIZE = 32;

    private start_blocks = 0;
    private left_blocks = 0;
    private right_blocks = 0;
    private up_blocks = 0;
    private down_blocks = 0;
    //private loop_blocks = 0;
    //private endloop_blocks = 0;

    /* SCENE VARIABLES */
    private crates?: Phaser.Physics.Arcade.Group
    private endCrates?: Phaser.Physics.Arcade.Group
    private crane: Crane;
    private start_instruction?: Instruction;

    // private toggleVisibleButton?: Phaser.GameObjects.Text;
    private score = 0;
    public Instructions?: Instruction[];

    //the background of the scene
    private background?: Phaser.GameObjects.Image


    /* ESSENTIAL FUNCTIONS */

    constructor(){
		super(`level`);
    }

    get getCrane(){
        return this.crane;
    }
    init(data:{levelNumber: number, gridData: GridData}) {
        this.grid = new Grid(data.gridData, true, this);
        this.secondaryGrid = new Grid(data.gridData, false, this);

        this.start_blocks = data.gridData.start_blocks;
        this.up_blocks = data.gridData.up_blocks;
        this.left_blocks = data.gridData.left_blocks;
        this.right_blocks = data.gridData.right_blocks;
        this.down_blocks = data.gridData.down_blocks;
        //this.loop_blocks = data.gridData.loop_blocks;
        //this.endloop_blocks = data.gridData.endloop_blocks;
        this.createLevel()
	}

    createLevel() {

        //create the background and set the scale
        this.background = this.add.image(this.sys.game.canvas.width / 2, this.sys.game.canvas.height / 2, 'background');
        this.background.setScale(this.sys.game.canvas.width, this.sys.game.canvas.height);

        // Create Grid and pass handlers
        this.grid.makeGrid();
        this.crates = this.grid.crates;
        this.endCrates = this.grid.endCrates;
        this.crane = this.grid.crane;

        this.secondaryGrid.makeGrid();

        // create iframe and pass scene to it
        const iframe = document.getElementById('editor') as HTMLIFrameElement;
        console.log(iframe)
        const contentWnd = iframe.contentWindow as Window  & {scene: Level};
        contentWnd.scene = this;

        // makes drag and drop instructions
        this.generate_instructions();

        // create button to for executing instructions
        const executeButton = this.add.rectangle(this.sys.game.canvas.width-80, this.sys.game.canvas.height-130, 140, 30, 0x204060, 1);

        executeButton.setInteractive();
        executeButton.on('pointerover', () => {
            executeButton.setFillStyle(0x204060, 0.6);
        });
        executeButton.on('pointerout', () => {
            executeButton.setFillStyle(0x204060, 1);
        });
        const executeText = this.add.text(this.sys.game.canvas.width-80, this.sys.game.canvas.height-130, `execute!`, {
            fontSize: '18px',
            color: '#fff',
        });
        executeText.setOrigin(0.5);
        executeButton.on('pointerdown', () => {
            console.log(this.InstructionChainToString());
            this.execute(this.InstructionChainToString())
        });
        
        // create button to for going back to level selection
        const levelSelectButton = this.add.rectangle(this.sys.game.canvas.width-80, this.sys.game.canvas.height-30, 140, 30, 0x204060, 1);

        levelSelectButton.setInteractive();
        levelSelectButton.on('pointerover', () => {
            levelSelectButton.setFillStyle(0x204060, 0.6);
        });
        levelSelectButton.on('pointerout', () => {
            levelSelectButton.setFillStyle(0x204060, 1);
        });
        const levelSelectText = this.add.text(this.sys.game.canvas.width-80, this.sys.game.canvas.height-30, `level select`, {
            fontSize: '18px',
            color: '#fff',
        });
        levelSelectText.setOrigin(0.5);
        levelSelectButton.on('pointerdown', () => {
            this.scene.start(`LevelSelectScene`);
        });

        // create button for restart level
        const restartButton = this.add.rectangle(this.sys.game.canvas.width-80, this.sys.game.canvas.height-80, 140, 30, 0x204060, 1);
        restartButton.setInteractive();
        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0x204060, 0.6);
        });
        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0x204060, 1);
        });
        const restartText = this.add.text(this.sys.game.canvas.width-80, this.sys.game.canvas.height-80, `restart`, {
            fontSize: '18px',
            color: '#fff',
        });
        restartText.setOrigin(0.5);
        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    update(){
        if(this.crane !== undefined) {
            if(!this.physics.overlap(this.crane.PICKUP_BOX, this.crates, (_box, crate) => {
                    if(this.crane !== undefined) {
                        this.crane.toGrab = crate as Phaser.Physics.Arcade.Sprite;
                    }
                }
                )
            ) {
                this.crane.toGrab = undefined;
            }
        }
        this.checkWin();
    }

    /* HELPER FUNCTIONS */
    private checkOverlap(c: Crate, ec:Crate) {
        if (c.getColor() !== ec.getColor()) {
            return false;
        }
        const xdiff = Math.abs( ec.body.position.x - c.body.position.x );
        const ydiff = Math.abs( ec.body.position.y - c.body.position.y );
        const diff = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
        return diff < 6;
    }

    private getScore() {
        this.score = 0;
        this.crates?.getChildren().forEach((c) => {
            this.endCrates?.getChildren().forEach((ec) => {
                const crate = c as Crate
                const ecrate = ec as Crate
                if (this.checkOverlap(ecrate, crate)) {
                    this.score++;
                }
            })
        }, this)
    }

    private checkWin() {
        this.getScore();
        const didWin = this.score === this.grid.maxScore;
        //console.log(this.score)
        if (didWin) {
            console.log("you win!")
            this.add.text(400,300,"YOU WIN!");
        }
        return didWin;
    }

    generate_instructions(){
        let currX = 400;
        let currY = 50;

        for(let i = 0; i < this.start_blocks; i++) {
            const fred = new Instruction(this, currX, currY, "start");
            this.add.existing(fred);
            this.Instructions?.push(fred);
            this.start_instruction = fred;
            currY += 50;
        }

        currX += 100;
        currY = 50;
        for(let i = 0; i < this.right_blocks; i++) {
            const fred = new Instruction(this, currX, currY, "right");
            this.add.existing(fred);
            this.Instructions?.push(fred);
            currY += 50;
        }

        currX += 100;
        currY = 50;
        for(let i = 0; i < this.left_blocks; i++) {
            const fred = new Instruction(this, currX, currY, "left");
            this.add.existing(fred);
            this.Instructions?.push(fred);
            currY += 50;
        }

        for(let i = 0; i < this.down_blocks; i++) {
            const fred = new Instruction(this, currX, currY, "down");
            this.add.existing(fred);
            this.Instructions?.push(fred);
            currY += 50;
        }
        
        currX += 100;
        currY = 50;
        for(let i = 0; i < this.up_blocks; i++) {
            const fred = new Instruction(this, currX, currY, "up");
            this.add.existing(fred);
            this.Instructions?.push(fred);
            currY += 50;
        }
        
        currX += 100;
        currY = 50;
    }

    InstructionChainToString(){
        let currInstruction = this.start_instruction;
        if(this.start_instruction){
            let instructionString = "";
            while(currInstruction?.nextInstruction !== undefined){
                currInstruction = currInstruction.nextInstruction;
                instructionString += currInstruction.instructionType;
                instructionString += "\n"
            }

            return instructionString;
        }
        return "";
    }

    execute(s: string) {
        const input = s;
        const chars = new CharStream(input);
        const lexer = new BlockLangLexer(chars);
        const tokens = new CommonTokenStream(lexer);
        const parser = new BlockLangParser(tokens);
        // let _error = "";
        // lexer.removeErrorListeners();
        // lexer.addErrorListener({
        //     syntaxError: (_recognizer, _offendingSymbol, line, column, msg, _e) => {
        //         _error += `Error: ${msg} at line ${line} and column ${column}. <br>`;
        //     }
        // });
        // parser.buildParseTrees = true;
        // parser.removeErrorListeners();
        // parser.addErrorListener({
        //     syntaxError: (_recognizer, _offendingSymbol, line, column, msg, _e) => {
        //         _error += `Error: ${msg} at line ${line} and column ${column}. <br>`;
        //     }
        // });
        const tree = parser.program();
        const visitor = new BlockVisitor(null, this);
        console.log(visitor.visit(tree));
        // console.log(formatParseTree(tree.toStringTree(null, parser)));
    }
}