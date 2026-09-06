import assert from "node:assert/strict";
import test from "node:test";
import { getPushNotificationPath } from "../client/src/lib/pushNavigation";

test("routes new-listing notifications to the admin review page", () => {
  assert.equal(getPushNotificationPath({ type: "new_listing" }), "/admin");
});

test("uses an explicit safe notification destination", () => {
  assert.equal(
    getPushNotificationPath({ type: "new_listing", path: "/admin?tab=pending" }),
    "/admin?tab=pending",
  );
});

test("rejects external notification destinations", () => {
  assert.equal(
    getPushNotificationPath({ type: "unknown", path: "//malicious.example" }),
    null,
  );
});

test("routes seller listing updates to My Listings", () => {
  assert.equal(getPushNotificationPath({ type: "listing_approved" }), "/my-listings");
  assert.equal(getPushNotificationPath({ type: "listing_rejected" }), "/my-listings");
});