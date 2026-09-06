import assert from "node:assert";
import { factorial, nC2 } from "./maths.mjs";

function testFactorial() {
  console.info("testing factorial");

  const result3 = factorial(3);
  assert(result3 === 6, "factorial(3) should be 6");

  const result11 = factorial(11);
  assert(result11 === 39_916_800, "factorial(11) should be 39_916_800");

  console.info("finished testing factorial");
}

function testNC2() {
  console.info("testing nC2");

  const result3 = nC2(3);
  assert(result3 === 3, "nC2(3) should be 3");

  const result11 = nC2(11);
  assert(result11 === 55, "nC2(11) should be 55");

  console.info("finished testing nC2");
}

testFactorial();
testNC2();
