/* ===========================
   1. ハンバーガーメニュー
=========================== */
(() => {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  const closeMenu = () => {
    toggle.classList.remove('is-open');
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    toggle.classList.add('is-open');
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'メニューを閉じる');
    document.body.style.overflow = 'hidden';
  };

  toggle.addEventListener('click', () => {
    if (nav.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // ナビ内リンクをクリックしたら閉じる
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
})();


/* ===========================
   2. スクロール時フェードイン
=========================== */
(() => {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    // フォールバック：全部表示
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  targets.forEach(el => io.observe(el));
})();


/* ===========================
   3. カレンダーUI
=========================== */
(() => {
  const grid = document.getElementById('calGrid');
  const title = document.getElementById('calTitle');
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  const selectedDateEl = document.getElementById('selectedDate');
  const submitBtn = document.getElementById('submitReserve');

  // モーダル関連
  const modal = document.getElementById('calModal');
  const trigger = document.getElementById('dateTrigger');
  const backdrop = document.getElementById('calBackdrop');
  const closeBtn = document.getElementById('calClose');

  if (!grid || !title) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();   // 0-11
  let selected = null;                // 選択した Date

  // 休業日判定（定休日なし）
  const isHoliday = (date) => false;

  // 過去日付は不可
  const isPast = (date) => date < today;

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  // モーダル開閉
  const openModal = () => {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  trigger?.addEventListener('click', openModal);
  backdrop?.addEventListener('click', closeModal);
  closeBtn?.addEventListener('click', closeModal);

  // Escキーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) {
      closeModal();
    }
  });

  const render = () => {
    title.textContent = `${viewYear}年 ${viewMonth + 1}月`;
    grid.innerHTML = '';

    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startWeekday = firstDay.getDay();   // 0=日
    const daysInMonth = lastDay.getDate();

    // 前の空セル
    for (let i = 0; i < startWeekday; i++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day empty';
      grid.appendChild(cell);
    }

    // 日付セル
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.textContent = d;

      const weekday = date.getDay();
      if (weekday === 0) cell.classList.add('sunday');
      if (weekday === 6) cell.classList.add('saturday');

      if (sameDay(date, today)) cell.classList.add('today');

      if (isPast(date) || isHoliday(date)) {
        cell.classList.add('disabled');
      } else {
        cell.addEventListener('click', () => {
          selected = date;
          const formatted =
            `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
          selectedDateEl.textContent = formatted;
          // トリガーボタンの「未選択」スタイル解除
          if (trigger) trigger.setAttribute('data-empty', 'false');
          render();
          // 選択後、ワンテンポおいてモーダルを閉じる
          setTimeout(closeModal, 200);
        });
      }

      if (selected && sameDay(date, selected)) cell.classList.add('selected');

      grid.appendChild(cell);
    }
  };

  prevBtn?.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    }
    // 過去月は遷移しても今日より前ならガード
    const lastOfTarget = new Date(viewYear, viewMonth + 1, 0);
    if (lastOfTarget < today) {
      // 戻りすぎたら今月に戻す
      viewYear = today.getFullYear();
      viewMonth = today.getMonth();
    }
    render();
  });

  nextBtn?.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    render();
  });

  // 予約確定ボタン → Formspreeで自動送信
  submitBtn?.addEventListener('click', async () => {
    const name    = document.getElementById('reserve-name')?.value.trim();
    const tel     = document.getElementById('reserve-tel')?.value.trim();
    const email   = document.getElementById('reserve-email')?.value.trim();
    const message = document.getElementById('reserve-message')?.value.trim();

    // 写真ファイル名を取得
    const photoInput = document.getElementById('reserve-photo');
    const photoNames = photoInput && photoInput.files.length > 0
      ? Array.from(photoInput.files).map(f => f.name).join('、')
      : '（なし）';

    // バリデーション
    if (!name) {
      alert('お名前をご入力ください。');
      return;
    }
    if (!tel) {
      alert('電話番号をご入力ください。');
      return;
    }

    // ボタンを「送信中…」に変えて多重送信防止
    submitBtn.textContent = '送信中…';
    submitBtn.disabled = true;

    try {
      const res = await fetch('https://formspree.io/f/mzdweldq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          '件名':             `【お家のリフォーム】お問い合わせ（${name}様）`,
          'お名前':           name,
          '電話番号':         tel,
          'メールアドレス':   email   || '（未入力）',
          'お問い合わせ内容': message || '（未入力）',
          '添付写真ファイル名': photoNames,
        })
      });

      if (res.ok) {
        // 送信成功
        alert(
          `送信が完了しました。\n\n` +
          `【お名前】${name}様\n` +
          `【電話番号】${tel}\n\n` +
          `担当者よりご連絡いたします。\nしばらくお待ちください。`
        );
        // フォームをリセット
        document.getElementById('reserve-name').value = '';
        document.getElementById('reserve-tel').value = '';
        if (document.getElementById('reserve-email'))  document.getElementById('reserve-email').value = '';
        if (document.getElementById('reserve-message')) document.getElementById('reserve-message').value = '';
        if (photoInput) photoInput.value = '';
        const preview = document.getElementById('photoPreview');
        if (preview) preview.innerHTML = '';
      } else {
        const data = await res.json();
        alert('送信に失敗しました。\n時間をおいて再度お試しください。\n\n(' + (data?.error || 'エラー') + ')');
      }
    } catch (err) {
      alert('通信エラーが発生しました。\nインターネット接続を確認して再度お試しください。');
    } finally {
      submitBtn.textContent = '送信する';
      submitBtn.disabled = false;
    }
  });

  render();
})();


/* ===========================
   AIチャットボット
   60秒後に出現、自動接客・クロージング
=========================== */
(() => {
  const launcher  = document.getElementById('botLauncher');
  const window_   = document.getElementById('botWindow');
  const messages  = document.getElementById('botMessages');
  const choices   = document.getElementById('botChoices');
  const cta       = document.getElementById('botCta');
  const closeBtn  = document.getElementById('botClose');
  const badge     = document.getElementById('botBadge');
  const reserveBtn = document.getElementById('botReserveBtn');

  if (!launcher || !window_) return;

  let isOpen = false;
  let conversationStep = 'start';

  // ===========================
  // 会話シナリオ定義
  // ===========================
  const scenarios = {
    start: {
      messages: [
        'こんにちは！👋',
        '石川県かほく市の\n「お家のリフォーム」です。\nお家のことでお困りですか？'
      ],
      choices: [
        { label: '🛁 水まわりを新しくしたい',  next: 'water' },
        { label: '🪟 お部屋を洋室にしたい',    next: 'room' },
        { label: '🔔 設備を交換したい',        next: 'equipment' },
        { label: '💰 費用が気になる',          next: 'price' },
      ]
    },
    water: {
      messages: [
        '水まわりのリフォーム、\nお任せください！💪',
        'どちらをご検討ですか？'
      ],
      choices: [
        { label: '🚿 洗面化粧台を交換したい',  next: 'closing_mizu' },
        { label: '🚽 温水便座を交換したい',    next: 'closing_mizu' },
        { label: '🌬️ 浴室換気扇を交換したい', next: 'closing_mizu' },
        { label: '⬅️ 最初に戻る',              next: 'start_soft' },
      ]
    },
    room: {
      messages: [
        '畳から洋室への変更、\n人気のリフォームです！🏠',
        'フローリング張り替えから\n建具まで丁寧に対応します。\n工賃は一律3万円（税込）です。'
      ],
      choices: [
        { label: '📅 詳しく相談したい',         next: 'closing_room' },
        { label: '📸 施工事例を見たい',          next: 'works' },
        { label: '⬅️ 最初に戻る',               next: 'start_soft' },
      ]
    },
    equipment: {
      messages: [
        '設備交換もお気軽に\nご相談ください！🔧',
        '取り扱いメニューを\nご案内します。'
      ],
      choices: [
        { label: '🔔 インターホン交換（工賃1万円）', next: 'closing_eq' },
        { label: '🍳 レンジフード交換（工賃2万円）', next: 'closing_eq' },
        { label: '📋 その他の設備について聞きたい', next: 'closing_eq' },
        { label: '⬅️ 最初に戻る',                  next: 'start_soft' },
      ]
    },
    price: {
      messages: [
        'ご安心ください！\n工賃のみでのご依頼も可能です💡',
        '商品をお客様がご用意の場合、\n工賃だけをお支払いいただけます。\n\n📌 工賃の目安\n・設備交換系：1万円〜\n・洗面化粧台・レンジフード：2万円\n・畳から洋室変更：3万円'
      ],
      choices: [
        { label: '📞 まずは電話で相談したい',    next: 'closing_tel' },
        { label: '📅 オンラインで予約したい',    next: 'closing_web' },
        { label: '❓ もっと詳しく聞きたい',      next: 'start_soft' },
      ]
    },
    works: {
      messages: [
        '施工事例をご覧ください📸',
        '和室から明るいフローリングの\n洋室にリフォームした事例です。\nページ内の「施工事例」を\nご覧いただけますか？'
      ],
      choices: [
        { label: '📅 相談・見積もりを依頼したい', next: 'closing_room' },
        { label: '⬅️ 最初に戻る',                next: 'start_soft' },
      ]
    },
    closing_mizu: {
      messages: [
        'ありがとうございます！',
        '担当者が丁寧にご説明します。\nまずはお気軽にご連絡ください📞\n\n📌 無料でお見積もりいたします。\nお電話またはWebからご予約できます。'
      ],
      choices: [],
      cta: true
    },
    closing_room: {
      messages: [
        '畳から洋室へのリフォーム、\nぜひご相談ください！',
        '現地を確認してから\n正式なお見積もりをいたします。\n無料でお伺いします📐\n\nまずはご連絡ください！'
      ],
      choices: [],
      cta: true
    },
    closing_eq: {
      messages: [
        '設備交換のご相談、\nお任せください！',
        'メーカー・型番をお知らせいただければ\nこちらで本体を手配することも可能です。\n\nまずはお気軽にご連絡ください📞'
      ],
      choices: [],
      cta: true
    },
    closing_tel: {
      messages: [
        'お電話、お待ちしています！',
        '📞 080-9996-8090\n\n営業時間 9:00〜18:00\nお気軽にお電話ください😊'
      ],
      choices: [],
      cta: true
    },
    closing_web: {
      messages: [
        'Webからのご予約、\nありがとうございます！',
        '下のボタンから予約フォームに\n進んでください。\n担当者よりご連絡いたします📩'
      ],
      choices: [],
      cta: true
    },
    start_soft: {
      messages: ['改めて、どのようなことでお困りですか？'],
      choices: [
        { label: '🛁 水まわりを新しくしたい',  next: 'water' },
        { label: '🪟 お部屋を洋室にしたい',    next: 'room' },
        { label: '🔔 設備を交換したい',        next: 'equipment' },
        { label: '💰 費用が気になる',          next: 'price' },
      ]
    }
  };

  // ===========================
  // ユーティリティ関数
  // ===========================

  // メッセージを追加
  const addBotMessage = (text, delay = 0) => {
    return new Promise(resolve => {
      setTimeout(() => {
        // タイピング表示
        const typing = document.createElement('div');
        typing.className = 'bot-msg bot-typing';
        typing.innerHTML = `
          <div class="bot-msg-avatar">🏠</div>
          <div class="bot-msg-bubble">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>`;
        messages.appendChild(typing);
        scrollToBottom();

        // タイピング後にメッセージ表示
        const typingTime = Math.min(800 + text.length * 20, 1500);
        setTimeout(() => {
          typing.remove();
          const msg = document.createElement('div');
          msg.className = 'bot-msg';
          msg.innerHTML = `
            <div class="bot-msg-avatar">🏠</div>
            <div class="bot-msg-bubble">${text.replace(/\n/g, '<br>')}</div>`;
          messages.appendChild(msg);
          scrollToBottom();
          resolve();
        }, typingTime);
      }, delay);
    });
  };

  // ユーザーの選択を表示
  const addUserMessage = (text) => {
    const msg = document.createElement('div');
    msg.className = 'bot-msg user';
    msg.innerHTML = `<div class="bot-msg-bubble">${text}</div>`;
    messages.appendChild(msg);
    scrollToBottom();
  };

  // 選択肢ボタンを表示
  const showChoices = (choiceList) => {
    choices.innerHTML = '';
    choiceList.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'bot-choice-btn';
      btn.textContent = choice.label;
      btn.addEventListener('click', () => handleChoice(choice));
      choices.appendChild(btn);
    });
  };

  // 一番下にスクロール
  const scrollToBottom = () => {
    messages.scrollTop = messages.scrollHeight;
  };

  // ===========================
  // 会話制御
  // ===========================
  const runScenario = async (stepKey) => {
    const step = scenarios[stepKey];
    if (!step) return;

    conversationStep = stepKey;
    choices.innerHTML = '';
    cta.style.display = 'none';

    // メッセージを順番に表示
    for (let i = 0; i < step.messages.length; i++) {
      await addBotMessage(step.messages[i], i === 0 ? 0 : 400);
    }

    // 選択肢 or CTA を表示
    if (step.cta) {
      cta.style.display = 'flex';
    } else if (step.choices.length > 0) {
      showChoices(step.choices);
    }
  };

  const handleChoice = (choice) => {
    // ユーザーの選択を表示
    addUserMessage(choice.label);
    choices.innerHTML = '';

    // 少し間を置いてから次のシナリオへ
    setTimeout(() => {
      runScenario(choice.next);
    }, 300);
  };

  // ===========================
  // 開閉制御
  // ===========================
  const openBot = () => {
    isOpen = true;
    window_.classList.add('is-open');
    window_.setAttribute('aria-hidden', 'false');
    badge.classList.add('hide');
    // 初回のみシナリオを開始
    if (messages.children.length === 0) {
      runScenario('start');
    }
  };

  const closeBot = () => {
    isOpen = false;
    window_.classList.remove('is-open');
    window_.setAttribute('aria-hidden', 'true');
  };

  launcher.addEventListener('click', () => {
    if (isOpen) { closeBot(); } else { openBot(); }
  });

  closeBtn.addEventListener('click', closeBot);

  // 予約フォームへスクロール
  reserveBtn?.addEventListener('click', () => {
    closeBot();
    const reserve = document.getElementById('reserve');
    if (reserve) {
      reserve.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // ===========================
  // 60秒後に自動出現
  // ===========================
  setTimeout(() => {
    launcher.classList.add('is-visible');

    // 5秒後に自動で開く（ユーザーがまだ開いていなければ）
    setTimeout(() => {
      if (!isOpen) {
        openBot();
      }
    }, 5000);

  }, 60000); // 60秒後

})();


/* ===========================
   スパム対策：メールアドレス動的生成
   ロボットに読み取られないよう、
   JavaScriptでアドレスを組み立てる
=========================== */
(() => {
  const emailEl = document.getElementById('contactEmail');
  if (!emailEl) return;

  // メールアドレスを分割して保持（ロボット対策）
  const user   = 'q10_lake';
  const domain = 'yahoo.co.jp';

  emailEl.addEventListener('click', () => {
    if (emailEl.classList.contains('revealed')) {
      // すでに表示済みならメーラーを開く
      window.location.href = `mailto:${user}@${domain}`;
      return;
    }
    // 初回クリックでアドレスを表示
    emailEl.textContent = `${user}@${domain}`;
    emailEl.classList.add('revealed');
    emailEl.title = 'クリックでメーラーを開く';
  });

  // ホバー時にガイドテキストを表示
  emailEl.title = 'クリックしてメールアドレスを表示';
})();


/* ===========================
   写真プレビュー機能
=========================== */
(() => {
  const photoInput = document.getElementById('reserve-photo');
  const preview    = document.getElementById('photoPreview');
  if (!photoInput || !preview) return;

  photoInput.addEventListener('change', () => {
    preview.innerHTML = '';
    Array.from(photoInput.files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const item = document.createElement('div');
        item.className = 'photo-preview-item';
        item.innerHTML = `
          <img src="${e.target.result}" alt="写真${index + 1}" />
          <button class="photo-preview-remove" data-index="${index}" aria-label="削除">✕</button>
        `;
        preview.appendChild(item);
      };
      reader.readAsDataURL(file);
    });
  });
})();
