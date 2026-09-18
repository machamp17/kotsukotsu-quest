// Chapter 4: お腹が苦しい患者さんとポータブルエコー
// The echo is already in the bag: this chapter is about gathering information
// from the hospital, the massage therapist and the family before visiting.
import type { ScriptCmd, Talk } from "../types";

export const TALKS4: Record<string, Talk[]> = {
  liaison: [
    {
      when: { none: ["infoHospital"] },
      script: [
        { say: "liaison", text: "{name}先生、お待ちしていました。地域連携担当の小林です。" },
        { say: "liaison", text: "木村タダシさん、85歳。三日前に退院されたばかりです。" },
        { say: "liaison", text: "病院の退院時の情報を確認しました。入院中、一時期は尿の管を使っていたそうです。" },
        { give: "dischargeNote" },
        { say: "liaison", text: "ご家族と、普段のお体を見ている方からも、お話を聞いておくといいと思います。" },
        { say: "careManager", text: "訪問マッサージの方が、木村さんのところにも通っていますね。" },
        { say: "player", text: "ご家族と、マッサージ師さん。話を聞いてから、お宅へ伺いましょう。" },
        { say: "liaison", text: "私もご一緒します。病院とのやりとりは任せてください。" },
        { setFlag: "infoHospital" },
        { narrate: "地域連携担当の小林さんが同行してくれることになった。" },
        { save: true },
      ],
    },
    { script: [{ narrate: "窓口には「ただいま往診同行中」の札が出ている。" }] },
  ],
  centerDesk: [{ script: [{ narrate: "病院からの連絡票が、ファイルにきちんと綴じられている。" }] }],
  centerBoard: [{ script: [{ narrate: "掲示板に「退院前カンファレンス」「多職種の勉強会」の予定が貼られている。" }] }],
  massageInfo: [
    {
      script: [
        { say: "massage", text: "木村さんですか。退院してから、立ち上がるのがゆっくりになりました。" },
        { say: "massage", text: "それと、この二、三日はトイレに行く回数が多いのに、すっきりしないとおっしゃっていて……。" },
        { setFlag: "infoMassage" },
        { narrate: "話を聞けた：普段の動作の変化" },
        { save: true },
      ],
    },
  ],
  kimuraDaughter: [
    {
      when: { none: ["infoHospital"] },
      script: [{ say: "kimuraDaughter", text: "父が退院してきたんですけど、どうも調子が悪そうで……。" }],
    },
    {
      when: { none: ["infoFamily"] },
      script: [
        { say: "kimuraDaughter", text: "水分は、トイレが近くなるのが嫌だと言って、控えているみたいです。" },
        { say: "kimuraDaughter", text: "食事は半分くらい。昨日の夜から、おしっこがほとんど出ていないと言っていて……。" },
        { setFlag: "infoFamily" },
        { narrate: "話を聞けた：水分・食事・排尿の様子" },
        { save: true },
      ],
    },
    { script: [{ say: "kimuraDaughter", text: "父の家はこちらです。どうぞ、中へ。" }] },
  ],
  kimura: [
    {
      when: { none: ["echoDone"] },
      script: [
        { say: "kimura", text: "先生……お腹の下のほうが張って、苦しくてね。" },
        { say: "player", text: "お話を聞かせてください。それから、お腹の中の様子をエコーで確かめます。" },
        { minigame: "echo" },
        { lesson: "ポータブルエコーを使うと、自宅でもお腹の中の様子を確かめ、処置や病院との連携につなげられる場合があります。" },
        { say: "kimuraDaughter", text: "何が起きているか分からないのが、一番怖かったんです。相談できる先が分かって安心しました。" },
        { say: "kimura", text: "楽になってきたよ。帰ってきたばかりで、また入院かと心配していたんだ。" },
        { setFlag: "echoDone" },
        { say: "liaison", text: "{name}先生。病院の情報と、ここでの暮らしの情報を、これからは私がつなぎます。" },
        { say: "player", text: "ありがとうございます。一緒にお願いします。" },
        { join: "liaison" },
        { save: true },
        {
          chapterCard: {
            title: "第4章　クリア",
            sub: "お腹が苦しい患者さんとポータブルエコー",
            foot: "仲間が5人そろった",
          },
        },
      ],
    },
    { script: [{ say: "kimura", text: "連絡先を大きく書いてもらったから、夜中でも安心だよ。" }] },
  ],
  kimuraDaughterIn: [
    {
      when: { none: ["echoDone"] },
      script: [{ say: "kimuraDaughter", text: "父さん、先生たちが来てくれたよ。" }],
    },
    { script: [{ say: "kimuraDaughter", text: "困ったときの連絡先と順番を、紙に書いて貼っておきました。" }] },
  ],
  kimuraNotes: [{ script: [{ narrate: "冷蔵庫の横に、センターと訪問看護の連絡先が大きな字で貼ってある。" }] }],
  kimuraCalendar: [{ script: [{ narrate: "カレンダーの三日前の欄に「退院」と書いてある。" }] }],
  kimuraDoor: [
    { when: { none: ["ch4Called"] }, script: [{ narrate: "「木村」と表札がある。" }] },
    { when: { none: ["infoHospital"] }, script: [{ narrate: "木村さんのお宅だ。まず、地域連携センターで話を聞こう。" }] },
    {
      when: { none: ["infoMassage"] },
      script: [{ say: "liaison", text: "普段の体の様子を知っている、マッサージ師さんのお話も聞いておきませんか。広場のそばにいらっしゃいます。" }],
    },
    { script: [{ say: "liaison", text: "娘さんから、お家での様子も聞いておきましょう。すぐそこにいらっしゃいます。" }] },
  ],
};

export const SCRIPTS4: Record<string, ScriptCmd[]> = {
  liaisonCall: [
    { sfx: "phone" },
    { phone: "地域連携センター" },
    { say: "liaisonPhone", text: "{name}先生、地域連携センターです。退院したばかりの方から、下腹部が苦しいと相談がありました。" },
    { say: "liaisonPhone", text: "病院の情報も確認します。一緒に診てもらえますか？" },
    { say: "player", text: "わかりました。まず、センターに寄りますね。" },
    { narrate: "往診バッグに、ポータブルエコーを入れた。" },
    { give: "echo" },
    { setFlag: "ch4Called" },
    { save: true },
  ],
  centerDoor: [{ narrate: "地域連携センター。病院と地域をつなぐ窓口だ。今は会議中の札が出ている。" }],
  kimuraEnter: [
    { say: "kimuraDaughter", text: "父さん、先生たちが来てくれたよ。" },
    { sfx: "door" },
    { setFlag: "enteredKimura" },
  ],
  tsutaEncounter: [
    { balloon: "player" },
    { narrate: "足元に、書類がぱらぱらと落ちてきた……。" },
    { battle: "tsutawaran" },
    { setFlag: "tsutaCleared" },
    { narrate: "落ちていた情報のかけらを、全部拾い集めた。" },
    { save: true },
  ],
};

export const FINALE_SCRIPTS: Record<string, ScriptCmd[]> = {
  bossIntro: [
    { bgm: null },
    { narrate: "……町の空気が、少しだけ重くなった気がする。" },
    { say: "careManager", text: "先生。4人の方の症状には、対応できました。でも……。" },
    { say: "nurse", text: "気づいた変化が、すぐに先生へ届かないことが、まだあります。" },
    { say: "pharmacist", text: "薬の情報と、病院の情報と、暮らしの情報が、ばらばらのままのこともあります。" },
    { say: "liaison", text: "ご家族も、介護のことや判断を一人で抱えて、眠れない夜を過ごしていることがあります。" },
    { say: "careManager", text: "私たちケアマネも、医療のことで迷って、誰にも聞けないときがあるんです。" },
    { narrate: "町に残った不安、遠慮、途切れた情報が、中央の広場に集まっていく……。" },
    { setFlag: "bossIntro" },
    { save: true },
  ],
  bossBattle: [
    { balloon: "player" },
    { boss: true },
    { setFlag: "bossCleared" },
    { save: true },
    { ending: true },
    { setFlag: "gameClear" },
    { save: true },
  ],
};
