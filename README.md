# こつこつクリニック クエスト

> **最新版について（2026年11月）**
> 公開中の最新版は `docs/index.html` です（GitHub Pages でこのファイルをそのまま配信）。
> 2026年10〜11月の調整（バトルの4段階メーター、先生キャラ10人、理念を入れたエンディングロール、会話アイコンの描き直し、表記統一など）は `docs/index.html` に直接加えています。
> `src/` の TypeScript は2026年9月時点のままなので、`npm run build` で作り直すと最新の変更が消えます。手直しは `docs/index.html` に対して行ってください。

スマートフォン縦画面向けのレトロRPG。仕様書 `kotsukotsu_clinic_quest_spec.md` に沿って、プロローグから第4章、最終章、エンディングまで遊べる。

## ビルド

```
npm install
npm run build        # 型チェック + dist/index.html（単一HTML）を生成
npm run check:emoji  # src と dist に絵文字・絵文字化する記号がないか検査
```

- `dist/index.html` … Artifact 公開用（`<html>`/`<head>` なしの断片）
- `dist/preview.html` … ローカル確認用の完全なHTML（`?debug` を付けると検証用フックを公開）

## 章の構成（章ごとに遊びを変えている）

| 章 | 遊び | 機器・ミニゲーム | 仲間 |
|---|---|---|---|
| 第1章 | 相談→機器庫で受け取り→患者宅 | ポータブルレントゲン（位置合わせ・撮影） | ケアマネージャー |
| 第2章 | 探索なしで駆けつける緊急対応 | ポータブル心電図（順序を学ぶ選択式、時間制限なし） | 訪問看護師 |
| 第3章 | 薬局で相談→眼科検査→家の中の危険探し→薬の整理 | 前眼部・眼底・眼圧（ピント合わせ）、薬を整える | 薬剤師 |
| 第4章 | 病院・マッサージ師・家族から情報を集めてから訪問 | ポータブルエコー（プローブ移動・角度保持・チームで判断） | 地域連携担当 |
| 最終章 | 孤立の魔王コリツ。医師一人では崩れず、4人の技を順に使う | 連携奥義「つながる医療」 | － |

敵は「ふあんのモヤ」「みおとしコウモリ」「つたわらん」（各章0〜1回）。病気や患者さんを敵にしない。

## 構成

| ファイル | 役割（仕様 13-2 の対応） |
|---|---|
| `src/main.ts` | GameShell：画面遷移、ワールドループ、会話・扉・イベントの振り分け、ScriptHost |
| `src/ui/title.ts` / `setup.ts` | TitleScreen / CharacterSetup |
| `src/engine/world.ts` | WorldMap / Player / PartyFollower（タイル、当たり判定、カメラ、追従） |
| `src/ui/dialogue.ts` | DialogueBox |
| `src/ui/hud.ts` | QuestTracker / Inventory / メニュー |
| `src/ui/encounter.ts` | Encounter（敵データで切り替え、仲間の技がコマンドに加わる） |
| `src/ui/mgkit.ts` ほか `xray.ts` `ecg.ts` `eye.ts` `echo.ts` `medicine.ts` | MedicalMiniGame（共通部品＋各機器） |
| `src/ui/boss.ts` | BossBattle |
| `src/ui/ending.ts` | Ending |
| `src/engine/save.ts` | saveGame / loadGame（localStorage、自動保存） |
| `src/data/chapter1〜4.ts` `story.ts` | 章ごとの会話・イベント（文言はここだけで修正可能） |
| `src/data/quests.ts` | 目的・あらすじ・章の判定（フラグで判定） |
| `src/data/maps.ts` | 町（26x34）と室内7か所 |

## 素材

絵文字・画像ファイルは使っていない。キャラクター（16x24、4方向 x 静止+歩行2コマ）、顔グラフィック、タイル、建物、機器アイコン、敵、ボスはすべて `src/engine/` のコードで描くオリジナルのドット絵。音は Web Audio で合成したオリジナル曲・効果音（初期状態は消音）。

## 操作

- 十字キー：タップで1マス、長押し（0.3秒以上）で歩き続ける。キーボードは矢印・WASD
- Aボタン：話す・調べる・次へ（Enter・Space・Z）
- メニュー：あらすじ、次の目的、仲間、持ち物、音、タイトルへ
