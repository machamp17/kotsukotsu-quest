// Chapter 2: 胸が苦しい患者さんとポータブル心電図
// The nurse is already at the patient's side and the ambulance is on its way.
// No searching and no enemies: the player goes straight there.
import type { ScriptCmd, Talk } from "../types";

export const TALKS2: Record<string, Talk[]> = {
  nurse: [
    {
      when: { none: ["ecgDone"] },
      script: [
        { say: "nurse", text: "{name}先生、ありがとうございます。田中さん、30分ほど前から胸が苦しいと。冷や汗もあります。" },
        { say: "nurse", text: "救急要請はもう済んでいます。到着まで、あと10分ほどです。" },
        { say: "player", text: "ありがとうございます。すぐに確認しましょう。" },
        { minigame: "ecg" },
        { lesson: "ポータブル心電図を使うと、自宅でも心臓の電気の状態を記録し、病院と早く情報を共有できる場合があります。" },
        { sfx: "phone" },
        { narrate: "サイレンの音が近づいてきた。救急隊が到着した。" },
        { say: "nurse", text: "救急隊の方へ、心電図とこれまでの経過をお渡ししました。" },
        { narrate: "田中さんは、受け入れ先の病院へ向かった。" },
        { setFlag: "ecgDone" },
        { bgm: "house" },
        { say: "tanakaWife", text: "病院から、今着いたと連絡がありました。先生、看護師さん、本当にありがとうございました。" },
        { say: "nurse", text: "普段の様子を知っていたから、いつもと違うと気づけました。" },
        { say: "player", text: "変化を知らせてもらえたから、早く次へつなげられました。" },
        { say: "careManager", text: "病院とのやりとりも、一人じゃなかったから早かったですね。" },
        { say: "nurse", text: "{name}先生。日々の小さな変化を、これからもすぐに先生へ届けます。一緒に回らせてください。" },
        { say: "player", text: "心強いです。よろしくお願いします。" },
        { join: "nurse" },
        { say: "nurse", text: "そういえば、こつこつ薬局の薬剤師さんが、先生に相談したいことがあると言っていました。" },
        { setFlag: "ch2Done" },
        { save: true },
        {
          chapterCard: {
            title: "第2章　クリア",
            sub: "胸が苦しい患者さんとポータブル心電図",
            foot: "つづいて　第3章「目が見えづらい患者さんと眼科検査」",
          },
        },
      ],
    },
  ],
  tanaka: [
    {
      script: [
        { narrate: "田中さんは胸を押さえ、浅い呼吸をしている。額に汗がにじんでいる。" },
        { say: "nurse", text: "先生、こちらへ。一緒に確認させてください。" },
      ],
    },
  ],
  tanakaWife: [
    {
      when: { none: ["ecgDone"] },
      script: [{ say: "tanakaWife", text: "主人が急に胸が苦しいって……。看護師さんがすぐ来てくれて、救急車も呼んでくれたんです。" }],
    },
    {
      script: [
        { say: "tanakaWife", text: "病院から、落ち着いてきたと連絡がありました。" },
        { say: "tanakaWife", text: "家に帰ってきたら、またよろしくお願いします。" },
      ],
    },
  ],
  tanakaPhone: [{ script: [{ narrate: "電話のそばに、救急隊へ伝える内容のメモがある。看護師さんが書いたものだ。" }] }],
  tanakaShelf: [{ script: [{ narrate: "お薬手帳と、訪問看護の記録ノートが並んでいる。毎回の血圧が、ていねいに書き込まれている。" }] }],
};

export const SCRIPTS2: Record<string, ScriptCmd[]> = {
  ch2Start: [
    { narrate: "往診バッグを確かめた。ポータブル心電図が入っている。" },
    { give: "ecg" },
    { setFlag: "ch2Started" },
    { say: "careManager", text: "田中さんのお宅は、クリニックの西隣、青い屋根の家です。急ぎましょう。" },
    { bgm: "emergency" },
    { save: true },
  ],
  tanakaDoor: [{ narrate: "「田中」と表札がある。留守のようだ。" }],
  tanakaEnter: [
    { say: "nurse", text: "（奥から）先生、こちらです！　鍵は開いています！" },
    { sfx: "door" },
    { setFlag: "enteredTanaka" },
  ],
};
