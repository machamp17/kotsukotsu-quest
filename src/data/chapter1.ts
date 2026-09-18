// Chapter 1: 転んだ患者さんとポータブルレントゲン
// All dialogue lives here as data. "{name}" is replaced with the player's name.
// Speaker ids: "player", a CharacterId, or an entry of SPEAKERS in ui/dialogue.ts.
import type { ScriptCmd, Talk } from "../types";

export const TALKS: Record<string, Talk[]> = {
  careManager: [
    {
      when: { none: ["askedForXray"] },
      script: [
        { say: "careManager", text: "あなたが{name}先生ですね。相談したい方がいるんです。" },
        { say: "careManager", text: "春山ウメさん、87歳。昨日、ご自宅で転んでから腰を痛がっています。" },
        { say: "careManager", text: "病院へ行くのも難しくて……。家でレントゲンが撮れたら助かるのですが。" },
        { say: "player", text: "わかりました。まず状態を確認しましょう。ポータブルレントゲンを準備します。" },
        { say: "careManager", text: "機器庫の方が場所を知っています。東の橋を渡った先の建物です。" },
        { say: "careManager", text: "準備できたら、もう一度ここへ来てください。" },
        { setFlag: "askedForXray" },
        { sfx: "select" },
        { save: true },
      ],
    },
    {
      when: { all: ["askedForXray"], none: ["gotXray"] },
      script: [
        { say: "careManager", text: "機器庫は、広場から東へ進んで橋を渡った先です。" },
        { say: "careManager", text: "ウメさんには、先生が来てくださることを伝えておきますね。" },
      ],
    },
    {
      when: { all: ["gotXray"], none: ["gotKey"] },
      script: [
        { say: "careManager", text: "それがあれば助けられます。ご本人にも連絡できました。" },
        { say: "careManager", text: "ウメさんとご家族から、訪問の了承をいただいて、この鍵を預かっています。" },
        { say: "careManager", text: "ウメさんは今、起き上がって玄関まで出るのがつらいそうなんです。" },
        { give: "patientKey" },
        { setFlag: "gotKey" },
        { say: "careManager", text: "私が家までご案内します。南西の、赤い屋根のお家です。" },
        { narrate: "ケアマネージャーが道案内についてくれることになった。" },
        { save: true },
      ],
    },
  ],
  elder: [
    {
      when: { none: ["askedForXray"] },
      script: [{ say: "elder", text: "やあ、{name}先生。今日もいい天気だねえ。クリニックの前で、ケアマネさんが先生を待っていたよ。" }],
    },
    {
      when: { all: ["askedForXray"], none: ["gotXray"] },
      script: [
        { say: "elder", text: "機器庫なら、この広場から東へ行って、橋を渡った先だよ。" },
        { say: "elder", text: "橋のあたりで、さっき紫色のもやもやを見かけたなあ。" },
      ],
    },
    {
      when: { none: ["careManagerJoined"] },
      script: [{ say: "elder", text: "ウメさんのところへ行くのかい。あの人は昔、この町で一番の世話焼きだったんだよ。" }],
    },
    { script: [{ say: "elder", text: "ケアマネさんと一緒なら心強いねえ。わしも何かあったら相談させてもらうよ。" }] },
  ],
  neighbor: [
    {
      when: { none: ["gotKey"] },
      script: [
        { say: "neighbor", text: "春山さん、ここ数日見かけなくて。いつもはお庭の手入れをしているのに……。" },
        { say: "neighbor", text: "呼び鈴を押しても、お返事がなかったの。" },
      ],
    },
    {
      when: { none: ["xrayExamDone"] },
      script: [{ say: "neighbor", text: "先生が来てくださったのね。ウメさん、きっと心細かったと思うの。" }],
    },
    { script: [{ say: "neighbor", text: "様子が分かって、私もほっとしました。何か手伝えることがあったら言ってくださいね。" }] },
  ],
  massage: [
    {
      when: { none: ["xrayExamDone"] },
      script: [
        { say: "massage", text: "訪問マッサージの者です。腰を痛めた方は、寝返りや立ち上がりの時が一番つらいんです。" },
        { say: "massage", text: "痛む場所だけでなく、どう動くと痛いのかも聞いてみてください。" },
      ],
    },
    { script: [{ say: "massage", text: "痛みが落ち着いたら、動き方の練習も一緒にできますよ。いつでも声をかけてください。" }] },
  ],
  mr: [
    {
      script: [
        { say: "mr", text: "製薬会社で情報提供をしている者です。お薬の情報は、最新の添付文書で確かめていただくのが一番です。" },
        { say: "mr", text: "気になる点があれば、資料をお持ちします。判断は先生と患者さんで、ですね。" },
      ],
    },
  ],
  cat: [{ script: [{ narrate: "ネコが日なたで丸くなっている。こちらを見て、ゆっくりまばたきをした。" }] }],
  storeStaff: [
    {
      when: { none: ["storeTalked"] },
      script: [
        { say: "storeStaff", text: "{name}先生、お疲れさまです。ケアマネさんから連絡をもらっています。" },
        { say: "storeStaff", text: "ポータブルレントゲンは、奥の専用ケースに入れてあります。点検も済んでいますよ。" },
        { say: "storeStaff", text: "ケースを開けて、中身を確認してから持っていってください。" },
        { setFlag: "storeTalked" },
      ],
    },
    {
      when: { none: ["gotXray"] },
      script: [{ say: "storeStaff", text: "奥の、ターコイズ色のケースです。" }],
    },
    {
      script: [
        { say: "storeStaff", text: "撮影のときは、周りの方に少し離れてもらうのを忘れずに。気をつけて行ってらっしゃい。" },
      ],
    },
  ],
  xrayCase: [
    { when: { none: ["storeTalked"] }, script: [{ narrate: "レントゲン専用の保管ケースだ。まず担当さんに声をかけよう。" }] },
    {
      when: { none: ["gotXray"] },
      script: [
        { narrate: "ケースを開けた。本体、撮影パネル、防護用のエプロンがそろっている。" },
        { give: "xray" },
        { setFlag: "gotXray" },
        { save: true },
        { say: "storeStaff", text: "ケアマネさんのところへ戻って、一緒に向かってください。" },
      ],
    },
    { script: [{ narrate: "空になった保管ケースだ。" }] },
  ],
  rack: [{ script: [{ narrate: "点検済みの機器が並んでいる。心電図、エコー、眼科の検査機器……。どれも、いつか出番が来そうだ。" }] }],
  storeDesk: [{ script: [{ narrate: "貸出記録の台帳だ。「ポータブルレントゲン　春山様宅」と書き込まれている。" }] }],
  clinicSign: [{ script: [{ narrate: "看板にはこう書かれている。「生きる事を嬉しく。こつこつクリニック」" }] }],
  well: [{ script: [{ narrate: "古い井戸だ。町の人たちが、ここでよく立ち話をしている。" }] }],
  garden: [
    { when: { none: ["xrayExamDone"] }, script: [{ narrate: "ウメさんの畑だ。ここ数日、水やりができていないようだ。" }] },
    { script: [{ narrate: "近所の方が水をまいてくれたようだ。葉が生き生きしている。" }] },
  ],
  calendar: [{ script: [{ narrate: "カレンダーに「デイサービス」「歯医者」と予定が書いてある。今週の予定には線が引かれていた。" }] }],
  umeShelf: [{ script: [{ narrate: "家族の写真と、お孫さんからの手紙が飾ってある。" }] }],
  kitchen: [{ script: [{ narrate: "台所だ。床に小さな段差がある。ここで振り向いたときに転んだのかもしれない。" }] }],
  umeTable: [{ script: [{ narrate: "お茶のセットと、お薬の袋が置いてある。" }] }],
  umeDesk: [{ script: [{ narrate: "電話の横に、ケアマネージャーの連絡先が大きな字で貼ってある。" }] }],
  ume: [
    {
      when: { none: ["xrayExamDone"] },
      script: [
        { say: "ume", text: "まあ、先生。わざわざ来てくださったのね。" },
        { say: "ume", text: "転んでから腰が痛くてね。骨が折れていたらと思うと、怖くて動けないよ。" },
        { say: "player", text: "痛み方や動ける範囲を確認します。必要な画像を撮って、一緒に考えましょう。" },
        { bgm: null },
        { minigame: "xray" },
        { lesson: "ポータブルレントゲンを使うと、移動が難しい方の自宅でも画像検査を行える場合があります。" },
        { bgm: "house" },
        { say: "ume", text: "家でここまで診てもらえるとは思わなかったよ。" },
        { say: "ume", text: "どうすればいいか分かって、少し安心した。" },
        { say: "careManager", text: "治療だけでなく、その後の暮らしも私が一緒に考えます。" },
        { say: "careManager", text: "手すりやベッドの高さ、お買い物のこと。ウメさんが家で過ごしやすいように。" },
        { say: "ume", text: "ありがとうね。一人で抱えていたのが、うそみたいだよ。" },
        { setFlag: "xrayExamDone" },
        { say: "careManager", text: "{name}先生。これからも、一緒に回らせてもらえませんか。" },
        { say: "careManager", text: "暮らしのことなら、私がお役に立てると思うんです。" },
        { say: "player", text: "心強いです。こちらこそ、よろしくお願いします。" },
        { join: "careManager" },
        { save: true },
      ],
    },
    {
      script: [
        { say: "ume", text: "先生、ありがとうね。痛いときは、無理せず連絡するよ。" },
      ],
    },
  ],
};

export const SCRIPTS: Record<string, ScriptCmd[]> = {
  intro: [
    { narrate: "ここは、川と緑にかこまれた小さな町。" },
    { narrate: "{name}先生は、今日もこつこつクリニックから、患者さんのお宅へ出かける。" },
    { setFlag: "introSeen" },
    { save: true },
  ],
  storeLocked: [
    { narrate: "機器庫の扉には札が下がっている。「訪問の依頼が入ったら開けます」" },
  ],
  umeHouseLocked: [
    { narrate: "「春山」と表札がある。呼び鈴を押したが、返事がない。" },
  ],
  umeHouseEnter: [
    { say: "careManager", text: "（呼び鈴を押して）ウメさん、ケアマネの南です。先生をお連れしました。鍵を開けますね。" },
    { sfx: "door" },
    { setFlag: "enteredPatientHouse" },
  ],
  clinicDoor: [{ narrate: "クリニックの中では、スタッフが今日の訪問の準備をしている。" }],
  moyaEncounter: [
    { balloon: "player" },
    { narrate: "橋のたもとに、紫がかった霧が立ちこめている……。" },
    { battle: "moya" },
    { setFlag: "moyaCleared" },
    { narrate: "足元が見えるようになった。機器庫はこの先だ。" },
    { save: true },
  ],
  nurseCall: [
    { sfx: "phone" },
    { phone: "訪問看護ステーション" },
    { say: "nursePhone", text: "{name}先生、胸の苦しさを訴えている方がいます。冷や汗もあります。" },
    { say: "nursePhone", text: "救急要請を進めています。すぐ来られますか？" },
    { say: "player", text: "わかりました。心電図を持って向かいます。" },
    { say: "player", text: "意識と呼吸の状態を見ながら、変化があればすぐ教えてください。" },
    { say: "careManager", text: "先生、急ぎましょう。ご家族への連絡は私が手伝います。" },
    { setFlag: "nurseCalled" },
    { setFlag: "chapter1Clear" },
    { save: true },
    {
      chapterCard: {
        title: "第1章　クリア",
        sub: "転んだ患者さんとポータブルレントゲン",
        foot: "つづいて　第2章「胸が苦しい患者さんとポータブル心電図」",
      },
    },
  ],
};
