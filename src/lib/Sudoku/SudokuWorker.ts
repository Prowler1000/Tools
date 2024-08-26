import { SudokuWorkerMsgType, FlagsManager, type SudokuWorkerMessage } from "./SudokuManager";
import { SudokuBoard } from "./SudokuBoard";
import { BufferedMatrix } from "./BufferedMatrix";

export default class SudokuWorker {
    private board!: SudokuBoard
    private flags!: FlagsManager;

    public constructor() {

    }

    public init(buffer: SharedArrayBuffer) {
        const flag_bytes = FlagsManager.NUM_BYTES;
        this.flags = new FlagsManager(new Uint32Array(buffer, 0, FlagsManager.FLAG_COUNT));

        const matrix = new BufferedMatrix(9, 9, new Uint32Array(buffer, flag_bytes, 81));
        this.board = new SudokuBoard(matrix);
        const solved = this.solve();
        if (solved) {
            console.log("It's been solved!!");
        }
        else {
            console.log("It's not been able to be solved?");
        }
    }

    public onmessage_handler(ev: MessageEvent) {
        const data = ev.data as SudokuWorkerMessage;
        switch (data.type) {
            case SudokuWorkerMsgType.INIT:
                this.init(data.data as SharedArrayBuffer);
                break;
        }
    }

    private send_message(message: SudokuWorkerMessage) {
        self.postMessage(message);
    }

    private get_allowed_values(r: number, c: number): number[] {
        return this.board.GetPossibleValues(c, r);
    }

    private create_allowed_values(): number[][][] {
        return this.board.Get2DArray().map((row, r_i) => {
            return row.map((cell, c_i) => {
                return cell > 0 ? [cell] : this.get_allowed_values(r_i, c_i);
            })
        })
    }

    private are_knowns(allowed_values?: number[][][]): boolean {
        allowed_values = allowed_values ?? this.create_allowed_values();
        let knowns = false;
        for (let y = 0; y < 9 && !knowns; y++) {
            for (let x = 0; x < 9 && !knowns; x++) {
                if (allowed_values[y][x].length === 1) {
                    knowns = knowns || this.board.GetValue(x, y) === 0;
                }
            }
        }
        return knowns;
    }

    private set_knowns(allowed_values: number[][][]) {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (allowed_values[y][x].length === 1 && this.board.GetValue(x,y) === 0) {
                    //const test = this.get_allowed_values(y, x);
                    this.board.SetValue(x,y, allowed_values[y][x][0]);
                    return;
                }
            }
        }
    }

    private solve(): boolean {
        let solved = false;
        console.log(`Is valid initial board: ${this.board.IsValidBoard()}`);
        while (this.are_knowns()) {
            this.set_knowns(this.create_allowed_values());
        }
        console.log(`Is pre-solved: ${this.board.IsValidBoard(false)}`)
        solved = this.solve_recursive();
        if (this.flags.NEW_DATA) {
            this.flags.NEW_DATA = false;
            solved = this.solve();
        }
        return solved;
    }

    private find_least_options(allowed_values: number[][][]) {
        let prev_min = 10; // Larger than the actual minimum value
        let min_row = -1;
        let min_col = -1;
        for (const [r_i, row] of allowed_values.entries()) {
            for (const [c_i, cell] of row.entries()) {
                if (cell.length > 1) {
                    if (cell.length < prev_min) {
                        prev_min = cell.length;
                        min_row = r_i;
                        min_col = c_i;
                    }
                }
            }
        }
        return [min_row, min_col]
    }

    private find_first_open(allowed_values: number[][][]) {
        let x = -1;
        let y = -1
        for (const [r_i, row] of allowed_values.entries()) {
            for (const [c_i, cell] of row.entries()) {
                if (cell.length > 1) {
                    x = c_i;
                    y = r_i;
                    break;
                }
            }
            if (x != -1 && y != -1) {
                break;
            }
        }
        return [y, x]
    }

    private test_allowed_values(allowed_values: number[][][]): boolean {
        const old_board = this.board.Get2DArray();
        const new_board = allowed_values.map(row => row.flat());
        this.board.SetGrid(new_board);
        const valid = this.board.IsValidBoard(false);
        if (!valid) {
            this.board.SetGrid(old_board);
        }
        return valid;
    }

    private solve_recursive(): boolean {
        let pause_timeout = 0;
        while (this.flags.PAUSE && !this.flags.HALT && !this.flags.NEW_DATA) {
            if (pause_timeout == 0) {
                pause_timeout = 0;
            }
        }
        if (this.flags.HALT || this.flags.NEW_DATA) {
            return false;
        }
        const allowed_values = this.create_allowed_values();
        const [row, col] = this.find_least_options(allowed_values);
        if (row > -1 && col > -1) {
            // Recursive case
            for (const attempt_value of allowed_values[row][col]) {
                this.board.SetValue(col, row, attempt_value);
                const solved = this.solve_recursive();
                if (solved) {
                    return solved
                }
            }
            // Restore changes if we've failed to solve
            this.board.SetValue(col, row, 0);
            return false; // We failed to solve before exhausting options
        }
        else {
            return this.test_allowed_values(allowed_values);
        }
    }
}


const worker = new SudokuWorker();
self.onmessage = (ev: MessageEvent) => {
    worker.onmessage_handler(ev);
};