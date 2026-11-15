#!/usr/bin/env python3
"""ゲーム内の文章を1か所だけ書き換える。

「\\u30B3」形式で書かれた文章も、そのまま書かれた文章も、どちらでも置き換えられる。
置き換え前の文章がファイル内にちょうど1か所だけあるときに限り書き換える（誤爆防止）。
見つからない・複数ある場合は何も変更せずに終了するので、前後の言葉を足して1か所に絞る。

使い方:  python tools/replace-text.py "今の文章" "新しい文章" [ファイル]
"""
import pathlib
import sys

if len(sys.argv) < 3:
    sys.exit(__doc__)
old, new = sys.argv[1], sys.argv[2]
target = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else pathlib.Path(__file__).resolve().parent.parent / "docs" / "index.html"
text = target.read_text(encoding="utf-8")


def esc(s, upper=True):
    fmt = "\\u%04X" if upper else "\\u%04x"
    return "".join(c if ord(c) < 128 else fmt % ord(c) for c in s)


for o, n in ((esc(old), esc(new)), (esc(old, False), esc(new, False)), (old, new)):
    count = text.count(o)
    if count == 1:
        target.write_text(text.replace(o, n), encoding="utf-8")
        print("書き換えました:", target)
        break
    if count > 1:
        sys.exit(f"{count} か所見つかりました。前後の言葉を足して1か所に絞ってください。（何も変更していません）")
else:
    sys.exit("見つかりませんでした。（何も変更していません）")
