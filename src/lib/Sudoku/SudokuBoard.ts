import { BufferedMatrix } from "./BufferedMatrix";

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
        return (value > 0 && value < 10) &&
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

    public GetPossibleValues(x: number, y: number): number[] {
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
