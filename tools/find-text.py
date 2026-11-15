#!/usr/bin/env python3
"""ゲーム内の文章を探す。

docs/index.html の日本語の多くは「\\u30B3」のような形式で書かれているため、
そのまま検索しても見つからないことがある。このスクリプトは読める形に直してから探す。

使い方:  python tools/find-text.py "探す言葉" [ファイル]
"""
import pathlib
import re
import sys

if len(sys.argv) < 2:
    sys.exit(__doc__)
target = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else pathlib.Path(__file__).resolve().parent.parent / "docs" / "index.html"
text = target.read_text(encoding="utf-8")
readable = re.sub(r"\\u([0-9A-Fa-f]{4})", lambda m: chr(int(m.group(1), 16)), text)
hits = [m.start() for m in re.finditer(re.escape(sys.argv[1]), readable)]
for a in hits:
    print("---")
    print(readable[max(0, a - 80):a + 160].replace("\n", " "))
print(f"\n{len(hits)} 件")
