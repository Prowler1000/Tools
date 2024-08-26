<script lang="ts">
    interface Props {
        column_values: number[],
        initial_values: number[],
        input_callback: (row: number, column: number, new_value: string) => void,
        row: number,
    }
    const {
        column_values,
        initial_values,
        input_callback,
        row
    }: Props = $props();

    let is_top_row = $derived(row === 0);
    let is_bottom_row = $derived(row === 8);
    let thick_top = (index: number): boolean => {
        return is_top_row;
    };
    let thick_right = (index: number): boolean => {
        return ((index + 1) % 3 === 0) //|| index === 8;
    }
    let thick_bottom = (index: number): boolean => {
        return ((row + 1) % 3 === 0) || is_bottom_row;
    }
    let thick_left = (index: number): boolean => {
        return index === 0;
    }

    function oninput(e: Event & {currentTarget: EventTarget & HTMLInputElement;}, index: number) {
        e.currentTarget.value = e.currentTarget.value.replaceAll(/\D*/g, "");
        input_callback(row, index, e.currentTarget.value);
    }
</script>

<div class="content">
    <div class="row-ctr">    
        {#each column_values as value, index}
            <div class={
                `cell
                ${thick_top(index) ? 'thick-top' : ''}
                ${thick_right(index) ? 'thick-right' : ''}  
                ${thick_bottom(index) ? 'thick-bottom' : ''}
                ${thick_left(index) ? 'thick-left' : '' }
                ${initial_values[index] > 0 ? 'initial-value' : ''}`}>
                <input type="numeric" value={column_values[index] > 0 ? column_values[index] : ''} oninput={(e) => oninput(e, index)}/>
            </div>
        {/each}
    </div>
</div>

<style>
    .row-ctr {
        display: flex;
    }
    .cell {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: 1px solid black;
    }
    .cell input {
        width: 50%;
        text-align: center;
    }
    .thick-top {
        border-top: 3px solid black;
    }
    .thick-right {
        border-right: 3px solid black;
    }
    .thick-bottom {
        border-bottom: 3px solid black;
    }
    .thick-left {
        border-left: 3px solid black;
    }
    .initial-value {
        background-color: green;
    }
</style>