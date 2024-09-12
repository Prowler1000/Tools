import SudokuWorker from "./SudokuWorker?worker";
import { SudokuBoard } from "./SudokuBoard";
import { BufferedMatrix } from "./BufferedMatrix";
//import { assert } from "vitest";

export enum SudokuWorkerMsgType {
    INIT,
    SOLVE,
    RESET,
    SOLVED,
    UNSOLVABLE,
}

export interface SudokuWorkerMessage {
    type: SudokuWorkerMsgType,
    data: unknown
}

export class FlagsManager {
    private static ArrayType = Uint32Array.prototype; // Honestly just so I can change things a bit easier later if need be

    private FlagArray: typeof FlagsManager.ArrayType;

    private RUN_FLAG = 0x80;
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

    public get RUN(): boolean {
        return this.GetFlag(this.RUN_FLAG);
    }

    public set RUN(value: boolean) {
        this.SetFlag(this.RUN_FLAG, value);
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

    public constructor(callback?: (ev: MessageEvent) => void) {
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
        this.worker.onmessage = callback ?? null;
    }

    public SendMessage(message: SudokuWorkerMessage): void
    public SendMessage(type: SudokuWorkerMsgType, data?: unknown): void
    public SendMessage(messageOrType: SudokuWorkerMessage | SudokuWorkerMsgType, data?: unknown) {
        if (typeof messageOrType === 'object') {
            this.worker.postMessage(messageOrType);
        } 
        else {
            this.worker.postMessage({
                type: messageOrType,
                data: data,
            });
        }
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
    }

    public GetGrid(): number[][] {
        return this.Board.GetGrid();
    }

    public Start() {
        this.SendMessage(SudokuWorkerMsgType.RESET);
        this.Flags.RUN = true;
        this.SendMessage(SudokuWorkerMsgType.SOLVE);
    }

    public Pause() {
        this.Flags.RUN = false;
    }

    public Toggle() {
        if (!this.Flags.RUN) {
            this.Start();
        }
        else {
            this.Pause();
        }
    }

    public IsSolving() {
        return this.Flags.RUN && !this.Flags.HALT;
    }
}