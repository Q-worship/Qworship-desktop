"""
convert_legacy_bibles.py

Converts the legacy JS array-format files (AMP, MSG) from QWorship/server/data
into the flat JSON format used by the Qwroship-desktop RAM cache:
  [ { book, chapter, verse, text }, ... ]

Usage:
  python3 convert_legacy_bibles.py
"""

import re
import json
import ast

# ── Book name mapping ─────────────────────────────────────────────────────────
BOOK_NAME_MAP = {
    'Genesis': 'Genesis', 'Exodus': 'Exodus', 'Leviticus': 'Leviticus',
    'Numbers': 'Numbers', 'Deuteronomy': 'Deuteronomy', 'Joshua': 'Joshua',
    'Judges': 'Judges', 'Ruth': 'Ruth',
    'FirstSamuel': '1 Samuel', 'SecondSamuel': '2 Samuel',
    'FirstKings': '1 Kings', 'SecondKings': '2 Kings',
    'FirstChronicles': '1 Chronicles', 'SecondChronicles': '2 Chronicles',
    'Ezra': 'Ezra', 'Nehemiah': 'Nehemiah', 'Esther': 'Esther', 'Job': 'Job',
    'Psalm': 'Psalms', 'Proverbs': 'Proverbs', 'Ecclesiastes': 'Ecclesiastes',
    'SongofSolomon': 'Song of Solomon', 'Isaiah': 'Isaiah',
    'Jeremiah': 'Jeremiah', 'Lamentations': 'Lamentations',
    'Ezekiel': 'Ezekiel', 'Daniel': 'Daniel', 'Hosea': 'Hosea', 'Joel': 'Joel',
    'Amos': 'Amos', 'Obadiah': 'Obadiah', 'Jonah': 'Jonah', 'Micah': 'Micah',
    'Nahum': 'Nahum', 'Habakkuk': 'Habakkuk', 'Zephaniah': 'Zephaniah',
    'Haggai': 'Haggai', 'Zechariah': 'Zechariah', 'Malachi': 'Malachi',
    'Matthew': 'Matthew', 'Mark': 'Mark', 'Luke': 'Luke', 'John': 'John',
    'Acts': 'Acts', 'Romans': 'Romans',
    'FirstCorinthians': '1 Corinthians', 'SecondCorinthians': '2 Corinthians',
    'Galatians': 'Galatians', 'Ephesians': 'Ephesians',
    'Philippians': 'Philippians', 'Colossians': 'Colossians',
    'FirstThessalonians': '1 Thessalonians', 'SecondThessalonians': '2 Thessalonians',
    'FirstTimothy': '1 Timothy', 'SecondTimothy': '2 Timothy',
    'Titus': 'Titus', 'Philemon': 'Philemon', 'Hebrews': 'Hebrews',
    'James': 'James', 'FirstPeter': '1 Peter', 'SecondPeter': '2 Peter',
    'FirstJohn': '1 John', 'SecondJohn': '2 John', 'ThirdJohn': '3 John',
    'Jude': 'Jude', 'Revelation': 'Revelation',
}


def sanitize_brackets_in_strings(text):
    """
    Neutralize literal [ and ] that appear INSIDE quoted strings.
    This prevents bracket counters from getting confused by verse text
    like: "[After rising from the dead...]"
    
    We replace [ → \u005b and ] → \u005d inside string literals only.
    json.loads() will correctly decode these back to [ and ] in the parsed string.
    """
    result = []
    in_string = False
    escape_next = False
    
    for i, ch in enumerate(text):
        if escape_next:
            result.append(ch)
            escape_next = False
            continue
        
        if ch == '\\':
            result.append(ch)
            escape_next = True
            continue
        
        if ch == '"' and not escape_next:
            in_string = not in_string
            result.append(ch)
            continue
        
        if in_string:
            if ch == '[':
                result.append('\\u005b')
            elif ch == ']':
                result.append('\\u005d')
            else:
                result.append(ch)
        else:
            result.append(ch)
    
    return ''.join(result)


def parse_legacy_js(filepath, book_indent=''):
    with open(filepath, encoding='utf-8') as f:
        raw = f.read()

    escaped = re.escape(book_indent)
    book_pattern = re.compile(rf'^{escaped}([A-Za-z0-9]+)\s*=\s*\[', re.MULTILINE)
    matches = list(book_pattern.finditer(raw))
    print(f"  Detected {len(matches)} book-level blocks")

    result = {}
    for i, match in enumerate(matches):
        raw_book = match.group(1).strip()
        if raw_book not in BOOK_NAME_MAP:
            continue
        canonical = BOOK_NAME_MAP[raw_book]

        start = match.end() - 1
        end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
        book_raw = raw[start:end].rstrip().rstrip(',').rstrip()

        # Sanitize [ and ] inside string literals before bracket counting
        safe_raw = sanitize_brackets_in_strings(book_raw)

        depth = 0
        close_pos = None
        for j, ch in enumerate(safe_raw):
            if ch == '[': depth += 1
            elif ch == ']':
                depth -= 1
                if depth == 0:
                    close_pos = j + 1
                    break

        if close_pos is None:
            print(f"  ⚠️  Bracket mismatch for {canonical}, skipping.")
            continue

        book_array_str = safe_raw[:close_pos]
        try:
            chapters = json.loads(book_array_str)
        except json.JSONDecodeError as e:
            try:
                # Fallback: try on original (unsafe, but may work for simpler books)
                chapters = ast.literal_eval(book_raw[:close_pos])
            except Exception as e2:
                print(f"  ⚠️  Parse error for {canonical}: {e2}")
                continue

        result[canonical] = chapters

    return result


def convert_to_flat(book_data, label):
    rows = []
    for book, chapters in book_data.items():
        for ch_i, verses in enumerate(chapters):
            if not isinstance(verses, list):
                continue
            for v_i, text in enumerate(verses):
                rows.append({
                    'book': book,
                    'chapter': ch_i + 1,
                    'verse': v_i + 1,
                    'text': str(text).strip() if text else '',
                })
    print(f"  [{label}] {len(rows)} verses across {len(book_data)} books")
    return rows


SOURCES = [
    {
        'label': 'AMP',
        'src': '/Users/rebeccashewuri/Documents/development/qworship/QWorship/server/data/amplified_1754194878610.js',
        'dest': '/Users/rebeccashewuri/Documents/development/qworship/Qwroship-desktop/apps/client/public/data/bibles/amp.json',
        'book_indent': '',
    },
    {
        'label': 'MSG',
        'src': '/Users/rebeccashewuri/Documents/development/qworship/QWorship/server/data/msg_1754194878613.js',
        'dest': '/Users/rebeccashewuri/Documents/development/qworship/Qwroship-desktop/apps/client/public/data/bibles/msg.json',
        'book_indent': '    ',
    },
]

for s in SOURCES:
    print(f"\n🔄 Processing {s['label']}...")
    books = parse_legacy_js(s['src'], book_indent=s['book_indent'])
    print(f"  Parsed {len(books)} books")
    rows = convert_to_flat(books, s['label'])

    with open(s['dest'], 'w', encoding='utf-8') as f:
        json.dump(rows, f, ensure_ascii=False, separators=(',', ':'))

    non_empty = sum(1 for r in rows if r['text'].strip())
    print(f"  ✅ {s['dest']}")
    print(f"  Verses with text: {non_empty}/{len(rows)}")

print("\n✅ All done!")
