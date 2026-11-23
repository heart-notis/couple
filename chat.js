/* 💬 카톡 대화 기록: 글자 → 말풍선
   index.html(사이트)과 admin.html(제작자 페이지 미리보기)이 같이 써요.

   쓰는 법 (한 줄에 하나씩)
     도하: 형 뭐해?                 → 이름: 대사
     [오후 3:21] 우진: 너 생각       → 앞에 시간을 붙이면 말풍선 옆에 시간이 떠요
     --- 11월 23일 월요일            → 날짜 구분선
     *둘은 한참 웃었다*              → 이름 없는 줄은 가운데 지문
     (빈 줄 없이 이어 쓴 줄은 바로 위 말풍선에 이어 붙어요)
   카카오톡 '대화 내보내기' 글을 그대로 붙여넣어도 돼요 (PC · 모바일 둘 다) */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const HEART = `<svg class="ghrt" viewBox="0 0 24 24" role="img" aria-label="♥"><path fill="url(#hg)" d="M12 21.2s-8.6-5.2-10.4-10.6C.3 6.6 2.8 2.8 6.7 2.8c2.3 0 4.1 1.2 5.3 3.1 1.2-1.9 3-3.1 5.3-3.1 3.9 0 6.4 3.8 5.1 7.8C20.6 16 12 21.2 12 21.2z"/></svg>`;
  const fmt = str => esc(str)
    .replace(/\*\*([^*\n]+?)\*\*/g, "<b>$1</b>")
    .replace(/\*([^*\n]+?)\*/g, "<i>$1</i>")
    .replace(/♥\uFE0F?/g, HEART);

  /* ---------- 디데이 ---------- */
  const toDay = d => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ""); return m ? new Date(+m[1], m[2] - 1, +m[3]) : new Date(NaN); };
  // 사귄 날 = D+1 (한국식). 기록 날짜(date)를 안 주면 오늘 기준
  function dPlus(start, date) {
    const a = toDay(start), b = date ? toDay(date) : new Date();
    if (isNaN(a) || isNaN(b)) return null;
    return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5) + 1;
  }
  const dLabel = n => n == null ? "" : n >= 1 ? `D+${n}일` : `D-${1 - n}`;

  /* ---------- 글자 읽기 ---------- */
  const T = "(?:오전|오후)\\s*\\d{1,2}:\\d{2}|\\d{1,2}:\\d{2}";
  const RE_PC = new RegExp(`^\\[([^\\]]+)\\]\\s*\\[(${T})\\]\\s?(.*)$`);
  const RE_MO = new RegExp(`^(\\d{4})[.년]\\s*(\\d{1,2})[.월]\\s*(\\d{1,2})[.일]?\\s*(${T}),\\s*(.+?)\\s:\\s(.*)$`);
  const RE_MO_DATE = /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*([월화수목금토일]요일)?\s*$/;
  const RE_DATE = /^-{2,}\s*(.+?)\s*-*\s*$/;
  const RE_SIMPLE = new RegExp(`^(?:\\[?(${T})\\]?\\s+)?([^:*\\[\\]()\\s][^:*\\[\\]()]{0,14}?)\\s*:\\s?(.*)$`);
  const SKIP = /님과 카카오톡 대화\s*$|^저장한 날짜\s*:|^\d{4}년 \d{1,2}월 \d{1,2}일 (오전|오후) \d{1,2}:\d{2}$/;
  const WEEK = "일월화수목금토";
  const dateText = (y, m, d) => `${y}년 ${+m}월 ${+d}일 ${WEEK[new Date(+y, m - 1, +d).getDay()]}요일`;
  const niceTime = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ""); if (!m) return (t || "").replace(/\s+/g, " "); const h = +m[1]; return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${m[2]}`; };

  function parse(raw, couple = {}) {
    const L = (couple.left || "").trim(), R = (couple.right || "").trim();
    const sideOf = n => (n === R || n === "나") ? "R" : "L";
    const out = []; let cur = null, lastYmd = "";
    const msg = (name, time, text) => { name = name.trim(); cur = { t: "msg", name, side: sideOf(name), time: niceTime(time), text }; out.push(cur); };
    for (const line of String(raw || "").replace(/\r/g, "").split("\n")) {
      const t = line.trim();
      if (!t) { cur = null; continue; }
      if (SKIP.test(t)) continue;
      let m;
      if ((m = RE_DATE.exec(t))) { const md = RE_MO_DATE.exec(m[1]); out.push({ t: "date", text: md ? dateText(md[1], md[2], md[3]) : m[1] }); cur = null; continue; }
      if ((m = RE_MO_DATE.exec(t))) { lastYmd = `${m[1]}-${+m[2]}-${+m[3]}`; out.push({ t: "date", text: dateText(m[1], m[2], m[3]) }); cur = null; continue; }
      if ((m = RE_PC.exec(t))) { msg(m[1], m[2], m[3]); continue; }
      if ((m = RE_MO.exec(t))) {
        const ymd = `${m[1]}-${+m[2]}-${+m[3]}`;
        if (ymd !== lastYmd) { lastYmd = ymd; out.push({ t: "date", text: dateText(m[1], m[2], m[3]) }); }
        msg(m[5], m[4], m[6]); continue;
      }
      // "이름: 대사" — 시간이 붙었거나, 커플 이름이거나, 위에 이어 붙을 말풍선이 없으면 새 말풍선
      if (!/^\*/.test(t) && (m = RE_SIMPLE.exec(t)) && (m[1] || !cur || [L, R, "나"].includes(m[2].trim()))) { msg(m[2], m[1] || "", m[3]); continue; }
      if (cur) { cur.text += "\n" + t; continue; }          // 바로 위 말풍선에 이어 붙이기
      out.push({ t: "narr", text: t });
    }
    return out;
  }

  /* ---------- 대화창 모양 ----------
     ava: 프사 위치(top 위 · bottom 아래 · none 없음) / time: side 말풍선 옆 · center 가운데 / bg: 커플 배경색을 쓸지 */
  const STYLES = {
    kakao:    { label: "카카오톡",   ava: "top",    name: true,  time: "side",   bg: true },
    imessage: { label: "아이메시지", ava: "none",   name: false, time: "center", bg: false },
    insta:    { label: "인스타 DM",  ava: "bottom", name: false, time: "center", bg: false },
    line:     { label: "라인",       ava: "top",    name: true,  time: "side",   bg: true }
  };
  const styleOf = k => STYLES[k] ? k : "kakao";

  /* ---------- 말풍선 그리기 ---------- */
  const PHOTO = /^(사진|동영상|이모티콘|사진 \d+장|<사진 읽지 않음>)$/;
  function avatar(name, couple, cls = "kk-ava") {
    const img = name === (couple.left || "").trim() ? couple.leftAva : name === (couple.right || "").trim() ? couple.rightAva : "";
    return img ? `<div class="${cls}"><img src="${esc(img)}" alt="" /></div>`
      : `<div class="${cls} kk-ini">${esc((name || "?").charAt(0))}</div>`;
  }
  function render(items, couple = {}, style = "kakao") {
    const S = STYLES[styleOf(style)];
    if (!items.length) return `<div class="kk-empty">아직 대화가 없어요</div>`;
    const same = (a, b) => a && b && a.t === "msg" && b.t === "msg" && a.name === b.name && a.time === b.time;
    let shown = "";
    const lastR = (() => { for (let i = items.length - 1; i >= 0; i--) if (items[i].t === "msg") return items[i].side === "R" ? i : -1; return -1; })();
    return items.map((m, i) => {
      if (m.t === "date") { shown = ""; return `<div class="kk-date"><span>${esc(m.text)}</span></div>`; }
      if (m.t === "narr") return `<div class="kk-narr">${fmt(m.text.replace(/^\*(.*)\*$/, "$1"))}</div>`;
      const first = !same(items[i - 1], m), last = !same(m, items[i + 1]);
      let pre = "";
      if (S.time === "center" && m.time && m.time !== shown) { shown = m.time; pre = `<div class="kk-ctime">${esc(m.time)}</div>`; }
      const bub = PHOTO.test(m.text.trim()) ? `<div class="kk-bub kk-media">${/동영상/.test(m.text) ? "🎬" : /이모티콘/.test(m.text) ? "😊" : "📷"} ${esc(m.text)}</div>` : `<div class="kk-bub">${fmt(m.text)}</div>`;
      const showAva = S.ava === "top" ? first : S.ava === "bottom" ? last : false;
      const ava = m.side === "L" && S.ava !== "none" ? (showAva ? avatar(m.name, couple) : `<div class="kk-ava kk-gap"></div>`) : "";
      return `${pre}<div class="kk-row ${m.side}${first ? " first" : ""}${last ? " last" : ""}">
        ${ava}
        <div class="kk-body">
          ${m.side === "L" && first && S.name ? `<div class="kk-name">${esc(m.name)}</div>` : ""}
          <div class="kk-line">${bub}${S.time === "side" && last && m.time ? `<span class="kk-time">${m.side === "R" && style === "line" ? "읽음<br/>" : ""}${esc(m.time)}</span>` : ""}</div>
          ${i === lastR && style === "imessage" ? `<div class="kk-read">읽음</div>` : ""}
          ${i === lastR && style === "insta" ? `<div class="kk-read">읽음</div>` : ""}
        </div>
      </div>`;
    }).join("");
  }
  // 대화창 위쪽 이름 줄
  function head(couple, style, opt = {}) {
    const L = couple.left || "상대", dd = opt.dd ? `<span class="kh-dd">${esc(opt.dd)}</span>` : "";
    if (style === "imessage") return `<div class="kk-head">${avatar(L, couple, "kh-ava")}<div class="kh-name">${esc(L)} ›</div>${dd}</div>`;
    if (style === "insta") return `<div class="kk-head">${avatar(L, couple, "kh-ava")}<div class="kh-main"><div class="kh-name">${esc(L)}</div><div class="kh-sub">${esc(couple.name || "")}</div></div>${dd}</div>`;
    return `<div class="kk-head"><span class="kh-name">${esc(L)}${couple.right ? `, ${esc(couple.right)}` : ""}</span>${opt.count != null ? `<small>${opt.count}</small>` : ""}${dd}</div>`;
  }
  // opt: { style, dd, head: true면 이름 줄도 }
  function room(raw, couple = {}, opt = {}) {
    const st = styleOf(opt.style || couple.style), items = parse(raw, couple);
    const bg = STYLES[st].bg ? `--kk-bg:${esc(couple.bg || (st === "line" ? "#8cabd9" : "#bacee0"))}` : "";
    return `<div class="kk-room st-${st}" style="${bg}">${opt.head ? head(couple, st, { dd: opt.dd, count: items.filter(m => m.t === "msg").length }) : ""}<div class="kk">${render(items, couple, st)}</div></div>`;
  }

  /* ---------- 모양 ---------- */
  const css = `
    .kk-room { font-size: 14px; line-height: 1.45; letter-spacing: -0.01em; }
    .kk { background: var(--kk-bg, #bacee0); padding: 12px 10px 20px; min-height: 120px; }
    .kk-empty { text-align: center; color: rgba(0,0,0,.4); font-size: .8rem; padding: 26px 0; }
    .kk-date { text-align: center; margin: 12px 0 8px; }
    .kk-date span { display: inline-block; padding: 4px 13px; border-radius: 999px; background: rgba(30,40,55,.18); color: #fff; font-size: .72rem; font-weight: 600; }
    .kk-ctime { text-align: center; margin: 12px 0 6px; font-size: .7rem; color: #8e8e93; font-weight: 600; }
    .kk-narr { text-align: center; margin: 10px 18px; padding: 6px 12px; border-radius: 12px; background: rgba(255,255,255,.42); color: #3f4a57; font-size: .8rem; white-space: pre-line; }
    .kk-row { display: flex; gap: 8px; margin-top: 4px; align-items: flex-start; }
    .kk-row.first { margin-top: 11px; }
    .kk-row.R { justify-content: flex-end; }
    .kk-ava { width: 38px; height: 38px; border-radius: 15px; flex-shrink: 0; overflow: hidden; background: #9fb6cc; color: #fff; font-weight: 800; font-size: .9rem; display: flex; align-items: center; justify-content: center; }
    .kk-ava img, .kh-ava img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .kk-gap { height: 0; visibility: hidden; }
    .kk-body { max-width: 74%; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; }
    .R .kk-body { align-items: flex-end; }
    .kk-name { font-size: .76rem; color: #3b4652; margin: 1px 0 4px 2px; }
    .kk-line { display: flex; align-items: flex-end; gap: 5px; max-width: 100%; }
    .R .kk-line { flex-direction: row-reverse; }
    .kk-bub { position: relative; background: #fff; color: #191919; padding: 7px 10px; border-radius: 14px; font-size: .9rem; white-space: pre-wrap; word-break: break-word; min-width: 0; }
    .R .kk-bub { background: #fee500; }
    .kk-media { opacity: .85; font-size: .84rem; }
    .kk-time { font-size: .64rem; color: #56616d; white-space: nowrap; flex-shrink: 0; padding-bottom: 1px; line-height: 1.25; }
    .R .kk-time { text-align: right; }
    .kk-read { font-size: .66rem; color: #8e8e93; margin-top: 3px; font-weight: 600; }
    .kk-room .ghrt { display: inline-block; width: 1em; height: 1em; vertical-align: -0.14em; }
    .kk-head { display: flex; align-items: center; gap: 8px; padding: 10px 16px; font-weight: 800; font-size: .88rem; color: #26313c; }
    .kk-head small { font-weight: 600; color: #56616d; font-size: .74rem; }
    .kh-dd { margin-left: auto; padding: 2px 9px; border-radius: 999px; background: rgba(255,255,255,.6); font-size: .72rem; font-weight: 800; }
    .kh-ava { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #b8c2cc; color: #fff; font-weight: 800; font-size: .8rem; display: flex; align-items: center; justify-content: center; }

    /* 카카오톡 */
    .st-kakao .kk-head { background: var(--kk-bg, #bacee0); filter: brightness(.96); }
    .st-kakao .first.L .kk-bub { border-top-left-radius: 4px; }
    .st-kakao .first.R .kk-bub { border-top-right-radius: 4px; }
    .st-kakao .first .kk-bub::before { content: ""; position: absolute; top: 0; width: 0; height: 0; border-bottom: 9px solid transparent; }
    .st-kakao .first.L .kk-bub::before { left: -6px; border-right: 8px solid #fff; }
    .st-kakao .first.R .kk-bub::before { right: -6px; border-left: 8px solid #fee500; }

    /* 아이메시지 */
    .st-imessage .kk { background: #fff; padding: 8px 12px 18px; }
    .st-imessage .kk-head { flex-direction: column; gap: 3px; padding: 12px 16px 8px; background: #f6f6f8; border-bottom: 1px solid #e5e5ea; font-weight: 500; position: relative; }
    .st-imessage .kh-ava { width: 46px; height: 46px; font-size: 1rem; background: linear-gradient(180deg, #a5abb7, #858b97); }
    .st-imessage .kh-name { font-size: .72rem; color: #1c1c1e; }
    .st-imessage .kh-dd { position: absolute; right: 12px; top: 12px; background: #e9e9eb; color: #3a3a3c; }
    .st-imessage .kk-date span { background: none; color: #8e8e93; padding: 0; font-size: .7rem; }
    .st-imessage .kk-narr { background: none; color: #8e8e93; font-size: .76rem; }
    .st-imessage .kk-row { margin-top: 2px; }
    .st-imessage .kk-row.first { margin-top: 8px; }
    .st-imessage .kk-body { max-width: 76%; }
    .st-imessage .kk-bub { background: #e9e9eb; color: #000; border-radius: 18px; padding: 7px 12px; font-size: .92rem; }
    .st-imessage .R .kk-bub { background: #0a84ff; color: #fff; }
    .st-imessage .last.L .kk-bub { border-bottom-left-radius: 5px; }
    .st-imessage .last.R .kk-bub { border-bottom-right-radius: 5px; }
    .st-imessage .kk-read { align-self: flex-end; }

    /* 인스타 DM */
    .st-insta .kk { background: #fff; padding: 8px 12px 18px; }
    .st-insta .kk-head { background: #fff; border-bottom: 1px solid #efefef; padding: 10px 14px; }
    .st-insta .kh-ava { width: 34px; height: 34px; background: linear-gradient(135deg, #f9ce34, #ee2a7b 55%, #6228d7); padding: 2px; }
    .st-insta .kh-ava img { border-radius: 50%; border: 2px solid #fff; }
    .st-insta .kh-main { min-width: 0; }
    .st-insta .kh-name { font-size: .9rem; color: #000; }
    .st-insta .kh-sub { font-size: .72rem; color: #8e8e8e; font-weight: 500; }
    .st-insta .kh-dd { background: #efefef; color: #262626; }
    .st-insta .kk-date span { background: none; color: #8e8e8e; padding: 0; font-size: .7rem; }
    .st-insta .kk-narr { background: none; color: #8e8e8e; font-size: .76rem; }
    .st-insta .kk-row { margin-top: 2px; align-items: flex-end; }
    .st-insta .kk-row.first { margin-top: 8px; }
    .st-insta .kk-ava { width: 28px; height: 28px; border-radius: 50%; font-size: .72rem; }
    .st-insta .kk-bub { background: #efefef; color: #000; border-radius: 20px; padding: 8px 13px; font-size: .9rem; }
    .st-insta .R .kk-bub { background: linear-gradient(135deg, #a033ff 0%, #5b5bff 55%, #3797f0 100%); color: #fff; }
    .st-insta .L:not(.first) .kk-bub { border-top-left-radius: 6px; }
    .st-insta .L:not(.last) .kk-bub { border-bottom-left-radius: 6px; }
    .st-insta .R:not(.first) .kk-bub { border-top-right-radius: 6px; }
    .st-insta .R:not(.last) .kk-bub { border-bottom-right-radius: 6px; }
    .st-insta .kk-read { align-self: flex-end; }

    /* 라인 */
    .st-line .kk-head { background: #273246; color: #fff; }
    .st-line .kk-head small { color: rgba(255,255,255,.6); }
    .st-line .kh-dd { background: rgba(255,255,255,.18); color: #fff; }
    .st-line .kk-ava { border-radius: 50%; }
    .st-line .kk-name { color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.15); }
    .st-line .kk-date span { background: rgba(0,0,0,.22); }
    .st-line .kk-bub { border-radius: 18px; padding: 8px 12px; }
    .st-line .R .kk-bub { background: #8de055; }
    .st-line .first.L .kk-bub::before, .st-line .first.R .kk-bub::before { content: ""; position: absolute; top: 4px; width: 10px; height: 10px; }
    .st-line .first.L .kk-bub::before { left: -5px; background: #fff; clip-path: polygon(100% 0, 0 0, 100% 100%); border-radius: 0 0 0 3px; }
    .st-line .first.R .kk-bub::before { right: -5px; background: #8de055; clip-path: polygon(0 0, 100% 0, 0 100%); }
    .st-line .kk-time { color: rgba(255,255,255,.9); }`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  window.KK = { parse, render, room, head, dPlus, dLabel, fmt, esc, STYLES };
})();
