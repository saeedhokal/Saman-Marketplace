import assert from "node:assert/strict";
import test from "node:test";
import { AUTOMOTIVE_SUBCATEGORIES, CAR_MODELS } from "../shared/schema";

test("powersports vehicle types are available for automotive listings", () => {
  for (const category of ["Motorcycles", "ATV", "UTV"]) {
    assert.ok(AUTOMOTIVE_SUBCATEGORIES.includes(category as any));
    assert.ok(CAR_MODELS[category]?.length > 0);
  }
});

test("motorcycle choices include Sharmax and Yamaha models", () => {
  assert.ok(CAR_MODELS.Motorcycles.some((model) => model.startsWith("Sharmax ")));
  assert.ok(CAR_MODELS.Motorcycles.some((model) => model.startsWith("Yamaha ")));
});

test("ATV and UTV choices include Can-Am, Yamaha, and Sharmax", () => {
  for (const category of ["ATV", "UTV"]) {
    const models = CAR_MODELS[category];
    assert.ok(models.some((model) => model.startsWith("Can-Am ")));
    assert.ok(models.some((model) => model.startsWith("Yamaha ")));
    assert.ok(models.some((model) => model.startsWith("Sharmax ")));
    assert.equal(new Set(models).size, models.length);
  }
});