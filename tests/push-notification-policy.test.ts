import assert from "node:assert/strict";
import test from "node:test";
import {
  deduplicateDeviceTokens,
  shouldNotifyAdminsForListingEdit,
} from "../server/pushNotificationPolicy";

test("sends one push per distinct physical device token", () => {
  const tokens = deduplicateDeviceTokens([
    { id: 1, fcmToken: "same-token" },
    { id: 2, fcmToken: "same-token" },
    { id: 3, fcmToken: "other-token" },
  ]);

  assert.equal(tokens.length, 2);
  assert.deepEqual(tokens.map(token => token.fcmToken).sort(), ["other-token", "same-token"]);
});

test("does not alert admins when an already-pending listing is edited", () => {
  assert.equal(shouldNotifyAdminsForListingEdit("pending"), false);
});

test("alerts admins when a reviewed listing is resubmitted", () => {
  assert.equal(shouldNotifyAdminsForListingEdit("approved"), true);
  assert.equal(shouldNotifyAdminsForListingEdit("rejected"), true);
});