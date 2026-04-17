const assert = require('assert');
function normalizeTranscript(raw) {
  let t = raw;
  t = t.replace(/[.,!?;:]+/g, " ");
  t = t.replace(
    /\b(true|false|was|were|are|been|being|um|uh|just|really|actually|basically|okay|ok|yeah|very|much|also|too)\b/gi,
    "",
  );
  t = t.replace(
    /^(?:show me|turn to|go to|read|open|find|search for|look up)\s+/gi,
    "",
  );
  t = t.replace(/(\d+)\s+(?:is|and|or|was|versus)\s+(\d+)/gi, "$1 verse $2");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

const input1 = "john 3:16-18";
console.log("Input:", input1);
console.log("Normalized:", normalizeTranscript(input1));

const PATTERNS = [
  /^(\d)\s*([a-z]+(?:\s+[a-z]+)?)\s+(\d+)[:.:](\d+)(?:\s*[-–]\s*(\d+))?$/i,
  /^([a-z]+(?:\s+[a-z]+)?)\s+(\d+)[:.:](\d+)(?:\s*[-–]\s*(\d+))?$/i,
  /^([a-z]+(?:\s+[a-z]+)?)\s+chapter\s+(\d+)\s+verse\s+(\d+)(?:\s+(?:to|through)\s+(\d+))?$/i,
  /^(\d)\s*([a-z]+(?:\s+[a-z]+)?)\s+chapter\s+(\d+)\s+verse\s+(\d+)(?:\s+(?:to|through)\s+(\d+))?$/i,
  /^(\d)\s*([a-z]+)\s+(\d+)\s+(\d+)$/i,
  /^([a-z]+(?:\s+[a-z]+)?)\s+(\d+)\s+(\d+)$/i,
  /^([a-z]+(?:\s+[a-z]+)?)\s+verse\s+(\d+)$/i,
  /^([a-z]+(?:\s+[a-z]+)?)\s+(\d+)$/i,
  /^(\d)\s*([a-z]+)\s+(\d+)$/i,
];

for (const pattern of PATTERNS) {
  const m = normalizeTranscript(input1).match(pattern);
  if (m) {
    console.log("Matched Pattern:", pattern.source, m);
  }
}

// Test with original input (before normalization stripped punctuation)
for (const pattern of PATTERNS) {
  const m = input1.match(pattern);
  if (m) {
    console.log("Matched ORIGINAL Input Pattern:", pattern.source, m);
  }
}
