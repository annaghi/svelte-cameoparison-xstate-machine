import { useMachine } from '@xstate/svelte';
import { machine } from './machine.js';

export const { state, send, service } = useMachine(machine, { devTools: true });

// service.onTransition((state) => console.log(state));
