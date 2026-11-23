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
    let li = -1;
    const msg = (name, time, text) => { name = name.trim(); cur = { t: "msg", name, side: sideOf(name), time: niceTime(time), text, ln: [li, li] }; out.push(cur); };
    for (const line of String(raw || "").replace(/\r/g, "").split("\n")) {
      li++;
      const t = line.trim();
      if (!t) { cur = null; continue; }
      if (SKIP.test(t)) continue;
      let m;
      if ((m = RE_DATE.exec(t))) { const md = RE_MO_DATE.exec(m[1]); out.push({ t: "date", text: md ? dateText(md[1], md[2], md[3]) : m[1], ln: [li, li] }); cur = null; continue; }
      if ((m = RE_MO_DATE.exec(t))) { lastYmd = `${m[1]}-${+m[2]}-${+m[3]}`; out.push({ t: "date", text: dateText(m[1], m[2], m[3]), ln: [li, li] }); cur = null; continue; }
      if ((m = RE_PC.exec(t))) { msg(m[1], m[2], m[3]); continue; }
      if ((m = RE_MO.exec(t))) {
        const ymd = `${m[1]}-${+m[2]}-${+m[3]}`;
        if (ymd !== lastYmd) { lastYmd = ymd; out.push({ t: "date", text: dateText(m[1], m[2], m[3]) }); }
        msg(m[5], m[4], m[6]); continue;
      }
      // "이름: 대사" — 시간이 붙었거나, 커플 이름이거나, 위에 이어 붙을 말풍선이 없으면 새 말풍선
      if (!/^\*/.test(t) && (m = RE_SIMPLE.exec(t)) && (m[1] || !cur || [L, R, "나"].includes(m[2].trim()))) { msg(m[2], m[1] || "", m[3]); continue; }
      if (cur) { cur.text += "\n" + t; cur.ln[1] = li; continue; }          // 바로 위 말풍선에 이어 붙이기
      out.push({ t: "narr", text: t, ln: [li, li] });
    }
    return out;
  }


  /* ---------- 🎨 사이트 메인 색 ----------
     프리셋 이름("pink") 또는 "#ff88aa" 같은 색 하나 → 그라데이션 · 연한 색까지 자동으로 만들어요 */
  const PALETTES = {
    lavender: { label: "라벤더", stops: ["#a993f4", "#8fb2f3", "#74c6f0"], accent: "#8b7cf0" },
    pink:     { label: "핑크",   stops: ["#f58fb4", "#f7a8c4", "#ffc2a8"], accent: "#e0659a" },
    rose:     { label: "장미",   stops: ["#e0526b", "#f07d8a", "#f9a8a8"], accent: "#c8405a" },
    peach:    { label: "피치",   stops: ["#ff8f7a", "#ffb07a", "#ffd27a"], accent: "#e8745c" },
    lemon:    { label: "레몬",   stops: ["#f2c230", "#f7d66a", "#ffe9a3"], accent: "#c49a0a" },
    mint:     { label: "민트",   stops: ["#4fc9a8", "#7fdcc0", "#a8e6e0"], accent: "#2fa58f" },
    sky:      { label: "하늘",   stops: ["#5aa9f5", "#7fc3f7", "#a8dcf8"], accent: "#3c8fe0" },
    grape:    { label: "포도",   stops: ["#8a5cf6", "#b07cf7", "#e0a3f5"], accent: "#7c4ddb" },
    mono:     { label: "모노",   stops: ["#5b616b", "#8d949e", "#c3c8cf"], accent: "#4a4f57" }
  };
  const hx = h => { h = h.replace("#", ""); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
  const toHex = rgb => "#" + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const rgba = (h, a) => `rgba(${hx(h).join(",")},${a})`;
  function hsl2hex(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
    const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
  }
  function hex2hsl(h) {
    const [r, g, b] = hx(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    const H = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [H * 60, s, l];
  }
  function palette(key) {
    let P = PALETTES[key];
    if (!P && /^#[0-9a-f]{6}$/i.test(key || "")) {     // 직접 고른 색 하나로 만들기
      const [h, s, l] = hex2hsl(key), L = Math.max(.5, Math.min(.68, l)), S = Math.max(.45, s);
      P = { stops: [hsl2hex(h, S, L), hsl2hex(h + 16, S, L + .06), hsl2hex(h + 32, S, L + .12)], accent: hsl2hex(h, S, Math.min(.55, L - .04)) };
      if (s < .12) P = { stops: [key, mix(key, "#ffffff", .3), mix(key, "#ffffff", .55)], accent: mix(key, "#000000", .1) };
    }
    P = P || PALETTES.lavender;
    const [a, b, c] = P.stops, ac = P.accent;
    return {
      stops: P.stops, accent: ac,
      vars: {
        "--blue": ac, "--blue-dark": mix(ac, "#000000", .1), "--blue-soft": mix(ac, "#ffffff", .9),
        "--heart": ac, "--heart-soft": mix(ac, "#ffffff", .9),
        "--grad": `linear-gradient(120deg, ${mix(a, "#ffffff", .35)} 0%, ${mix(b, "#ffffff", .35)} 50%, ${mix(c, "#ffffff", .35)} 100%)`,
        "--grad-strong": `linear-gradient(120deg, ${a} 0%, ${b} 50%, ${c} 100%)`,
        "--ring": mix(a, "#ffffff", .55), "--tint": mix(a, "#ffffff", .94), "--glow": rgba(a, .35)
      },
      hg: [mix(a, "#ffffff", .15), mix(b, "#ffffff", .15), mix(c, "#ffffff", .15)]
    };
  }
  // 페이지에 바로 입히기 (하트 그라데이션 · 브라우저 위쪽 색까지)
  function applyPalette(key, map) {
    const P = palette(key), root = document.documentElement.style;
    Object.entries(P.vars).forEach(([k, v]) => root.setProperty(map && map[k] || k, v));
    document.querySelectorAll("#hg stop").forEach((st, i) => st.setAttribute("stop-color", P.hg[i] || P.hg[2]));
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", P.hg[0]);
    return P;
  }

  /* ---------- 대화창 모양 ----------
     ava: 프사 위치(top 위 · bottom 아래 · none 없음) / time: side 말풍선 옆 · center 가운데 / bg: 커플 배경색을 쓸지 */
  // sw: 고르기 견본 [배경, 왼쪽, 오른쪽] / both: 양쪽 다 왼쪽 정렬 + 이름 · 프사 / time: side · center · inside(말풍선 안) · head(이름 옆)
  const STYLES = {
    kakao:        { label: "카카오톡",        ava: "top",    name: true,  time: "side",   bg: true, defBg: "#bacee0", sw: ["#bacee0", "#fff", "#fee500"] },
    kakaodark:    { label: "카톡 다크",       ava: "top",    name: true,  time: "side",   sw: ["#1f2226", "#3a3d42", "#fee500"] },
    imessage:     { label: "아이메시지",      ava: "none",   name: false, time: "center", read: true, sw: ["#fff", "#e9e9eb", "#0a84ff"] },
    imessagedark: { label: "아이메시지 다크", ava: "none",   name: false, time: "center", read: true, sw: ["#000", "#262628", "#0a84ff"] },
    insta:        { label: "인스타 DM",       ava: "bottom", name: false, time: "center", read: true, sw: ["#fff", "#efefef", "linear-gradient(135deg,#a033ff,#3797f0)"] },
    line:         { label: "라인",            ava: "top",    name: true,  time: "side",   bg: true, defBg: "#8cabd9", sideRead: true, sw: ["#8cabd9", "#fff", "#8de055"] },
    telegram:     { label: "텔레그램",        ava: "bottom", name: false, time: "inside", bg: true, defBg: "#c8dbb3", sw: ["#c8dbb3", "#fff", "#e1fec6"] },
    lovely:       { label: "러블리",          ava: "top",    name: true,  time: "side",   bg: true, defBg: "#ffe3ec", sw: ["#ffe3ec", "#fff", "linear-gradient(135deg,#ff8fb1,#ffb3c6)"] },
    discord:      { label: "디스코드",        ava: "top",    name: true,  time: "head",   both: true, sw: ["#313338", "#4e5058", "#5865f2"] },
    diary:        { label: "다이어리",        ava: "none",   name: true,  time: "head",   both: true, sw: ["repeating-linear-gradient(#fbf6ea 0 9px,#e8dcc4 9px 10px)", "#7a9cc6", "#d9849b"] },
    retro:        { label: "옛날 메신저",     ava: "none",   name: true,  time: "head",   both: true, sw: ["linear-gradient(#2a5bd7 0 30%,#ece9d8 30%)", "#2457c5", "#c0392b"] },
    simple:       { label: "심플",            ava: "top",    name: true,  time: "side",   sw: ["#fff", "#f1f2f4", "var(--grad)"] },
    outline:      { label: "테두리",          ava: "top",    name: true,  time: "side",   sw: ["#fff", "#e3e5e8", "var(--accent)"] },
    card:         { label: "카드",            ava: "top",    name: true,  time: "side",   sw: ["#f3f4f6", "#fff", "var(--soft)"] },
    minidark:     { label: "미니멀 다크",     ava: "top",    name: true,  time: "side",   sw: ["#141517", "#2a2c30", "#f5f5f5"] },
    script:       { label: "대본",            ava: "none",   name: true,  time: "none",   both: true, sw: ["#fff", "#d5d8dc", "var(--accent)"] }
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
    style = styleOf(style);
    const S = STYLES[style];
    if (!items.length) return `<div class="kk-empty">아직 대화가 없어요</div>`;
    const same = (a, b) => a && b && a.t === "msg" && b.t === "msg" && a.name === b.name && a.time === b.time;
    let shown = "";
    const lastR = (() => { for (let i = items.length - 1; i >= 0; i--) if (items[i].t === "msg") return items[i].side === "R" ? i : -1; return -1; })();
    return items.map((m, i) => {
      const k = m.ln ? ` data-k="${i}"` : "";
      if (m.t === "date") { shown = ""; return `<div class="kk-date"${k}><span>${esc(m.text)}</span></div>`; }
      if (m.t === "narr") return `<div class="kk-narr"${k}>${fmt(m.text.replace(/^\*(.*)\*$/, "$1"))}</div>`;
      const first = !same(items[i - 1], m), last = !same(m, items[i + 1]), mine = m.side === "R";
      let pre = "";
      if (S.time === "center" && m.time && m.time !== shown) { shown = m.time; pre = `<div class="kk-ctime">${esc(m.time)}</div>`; }
      const itime = S.time === "inside" && m.time ? `<span class="kk-itime">${esc(m.time)}${mine ? " ✓✓" : ""}</span>` : "";
      const bub = PHOTO.test(m.text.trim())
        ? `<div class="kk-bub kk-media">${/동영상/.test(m.text) ? "🎬" : /이모티콘/.test(m.text) ? "😊" : "📷"} ${esc(m.text)}${itime}</div>`
        : `<div class="kk-bub">${fmt(m.text)}${itime}</div>`;
      const withAva = S.ava !== "none" && (S.both || !mine);
      const showAva = S.ava === "top" ? first : last;
      const ava = withAva ? (showAva ? avatar(m.name, couple) : `<div class="kk-ava kk-gap"></div>`) : "";
      const htime = S.time === "head" && m.time ? `<span class="kk-htime">${esc(m.time)}</span>` : "";
      const nameLine = S.name && first && (S.both || !mine) ? `<div class="kk-name"><span class="kn">${esc(m.name)}</span>${htime}</div>` : "";
      const stime = S.time === "side" && last && m.time ? `<span class="kk-time">${mine && S.sideRead ? "읽음<br/>" : ""}${esc(m.time)}</span>` : "";
      return `${pre}<div class="kk-row ${m.side}${first ? " first" : ""}${last ? " last" : ""}"${k}>
        ${ava}
        <div class="kk-body">
          ${nameLine}
          <div class="kk-line">${bub}${stime}</div>
          ${i === lastR && S.read ? `<div class="kk-read">읽음</div>` : ""}
        </div>
      </div>`;
    }).join("");
  }
  // 대화창 위쪽 이름 줄
  function head(couple, style, opt = {}) {
    const L = couple.left || "상대", R = couple.right || "나", dd = opt.dd ? `<span class="kh-dd">${esc(opt.dd)}</span>` : "";
    const ava = avatar(L, couple, "kh-ava");
    switch (style) {
      case "imessage": case "imessagedark":
        return `<div class="kk-head">${ava}<div class="kh-name">${esc(L)} ›</div>${dd}</div>`;
      case "insta": case "telegram":
        return `<div class="kk-head">${ava}<div class="kh-main"><div class="kh-name">${esc(L)}</div><div class="kh-sub">${style === "telegram" ? "온라인" : esc(couple.name || "")}</div></div>${dd}</div>`;
      case "discord":
        return `<div class="kk-head"><b class="kh-hash">#</b><span class="kh-name">${esc(L)}-${esc(R)}</span>${dd}</div>`;
      case "diary":
        return `<div class="kk-head"><span class="kh-name">♡ ${esc(R)} &amp; ${esc(L)}의 일기장</span>${dd}</div>`;
      case "retro":
        return `<div class="kk-head"><span class="kh-name">💬 ${esc(L)} - 대화</span>${dd}<span class="kh-btns"><i>_</i><i>□</i><i>×</i></span></div>`;
      case "lovely":
        return `<div class="kk-head"><span class="kh-name">${esc(L)} <span class="kh-heart">♥</span> ${esc(R)}</span>${dd}</div>`;
    }
    return `<div class="kk-head"><span class="kh-name">${esc(L)}, ${esc(R)}</span>${opt.count != null ? `<small>${opt.count}</small>` : ""}${dd}</div>`;
  }
  // opt: { style, dd, head: true면 이름 줄도 }
  function room(raw, couple = {}, opt = {}) {
    const st = styleOf(opt.style || couple.style), items = parse(raw, couple);
    const S = STYLES[st], bg = S.bg ? `--kk-bg:${esc(st === "kakao" ? couple.bg || S.defBg : S.defBg)}` : "";
    if (st === "diary") loadFont();
    return `<div class="kk-room st-${st}${S.both ? " flat" : ""}" style="${bg}">${opt.head ? head(couple, st, { dd: opt.dd, count: items.filter(m => m.t === "msg").length }) : ""}<div class="kk">${render(items, couple, st)}</div></div>`;
  }

  // 다이어리 글씨체 (쓸 때만 불러와요)
  function loadFont() {
    if (document.getElementById("kk-font")) return;
    const l = document.createElement("link"); l.id = "kk-font"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap"; document.head.appendChild(l);
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
    :is(.st-kakao, .st-kakaodark) .first.L .kk-bub { border-top-left-radius: 4px; }
    :is(.st-kakao, .st-kakaodark) .first.R .kk-bub { border-top-right-radius: 4px; }
    :is(.st-kakao, .st-kakaodark) .first .kk-bub::before { content: ""; position: absolute; top: 0; width: 0; height: 0; border-bottom: 9px solid transparent; }
    :is(.st-kakao, .st-kakaodark) .first.L .kk-bub::before { left: -6px; border-right: 8px solid var(--kl, #fff); }
    :is(.st-kakao, .st-kakaodark) .first.R .kk-bub::before { right: -6px; border-left: 8px solid #fee500; }

    /* 아이메시지 */
    :is(.st-imessage, .st-imessagedark) .kk, .st-imessagedark .kk { background: #fff; padding: 8px 12px 18px; }
    :is(.st-imessage, .st-imessagedark) .kk-head { flex-direction: column; gap: 3px; padding: 12px 16px 8px; background: #f6f6f8; border-bottom: 1px solid #e5e5ea; font-weight: 500; position: relative; }
    :is(.st-imessage, .st-imessagedark) .kh-ava { width: 46px; height: 46px; font-size: 1rem; background: linear-gradient(180deg, #a5abb7, #858b97); }
    :is(.st-imessage, .st-imessagedark) .kh-name { font-size: .72rem; color: #1c1c1e; }
    :is(.st-imessage, .st-imessagedark) .kh-dd { position: absolute; right: 12px; top: 12px; background: #e9e9eb; color: #3a3a3c; }
    :is(.st-imessage, .st-imessagedark) .kk-date span { background: none; color: #8e8e93; padding: 0; font-size: .7rem; }
    :is(.st-imessage, .st-imessagedark) .kk-narr { background: none; color: #8e8e93; font-size: .76rem; }
    :is(.st-imessage, .st-imessagedark) .kk-row { margin-top: 2px; }
    :is(.st-imessage, .st-imessagedark) .kk-row.first { margin-top: 8px; }
    :is(.st-imessage, .st-imessagedark) .kk-body { max-width: 76%; }
    :is(.st-imessage, .st-imessagedark) .kk-bub { background: #e9e9eb; color: #000; border-radius: 18px; padding: 7px 12px; font-size: .92rem; }
    :is(.st-imessage, .st-imessagedark) .R .kk-bub { background: #0a84ff; color: #fff; }
    :is(.st-imessage, .st-imessagedark) .last.L .kk-bub { border-bottom-left-radius: 5px; }
    :is(.st-imessage, .st-imessagedark) .last.R .kk-bub { border-bottom-right-radius: 5px; }
    :is(.st-imessage, .st-imessagedark) .kk-read { align-self: flex-end; }

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
    .st-line .kk-time { color: rgba(255,255,255,.9); }

    /* 공통: 이름 옆 시간 · 말풍선 안 시간 · 양쪽 왼쪽 정렬 */
    .kk-htime { margin-left: 7px; font-size: .68rem; font-weight: 500; opacity: .7; }
    .kk-itime { float: right; margin: 7px -2px -3px 9px; font-size: .62rem; line-height: 1; opacity: .7; white-space: nowrap; }
    .flat .kk-row.R { justify-content: flex-start; }
    .flat .R .kk-body { align-items: flex-start; }
    .flat .R .kk-line { flex-direction: row; }
    .flat .kk-body { max-width: 100%; flex: 1; }

    /* 카톡 다크 */
    .st-kakaodark { --kl: #3a3d42; }
    .st-kakaodark .kk { background: #1f2226; }
    .st-kakaodark .kk-head { background: #181a1d; color: #f1f1f1; }
    .st-kakaodark .kk-head small { color: #8a8f96; }
    .st-kakaodark .kh-dd { background: rgba(255,255,255,.12); color: #fff; }
    .st-kakaodark .kk-bub { background: #3a3d42; color: #f1f1f1; }
    .st-kakaodark .R .kk-bub { background: #fee500; color: #191919; }
    .st-kakaodark .kk-name { color: #b0b4ba; }
    .st-kakaodark .kk-time { color: #8a8f96; }
    .st-kakaodark .kk-date span { background: rgba(255,255,255,.1); color: #c9ccd1; }
    .st-kakaodark .kk-narr { background: rgba(255,255,255,.07); color: #b0b4ba; }
    .st-kakaodark .kk-ava { background: #4a4f57; }

    /* 아이메시지 다크 */
    .st-imessagedark .kk { background: #000; }
    .st-imessagedark .kk-head { background: #1c1c1e; border-bottom-color: #2c2c2e; }
    .st-imessagedark .kh-name { color: #f2f2f7; }
    .st-imessagedark .kh-dd { background: #2c2c2e; color: #f2f2f7; }
    .st-imessagedark .kk-bub { background: #262628; color: #fff; }

    /* 텔레그램 */
    .st-telegram .kk { background-color: var(--kk-bg); background-image: radial-gradient(rgba(255,255,255,.22) 1.5px, transparent 1.6px); background-size: 18px 18px; }
    .st-telegram .kk-head { background: #fff; border-bottom: 1px solid #e6e6e6; padding: 9px 14px; }
    .st-telegram .kh-ava { width: 36px; height: 36px; background: linear-gradient(135deg, #6fc2f0, #3d8fd8); }
    .st-telegram .kh-name { font-size: .9rem; color: #000; }
    .st-telegram .kh-sub { font-size: .72rem; color: #3d95d8; font-weight: 500; }
    .st-telegram .kh-dd { background: #eef3f7; color: #3d6e95; }
    .st-telegram .kk-date span { background: rgba(0,0,0,.22); }
    .st-telegram .kk-row { margin-top: 3px; align-items: flex-end; }
    .st-telegram .kk-row.first { margin-top: 9px; }
    .st-telegram .kk-ava { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #f7a96b, #e8697a); font-size: .76rem; }
    .st-telegram .kk-bub { border-radius: 14px; padding: 6px 10px; box-shadow: 0 1px 1px rgba(0,0,0,.12); }
    .st-telegram .R .kk-bub { background: #e1fec6; }
    .st-telegram .last.L .kk-bub { border-bottom-left-radius: 4px; }
    .st-telegram .last.R .kk-bub { border-bottom-right-radius: 4px; }
    .st-telegram .kk-itime { color: #8a9aa8; opacity: 1; }
    .st-telegram .R .kk-itime { color: #5fb158; }
    .st-telegram .kk-narr { background: rgba(0,0,0,.18); color: #fff; }

    /* 러블리 */
    .st-lovely .kk { background-color: var(--kk-bg); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath fill='%23ffffff' opacity='.55' d='M15 22s-6-3.6-7.2-7.3C7 12 8.7 9.4 11.4 9.4c1.5 0 2.7.8 3.6 2 .8-1.2 2-2 3.5-2 2.7 0 4.4 2.6 3.6 5.3C20.9 18.4 15 22 15 22z'/%3E%3Cpath fill='%23ffffff' opacity='.35' transform='translate(30 30) scale(.6)' d='M15 22s-6-3.6-7.2-7.3C7 12 8.7 9.4 11.4 9.4c1.5 0 2.7.8 3.6 2 .8-1.2 2-2 3.5-2 2.7 0 4.4 2.6 3.6 5.3C20.9 18.4 15 22 15 22z'/%3E%3C/svg%3E"); }
    .st-lovely .kk-head { justify-content: center; background: #fff; color: #d0628a; border-bottom: 2px dashed #ffc2d4; position: relative; }
    .st-lovely .kh-heart { color: #ff7aa5; }
    .st-lovely .kh-dd { position: absolute; right: 12px; background: #ffe3ec; color: #d0628a; }
    .st-lovely .kk-ava { border-radius: 50%; background: #ffb3c6; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #ffc2d4; }
    .st-lovely .kk-name { color: #d0628a; font-weight: 700; }
    .st-lovely .kk-bub { border-radius: 18px; border: 1.5px solid #ffd0de; padding: 8px 12px; }
    .st-lovely .R .kk-bub { background: linear-gradient(135deg, #ff8fb1, #ffb3c6); color: #fff; border-color: transparent; }
    .st-lovely .kk-time { color: #d0628a; }
    .st-lovely .kk-date span { background: #fff; color: #d0628a; border: 1px solid #ffc2d4; }
    .st-lovely .kk-narr { background: rgba(255,255,255,.7); color: #c0587e; }

    /* 디스코드 */
    .st-discord .kk { background: #313338; padding: 8px 14px 18px; }
    .st-discord .kk-head { background: #2b2d31; color: #f2f3f5; border-bottom: 1px solid #1f2023; }
    .st-discord .kh-hash { color: #80848e; font-size: 1.1rem; font-weight: 500; }
    .st-discord .kh-dd { background: #5865f2; color: #fff; }
    .st-discord .kk-row { margin-top: 0; gap: 14px; }
    .st-discord .kk-row.first { margin-top: 14px; }
    .st-discord .kk-ava { width: 40px; height: 40px; border-radius: 50%; background: #5865f2; }
    .st-discord .R .kk-ava { background: #eb459e; }
    .st-discord .kk-name { font-size: .9rem; margin: 0 0 2px; color: #7ee0ff; font-weight: 600; }
    .st-discord .R .kk-name { color: #ffb3d1; }
    .st-discord .kk-htime { color: #949ba4; opacity: 1; }
    .st-discord .kk-bub, .st-discord .R .kk-bub { background: none; color: #dbdee1; padding: 1px 0; border-radius: 0; }
    .st-discord .kk-date { display: flex; align-items: center; gap: 8px; }
    .st-discord .kk-date::before, .st-discord .kk-date::after { content: ""; flex: 1; height: 1px; background: #3f4147; }
    .st-discord .kk-date span { background: none; color: #949ba4; padding: 0; }
    .st-discord .kk-narr { background: none; color: #949ba4; font-style: italic; }

    /* 다이어리 */
    .st-diary { font-family: "Gaegu", "Pretendard Variable", sans-serif; }
    .st-diary .kk { background-color: #fbf6ea; background-image: linear-gradient(90deg, transparent 30px, #f3c4c4 30px 31px, transparent 31px), repeating-linear-gradient(transparent 0 27px, #e8dcc4 27px 28px); padding: 14px 16px 22px 42px; line-height: 28px; }
    .st-diary .kk-head { background: #f6ecd6; color: #8a6a4a; font-size: 1.15rem; border-bottom: 1px dashed #d9c6a3; font-weight: 700; }
    .st-diary .kh-dd { background: #fff6e3; color: #b07a4a; font-size: .85rem; }
    .st-diary .kk-row, .st-diary .kk-row.first { margin-top: 0; }
    .st-diary .kk-name { font-size: 1.05rem; font-weight: 700; color: #6d8fbd; margin: 0; line-height: 28px; }
    .st-diary .R .kk-name { color: #cf6f8c; }
    .st-diary .kk-htime { font-size: .8rem; color: #a08a6e; }
    .st-diary .kk-bub, .st-diary .R .kk-bub { background: none; color: #3d3428; padding: 0; border-radius: 0; font-size: 1.12rem; line-height: 28px; }
    .st-diary .kk-date { text-align: left; margin: 0; }
    .st-diary .kk-date span { background: none; color: #b07a4a; padding: 0; font-size: 1rem; font-weight: 700; border-bottom: 2px solid #f3c4c4; border-radius: 0; line-height: 26px; }
    .st-diary .kk-narr { background: none; color: #a08a6e; font-size: 1rem; margin: 0; padding: 0; text-align: center; line-height: 28px; }
    .st-diary .kk-narr::before { content: "( "; } .st-diary .kk-narr::after { content: " )"; }

    /* 옛날 메신저 */
    .st-retro { background: #ece9d8; padding: 0 5px 5px; border: 1px solid #0a246a; font-family: "Gulim", "굴림", "Dotum", "돋움", "Pretendard Variable", sans-serif; }
    .st-retro .kk-head { margin: 0 -5px 5px; background: linear-gradient(180deg, #3d7bf2, #0a4fd6 60%, #0842b8); color: #fff; padding: 6px 8px; font-size: .84rem; text-shadow: 1px 1px #0a246a; }
    .st-retro .kh-dd { background: rgba(255,255,255,.2); color: #fff; text-shadow: none; }
    .st-retro .kh-btns { display: flex; gap: 2px; margin-left: 6px; }
    .st-retro .kh-dd + .kh-btns { margin-left: 6px; }
    .st-retro .kh-name + .kh-btns { margin-left: auto; }
    .st-retro .kh-btns i { width: 19px; height: 18px; display: flex; align-items: center; justify-content: center; font-style: normal; font-size: .7rem; background: linear-gradient(#fff, #d8e4f8); color: #0a246a; border: 1px solid #fff; border-radius: 3px; text-shadow: none; }
    .st-retro .kh-btns i:last-child { background: linear-gradient(#f0a08a, #d4462a); color: #fff; }
    .st-retro .kk { background: #fff; border: 1px solid #7f9db9; padding: 10px 12px 16px; min-height: 140px; }
    .st-retro .kk-row, .st-retro .kk-row.first { margin-top: 0; }
    .st-retro .kk-row.first { margin-top: 6px; }
    .st-retro .kk-name { font-size: .8rem; color: #2457c5; margin: 0; }
    .st-retro .R .kk-name { color: #c0392b; }
    .st-retro .kn::after { content: " 님의 말"; }
    .st-retro .kk-htime { margin-left: 3px; opacity: 1; }
    .st-retro .kk-htime::before { content: "("; } .st-retro .kk-htime::after { content: ")"; }
    .st-retro .kk-name::after { content: ":"; }
    .st-retro .kk-bub, .st-retro .R .kk-bub { background: none; color: #000; padding: 0 0 0 14px; border-radius: 0; font-size: .86rem; }
    .st-retro .kk-date { text-align: left; margin: 8px 0 2px; }
    .st-retro .kk-date span { background: none; color: #808080; padding: 0; border-radius: 0; font-weight: 400; }
    .st-retro .kk-date span::before { content: "─── "; } .st-retro .kk-date span::after { content: " ───"; }
    .st-retro .kk-narr { background: none; text-align: left; color: #008000; margin: 4px 0; padding: 0; font-size: .8rem; }
    .st-retro .kk-narr::before { content: "* "; }

    /* 깔끔한 분위기들: 사이트 메인 색을 따라가요 */
    .kk-room { --mc: var(--blue, var(--accent, #8b7cf0)); --mg: var(--grad-strong, var(--grad, #8b7cf0)); --ms: var(--blue-soft, var(--soft, #f1eefe)); }
    :is(.st-simple, .st-outline, .st-card, .st-script) .kk-head { background: #fff; color: #1f2329; border-bottom: 1px solid #eef0f2; }
    :is(.st-simple, .st-outline, .st-card, .st-script) .kh-dd { background: var(--ms); color: var(--mc); }
    :is(.st-simple, .st-outline, .st-card, .st-minidark) .kk-ava { border-radius: 50%; width: 34px; height: 34px; font-size: .8rem; background: var(--ms); color: var(--mc); }
    :is(.st-simple, .st-outline, .st-card) .kk-name { color: #6b7178; font-size: .74rem; }
    :is(.st-simple, .st-outline, .st-card) .kk-time { color: #a0a5ab; }
    :is(.st-simple, .st-outline, .st-card, .st-script) .kk-date span { background: none; color: #a0a5ab; padding: 0; font-weight: 600; }
    :is(.st-simple, .st-outline, .st-card, .st-script) .kk-narr { background: none; color: #9aa0a6; font-size: .78rem; }

    /* 심플 */
    .st-simple .kk { background: #fff; padding: 10px 14px 20px; }
    .st-simple .kk-bub { background: #f1f2f4; color: #1f2329; border-radius: 18px; padding: 8px 13px; }
    .st-simple .R .kk-bub { background: var(--mg); color: #fff; }

    /* 테두리 */
    .st-outline .kk { background: #fff; padding: 10px 14px 20px; }
    .st-outline .kk-bub { background: #fff; color: #1f2329; border: 1.5px solid #e3e5e8; border-radius: 16px; padding: 7px 12px; }
    .st-outline .R .kk-bub { background: #fff; border-color: var(--mc); color: #1f2329; }
    .st-outline .kk-date span { border: 1px solid #e3e5e8; padding: 2px 10px; border-radius: 999px; }

    /* 카드 */
    .st-card .kk { background: #f3f4f6; padding: 10px 14px 20px; }
    .st-card .kk-bub { background: #fff; color: #1f2329; border-radius: 14px; padding: 9px 13px; box-shadow: 0 1px 3px rgba(20,24,30,.07); }
    .st-card .R .kk-bub { background: var(--ms); color: #1f2329; box-shadow: none; }
    .st-card .kk-date span { background: #e7e9ec; color: #7a8088; padding: 3px 11px; border-radius: 999px; }

    /* 미니멀 다크 */
    .st-minidark .kk { background: #141517; padding: 10px 14px 20px; }
    .st-minidark .kk-head { background: #1b1c1f; color: #f1f1f3; border-bottom: 1px solid #26282c; }
    .st-minidark .kk-head small { color: #6f7378; }
    .st-minidark .kh-dd { background: #2a2c30; color: #f1f1f3; }
    .st-minidark .kk-ava { background: #2a2c30; color: #c9ccd1; }
    .st-minidark .kk-name { color: #8a8f96; font-size: .74rem; }
    .st-minidark .kk-bub { background: #2a2c30; color: #ececee; border-radius: 16px; padding: 8px 12px; }
    .st-minidark .R .kk-bub { background: #f5f5f5; color: #111; }
    .st-minidark .kk-time { color: #6f7378; }
    .st-minidark .kk-date span { background: none; color: #6f7378; padding: 0; }
    .st-minidark .kk-narr { background: none; color: #6f7378; font-size: .78rem; }

    /* 대본 */
    .st-script .kk { background: #fff; padding: 14px 16px 22px; }
    .st-script .kk-row, .st-script .kk-row.first { margin-top: 2px; }
    .st-script .kk-row.first { margin-top: 10px; }
    .st-script .kk-body { flex-direction: row; gap: 12px; align-items: flex-start; }
    .st-script .kk-name { flex: 0 0 64px; text-align: right; margin: 0; font-weight: 800; font-size: .84rem; color: #8a9099; line-height: 1.55; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .st-script .R .kk-name { color: var(--mc); }
    .st-script .kk-row:not(.first) .kk-line { margin-left: 76px; }
    .st-script .kk-bub, .st-script .R .kk-bub { background: none; color: #2b2f35; padding: 0; border-radius: 0; font-size: .9rem; line-height: 1.55; }
    .st-script .kk-date { margin: 14px 0 6px; }
    .st-script .kk-date span::before { content: "— "; } .st-script .kk-date span::after { content: " —"; }
    .st-script .kk-narr { text-align: left; margin: 8px 0 8px 76px; padding: 0; font-style: italic; }
    .st-script .kk-narr::before { content: "("; } .st-script .kk-narr::after { content: ")"; }`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  window.KK = { parse, render, room, head, dPlus, dLabel, fmt, esc, STYLES, PALETTES, palette, applyPalette };
})();
