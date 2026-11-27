import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateGrossFromNet,
  calculateWageBreakdown,
} from "../src/lib/wage-calculator.ts";

test("recovers gross pay across primary tax brackets", () => {
  for (const [taxableIncome, targetNetPay] of [
    [100, 100],
    [250, 250],
    [350, 342],
    [450, 434],
    [600, 569],
  ]) {
    const result = calculateGrossFromNet({
      targetNetPay,
      employeePensionRate: 5,
      employerPensionRate: 10,
      jobType: "primary",
    });

    assert.ok(!("error" in result));
    assert.ok(Math.abs(result.estimatedGrossPay - taxableIncome / 0.95) < 0.01);
    assert.ok(Math.abs(result.differenceFromTarget) < 0.01);
  }
});

test("calculates a positive target beyond the former gross ceiling", () => {
  for (const jobType of ["primary", "secondary"]) {
    const result = calculateGrossFromNet({
      targetNetPay: 550,
      employeePensionRate: 99.9,
      employerPensionRate: 5,
      jobType,
    });

    assert.ok(!("error" in result));
    assert.ok(result.estimatedGrossPay > 100_000);
    assert.ok(Math.abs(result.differenceFromTarget) < 0.01);
  }
});

test("preserves remaining income at rates close to 100%", () => {
  const result = calculateGrossFromNet({
    targetNetPay: 550,
    employeePensionRate: 99.99999999999999,
    employerPensionRate: 5,
    jobType: "secondary",
  });

  assert.ok(!("error" in result));
  assert.ok(Math.abs(result.differenceFromTarget) < 0.01);
});

test("applies the minimum pension and secondary tax to inverse estimates", () => {
  const result = calculateGrossFromNet({
    targetNetPay: 855,
    employeePensionRate: 0,
    employerPensionRate: 0,
    jobType: "secondary",
  });

  assert.ok(!("error" in result));
  assert.ok(Math.abs(result.estimatedGrossPay - 1000) < 0.01);
  assert.ok(Math.abs(result.breakdown.employerPension - 50) < 0.01);
  assert.ok(Math.abs(result.breakdown.incomeTax - 95) < 0.01);
});

test("rejects a positive target when the pension takes the entire wage", () => {
  for (const jobType of ["primary", "secondary"]) {
    assert.deepEqual(
      calculateGrossFromNet({
        targetNetPay: 550,
        employeePensionRate: 100,
        employerPensionRate: 5,
        jobType,
      }),
      { error: "fullEmployeePension" },
    );
    assert.equal(
      calculateWageBreakdown({
        grossPay: 100_000,
        employeePensionRate: 100,
        employerPensionRate: 5,
        jobType,
      }).netPay,
      0,
    );
  }
});

test("allows a zero target even at 100% employee pension", () => {
  const result = calculateGrossFromNet({
    targetNetPay: 0,
    employeePensionRate: 100,
    employerPensionRate: 5,
    jobType: "primary",
  });

  assert.ok(!("error" in result));
  assert.equal(result.estimatedGrossPay, 0);
  assert.equal(result.breakdown.netPay, 0);
});

test("rejects gross or employer costs beyond the numeric range", () => {
  assert.deepEqual(
    calculateGrossFromNet({
      targetNetPay: Number.MAX_VALUE,
      employeePensionRate: 5,
      employerPensionRate: 5,
      jobType: "primary",
    }),
    { error: "amountOutOfRange" },
  );
  assert.deepEqual(
    calculateGrossFromNet({
      targetNetPay: Number.MAX_VALUE / 1.5,
      employeePensionRate: 5,
      employerPensionRate: 100,
      jobType: "primary",
    }),
    { error: "amountOutOfRange" },
  );
});
