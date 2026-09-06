import assert from "node:assert/strict";
import test from "node:test";
import { formatUaePhoneForFirebase } from "../client/src/lib/phone";

test("formats common UAE phone-number forms for Firebase", () => {
  assert.equal(formatUaePhoneForFirebase("050 123 4567"), "+971501234567");
  assert.equal(formatUaePhoneForFirebase("50 123 4567"), "+971501234567");
  assert.equal(formatUaePhoneForFirebase("+971 50 123 4567"), "+971501234567");
  assert.equal(formatUaePhoneForFirebase("00971 50 123 4567"), "+971501234567");
});