import SudokuWorker from "./SudokuWorker?worker";
//import { assert } from "vitest";

export enum SudokuWorkerMsgType {
    INIT,
    START_SOLVE,
    PAUSE_SOLVE,
    STOP_SOLVE,
}

export interface SudokuWorkerMessage {
    type: SudokuWorkerMsgType,
    data: unknown
}

export class SudokuBoard {
    private grid: BufferedMatrix;

    public constructor(grid: BufferedMatrix) {
        this.grid = grid;
    }

    public GetValue(x: number, y: number): number {
        return this.grid.GetValue(x, y);
    }

    public SetValue(x: number, y: number, value: number) {
        this.grid.SetValue(x, y, value);
    }

    public Get2DArray(): number[][] {
        return this.grid.AsMatrix();
    }

    public IsValidCell(x: number, y: number, value: number =  this.GetValue(x, y)): boolean {
        const row = this.GetRow(y).filter(v => v === value);
        const column = this.GetColumn(x).filter(v => v === value);
        const square = this.GetSquare(x, y).flat().filter(v => v === value);
        const duplicate_in_row = row.length > 1;
        const duplicate_in_column = column.length > 1;
        const duplicate_in_square = square.length > 1;
        return (value !== 0) &&
            !duplicate_in_row &&
            !duplicate_in_column &&
            !duplicate_in_square;
    }
    
    public IsValidBoard(allow_unfilled=true): boolean {
        let valid = true;
        for (let y = 0; y < 9 && valid; y++) {
            for (let x = 0; x < 9 && valid; x++) {
                valid = valid && ((allow_unfilled && this.GetValue(x, y) === 0) || this.IsValidCell(x, y));
            }
        }
        return valid;
    }

    public SetGrid(grid: number[][]) {
        this.grid.FromMatrix(grid);
    }

    public GetGrid(): number[][] {
        return this.grid.AsMatrix();
    }

    public GetRow(row: number): number[] {
        return this.grid.GetRow(row);
    }

    public GetColumn(column: number): number[] {
        return this.grid.GetColumn(column);
    }

    public GetSquare(x: number, y: number): number[][] {
        const row_offset = Math.trunc(y / 3) * 3;
        const column_offset = Math.trunc(x / 3) * 3;
        const square: number[][] = []
        for (let i = 0; i < 3; i++) {
            square.push([
                this.grid.GetValue(0 + column_offset, i + row_offset),
                this.grid.GetValue(1 + column_offset, i + row_offset),
                this.grid.GetValue(2 + column_offset, i + row_offset)
            ])
        }
        return square;
    }
}

export class FlagsManager {
    private static ArrayType = Uint32Array.prototype; // Honestly just so I can change things a bit easier later if need be

    private FlagArray: typeof FlagsManager.ArrayType;

    private PAUSE_FLAG = 0x80;
    private HALT_FLAG =  0x40;
    private NEW_DATA_FLAG = 0x20;

    public constructor(flag_array: typeof FlagsManager.ArrayType) {
        this.FlagArray = flag_array;
        
    }

    private GetFlag(flag: number, array_pos = 0): boolean {
        return (this.FlagArray[array_pos] & flag) > 0;
    }

    private SetFlag(flag: number, value: boolean, array_pos = 0) {
        if (value) {
            this.FlagArray[array_pos] = this.FlagArray[array_pos] | flag;
        }
        else {
            this.FlagArray[array_pos] = this.FlagArray[array_pos] & ~flag;
        }
    }

    public static get FLAG_COUNT(): number {
        return 3;
    }

    public static get NUM_BYTES(): number {
        return this.ArrayType.BYTES_PER_ELEMENT * this.FLAG_COUNT;
    }

    public get PAUSE(): boolean {
        return this.GetFlag(this.PAUSE_FLAG);
    }

    public set PAUSE(value: boolean) {
        this.SetFlag(this.PAUSE_FLAG, value);
    }

    public get HALT(): boolean {
        return this.GetFlag(this.HALT_FLAG);
    }

    public set HALT(value: boolean) {
        this.SetFlag(this.HALT_FLAG, value);
    }

    public get NEW_DATA(): boolean {
        return this.GetFlag(this.NEW_DATA_FLAG);
    }

    public set NEW_DATA(value: boolean) {
        this.SetFlag(this.NEW_DATA_FLAG, value);
    }
    
}

export class SudokuManager {
    private buffer: SharedArrayBuffer;

    private Flags: FlagsManager;
    private Matrix: BufferedMatrix;
    private Board: SudokuBoard;

    private worker: Worker;

    public constructor() {
        const flag_bytes = FlagsManager.NUM_BYTES;
        const grid_bytes = BufferedMatrix.CalculateBytes(9, 9);

        this.buffer = new SharedArrayBuffer(flag_bytes + grid_bytes + 1);
        this.Flags = new FlagsManager(new Uint32Array(this.buffer, 0, FlagsManager.FLAG_COUNT));
        this.Matrix = new BufferedMatrix(9, 9, new Uint32Array(this.buffer, flag_bytes, 81));
        this.Board = new SudokuBoard(this.Matrix);

        this.Pause();
        this.worker = new SudokuWorker();
        this.worker.postMessage({
            type: SudokuWorkerMsgType.INIT,
            data: this.buffer,
        });
    }

    public Empty() {
        this.Matrix.Fill(0);
    }

    public get SudokuBoard() {
        return this.Board;
    }

    public SetValue(x: number, y: number, value: number) {
        this.Board.SetValue(x, y, value);
    }

    public SetGrid(grid: number[][]): void {
        this.Board.SetGrid(grid);
        this.Flags.NEW_DATA = true;
    }

    public GetGrid(): number[][] {
        return this.Board.GetGrid();
    }

    public Start() {
        this.Flags.PAUSE = false;
    }

    public Pause() {
        this.Flags.PAUSE = true;
    }

    public Toggle() {
        this.Flags.PAUSE = !this.Flags.PAUSE;
    }

    public IsSolving() {
        return !(this.Flags.PAUSE || this.Flags.HALT);
    }
}

// Make this into a tensor?
export class BufferedMatrix {
    private static BufferType = Uint32Array.prototype;

    private buffer: typeof BufferedMatrix.BufferType;
    private size_x: number;
    private size_y: number;

    public constructor(size_x: number, size_y: number, buffer: typeof BufferedMatrix.BufferType) {
        this.size_x = size_x;
        this.size_y = size_y;
        this.buffer = buffer;
    }

    public Fill(value: number) {
        this.buffer.fill(value);
    }

    public static CalculateBytes(size_x: number, size_y: number) {
        return (size_x * size_y) * BufferedMatrix.BufferType.BYTES_PER_ELEMENT;
    }

    private CalculateIndex(x: number, y: number): number {
        //assert(x < this.size_x);
        //assert(y < this.size_y);
        return this.size_x * y + x
    }

    public GetValue(x: number, y: number): number {
        //assert(x < this.size_x);
        //assert(y < this.size_y);
        const index = this.CalculateIndex(x, y);
        return this.buffer[index];
    }

    public SetValue(x: number, y: number, value: number) {
        //assert(x < this.size_x);
        //assert(y < this.size_y);
        this.buffer[this.CalculateIndex(x, y)] = value;
    }

    public GetRow(row_index: number): number[] {
        //assert(row_index < this.size_y);
        return [...this.buffer.slice(this.CalculateIndex(0, row_index), this.CalculateIndex(this.size_x - 1, row_index) + 1)];
    }

    public GetColumn(column_index: number): number[] {
        //assert(column_index < this.size_x);
        const column = [];
        for (let i = 0; i < this.size_y; i++) {
            column.push(this.buffer[this.CalculateIndex(column_index, i)])
        }
        return column;
    }

    public AsMatrix(): number[][] {
        const matrix: number[][] = []
        for (let y = 0; y < this.size_y; y++) {
            const row: number[] = [];
            for (let x = 0; x < this.size_x; x++) {
                row.push(this.buffer[this.CalculateIndex(x, y)])
            }
            matrix.push(row);
        }
        return matrix;
    }

    public FromMatrix(matrix: number[][]) {
        //assert(matrix.length === this.size_y);
        //assert(matrix.every(x => x.length === this.size_x));
        let index = 0;
        for (const row of matrix) {
            for (const cell of row) {
                this.buffer[index] = cell;
                index++;
            }
        }
    }
}

