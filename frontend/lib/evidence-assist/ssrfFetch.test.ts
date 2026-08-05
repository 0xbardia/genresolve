/**
 * Unit tests for SSRF helpers (node:test).
 * Run: npx tsx --test lib/evidence-assist/ssrfFetch.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPrivateOrReservedIp,
  parseAndValidateUrlString,
  SafeFetchError,
} from "./ssrfFetch";

describe("isPrivateOrReservedIp", () => {
  it("flags RFC1918 and loopback", () => {
    assert.equal(isPrivateOrReservedIp("10.0.0.1"), true);
    assert.equal(isPrivateOrReservedIp("192.168.1.1"), true);
    assert.equal(isPrivateOrReservedIp("172.16.0.1"), true);
    assert.equal(isPrivateOrReservedIp("127.0.0.1"), true);
    assert.equal(isPrivateOrReservedIp("0.0.0.0"), true);
  });

  it("flags link-local / metadata-ish ranges", () => {
    assert.equal(isPrivateOrReservedIp("169.254.169.254"), true);
  });

  it("allows public IPv4", () => {
    assert.equal(isPrivateOrReservedIp("8.8.8.8"), false);
    assert.equal(isPrivateOrReservedIp("1.1.1.1"), false);
  });

  it("flags IPv6 loopback and ULA", () => {
    assert.equal(isPrivateOrReservedIp("::1"), true);
    assert.equal(isPrivateOrReservedIp("fc00::1"), true);
    assert.equal(isPrivateOrReservedIp("fe80::1"), true);
  });
});

describe("parseAndValidateUrlString", () => {
  it("accepts https URLs", () => {
    const u = parseAndValidateUrlString("https://example.com/path");
    assert.equal(u.hostname, "example.com");
  });

  it("rejects credentials", () => {
    assert.throws(
      () => parseAndValidateUrlString("https://user:pass@example.com/"),
      (e: unknown) => e instanceof SafeFetchError && e.code === "credentials"
    );
  });

  it("rejects file and data schemes", () => {
    assert.throws(
      () => parseAndValidateUrlString("file:///etc/passwd"),
      SafeFetchError
    );
    assert.throws(
      () => parseAndValidateUrlString("data:text/html,hi"),
      SafeFetchError
    );
    assert.throws(
      () => parseAndValidateUrlString("javascript:alert(1)"),
      SafeFetchError
    );
  });

  it("rejects localhost", () => {
    assert.throws(
      () => parseAndValidateUrlString("http://localhost/admin"),
      (e: unknown) => e instanceof SafeFetchError && e.code === "private_ip"
    );
  });
});
