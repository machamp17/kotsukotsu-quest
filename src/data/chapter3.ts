// Chapter 3: 目が見えづらい患者さんと眼科検査
// Different rhythm: a consultation at the pharmacy, the eye exam, then a search of
// the home for what makes daily life harder, and finally tidying up the medicine.
import type { ScriptCmd, Talk } from "../types";

export const TALKS3: Record<string, Talk[]> = {
  pharmacist: [
    {
      when: { none: ["ch3Asked"] },
      script: [
        { say: "pharmacist", text: "{name}先生、来てくださってありがとうございます。薬剤師の森です。" },
        { say: "pharmacist", text: "薬の袋が見えづらくて、飲み間違えそうになる方がいます。最近、見え方そのものも変わったそうです。" },
        { say: "pharmacist", text: "佐藤ハルさん、90歳。南の通りの、ターコイズの屋根のお家です。" },
        { say: "careManager", text: "家の中にも、つまずきそうな場所が増えていました。" },
        { say: "player", text: "目の検査と、暮らしの中の困りごと。両方を一緒に確かめましょう。" },
        { narrate: "機器庫の担当さんが、眼科の検査機器を届けてくれていた。" },
        { give: "eyeKit" },
        { say: "pharmacist", text: "私もご一緒します。お薬のことなら任せてください。" },
        { setFlag: "ch3Asked" },
        { narrate: "薬剤師の森さんが同行してくれることになった。" },
        { save: true },
      ],
    },
    { script: [{ narrate: "窓口には「ただいま往診同行中」の札が出ている。" }] },
  ],
  medShelf: [{ script: [{ narrate: "薬の箱が、効能ごとにきれいに並んでいる。どれにも大きな字の札が付いている。" }] }],
  haru: [
    {
      when: { none: ["eyeExamDone"] },
      script: [
        { say: "haru", text: "まあ、先生。最近ね、何もかもかすんで見えるのよ。" },
        { say: "haru", text: "薬の袋の字も読みにくくて。朝の薬と夜の薬を、取り違えそうになったの。" },
        { say: "player", text: "見え方を、順番に確かめていきましょう。痛いことはしませんから、安心してください。" },
        { minigame: "eye" },
        { lesson: "自宅でも前眼部・眼底・眼圧を確かめ、必要に応じて眼科の専門医へつなぐことができます。" },
        { setFlag: "eyeExamDone" },
        { say: "careManager", text: "先生、お部屋の中も見てみませんか。つまずきそうな所や、困っていそうな所を一緒に探しましょう。" },
        { narrate: "ケアマネージャーの「暮らしを知る」。気になる場所に、目印が付いた。" },
        { save: true },
      ],
    },
    {
      when: { none: ["hazardsFound"] },
      script: [{ say: "haru", text: "暗いところだと、足元がよく見えなくてねえ。" }],
    },
    {
      when: { none: ["pharmacistJoined"] },
      script: [
        { say: "pharmacist", text: "ハルさん、お薬のこと、いくつか提案させてください。" },
        { minigame: "medicine" },
        { lesson: "薬の袋や飲み方を工夫すると、見えにくさがあっても治療を続けやすくなります。" },
        { say: "careManager", text: "マットは滑り止めのものに替えて、コードは壁沿いにまとめましょう。明るい電球も用意しますね。" },
        { say: "haru", text: "目だけの話だと思っていたけれど、薬や家の中のことまで一緒に考えてくれるんだね。" },
        { say: "pharmacist", text: "{name}先生。見え方の変化も、お薬の変化も、これからは私から先生へお伝えします。" },
        { say: "pharmacist", text: "私も、チームに加えてもらえませんか。" },
        { say: "player", text: "もちろんです。一緒に回りましょう。" },
        { join: "pharmacist" },
        { setFlag: "ch3Done" },
        { save: true },
        {
          chapterCard: {
            title: "第3章　クリア",
            sub: "目が見えづらい患者さんと眼科検査",
            foot: "つづいて　第4章「お腹が苦しい患者さんとポータブルエコー」",
          },
        },
      ],
    },
    { script: [{ say: "haru", text: "眼科の先生にも、ちゃんと診てもらうからね。この薬袋、とっても見やすいよ。" }] },
  ],
  haruMedicine: [
    {
      when: { none: ["foundMedicine"] },
      script: [
        { narrate: "テーブルの上に、同じような白い薬袋がいくつも並んでいる。字が小さく、朝と夜の区別がつきにくい。" },
        { setFlag: "foundMedicine" },
        { say: "pharmacist", text: "これでは見分けにくいですね。あとで一緒に整えましょう。" },
      ],
    },
    { script: [{ narrate: "薬袋が並んでいる。森さんが、どう整えるか考えてくれている。" }] },
  ],
  hazardRug: [
    {
      when: { none: ["foundRug"] },
      script: [
        { narrate: "マットの端がめくれている。見えにくいと、つまずきやすい。" },
        { setFlag: "foundRug" },
        { say: "careManager", text: "滑り止めの付いたマットに替えましょう。" },
      ],
    },
    { script: [{ narrate: "めくれたマットの端。あとで替えることになった。" }] },
  ],
  hazardCord: [
    {
      when: { none: ["foundCord"] },
      script: [
        { narrate: "床を電気のコードが横切っている。薄暗いと、足を引っかけてしまいそうだ。" },
        { setFlag: "foundCord" },
        { say: "careManager", text: "壁沿いにまとめれば安心ですね。" },
      ],
    },
    { script: [{ narrate: "床のコード。壁沿いにまとめることになった。" }] },
  ],
  haruCalendar: [{ script: [{ narrate: "カレンダーの予定が、小さな字でびっしり書かれている。" }] }],
};

export const SCRIPTS3: Record<string, ScriptCmd[]> = {
  pharmacyDoor: [{ narrate: "こつこつ薬局。窓口が混み合っているようだ。また後で来よう。" }],
  haruDoor: [{ narrate: "「佐藤」と表札がある。中からテレビの音が聞こえる。" }],
  haruEnter: [
    { say: "pharmacist", text: "ハルさん、薬局の森です。先生をお連れしました。" },
    { sfx: "door" },
    { setFlag: "enteredHaru" },
  ],
  batEncounter: [
    { balloon: "player" },
    { narrate: "ハルさんの家の前を、眠たげなコウモリがふさいでいる……。" },
    { battle: "bat" },
    { setFlag: "batCleared" },
    { narrate: "みおとしコウモリは、ぱたぱたと空へ帰っていった。" },
    { save: true },
  ],
};
