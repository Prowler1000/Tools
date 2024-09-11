<script lang="ts">
    import { SudokuManager } from "$lib/Sudoku/SudokuManager"
	import { CloneArray } from "$lib/util";
	import SudokuRow from "$lib/SudokuRow.svelte";
    import { onMount } from "svelte";
	import { GridIterator } from "$lib/Sudoku/BufferedMatrix";

    const test_grid2 = [
        [8, 4, 0, 0, 7, 0, 0, 0, 1],
        [0, 0, 7, 9, 0, 0, 0, 6, 0],
        [0, 9, 3, 0, 6, 0, 2, 0, 0],
        [6, 0, 0, 5, 0, 0, 0, 0, 0],
        [7, 0, 0, 6, 0, 3, 0, 0, 4],
        [0, 0, 0, 0, 0, 7, 0, 0, 9],
        [0, 0, 4, 0, 5, 0, 1, 8, 0],
        [0, 6, 0, 0, 0, 1, 9, 0, 0],
        [9, 0, 0, 0, 2, 0, 0, 3, 5],
    ]

    const test_grid = [
        [0, 0, 0, 2, 6, 0, 7, 0, 1],
        [6, 8, 0, 0, 7, 0, 0, 9, 0],
        [1, 9, 0, 0, 0, 4, 5, 0, 0],
        [8, 2, 0, 1, 0, 0, 0, 4, 0],
        [0, 0, 4, 6, 0, 2, 9, 0, 0],
        [0, 5, 0, 0, 0, 3, 0, 2, 8],
        [0, 0, 9, 3, 0, 0, 0, 7, 4],
        [0, 4, 0, 0, 5, 0, 0, 3, 6],
        [7, 0, 3, 0, 1, 8, 0, 0, 0],
    ]

    let user_grid = $state(Array.from({ length: 9}, () => [] as number[]));
    let solver_grid = $state(Array.from({ length: 9}, () => [] as number[]));
    let knowns = $state({} as {[key: number]: { [key: number]: number}});
    let possible_values = $state([] as number[][][]);
    let valid_cells = $state(Array.from({ length: 9}, () => [] as boolean[]));

    let working = $state(false);
    let is_valid = $state(true);

    let manager: SudokuManager

    onMount(async () => {
        manager = new SudokuManager();
        manager.Empty();
        manager.SetGrid(test_grid)
        //user_grid = manager.GetGrid();
        check_cell_validity();
        setInterval(() => {
            solver_grid = manager.GetGrid();
            knowns = manager.SudokuBoard.GetKnowns();
            working = manager.IsSolving();
            possible_values = manager.SudokuBoard.GetAllPossibles();
        }, 10);
    })

    function check_cell_validity() {
        for (const [x, y] of GridIterator(9, 9)) {
            valid_cells[y][x] = manager.SudokuBoard.IsValidCell(x, y, undefined, true);
        }
    }

    function input_callback(r: number, c: number, val: string) {
        user_grid[r][c] = Number(val);
        manager.SetValue(c, r, Number(val));
        is_valid = manager.SudokuBoard.IsValidBoard();
        const valid_cell = manager.SudokuBoard.IsValidCell(c, r, undefined, true);
        // If the cell is coming up as invalid, or the cell was previously found to be invalid
        if (!valid_cell || !valid_cells[r][c]) {
            check_cell_validity();
        }
    }

    async function solve() {
        if (!working) {
            manager.SetGrid(user_grid);
        }
        manager.Toggle();
    }
</script>

<div class="content">
    <div class="sudoku-grid">
        <div class="grid-ctr">
            {#each user_grid as row, i}
                <SudokuRow column_values={user_grid[i]} row={i} valid_cells={valid_cells[i]} input_callback={input_callback} possible_values={possible_values[i]} show_dead_cells={false}></SudokuRow>
            {/each}
        </div>
        <div class="grid-ctr">
            {#each solver_grid as row, i}
                <SudokuRow column_values={solver_grid[i]} known_values={knowns[i]} row={i} possible_values={possible_values[i]}></SudokuRow>
            {/each}
        </div>
    </div>
    <div class="btn-ctr">        
        <button onclick={solve}>{working ? 'Pause' : 'Solve'}</button>
    </div>
    <div class="btn-ctr">Valid Grid: {is_valid}</div>
</div>

<style>
    .content {
        display: flex;
        flex-direction: column;
    }
    .sudoku-grid {
        margin: auto;
        margin-top: 10px;
        display: flex;
    }
    .grid-ctr {
        margin: 10px;
    }
    .btn-ctr {
        margin: auto;
        margin-top: 40px;
    }
    .btn-ctr button {
        padding: 10px;
        font-size: larger;
    }
</style>