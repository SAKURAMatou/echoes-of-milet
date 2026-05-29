export const ABOUT_COPY = {
  zh: {
    hero: {
      eyebrow: 'ABOUT ME',
      title: 'For milet, for miles — a quiet place to stay.',
      lead: '这是一个围绕 milet， 由miles 创造的小小角落。从 2024 年成为 miles 开始，我在这里记录她的音乐、现场与点滴，也记录作为听众逐渐加深的理解与共鸣。',
    },
    story: {
      paragraphs: [
        '我希望这里不是信息的堆砌，而更像一本不断更新的miles的手账：有热爱，有整理，也带着一点执拗的审美。',
        `围绕 milet 的内容，是这个站点最初的起点。
从 2024 年成为 miles 开始，我逐渐了解并记录关于她的作品与现场。
这里不会停留在“资料整理”，而更希望保留作品带来的情绪、现场的感受，以及作为听众的观察。`,
        {
          text: '这里并不是官方信息的发布地，虽然我会尽力确保内容的准确，但难免会有疏漏和错误。如果你发现任何问题，欢迎通过下方的反馈表单联系我。官方网站请参考：',
          linkLabel: 'milet.jp',
          linkUrl: 'https://milet.jp/',
        },
        {
          text: '关于本站：目前所有内容均基于网络公开信息整理，并由我持续维护',
          linkLabel: '- miles DML',
          linkUrl: 'https://www.instagram.com/dml_4016/',
          linkSuffix: '；2026年5月开始有了更多的miles的伙伴加入内容的维护。',
        },
        `关于网站名称：「echoes of milet」这个名字，源于我对现场音乐的一种感受。
每一次参加 milet 的 live 之后，总会留下难以消散的余韵——
即使演出已经结束，那些声音、情绪与瞬间，仍然在心中不断回响。
成为 miles 的时间不算长，参与过的 live 也不多。
但我相信，这种“意犹未尽”的感觉，并不只属于我一个人。
「echoes」，正是这种回响的具象。
它不仅来自现场，也延续在每一次回忆、记录与再次聆听之中。
同时，这个名字也来自我非常喜欢的一首歌《Rewrite》中的一句歌词：
“壁伝いのEchoes will go”
那些回响，也许微弱，却始终在某个地方继续传递着。`,
        '关于我：一个追寻milet脚步的普通miles，但至今还没有拿到过签名 ::>_<:: ……果然还是想要一份亲签。',
      ],
    },
    feedback: {
      eyebrow: 'MESSAGE TO THE OWNER',
      title: 'Send a note',
      desc: '如果你想反馈问题、交流内容、纠正资料，或者只是想打个招呼，都可以通过下面的表单留言。',
      closeLabel: '关闭说明',
      steps: [
        '填写邮箱、标题和内容后点击提交。',
        '页面会先进入确认步骤，便于你再次核对内容。',
        '确认无误后正式提交，表单会清空并弹窗提示发送成功。',
      ],
    },
    form: {
      emailLabel: '邮箱',
      emailPlaceholder: 'you@example.com',
      titleLabel: '标题',
      titlePlaceholder: '例如：页面建议、资料勘误、合作沟通',
      contentLabel: '内容',
      contentPlaceholder: '想说的话可以写在这里，建议尽量描述清楚背景与需求。',
      honeypotLabel: '请勿填写此字段',
      turnstileTitle: '安全验证',
      turnstileDesc: '请完成下方的人机验证后再提交。',
      turnstilePending:
        '尚未配置 Turnstile 站点 Key，当前使用前端占位模式。接入后端前，请在环境变量中配置 `VITE_TURNSTILE_SITE_KEY`。',
      submitHint: '提交前会先进入确认步骤，你仍然可以返回修改。',
      submit: '进入确认',
      submitting: '提交中...',
    },
    confirm: {
      eyebrow: 'CONFIRMATION',
      title: 'Check before sending',
      desc: '请确认以下内容无误。正式提交后，表单会被清空。',
      back: '返回修改',
      submit: '确认并发送',
    },
    toast: {
      title: '发送成功',
      message: '留言已经提交，感谢你的反馈。',
    },
    footer: {
      copyrightTitle: 'COPYRIGHT NOTICE',
      copyrightBody:
        '本站为个人非商业站点。除特别说明外，页面设计、文案整理与前端实现均为站点 owner 自行维护；引用内容的原始版权归对应权利方所有，如有不妥请联系删除。',
      techInfoTitle: 'TECH & OPERATION',
      techInfoItems: [
        '基于 Vue 3、Vite、Tailwind CSS、Cloudflare等构建。',
        '当前页面内容支持中文与日文切换，后续可继续扩展更多语言。',
      ],
    },
    validation: {
      emailRequired: '请输入邮箱地址。',
      emailInvalid: '请输入有效的邮箱地址。',
      titleRequired: '请输入标题。',
      titleTooLong: '标题不能超过 120 个字符。',
      contentRequired: '请输入留言内容。',
      contentTooLong: '内容不能超过 2000 个字符。',
      turnstileRequired: '请先完成安全验证。',
      honeypotBlocked: '提交未通过安全校验。',
      submitFailed: '提交失败，请稍后重试。',
    },
  },
  jp: {
    hero: {
      eyebrow: 'ABOUT ME',
      title: 'For milet, for miles — a quiet place to stay.',
      lead: 'ここは milet を中心にした、milesにより作った小さな場所です。2024年にmilesになってから、彼女の音楽やライブ、さまざまな瞬間を記録しながら、リスナーとして深まっていく理解や共鳴も残しています。',
    },
    story: {
      paragraphs: [
        `ここを単なる情報の集積ではなく、書き続けていく「milesの手帳」のような場所にしたいと思っています。好きという気持ちと整理、そして少しのこだわりを込めて。`,
        `milet を軸としたコンテンツは、このサイトの出発点です。2024年にmilesになってから、彼女の作品やライブについて少しずつ知り、記録してきました。
単なるアーカイブではなく、音楽から受け取った感情やライブの空気、そして一人のリスナーとしての視点を残していきたいと思っています。`,
        {
          text: 'ここは公式な情報の発信場所ではありません。内容の正確性にはできる限り配慮していますが、誤りや不備が含まれる可能性があります。もし問題やお気づきの点がありましたら、下記のフィードバックフォームよりご連絡ください。公式サイトについては、',
          linkLabel: 'milet公式サイト',
          linkUrl: 'https://milet.jp/',
          linkSuffix: ' をご参照ください。',
        },

        {
          text: `このサイトついて：サイトの内容は公開されている情報をもとに自分で収集・整理し、継続的に更新しています`,
          linkLabel: '- miles DMLより',
          linkUrl: 'https://www.instagram.com/dml_4016/',
          linkSuffix:
            '；2026年5月からは、さらに多くのmilesの仲間が内容のメンテナンスに参加してくれるようになりました。',
        },
        `titleについて：「echoes of milet」という名前は、ライブの余韻から生まれました。

milet のライブが終わったあとも、
音や感情、あの瞬間の空気はすぐには消えず、心の中で静かに響き続けます。
milesになってまだ日が浅く、参加したライブの数も多くはありません。
それでも、この「終わってほしくない」と感じる余韻は、きっと多くのmilesが共有しているものだと思います。
「echoes」は、その余韻を表す言葉です。
ライブの中だけでなく、記憶や記録、そして何度も聴き返す中で、静かに続いていく響き。
そしてこの名前は、私の好きな楽曲「Rewrite」の歌詞、
「壁伝いのEchoes will go」からも着想を得ています。
その響きは小さくても、どこかで確かに続いていく——
そんなイメージを込めています。`,
        '私について：milet を追いかけている、ただのmilesです。いまだにサインはもらえていなくて ::>_<:: ……いつか直筆サインを手に入れたいと思っています。',
      ],
    },
    feedback: {
      eyebrow: 'MESSAGE TO THE OWNER',
      title: 'Send a note',
      desc: '内容の誤り、ページ改善の提案、感想、ちょっとした挨拶まで、気軽にメッセージを送ってください。',
      closeLabel: '説明を閉じる',
      steps: [
        'メールアドレス、タイトル、本文を入力して送信ボタンを押します。',
        'その後、確認ステップに進み、内容をもう一度確認できます。',
        '問題なければ正式送信し、フォームは空に戻って送信成功のポップアップを表示します。',
      ],
    },
    form: {
      emailLabel: 'メールアドレス',
      emailPlaceholder: 'you@example.com',
      titleLabel: 'タイトル',
      titlePlaceholder: '例: ページ改善、情報修正、コラボ相談',
      contentLabel: '本文',
      contentPlaceholder: '背景や要望が伝わるように、できるだけ具体的に書いてください。',
      honeypotLabel: 'この項目は入力しないでください',
      turnstileTitle: 'セキュリティ認証',
      turnstileDesc: '送信前に下の認証を完了してください。',
      turnstilePending:
        'Turnstile の site key が未設定のため、現在はフロントエンドのプレースホルダー表示です。接続時は `VITE_TURNSTILE_SITE_KEY` を設定してください。',
      submitHint: '送信前に確認ステップへ進むため、まだ修正できます。',
      submit: '確認へ進む',
      submitting: '送信中...',
    },
    confirm: {
      eyebrow: 'CONFIRMATION',
      title: 'Check before sending',
      desc: '以下の内容を確認してください。正式送信後はフォームがリセットされます。',
      back: '修正に戻る',
      submit: '確認して送信',
    },
    toast: {
      title: '送信完了',
      message: 'メッセージを受け取りました。ありがとうございます。',
    },
    footer: {
      copyrightTitle: 'COPYRIGHT NOTICE',
      copyrightBody:
        'このサイトは個人による非商用サイトです。特記のない限り、ページ設計、文章整理、フロントエンド実装は site owner が管理しています。引用物の権利は各権利者に帰属し、問題があれば連絡に応じて対応します。',
      techInfoTitle: 'TECH & OPERATION',
      techInfoItems: [
        '本サイトは Vue 3、Vite、Tailwind CSS、CSS、Cloudflare を基盤に構築しています。',
        '現在は中国語と日本語の切り替えに対応し、今後さらに拡張可能です。',
      ],
    },
    validation: {
      emailRequired: 'メールアドレスを入力してください。',
      emailInvalid: '有効なメールアドレスを入力してください。',
      titleRequired: 'タイトルを入力してください。',
      titleTooLong: 'タイトルは 120 文字以内で入力してください。',
      contentRequired: '本文を入力してください。',
      contentTooLong: '本文は 2000 文字以内で入力してください。',
      turnstileRequired: 'セキュリティ認証を完了してください。',
      honeypotBlocked: 'セキュリティチェックに失敗しました。',
      submitFailed: '送信に失敗しました。しばらくしてから再試行してください。',
    },
  },
}
