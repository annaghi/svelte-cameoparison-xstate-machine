<script>
    import { onMount } from 'svelte';

    import { load_image } from './utils.js';

    import Welcome from './screens/Welcome.svelte';
    import Game from './screens/Game.svelte';
    import Error from './screens/Error.svelte';

    import { state, send } from './useMachine.js';

    onMount(() => {
        send('loadCelebs');
        load_image('/icons/right.svg');
        load_image('/icons/wrong.svg');
    });
</script>

<main>
    {#if $state.matches('welcome') && !$state.matches('welcome.error')}
        <Welcome />
    {:else if $state.matches('game')}
        <Game />
    {:else if $state.matches('welcome.error')}
        <Error />
    {/if}
</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        max-width: 800px;
        margin: 0 auto;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
    }
</style>
