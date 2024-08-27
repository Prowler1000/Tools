
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

export function* GridIterator(size_x: number, size_y: number) {
    for (let y = 0; y < size_y; y++)
        for (let x = 0; x < size_x; x++)
            yield [x, y]
}