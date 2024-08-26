<script lang="ts">
    import { SudokuManager } from "$lib/Sudoku/SudokuManager"
	import { CloneArray } from "$lib/util";
	import SudokuRow from "$lib/SudokuRow.svelte";
    import { onMount } from "svelte";

    let grid = $state([] as number[][]);
    let initial_grid = $state([] as number[][])
    let working = $state(false);
    let is_valid = $state(true);

    let manager: SudokuManager

    onMount(async () => {
        manager = new SudokuManager();
        manager.Empty();
        initial_grid = manager.GetGrid();
        setInterval(() => {
            grid = manager.GetGrid();
            working = manager.IsSolving();
        }, 10);
    })

    function input_callback(r: number, c: number, val: string) {
        manager.SetValue(c, r, Number(val));
        is_valid = manager.SudokuBoard.IsValidBoard();
    }

    async function solve() {
        if (!working) {
            manager.SetGrid(grid);
            initial_grid = grid;
        }
        manager.Toggle();
    }
</script>

<div class="content">
    <div class="sudoku-grid">
        {#each grid as row, i}
            <SudokuRow column_values={grid[i]} initial_values={initial_grid[i]} row={i} input_callback={input_callback}></SudokuRow>
        {/each}
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