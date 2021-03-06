import { assign, createMachine, send } from 'xstate';

import { ROUNDS_PER_GAME } from './constants.js';
import { select } from './select.js';
import { loadImage } from './utils.js';

const loadCelebs = async () => {
    const res = await fetch('https://cameo-explorer.netlify.app/celebs.json');
    const data = await res.json();

    const lookup = new Map();
    data.forEach((c) => {
        lookup.set(c.id, c);
    });

    const subset = new Set();
    data.forEach((celeb) => {
        if (celeb.reviews >= 50) {
            subset.add(celeb);
            celeb.similar.forEach((id) => {
                subset.add(lookup.get(id));
            });
        }
    });

    return {
        celebs: Array.from(subset),
        lookup
    };
};

const loadRounds = async (selection) =>
    selection.map((round) => Promise.all([loadCelebDetails(round.a), loadCelebDetails(round.b)]));

const loadCelebDetails = async (celeb) => {
    const res = await fetch(`https://cameo-explorer.netlify.app/celebs/${celeb.id}.json`);
    const details = await res.json();
    await loadImage(details.image);
    return details;
};

const initialGameContext = {
    rounds: [],
    currentRound: [],
    currentRoundIndex: 0,
    results: Array(ROUNDS_PER_GAME),
    currentResult: undefined
};

export const machine = createMachine({
    id: 'app',
    context: {
        celebs: [],
        lookup: undefined,
        category: undefined,
        ...initialGameContext
    },

    initial: 'welcome',
    states: {
        welcome: {
            initial: 'loadingCelebs',
            states: {
                loadingCelebs: {
                    invoke: {
                        src: (context, event) => loadCelebs(),
                        onDone: {
                            target: 'categories',
                            actions: assign({
                                celebs: (context, event) => event.data.celebs,
                                lookup: (context, event) => event.data.lookup
                            })
                        },
                        onError: { target: 'failure' }
                    }
                },
                categories: {
                    on: {
                        SELECT_CATEGORY: {
                            actions: [assign({ category: (context, event) => event.category }), send({ type: 'PLAY' })]
                        }
                    }
                },
                failure: {
                    on: {
                        RETRY: { target: 'loadingCelebs' }
                    }
                }
            }
        },

        game: {
            initial: 'loadingRounds',
            states: {
                loadingRounds: {
                    entry: assign(initialGameContext),
                    invoke: {
                        src: (context, event) =>
                            loadRounds(select(context.celebs, context.lookup, context.category.slug, ROUNDS_PER_GAME)),
                        onDone: {
                            target: 'loadingRound',
                            actions: assign({ rounds: (context, event) => event.data })
                        }
                    }
                },
                loadingRound: {
                    invoke: {
                        src: (context, event) => context.rounds[context.currentRoundIndex].then((round) => round),
                        onDone: {
                            target: 'question',
                            actions: assign({ currentRound: (context, event) => event.data })
                        },
                        onError: { target: 'healingRounds' }
                    }
                },
                healingRounds: {
                    invoke: {
                        src: (context, event) =>
                            loadRounds(select(context.celebs, context.lookup, context.category.slug, 1)),
                        onDone: {
                            target: 'loadingRound',
                            actions: assign({
                                rounds: (context, event) => [
                                    ...context.rounds.slice(0, context.currentRoundIndex),
                                    event.data[0],
                                    ...context.rounds.slice(context.currentRoundIndex + 1)
                                ]
                            })
                        }
                    }
                },
                question: {
                    on: {
                        ATTEMPT: {
                            target: 'answer',
                            actions: assign({
                                currentResult: (context, event) =>
                                    Math.sign(event.a.price - event.b.price) === event.sign ? 'right' : 'wrong'
                            })
                        }
                    }
                },
                answer: {
                    after: {
                        1500: {
                            target: 'next',
                            actions: assign({
                                results: (context, event) => [
                                    ...context.results.slice(0, context.currentRoundIndex),
                                    context.currentResult,
                                    ...context.results.slice(context.currentRoundIndex + 1)
                                ]
                            })
                        }
                    }
                },
                next: {
                    after: {
                        500: [
                            {
                                cond: (context, event) => context.currentRoundIndex < ROUNDS_PER_GAME - 1,
                                target: 'loadingRound',
                                actions: assign({
                                    currentRoundIndex: (context, event) => context.currentRoundIndex + 1
                                })
                            },
                            {
                                target: 'feedback'
                            }
                        ]
                    }
                },
                feedback: {
                    on: {
                        RESTART: {
                            actions: send('GREET')
                        }
                    }
                }
            }
        }
    },

    on: {
        GREET: 'welcome.categories',
        PLAY: 'game'
    }
});
