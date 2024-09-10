import { BufferedMatrix, GridIterator } from "./BufferedMatrix";

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

    public IsValidCell(x: number, y: number, value: number = this.GetValue(x, y), allow_empty: boolean = false): boolean {
        const row = this.GetRow(y).filter(v => v === value);
        const column = this.GetColumn(x).filter(v => v === value);
        const square = this.GetSquare(x, y).flat().filter(v => v === value);
        const is_empty = value === 0;
        const duplicate_in_row = row.length > 1;
        const duplicate_in_column = column.length > 1;
        const duplicate_in_square = square.length > 1;
        const within_bounds = value > 0 && value < 10
        return (is_empty && allow_empty) || (
            within_bounds &&
            !duplicate_in_row &&
            !duplicate_in_column &&
            !duplicate_in_square
        );
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

    public GetAllPossibles(): number[][][] {
        const values: number[][][] = [];
        for (let y = 0; y < 9; y++) {
            values.push([])
            for (let x = 0; x < 9; x++) {
                values[y].push(this.GetPossibleValues(x, y, false))
            }
        }
        return values;
    }

    public GetKnowns(): {[key: number]: { [key: number]: number}} {
        const knowns: {[key: number]: { [key: number]: number}} = {};
        for (const [x, y] of GridIterator(9, 9)) {
            const valid_values = this.GetPossibleValues(x, y, false);
            if (valid_values.length === 1) {
                if (!(y in knowns))
                    knowns[y] = {};
                knowns[y][x] = valid_values[0];
            }
        }
        return knowns;
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

    public GetPossibleValues(x: number, y: number, ignore_existing_value=false): number[] {
        if (!ignore_existing_value && this.GetValue(x, y) !== 0) {
            return []
        }
        const existing_values: number[] = [
            ...this.GetRow(y),
            ...this.GetColumn(x),
            ...this.GetSquare(x, y).flat(),
        ];
        const allowed_values: number[] = []
        for (let i = 0; i < 10; i++) {
            if (!existing_values.includes(i)) {
                allowed_values.push(i);
            }
        }
        return allowed_values;
    }
}
