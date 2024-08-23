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
            <a href="/servers">Servers</a>
        </nav>
    </div>
    <div class="content">
        {#if children}
            {@render children()}
        {/if}
    </div>
</div>

<style>
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
    }
    .page-ctr {
    }

    :root {
        --select-color: #276cc7;
    }
</style>