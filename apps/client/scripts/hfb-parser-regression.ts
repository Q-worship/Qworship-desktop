import { parseVoiceCommand } from "../src/lib/offlineBibleEngine.ts";
import { HFB_REGRESSION_CASES } from "../src/lib/hfbRegressionCases.ts";

let failures = 0;

for (const testCase of HFB_REGRESSION_CASES) {
  const parsed = parseVoiceCommand(testCase.input, "kjv");

  if (testCase.expected.type === "version_change") {
    const passed =
      parsed.commandType === "version_change" &&
      parsed.requestedVersion === testCase.expected.version;

    if (!passed) {
      failures += 1;
      console.error("[FAIL]", testCase.input, {
        expected: testCase.expected,
        actual: parsed,
      });
    } else {
      console.log("[PASS]", testCase.input, "->", parsed.requestedVersion);
    }

    continue;
  }

  if (testCase.expected.type === "navigation") {
    const passed =
      parsed.commandType === testCase.expected.commandType &&
      parsed.navigationDirection === testCase.expected.direction &&
      parsed.targetVerse === testCase.expected.targetVerse;

    if (!passed) {
      failures += 1;
      console.error("[FAIL]", testCase.input, {
        expected: testCase.expected,
        actual: parsed,
      });
    } else {
      const targetSuffix =
        testCase.expected.commandType === "jump_to_verse"
          ? ` ${parsed.targetVerse}`
          : parsed.navigationDirection
            ? ` ${parsed.navigationDirection}`
            : "";
      console.log("[PASS]", testCase.input, "->", `${parsed.commandType}${targetSuffix}`);
    }

    continue;
  }

  if (testCase.expected.type === "unclear") {
    const passed =
      parsed.commandType === "lookup" &&
      parsed.parsedReference == null &&
      parsed.confidence === 0;

    if (!passed) {
      failures += 1;
      console.error("[FAIL]", testCase.input, {
        expected: testCase.expected,
        actual: parsed,
      });
    } else {
      console.log("[PASS]", testCase.input, "-> rejected as unclear");
    }

    continue;
  }

  const passed =
    parsed.commandType === "lookup" &&
    parsed.parsedReference?.book === testCase.expected.book &&
    parsed.parsedReference?.chapter === testCase.expected.chapter &&
    parsed.parsedReference?.verseStart === testCase.expected.verseStart &&
    parsed.parsedReference?.verseEnd === testCase.expected.verseEnd;

  if (!passed) {
    failures += 1;
    console.error("[FAIL]", testCase.input, {
      expected: testCase.expected,
      actual: parsed,
    });
  } else {
    const verseSuffix =
      parsed.parsedReference?.verseEnd &&
      parsed.parsedReference.verseEnd > parsed.parsedReference.verseStart
        ? `${parsed.parsedReference.verseStart}-${parsed.parsedReference.verseEnd}`
        : `${parsed.parsedReference?.verseStart}`;
    console.log(
      "[PASS]",
      testCase.input,
      "->",
      `${parsed.parsedReference?.book} ${parsed.parsedReference?.chapter}:${verseSuffix}`,
      `(confidence ${parsed.confidence.toFixed(2)})`,
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} regression case(s) failed.`);
  process.exit(1);
}

console.log(`\nAll Hands-free Bible regression cases passed (${HFB_REGRESSION_CASES.length} total).`);
