<script>
    import { send } from '../useMachine.js';
</script>

<div class="error">
    <p class="message">Server or network error</p>
    <button on:click={() => send('retry')}>Try again</button>
</div>

<style>
    .error {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .message {
        color: red;
    }
    button {
        align-self: center;
    }
</style>
