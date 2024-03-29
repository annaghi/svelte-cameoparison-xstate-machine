<script>
    import Card from './Card.svelte';
    import CardSkeleton from './CardSkeleton.svelte';
    import Feedback from './Feedback.svelte';

    import { fly, crossfade } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';

    import { service } from '../service.js';

    $: ({ currentRound, results, currentResult } = $service.context);
    $: [a, b] = currentRound;

    const [sendFade, receiveFade] = crossfade({
        easing: cubicOut,
        duration: 300
    });
</script>

{#if !$service.matches('game.feedback')}
    <header>
        <p>Tap on the more monetisable celebrity's face, or tap 'same price' if society values them equally.</p>
    </header>
{/if}

<div class="game-container">
    {#if $service.matches('game.question') || $service.matches('game.answer') || $service.matches('game.next')}
        <div in:fly={{ duration: 300, y: 20 }} out:fly={{ duration: 300, y: -20 }} class="game">
            <div class="card-container">
                <Card
                    celeb={a}
                    showprice={$service.matches('game.answer')}
                    winner={a.price >= b.price}
                    on:select={() => service.send({ type: 'ATTEMPT', a, b, sign: 1 })}
                />
            </div>

            <div>
                <button class="same" on:click={() => service.send({ type: 'ATTEMPT', a, b, sign: 0 })}
                    >same price</button
                >
            </div>

            <div class="card-container">
                <Card
                    celeb={b}
                    showprice={$service.matches('game.answer')}
                    winner={b.price >= a.price}
                    on:select={() => service.send({ type: 'ATTEMPT', a, b, sign: -1 })}
                />
            </div>
        </div>

        {#if $service.matches('game.answer')}
            <img
                in:fly={{ duration: 200, y: -100 }}
                out:sendFade={{ key: currentResult }}
                class="giant-result"
                alt="{currentResult} answer"
                src="/icons/{currentResult}.svg"
            />
        {/if}
    {:else if $service.matches('game.feedback')}
        <Feedback />
    {:else}
        <div class="game">
            <div class="card-container">
                <CardSkeleton />
            </div>

            <div>
                <button class="same" disabled />
            </div>

            <div class="card-container">
                <CardSkeleton />
            </div>
        </div>
    {/if}
</div>

<div class="results" style="grid-template-columns: repeat({results.length}, 1fr)">
    {#each results as result}
        <span class="result">
            {#if result}
                <img in:receiveFade={{ key: result }} alt="{result} answer" src="/icons/{result}.svg" />
            {/if}
        </span>
    {/each}
</div>

<style>
    .game-container {
        flex: 1;
    }
    .game {
        display: grid;
        grid-template-rows: 1fr 2em 1fr;
        grid-gap: 0.5em;
        width: 100%;
        height: 100%;
        max-width: min(100%, 40vh);
        margin: 0 auto;
    }
    .game > div {
        display: flex;
        align-items: center;
    }
    .same {
        width: 100%;
        align-items: center;
        margin: 0;
    }

    .same:disabled {
        background-color: #888;
    }

    .game .card-container button {
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
    }
    .giant-result {
        position: fixed;
        width: 50vmin;
        height: 50vmin;
        left: calc(50vw - 25vmin);
        top: calc(50vh - 25vmin);
        opacity: 0.5;
    }
    .results {
        display: grid;
        grid-gap: 0.2em;
        width: 100%;
        max-width: 320px;
        margin: auto auto 0 auto;
    }
    .result {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        padding: 0 0 100% 0;
        transition: background 0.2s;
        transition-delay: 0.2s;
    }
    .result img {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
    }

    @media (min-width: 640px) {
        .game {
            max-width: 100%;
            grid-template-rows: none;
            grid-template-columns: 1fr 8em 1fr;
            /* work around apparent safari flex bug */
            max-height: calc(100vh - 6em);
        }
        .same {
            height: 8em;
        }
    }
</style>
