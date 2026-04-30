import { parseVoiceCommand } from '../src/lib/offlineBibleEngine.ts';

const cases = [
  'John chapter 3 verse 16',
  'first corinthians 5 1',
  'second thessalonians chapter 2 verse 3',
  'philippians 4 13',
  'philemon 1 6',
  'deuteronomy 28 1',
  'romans chapter 8 verse 28 in the niv',
  'juan tres dieciseis',
];

for (const input of cases) {
  const parsed = parseVoiceCommand(input, 'kjv');
  console.log(JSON.stringify({ input, parsed }, null, 2));
}
