interface Item<T> {
  val: T;
  expire: number;
  timeout: number;
}

export default class TTL<T> extends EventTarget {
  #store: Map<string, Item<T>>;
  #ttl: number;
  #capacity: number;

  #eventTarge: EventTarget;

  constructor(ttl: number = 10_000) {
    super();
    this.#ttl = ttl;
    this.#store = new Map();
    this.#capacity = Number.MAX_SAFE_INTEGER;
    this.#eventTarge = new EventTarget();
  }

  get(key: string) {
    if (!this.#store.has(key)) {
      this.dispatchEvent(new TTLEvent("miss", { key }));
      return undefined;
    }

    const { val, expire } = this.#store.get(key)!;

    if (expire <= Date.now()) {
      this.del(key);
      this.dispatchEvent(new TTLEvent("miss", { key }));
      return undefined;
    }

    this.dispatchEvent(
      new TTLEvent("hit", { key, val, expire }),
    );

    return val;
  }

  has(key: string) {
    return this.#store.has(key);
  }

  /** Sets a key value pair. It is possible to define a ttl (in seconds). */
  set(key: string, val: T, ttl = this.#ttl): void {
    if (val === undefined) return;

    if (!this.#store.has(key) && this.size >= this.#capacity) {
      this.dispatchEvent(
        new TTLEvent("drop", { key, val }),
      );
      return;
    }

    this.del(key);

    const expire = Date.now() + ttl;
    this.#store.set(key, {
      val,
      expire: expire,
      timeout: setTimeout(() => {
        this.dispatchEvent(new TTLEvent("expired", { key, val }));
        this.del(key);
      }, ttl),
    });

    this.dispatchEvent(new TTLEvent("set", { key, val, expire }));
  }

  /** set multiple cached keys at once. */
  mset(arr: [key: string, val: T, ttl?: number][]) {
    arr.forEach((x) => this.set(...x));
  }

  del(key: string): T | undefined {
    if (!this.#store.has(key)) {
      return;
    }

    const { val, timeout, expire } = this.#store.get(key)!;

    clearTimeout(timeout);
    this.#store.delete(key);
    this.dispatchEvent(
      new TTLEvent("del", { key, val, expire }),
    );

    return val;
  }

  clear() {
    for (const key of this.#store.keys()) {
      this.del(key);
    }
  }

  get size() {
    return this.#store.size;
  }

  setCapacity(capacity: string) {
    if (typeof capacity === "number" && capacity >= 0) {
      this.#capacity = capacity;
    }
  }

  // @ts-ignore: 2416 Why? https://github.com/microsoft/TypeScript/issues/28357
  addEventListener(
    type: EventType,
    listener: (evt: TTLEvent<T>) => void | Promise<void>,
    options?: boolean | AddEventListenerOptions,
  ): void {
    this.#eventTarge.addEventListener(
      type,
      ((evt: TTLEvent<T>) => {
        const ttlEvent = new TTLEvent<T>(type, evt);
        listener(ttlEvent);
      }) as EventListener,
      options,
    );
  }

  dispatchEvent(event: TTLEvent<T>): boolean {
    return this.#eventTarge.dispatchEvent(event);
  }

  // @ts-ignore: 2416 Why? https://github.com/microsoft/TypeScript/issues/28357
  removeEventListener(
    type: EventType,
    callback: (evt: TTLEvent<T>) => void | Promise<void>,
    options?: EventListenerOptions | boolean,
  ): void {
    this.#eventTarge.removeEventListener(
      type,
      callback as EventListener,
      options,
    );
  }

  *[Symbol.iterator]() {
    for (const [key, { val }] of this.#store.entries()) {
      yield { key, val };
    }
  }

  get [Symbol.toStringTag]() {
    return "TTL";
  }

  [Symbol.for("Deno.customInspect")](inspect: typeof Deno.inspect): string {
    const inspectArr = Array
      .from(this.#store.entries())
      .map(([key, { val, expire }]) => ({
        key,
        val,
        expire: new Date(expire),
      }));
    return `TTL ${inspect(inspectArr)}`;
  }
}

interface TTLEventHandlersEventMap<T> {
  /** The key was found in TTL cache. */
  "hit": TTLEvent<T>;
  /** The key was not found in TTL cache. */
  "miss": TTLEvent<T>;
  /** The key was expired. */
  "expired": TTLEvent<T>;
  "drop": TTLEvent<T>;
  "set": TTLEvent<T>;
  "del": TTLEvent<T>;
}

type EventType = keyof TTLEventHandlersEventMap<unknown>;

export interface TTLEventInit<T> extends EventInit {
  key: string;
  val?: T;
  expire?: number;
}

class TTLEvent<T> extends Event {
  readonly key: string = "";
  readonly val?: T;
  readonly expire?: number;

  constructor(type: EventType, eventInitDict: TTLEventInit<T>) {
    super(type, eventInitDict);
    this.key = eventInitDict.key;
    this.val = eventInitDict.val;
    this.expire = eventInitDict.expire;
  }
}
