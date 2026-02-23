// test/index.test.ts
import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { treaty } from "@elysiajs/eden";
import { app, App } from "../src";

const api = treaty(app);

describe("Elysia", () => {
  it("returns a response", async () => {
    const { data } = await api.photo.lists.get();
    expect(data).toBeObject();
  });

  it("post a new photo", async () => {
    const { data } = await api.photo.post({
      title: "Test Photo",
      src: "https://example.com/test-photo.jpg",
    });
    expect(data).toBeObject();
  });
});
