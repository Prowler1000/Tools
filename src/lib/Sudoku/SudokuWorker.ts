import { SudokuWorkerMsgType, FlagsManager, type SudokuWorkerMessage } from "./SudokuManager";
import { SudokuBoard } from "./SudokuBoard";
import { BufferedMatrix, GridIterator } from "./BufferedMatrix";

function* square_coords(coord: Coordinate) {
    const x_mod = Math.trunc(coord.x/3)*3;
    const y_mod = Math.trunc(coord.y/3)*3;
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            yield [x + x_mod, y + y_mod];
        }
    }
}

type Coordinate = {
    x: number,
    y: number,
}

type GridModAction = {
    coord: Coordinate,
    old_value: number,
    new_value: number,
    allowed_values_removed: Coordinate[]
}

class SudokuWorker {
    private board!: SudokuBoard;
    private flags!: FlagsManager;

    private allowed_values: number[][][] = Array.from({length: 9}, () => Array.from({length: 9}, () => []));

    private mod_stack: GridModAction[] = [];

    /**
     * Undoes the most recent value on mod_stack
     * Does NOT re-add the tried value to appropriate coordinate
     */
    private undo() {
        const action = this.mod_stack.pop();
        if (action !== undefined) {
            this.board.SetValue(action.coord.x, action.coord.y, action.old_value);
            for (const coord of action.allowed_values_removed) {
                this.allowed_values[coord.y][coord.x].push(action.new_value);
                this.allowed_values[coord.y][coord.x].sort();
            }
        }
    }

    /**
     * Pops the last value from allowed_values of coord.
     * Sets grid cell at coord to popped value.
     * Modifies allowed values for row, column, and square.
     * Pushes modifications to mod_stack.
     * @param coord The coordinate of the cell to try
     */
    private try_allowed_value(coord: Coordinate) {
        if (this.allowed_values[coord.y][coord.x].length > 0) {
            const new_value = this.allowed_values[coord.y][coord.x].pop()!;
            const old_value = this.board.GetValue(coord.x, coord.y);
            this.board.SetValue(coord.x, coord.y, new_value);
            const removed_allowed_coordinate: Coordinate[] = []
            // Check row and column
            for (let i = 0; i < 9; i++) {
                if (this.allowed_values[coord.y][i].includes(new_value)) {
                    this.allowed_values[coord.y][i] = this.allowed_values[coord.y][i].filter(x => x !== new_value);
                    removed_allowed_coordinate.push({x: i, y: coord.y});
                }
                if (this.allowed_values[i][coord.x].includes(new_value)) {
                    this.allowed_values[i][coord.x] = this.allowed_values[i][coord.x].filter(x => x !== new_value);
                    removed_allowed_coordinate.push({x: coord.x, y: i});
                }
            }
            // Check square
            for (const [x, y] of square_coords(coord)) {
                if (this.allowed_values[y][x].includes(new_value)) {
                    // assert(x !== coord.x);
                    // assert(y !== coord.y);
                    this.allowed_values[y][x] = this.allowed_values[y][x].filter(x => x !== new_value);
                    removed_allowed_coordinate.push({x: x, y: y});
                }
            }
            this.mod_stack.push({
                coord: coord,
                old_value: old_value,
                new_value: new_value,
                allowed_values_removed: removed_allowed_coordinate,
            });
        }
    }

    /**
     * Checks if there are empty cells with no allowed values
     * @returns True if there are empty cells with no options, false otherwise
     */
    private are_dead_cells(): boolean {        
        for (const [x,y] of GridIterator(9, 9)) {
            // If the current cell is unfilled AND there are no allowed values
            if (this.board.GetValue(x, y) === 0 && this.allowed_values[y][x].length === 0) {
                console.error(`[${x}, ${y}] dead cell`)
                return true;
            }
        }
        return false;
    }

    /**
     * Finds the empty cell with the least number of allowed values
     * @returns Coordinate of the cell with the least number of allowed values, (-1,-1) if no cells with options exist
     */
    private find_most_restrictive(): Coordinate {
        let prev_min = 10;
        const min_coord: Coordinate = {x: -1, y:-1};
        for (const [r_i, row] of this.allowed_values.entries()) {
            for (const [c_i, cell] of row.entries()) {
                if (this.board.GetValue(c_i, r_i) === 0 && cell.length > 0 && cell.length < prev_min) {
                    prev_min = cell.length;
                    min_coord.x = c_i;
                    min_coord.y = r_i;
                }
            }
        }
        return min_coord;
    }

    /**
     * Checks if there are any empty cells with 1 allowed value
     */
    private are_known_values(): boolean {
        let knowns = false;
        for (const [x, y] of GridIterator(9, 9)) {
            if (this.allowed_values[y][x].length === 1 && this.board.GetValue(x, y) === 0) {
                knowns = true;
                break;
            }
        }
        return knowns;
    }

    /**
     * Sets known values
     */
    private set_known_values() {
        while (this.are_known_values() && !this.are_dead_cells()) {    
            for (const [x, y] of GridIterator(9, 9)) {
                if (this.allowed_values[y][x].length === 1 && this.board.GetValue(x, y) === 0) {
                    this.try_allowed_value({x, y});
                    break;
                }
            }
        }
    }

    private solve() {
        while (this.flags.RUN) {
            this.set_known_values();
            while (this.are_dead_cells() && this.mod_stack.length > 0) {
                this.undo()
            }
            if (this.are_dead_cells()) {
                // We can't undo any more but there are still dead cells
                // If this happens, the grid turned out to be unsolvable
                SendMessage(SudokuWorkerMsgType.UNSOLVABLE);
                break;
            }
            const cell = this.find_most_restrictive();
            if (cell.x > -1 && cell.y > -1) {
                // There is still at least 1 cell with options
                this.try_allowed_value(cell);
            }
            else {
                SendMessage(SudokuWorkerMsgType.SOLVED);
                break;
            }
        }
    }

    public init(buffer: SharedArrayBuffer) {
        const flag_bytes = FlagsManager.NUM_BYTES;
        this.flags = new FlagsManager(new Uint32Array(buffer, 0, FlagsManager.FLAG_COUNT));

        const matrix = new BufferedMatrix(9, 9, new Uint32Array(buffer, flag_bytes, 81));
        this.board = new SudokuBoard(matrix);
    }

    private set_allowed_values() {
        for (const [x,y] of GridIterator(9, 9)) {
            this.allowed_values[y][x] = this.board.GetPossibleValues(x, y);
        }
    }

    public reset() {
        for (const [x, y] of GridIterator(9,9)) {
            this.allowed_values[y][x].length = 0;
        }
        this.mod_stack.length = 0;
        this.set_allowed_values();
    }

    public onmessage_handler(ev: MessageEvent) {
        const data = ev.data as SudokuWorkerMessage;
        switch (data.type) {
            case SudokuWorkerMsgType.INIT:
                this.init(data.data as SharedArrayBuffer);
                break;
            case SudokuWorkerMsgType.SOLVE:
                this.solve();
                break;
            case SudokuWorkerMsgType.RESET:
                this.reset();
                break;
        }
    }
}

function SendMessage(message: SudokuWorkerMessage): void
function SendMessage(type: SudokuWorkerMsgType, data?: unknown): void
function SendMessage(messageOrType: SudokuWorkerMessage | SudokuWorkerMsgType, data?: unknown) {
    if (typeof messageOrType === 'object') {
        self.postMessage(messageOrType);
    } 
    else {
        self.postMessage({
            type: messageOrType,
            data: data,
        });
    }
}


const worker = new SudokuWorker();
self.onmessage = (ev: MessageEvent) => {
    worker.onmessage_handler(ev);
};