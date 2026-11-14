export type Handler<P> = (payload: P) => void;

export interface SubscribeOptions {
  /** Unsubscribes automatically when aborted. */
  readonly signal?: AbortSignal;
  /**
   * Also receive a sticky event that fired before anyone was listening (once; it is consumed).
   * Lets a click on server-rendered markup reach an island that has not hydrated yet.
   */
  readonly replay?: boolean;
}

export interface BusOptions<M> {
  /** Events retained (latest payload only) while they have no subscriber. */
  readonly sticky?: ReadonlyArray<keyof M & string>;
}

/** Minimal typed pub/sub. `M` maps event name -> payload type. */
export interface Bus<M extends object> {
  on<K extends keyof M & string>(type: K, handler: Handler<M[K]>, options?: SubscribeOptions): () => void;
  emit<K extends keyof M & string>(type: K, payload: M[K]): void;
}

export function createBus<M extends object>(options: BusOptions<M> = {}): Bus<M> {
  const registry = new Map<string, Set<Handler<never>>>();
  const sticky = new Set<string>(options.sticky ?? []);
  const pending = new Map<string, unknown>();

  const call = (type: string, handler: Handler<never>, payload: unknown): void => {
    try {
      (handler as Handler<unknown>)(payload);
    } catch (error) {
      // One faulty subscriber must never break the others.
      console.error(`[bus] handler for "${type}" threw`, error);
    }
  };

  return {
    on(type, handler, subscribeOptions) {
      if (subscribeOptions?.signal?.aborted) return () => undefined;

      let set = registry.get(type);
      if (!set) {
        set = new Set();
        registry.set(type, set);
      }
      const stored = handler as Handler<never>;
      set.add(stored);

      if (subscribeOptions?.replay && pending.has(type)) {
        const payload = pending.get(type);
        pending.delete(type);
        // Async so the subscriber finishes its own setup first.
        queueMicrotask(() => call(type, stored, payload));
      }

      const off = (): void => {
        set.delete(stored);
      };
      subscribeOptions?.signal?.addEventListener('abort', off, { once: true });
      return off;
    },

    emit(type, payload) {
      const set = registry.get(type);
      if (!set || set.size === 0) {
        if (sticky.has(type)) pending.set(type, payload);
        return;
      }
      // Copy: a handler may unsubscribe while we iterate.
      for (const handler of Array.from(set)) call(type, handler, payload);
    },
  };
}
