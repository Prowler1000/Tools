<script lang="ts">
    interface Props {
        children: any,
    }
    const {
        children
    }: Props = $props();
</script>

<div class="page-ctr">
    <div class="nav-ctr">
        <nav>
            <a href="/">Home</a>
            <a href="/sudoku/solver">Sudoku Solver</a>
            <a href="/planetary_gear_calc">Planetary Gear Calculator</a>
        </nav>
    </div>
    <div class="content">
        {#if children}
            {@render children()}
        {/if}
    </div>
</div>

<style>
    .page-ctr {
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    .nav-ctr {
        width: 100%;
        text-align: center;
        font-size: 2em;
        background: rgb(121, 121, 121);
        padding: 10px 0;
    }
    nav a {
        margin-left: 10px;
        margin-right: 10px;
        text-decoration: none;
    }
    .content {
        flex-grow: 1;
    }
    :root {
        --select-color: #276cc7;
    }
</style>