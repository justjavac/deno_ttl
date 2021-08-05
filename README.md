# deno_ttl

[![tag](https://img.shields.io/github/release/justjavac/deno_ttl)](https://github.com/justjavac/deno_ttl/releases)
[![ci](https://github.com/justjavac/deno_ttl/actions/workflows/ci.yml/badge.svg)](https://github.com/justjavac/deno_ttl/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/justjavac/deno_ttl)](https://github.com/justjavac/deno_ttl/blob/master/LICENSE)
[![](https://img.shields.io/badge/deno-v1.x-green.svg)](https://github.com/denoland/deno)

Simple in-memory TTL(Time To Live) cache for Deno.

## Usage

```ts
import TTL from "https://deno.land/x/ttl/mod.ts";

const ttl = new TTL<string>(10_000);

ttl.addEventListener("hit", (event) => {
  console.log("hit %s with value: %s", event.key, event.val);
});

ttl.set("foo", "bar");
ttl.set("ping", "pong", 20 * 1000);
ttl.set("user", "justjavac", 30 * 1000);

ttl.get("foo"); // > 'bar'
ttl.get("user"); // > 'justjavac'
ttl.get("ping"); // > 'pong'
ttl.get("lol"); // > undefined

// after 10 seconds
ttl.get("foo"); // > undefined
ttl.size; // > 2
ttl.del("ping"); // > 'pong'
ttl.get("ping"); // > undefined
ttl.size; // > 1
ttl.clear();
ttl.size; // > 0
```

## Events

Usage:

```ts
ttl.addEventListener("set", (event) => {
  // event.key, event.val, event.expire
});

function onhit(event: TTLEvent<string>) {
  // event.key, event.val, event.expire
}

ttl.addEventListener("hit", onhit);
ttl.removeEventListener("hit", onhit);
```

- `set` - The key has been added or changed.
- `del` - The key has been removed manually or due to expiry.
- `expired` - The key was expired.
- `hit` - The key was found in TTL cache.
- `miss` - The key was not found in TTL cache.
- `drop` - The key was not been added.

## License

[deno_ttl](https://github.com/justjavac/deno_ttl) is released under the MIT
License. See the bundled [LICENSE](./LICENSE) file for details.
