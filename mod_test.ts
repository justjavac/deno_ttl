import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import TTL from "./mod.ts";

Deno.test("ttl set", () => {
  return new Promise((resolve) => {
    const ttl = new TTL<string>(0);

    ttl.addEventListener("del", (evt) => {
      assertEquals(evt.key, "foo");
      assertEquals(evt.val, "bar");
      resolve();
    });

    assertEquals(ttl.size, 0);
    ttl.set("foo", "bar");
    assertEquals(ttl.size, 1);
    assertEquals(ttl.get("foo"), "bar");
    assertEquals(ttl.get("hello"), undefined);
  });
});

Deno.test("ttl del", () => {
  return new Promise((resolve) => {
    const ttl = new TTL<string>(10);

    ttl.addEventListener("del", (evt) => {
      assertEquals(evt.key, "foo");
      assertEquals(evt.val, "bar");
      resolve();
    });

    assertEquals(ttl.size, 0);
    ttl.set("foo", "bar");
    assertEquals(ttl.size, 1);
    ttl.del("foo");
    assertEquals(ttl.size, 0);
    assertEquals(ttl.get("foo"), undefined);
  });
});
