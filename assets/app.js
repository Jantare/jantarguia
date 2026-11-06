(() => {
  const TIERS = [["8–20", 8, 20], ["20–35", 20, 35], ["35–60", 35, 60], ["60–100", 60, 100], ["100–150", 100, 150], ["150–200", 150, 200], ["200–300", 200, 300], ["300–400", 300, 400], ["400–500", 400, 500], ["500–600", 500, 600]];
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = n => Number(n).toLocaleString("pt-BR");
  const rarity = c => c >= 5 ? "common" : c >= 1 ? "uncommon" : "rare";
  const rlabel = c => c >= 5 ? "comum" : c >= 1 ? "incomum" : "raro";
  const pct = c => c.toFixed(2).replace(".", ",") + "%";
  const img = (src, cls, alt) => src ? `<img class="${cls || ""}" src="${esc(src)}" alt="${esc(alt || "")}" loading="lazy" onerror="this.remove()">` : "";
  const ytq = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  const slot = (src, big, alt) => `<span class="slot${big ? " big" : ""}">${img(src, "", alt)}</span>`;

  const st = { monF: "todos", monQ: "", imbuVoc: "knight", view: "inicio", qfilter: "todas", look: "montarias", lookCat: "todas", lookQ: "", weapon: "Machado", level: null, srv: "" };
  let SITE, BASE, QUESTS, LOOK, ROTAS, IMBU, SERVERS = {};

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  };

  function tierOf(lv) {
    if (!lv) return null;
    for (const t of TIERS) if (lv >= t[1] && lv < t[2]) return t[0];
    return lv >= 600 ? "500–600" : "8–20";
  }

  const VOC_INFO = {
    knight: { icon: "img/itens/heroic-axe.webp", txt: "Linha de frente. Rota completa do Knight de machado, com hunts, magias e a ordem de compra do meta atual. Também tem espada e clava." },
    paladin: { icon: "img/itens/falcon-bow.webp", txt: "Ataca de longe com arco, besta, lança ou estrela. Dano alto e boa defesa." },
    sorcerer: { icon: "img/itens/wand-of-inferno.webp", txt: "Mago de dano. As magias mais fortes do jogo, mas com pouca vida." },
    druid: { icon: "img/itens/hailstorm-rod.webp", txt: "Mago de suporte. Cura o time e também causa bastante dano." },
    monk: { icon: "img/itens/jo-staff.webp", txt: "Luta corpo a corpo com punhos e bastões. A vocação mais nova do Tibia." }
  };

  function views() {
    const v = [{ id: "inicio", nome: "Início" }, ...BASE.vocacoes.map(x => ({ id: x.id, nome: x.nome }))];
    v.push({ id: "quests", nome: "Quests" });
    v.push({ id: "imbuements", nome: "Imbuements" });
    v.push({ id: "outfits", nome: "Outfits" });
    v.push({ id: "monstros", nome: "Monstros" });
    if (st.srv) v.push({ id: st.srv, nome: SERVERS[st.srv].nome, srv: true });
    return v;
  }

  const NAV_ICON = { quests: "img/itens/spellbook-of-enlightenment.webp", imbuements: "img/itens/ring-of-red-plasma.webp", outfits: "img/montarias/draptor.webp", monstros: "img/monstros/dragon.gif" };
  function nav() {
    const tab = v => {
      const ic = v.id === "inicio" ? `<svg class="tab-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 10.5V21h6.5v-6h5v6H21V10.5z" fill="currentColor"/></svg>`
        : (VOC_INFO[v.id] || NAV_ICON[v.id]) ? `<img class="tab-ico" src="${esc((VOC_INFO[v.id] || {}).icon || NAV_ICON[v.id])}" alt="">` : "";
      return `<a class="tab${v.srv ? " srv" : ""}" href="#${v.id}" ${v.id === st.view ? 'aria-current="page"' : ""}>${ic}<span>${esc(v.nome)}</span></a>`;
    };
    const vs = views(), vocIds = BASE.vocacoes.map(x => x.id);
    const g1 = vs.filter(v => v.id === "inicio"), g2 = vs.filter(v => vocIds.includes(v.id)), g3 = vs.filter(v => v.id !== "inicio" && !vocIds.includes(v.id));
    $("#tabs").innerHTML = `${g1.map(tab).join("")}<span class="tab-sep" aria-hidden="true"></span><span class="tab-group" aria-label="Vocações">${g2.map(tab).join("")}</span><span class="tab-sep" aria-hidden="true"></span>${g3.map(tab).join("")}`;
    const act = $("#tabs [aria-current]"), tb = $("#tabs");
    if (act) tb.scrollLeft = act.offsetLeft - (tb.clientWidth - act.offsetWidth) / 2;
    tb.classList.toggle("over", tb.scrollWidth > tb.clientWidth + 2);
    const ch = $("#chips");
    ch.hidden = st.view !== "knight";
    ch.innerHTML = ["todas", "Machado", "Espada", "Clava"].map(w =>
      `<button class="chip" type="button" aria-pressed="${st.weapon === w}" data-w="${w}">${w === "todas" ? "Todas as armas" : w}</button>`).join("");
  }

  function srvNote(kind, key) {
    if (!st.srv) return "";
    const s = SERVERS[st.srv], n = (s[kind] || {})[key];
    return n ? `<div class="srvnote"><b>No ${esc(s.nome)}:</b> ${esc(n)}</div>` : "";
  }

  function card(it) {
    const srcs = it.src.map(s => {
      const m = BASE.monstros[s.m];
      return `<div class="src">${img(m.img, "mon-ico", s.m) || "<span></span>"}<span class="m">${esc(s.m)}</span><span class="c"><span class="dot ${rarity(s.c)}" title="${rlabel(s.c)}"></span>${pct(s.c)}</span>` +
        `<span class="w">${m.boss ? `<span class="boss-tag">boss</span> ${m.loc ? esc(m.loc) : "veja na TibiaWiki"} · <a class="yt-mini" href="${ytq("tibia boss " + s.m)}" target="_blank" rel="noopener">vídeo do boss</a>` : `caça a partir do lvl ${esc(m.lvl)} · ${m.loc ? esc(m.loc) : "local no Hunt Finder"}`}</span></div>`;
    }).join("");
    const npc = it.shop.length ? `<div class="line"><b>NPC:</b> ${it.shop.map(s => `${esc(s.n)} (${num(s.p)} gp)`).join(", ")}</div>` : "";
    const quest = it.quest ? `<div class="line"><b>Recompensa:</b> ${esc(it.quest)}</div>` : "";
    const onlyNpc = !it.src.length && it.shop.length ? `<p class="tip">Não dropa em monstro acessível: compre no NPC.</p>` :
      !it.src.length && !it.quest && !(it.tip || "").includes("market") ? `<div class="line"><b>Market:</b> não dropa de monstro comum.</div>` : "";
    return `<article class="card">
      <div class="head">${slot(it.img, false, it.item)}<div class="head-txt">
        <span class="meta">${esc(it.slot)}</span>
        <a class="name" href="${esc(it.wiki)}" target="_blank" rel="noopener">${esc(it.item)}</a>
        <div class="stats-line"><span class="req${it.lv ? "" : " none"}">${it.lv ? "lvl " + it.lv : "qualquer level"}</span><span class="attr">${esc(it.attr)}</span></div>
      </div></div>
      <div class="how"><span class="how-t">Onde conseguir</span>${srcs}${npc}${quest}${onlyNpc}</div>
      ${it.tip ? `<p class="tip">${esc(it.tip)}</p>` : ""}
      ${srvNote("itens", it.item)}
    </article>`;
  }

  function serverBanner() {
    if (!st.srv) return "";
    const s = SERVERS[st.srv];
    const n = Object.keys(s.itens || {}).length;
    return `<div class="notice"><span><b>${esc(s.nome)}</b> · ${esc(s.status)}</span>
      <span>${n ? `${n} item(ns) com diferença conferida neste servidor aparecem marcados.` : "Ainda não há diferenças conferidas neste servidor: os dados abaixo são os do Tibia base."}</span></div>`;
  }

  function vocItems(voc) {
    let items = voc.itens;
    if (voc.id === "knight" && st.weapon !== "todas")
      items = items.filter(i => !/^Arma( |$)/.test(i.slot) || i.slot.includes(st.weapon));
    const ord = ["Arma", "Armadura", "Capacete", "Pernas", "Botas", "Colar", "Amuleto", "Anel", "Escudo"];
    const rank = sl => { const i = ord.findIndex(o => sl === o || sl.startsWith(o + " ")); return (i < 0 ? 5 : i) + (/alternativa|situacional/.test(sl) ? 20 : 0); };
    return [...items].sort((x, y) => rank(x.slot) - rank(y.slot));
  }

  function lvlNote(cur) {
    return cur ? `<div class="filter-note"><span>Mostrando do level ${esc(cur)} em diante, para o level ${st.level}.</span><button type="button" data-clear-lvl>Ver todas as faixas</button></div>` : "";
  }

  const WSKILL = { Machado: "Axe Fighting", Espada: "Sword Fighting", Clava: "Club Fighting" };
  const linhaList = l => `<ol class="linha">${l.map(([lv, t]) => `<li><a href="#" data-jump="${esc(lv)}"><b>${esc(lv)}</b><span>${esc(t)}</span></a></li>`).join("")}</ol>`;
  function pickW(v) {
    if (!v || typeof v === "string") return v ? esc(v) : "";
    if (st.weapon !== "todas" && v[st.weapon]) return esc(v[st.weapon]);
    return Object.entries(v).map(([w, t]) => `<span class="obj-w"><b>${esc(w)}:</b> ${esc(t)}</span>`).join("");
  }
  function resumoBlock(r) {
    if (!r) return "";
    if (r.armas) {
      const one = st.weapon !== "todas" && r.armas[st.weapon];
      r = { ...r, titulo: one ? one.titulo : "Knight: machado, espada ou clava", skills: one ? one.skills : "A skill da sua arma (Axe, Sword ou Club Fighting) e Shielding. Magic level baixo, não precisa treinar.",
        linhaHtml: one ? linhaList(one.linha) : Object.entries(r.armas).map(([w, a]) => `<span class="linha-w">${esc(w)}</span>${linhaList(a.linha)}`).join("") };
    }
    return `<section class="resumo">
      <div class="resumo-h"><span class="path-kicker">Resumo</span><h2>${esc(r.titulo)}</h2></div>
      <div class="resumo-grid">
        <div class="rbox"><span class="how-t">Papel</span><p>${esc(r.papel)}</p></div>
        <div class="rbox"><span class="how-t">Skills</span><p>${esc(r.skills)}</p></div>
        <div class="rbox"><span class="how-t">Imbuements</span><ul>${r.imbuements.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="rbox"><span class="how-t">RTC (auto-uso)</span><p>${esc(r.rtc)}</p></div>
        ${r.tier ? `<div class="rbox"><span class="how-t">Tier</span><p>${esc(r.tier)}</p></div>` : ""}
      </div>
      <div class="linha-wrap"><span class="how-t">Ordem de compra resumida</span>
        ${r.linhaHtml || linhaList(r.linha)}</div>
      <p class="foot-note">${esc(r.fonte)}${r.videos ? ` Vídeos: ${r.videos.map(([l, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a>`).join(", ")}.` : r.video ? ` <a href="${esc(r.video)}" target="_blank" rel="noopener">Ver o vídeo</a>.` : ""}</p>
    </section>`;
  }

  function itemRow(it) {
    const s = it.src[0], m = s && BASE.monstros[s.m];
    const where = s ? `${esc(s.m)}${m && m.boss ? ' <span class="boss-tag">boss</span>' : ""} · ${pct(s.c)}` :
      it.shop.length ? `NPC ${esc(it.shop[0].n)} · ${num(it.shop[0].p)} gp` : it.quest ? "Recompensa de quest" : "Market";
    return `<details class="irow"><summary>${slot(it.img, false, it.item)}<span class="irow-txt"><span class="meta">${esc(it.slot)}${it.lv ? " · lvl " + it.lv : ""}</span><b>${esc(it.item)}</b><span class="irow-w">${where}</span></span><span class="irow-more" aria-hidden="true">+</span></summary>
      <div class="irow-body">${card(it)}</div></details>`;
  }

  function huntRow(h) {
    const meta = [`lvl ${esc(h.lv)}`, h.exp ? `${num(h.exp)} xp` : "", h.hp ? `${num(h.hp)} hp` : ""].filter(Boolean).join(" · ");
    return `<div class="hrow">${h.img ? slot(h.img, false, h.m || h.onde) :`<span class="slot place"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg></span>`}<div class="hrow-txt"><span class="meta">${meta}</span><b>${esc(h.m || h.onde)}</b>${h.m ? `<span class="hrow-onde">${esc(h.onde)}</span>` : ""}${h.nota ? `<span class="hrow-nota">${esc(h.nota)}</span>` : ""}${h.yt ? `<a class="hrow-yt" href="${esc(h.yt)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>Ver vídeos dessa hunt</a>` : ""}${h.m ? srvNote("monstros", h.m) : ""}</div></div>`;
  }

  function spellRows(list) {
    return list.map(s => `<div class="srow${s.ess ? " ess" : ""}"><span class="s-lv">${s.lv}</span><span class="s-n"><b>${esc(s.n)}</b><code>${esc(s.w)}</code></span><span class="s-p">${s.p ? num(s.p) + " gp" : s.p === 0 ? "grátis" : "—"}</span>${s.npc.length ? `<span class="s-npc">${s.npc.map(esc).join(", ")}</span>` : ""}</div>`).join("");
  }

  function routeView(voc) {
    const R = ROTAS.vocacoes[voc.id] || { etapas: [] };
    const items = vocItems(voc);
    const cur = tierOf(st.level);
    const curIdx = cur ? TIERS.findIndex(t => t[0] === cur) : 0;
    const qlvl = {};
    QUESTS.faixas.forEach(f => f.quests.forEach(q => qlvl[q.nome] = q));
    return `${R.pronta ? resumoBlock(R.resumo) : `<div class="notice"><span><b>Rota em construção</b></span><span>Esta vocação já tem equipamento, magias e quests por faixa. As hunts e o resumo entram em breve; por enquanto, use o Hunt Finder do servidor para escolher onde caçar.</span></div>`}
      ${lvlNote(cur)}
      <div class="steps">${R.etapas.map((e, idx) => {
        if (idx < curIdx) return "";
        const its = items.filter(i => i.tier === e.faixa);
        const ess = e.magias.filter(s => s.ess), rest = e.magias.filter(s => !s.ess);
        const qs = (ROTAS.quests[e.faixa] || []);
        return `<section class="step${cur === e.faixa ? " is-here" : ""}" id="etapa-${idx}" data-lo="${TIERS[idx][1]}">
          <div class="step-h"><span class="step-n">${idx + 1}</span><span class="lvl-badge">Lvl ${esc(e.faixa)}</span>${cur === e.faixa ? '<span class="here">você está aqui</span>' : ""}<span class="rule"></span></div>
          ${e.objetivo ? `<p class="step-obj">${pickW(e.objetivo)}</p>` : ""}
          <div class="step-grid">
            <div class="sbox"><span class="how-t">Onde caçar</span>${e.hunts.length ? e.hunts.map(huntRow).join("") : `<p class="muted">Use o Hunt Finder para ver as hunts desta faixa.</p>`}</div>
            <div class="sbox"><span class="how-t">O que comprar ou trocar${its.length ? ` (${its.length})` : ""}</span>${its.length ? its.map(itemRow).join("") : `<p class="muted">Nada novo: mantenha o equipamento da faixa anterior e junte gold.</p>`}</div>
          </div>
          <div class="step-grid">
            <div class="sbox"><span class="how-t">Magias para comprar</span>${ess.length || rest.length ? `${spellRows(ess)}${rest.length ? `<details class="more"><summary>Outras magias desta faixa (${rest.length})</summary>${spellRows(rest)}</details>` : ""}` : `<p class="muted">Nenhuma magia nova nesta faixa.</p>`}</div>
            <div class="sbox"><span class="how-t">Quests</span>${qs.length ? `<div class="q-links">${qs.map(n => `<a class="pill${qlvl[n] && (qlvl[n].outfit || qlvl[n].montaria) ? " pill-gold" : ""}" href="#quests">${esc(n)}${qlvl[n] ? ` <small>${esc(qlvl[n].lvl)}</small>` : ""}</a>`).join("")}</div>` : `<p class="muted">Sem quest essencial nesta faixa.</p>`}
              ${e.treino ? `<span class="how-t t2">Treino</span><p class="step-treino">${esc(e.treino.replace(/\{skill\}/g, WSKILL[st.weapon] || "a skill da arma").replace(/(^|\. )a skill/g, "$1A skill"))}</p>` : ""}</div>
          </div>
        </section>`;
      }).join("")}</div>
      <p class="foot-note">Magias: level, palavras, preço e alguns NPCs que vendem, da base do Canary. As marcadas em dourado são as que mais fazem diferença.</p>`;
  }

  function vocationView(voc) {
    const title = voc.id === "knight" && st.weapon !== "todas" ? "Knight de " + st.weapon.toLowerCase() : voc.nome;
    return `<div class="page-h"><h1>${esc(title)}: rota do level 8 ao 600</h1>
      <p class="intro">Cada etapa mostra onde caçar (com vídeos de cada hunt), o que comprar, quais magias pegar, as quests e o que treinar. Digite seu level no topo para pular direto para a sua etapa.</p></div>
      ${serverBanner()}
      ${routeView(voc)}`;
  }

  function monstersView() {
    const all = Object.entries(BASE.monstros).sort((a, b) => parseInt(a[1].lvl) - parseInt(b[1].lvl));
    const ms = all.filter(([, m]) => st.monF === "todos" || (st.monF === "boss" ? m.boss : !m.boss));
    const nb = all.filter(([, m]) => m.boss).length;
    return `<div class="page-h"><h1>Monstros</h1>
      <p class="intro">Todos os monstros e bosses do guia, do mais fácil ao mais difícil. Busque pelo nome, pelo lugar ou pelo item que você quer.</p></div>
      ${serverBanner()}
      <div class="look-bar">
        <div class="chips">${[["todos", `Todos (${all.length})`], ["monstros", `Monstros (${all.length - nb})`], ["boss", `Bosses (${nb})`]].map(([k, l]) => `<button class="chip" type="button" data-monf="${k}" aria-pressed="${st.monF === k}">${l}</button>`).join("")}</div>
        <label class="field look-search" for="monq">Buscar <input id="monq" type="search" placeholder="ex: Dragon, Zao, Soulbiter" value="${esc(st.monQ)}" autocomplete="off"></label>
      </div>
      <p class="intro mon-empty" hidden>Nada encontrado com essa busca.</p>
      <div class="grid mon-grid">${ms.map(([n, m]) => `<article class="card" data-s="${esc([n, m.loc, ...m.items].join(" ").toLowerCase())}">
        <div class="head">${slot(m.img, true, n)}<div class="head-txt">
          <span class="name">${esc(n)}</span>
          <div class="stats-line">${m.boss ? '<span class="boss-tag">boss</span>' : `<span class="req">caçar no lvl ${esc(m.lvl)}</span>`}</div>
          <span class="attr">${num(m.exp)} xp · ${num(m.hp)} hp</span>
        </div></div>
        <div class="line"><b>Onde:</b> ${m.loc ? esc(m.loc) : (m.boss ? "veja na TibiaWiki" : "ver Hunt Finder")}</div>
        <div class="line"><b>Dropa:</b> ${m.items.map(esc).join(", ")}</div>
        ${srvNote("monstros", n)}
        <div class="links"><a href="${esc(m.wiki)}" target="_blank" rel="noopener">TibiaWiki</a><a href="${esc(m.yt)}" target="_blank" rel="noopener">Vídeos no YouTube</a></div>
      </article>`).join("")}</div>`;
  }

  function questsView() {
    const itemImg = {};
    BASE.vocacoes.forEach(v => v.itens.forEach(i => { if (i.img) itemImg[i.item] = i.img; }));
    const nOut = QUESTS.faixas.reduce((a, f) => a + f.quests.filter(q => q.outfit || q.montaria).length, 0);
    const only = st.qfilter === "outfit";
    return `<div class="page-h"><h1>Quests por level</h1>
      <p class="intro">As quests que os guias da comunidade mais recomendam, na ordem em que vale fazer. Cada uma mostra o que libera e quais itens do Jantar Guia vêm dela. As que dão outfit ou montaria estão destacadas em dourado, com a imagem.</p></div>
      <div class="chips"><button class="chip" type="button" data-q="todas" aria-pressed="${!only}">Todas as quests</button><button class="chip chip-outfit" type="button" data-q="outfit" aria-pressed="${only}">Só as que dão outfit ou montaria (${nOut})</button></div>
      ${QUESTS.faixas.map(f => ({ ...f, quests: only ? f.quests.filter(q => q.outfit || q.montaria) : f.quests })).filter(f => f.quests.length).map(f => `<section class="tier">
        <div class="tier-h"><span class="lvl-badge">${esc(f.faixa)}</span><span class="rule"></span></div>
        <p class="intro">${esc(f.desc)}</p>
        <div class="grid">${f.quests.map(q => `<article class="card quest${q.outfit || q.montaria ? " has-outfit" : ""}">
          ${q.outfit ? `<div class="outfit-badge">${q.outfit_img ? `<span class="badge-pic">${img(q.outfit_img, "", q.outfit)}</span>` : `<span class="outfit-ico" aria-hidden="true">✦</span>`}<span><small>Dá a outfit</small><b>${esc(q.outfit)}</b></span></div>` : ""}
          ${q.montaria ? `<div class="outfit-badge mount-badge">${q.montaria_img ? `<span class="badge-pic">${img(q.montaria_img, "", q.montaria)}</span>` : ""}<span><small>Dá a montaria</small><b>${esc(q.montaria)}</b><em>${esc(q.montaria_como || "")}</em></span></div>` : ""}
          <div class="q-head"><span class="name">${esc(q.nome)}</span><span class="req">lvl ${esc(q.lvl)}</span></div>
          <div class="path-tags">${q.tags.map(t => `<span class="pill">${esc(t)}</span>`).join("")}</div>
          <p class="q-txt">${esc(q.txt)}</p>
          <a class="hrow-yt" href="${ytq("tibia " + q.nome + " quest guia")}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>Ver vídeos da quest</a>
          ${q.limite ? `<div class="q-warn">${esc(q.limite)}</div>` : ""}
          ${q.det ? `<details class="q-det"><summary>Ver detalhes da quest</summary><dl>
            <div><dt>Level mínimo</dt><dd>${esc(q.det.min)}</dd></div>
            <div><dt>Recomendado</dt><dd>${esc(q.det.rec)}</dd></div>
            <div><dt>Premium</dt><dd>${esc(q.det.prem)}</dd></div>
            <div class="wide"><dt>Onde é</dt><dd>${esc(q.det.onde)}</dd></div>
            <div class="wide"><dt>Recompensa</dt><dd>${esc(q.det.recompensa)}</dd></div>
            <div class="wide"><dt>O que você vai enfrentar</dt><dd>${esc(q.det.perigos)}</dd></div>
          </dl></details>` : ""}
          ${q.itens && q.itens.length ? `<div class="how"><span class="how-t">Itens do guia que vêm daqui</span><div class="q-items">${q.itens.map(n => `<span class="q-item">${img(itemImg[n], "q-ico")}${esc(n)}</span>`).join("")}</div></div>` : ""}
        </article>`).join("")}</div>
      </section>`).join("")}
      <p class="foot-note">Fontes: ${QUESTS.fontes.map(esc).join(", ")}. O level do selo é o recomendado; o mínimo oficial está em "Ver detalhes da quest".</p>`;
  }

  const GT = { Strike: 6, Vampirism: 6, Void: 6 };
  function recCost(txt) {
    const id = n => n.replace(/ /g, "-");
    const found = IMBU.lista.filter(x => new RegExp("\\b" + x.nome + "\\b").test(txt));
    const prot = /proteção do elemento/i.test(txt);
    if (!found.length && !prot) return "";
    const PROT = [["Fogo", "Dragon Hide"], ["Terra", "Snake Skin"], ["Gelo", "Quara Scale"], ["Energia", "Cloud Fabric"], ["Morte", "Lich Shroud"], ["Sagrado", "Demon Presence"]];
    return `<div class="rec-cost">${found.map(x => `<a class="rec-chip" href="#" data-imbu-go="${esc(id(x.nome))}"><b>${esc(x.nome)}</b>${GT[x.nome] ? `<span class="gt-n">${GT[x.nome]} Gold Tokens</span>` : `<span class="rec-see">ver receita →</span>`}</a>`).join("")}
      ${prot ? PROT.map(([el, n]) => `<a class="rec-chip" href="#" data-imbu-go="${esc(id(n))}"><b>${esc(el)}</b><span class="rec-see">${esc(n)} →</span></a>`).join("") : ""}</div>`;
  }

  function imbuView() {
    const vocs = Object.entries(IMBU.rec);
    const cur = IMBU.rec[st.imbuVoc] ? st.imbuVoc : "knight";
    const r = IMBU.rec[cur];
    const groups = ["Ataque", "Proteção", "Skill", "Suporte"];
    return `<div class="page-h"><h1>Imbuements</h1>
      <p class="intro">O que colocar em cada item da sua vocação e do que você precisa para fazer cada imbuement. Imbuement faz muita diferença no gasto de potion e na XP: não cace sem.</p></div>
      <section class="resumo">
        <div class="resumo-h"><span class="path-kicker">Recomendado por vocação</span><h2>${esc(r.nome)}</h2></div>
        <div class="chips">${vocs.map(([id, v]) => `<button class="chip" type="button" data-imbu="${id}" aria-pressed="${id === cur}">${esc(v.nome)}</button>`).join("")}</div>
        <div class="imbu-rec">${r.slots.map(([sl, im, tip]) => `<div class="rbox"><span class="how-t">${esc(sl)}</span><b class="imbu-what">${esc(im)}</b>${tip ? `<p>${esc(tip)}</p>` : ""}${recCost(im)}</div>`).join("")}</div>
        <p class="foot-note">Gold Tokens: preço do Powerful no NPC (só Strike, Vampirism e Void). Nos outros, clique para ver a receita com os itens.</p>
      </section>
      <section class="home-block"><h2 class="block-h">Como funciona</h2>
        <div class="imbu-info"><div class="rbox"><span class="how-t">Custo na máquina</span><ul>${IMBU.custos.map(([a, b]) => `<li><b>${esc(a)}:</b> ${esc(b)}</li>`).join("")}</ul></div>
        <div class="rbox"><span class="how-t">Dicas</span><ul>${IMBU.dicas.map(d => `<li>${esc(d)}</li>`).join("")}</ul></div></div>
        <a class="hrow-yt" href="${esc(IMBU.video)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>Ver o guia em vídeo</a>
      </section>
      <p class="foot-note imbu-leg">Cada nível mostra todos os itens que você precisa juntar. A etiqueta "novo" marca o item que entra a partir daquele nível.</p>
      ${groups.map(g => `<section class="tier" id="grp-${esc(g)}"><div class="tier-h"><span class="lvl-badge">${esc(g)}</span><span class="rule"></span></div>
        <div class="grid">${IMBU.lista.filter(x => x.grupo === g).map(x => `<article class="card imbu" id="${esc(x.nome.replace(/ /g, "-"))}">
          <div class="q-head"><span class="name">${esc(x.nome)}</span><span class="req">${esc(x.efeito)}</span></div>
          <div class="line"><b>Onde:</b> ${esc(x.onde)}</div>
          <div class="imbu-lv">${x.niveis.map((n, i) => `<div><span class="how-t">${esc(n.n)}</span><b>${esc(n.v)}</b><span class="imbu-items">${x.itens[i].map(t => { const m = t.match(/^(\d+) (.+)$/), novo = i === 0 || !x.itens[i - 1].includes(t); return `<span class="imbu-it${novo ? " novo" : ""}"><b>${esc(m[1])}x</b> ${esc(m[2])}</span>`; }).join("")}</span></div>`).join("")}</div>
        </article>`).join("")}</div></section>`).join("")}
      <p class="foot-note">${esc(IMBU.fonte)}</p>`;
  }

  function filterMon() {
    const q = st.monQ.trim().toLowerCase();
    let n = 0;
    document.querySelectorAll(".mon-grid > .card").forEach(c => { const ok = !q || c.dataset.s.includes(q); c.hidden = !ok; if (ok) n++; });
    const e = $(".mon-empty"); if (e) e.hidden = n > 0;
  }

  function lookView() {
    const isM = st.look === "montarias";
    const list = isM ? LOOK.montarias : LOOK.outfits;
    const cats = isM ? ["todas", ...new Set(list.map(x => x.cat))] : ["todas", "Quest", "Especial", "Premium", "Básica", "Loja"];
    const key = isM ? "cat" : "grupo";
    const q = st.lookQ.trim().toLowerCase();
    let items = list.filter(x => (st.lookCat === "todas" ? (isM || x.grupo !== "Loja") : x[key] === st.lookCat) && (!q || x.nome.toLowerCase().includes(q) || x.como.toLowerCase().includes(q)));
    const labels = { todas: isM ? "Todas" : "Todas (sem loja)", Quest: "De quest", Especial: "Especiais", Premium: "Premium", "Básica": "Básicas", Loja: "Loja (Tibia Coins)" };
    const count = c => c === "todas" ? (isM ? list.length : list.filter(x => x.grupo !== "Loja").length) : list.filter(x => x[key] === c).length;
    return `<div class="page-h"><h1>Outfits e montarias</h1>
      <p class="intro">Como conseguir cada montaria e cada outfit jogando. As da loja ficam separadas, para você ver primeiro o que dá para conseguir sem gastar Tibia Coins.</p></div>
      <div class="chips look-switch"><button class="chip" type="button" data-look="montarias" aria-pressed="${isM}">Montarias (${LOOK.montarias.length})</button><button class="chip" type="button" data-look="outfits" aria-pressed="${!isM}">Outfits (${LOOK.outfits.length})</button></div>
      <div class="look-bar">
        <div class="chips">${cats.map(c => `<button class="chip" type="button" data-lcat="${esc(c)}" aria-pressed="${st.lookCat === c}">${esc(labels[c] || c)} (${count(c)})</button>`).join("")}</div>
        <label class="field look-search" for="lookq">Buscar <input id="lookq" type="search" placeholder="${isM ? "ex: Draptor" : "ex: Norseman"}" value="${esc(st.lookQ)}"></label>
      </div>
      ${items.length ? `<div class="grid look-grid">${items.map(x => `<article class="card look">
        <div class="head"><span class="slot big look-slot">${img(x.img, "", x.nome)}</span><div class="head-txt">
          <span class="meta">${esc(isM ? x.cat : (x.grupo === "Loja" ? "Loja" : "Outfit " + x.grupo.toLowerCase()))}${!isM && x.premium ? " · Premium" : ""}</span>
          <span class="name">${esc(x.nome)}</span>
        </div></div>
        <p class="q-txt">${esc(x.como)}</p>
        ${!isM && x.achievement && x.achievement !== "None" ? `<div class="line"><b>Achievement:</b> ${esc(x.achievement)}</div>` : ""}
      </article>`).join("")}</div>` : `<p class="intro">Nada encontrado com esse filtro.</p>`}
      <p class="foot-note">Fonte: ${esc(LOOK.fonte)}.</p>`;
  }

  function promoBox(big) {
    if (!SITE.codigo_streamer) return "";
    return `<section class="promo${big ? " big" : ""}">
      <div class="promo-txt"><span class="path-kicker">Parceiro: ${esc(SITE.servidor_parceiro)}</span>
        <h2>Jogue no ${esc(SITE.servidor_parceiro)} pelo link do ${esc(SITE.criador)}</h2>
        <ol class="promo-steps"><li>Crie sua conta pelo botão <b>Criar conta</b>.</li><li>Na hora de comprar cash, use o cupom <b class="promo-bonus">${esc(SITE.codigo_streamer)}</b>${SITE.bonus_cupom ? ` e ganhe <b class="promo-bonus">${esc(SITE.bonus_cupom)}</b>` : ""}.</li></ol></div>
      <div class="promo-act">
        ${SITE.link_cadastro ? `<a class="promo-btn" href="${esc(SITE.link_cadastro)}" target="_blank" rel="sponsored noopener">Criar conta no ${esc(SITE.servidor_parceiro)} →</a>` : ""}
        <button class="promo-code" type="button" data-copy="${esc(SITE.codigo_streamer)}" title="Copiar cupom"><span>Cupom para cash</span><b>${esc(SITE.codigo_streamer)}</b><span class="copy-lbl">Copiar</span></button>
      </div>
    </section>`;
  }

  function serverView(s) {
    return `<div class="page-h"><h1>${esc(s.nome)}</h1>
      <p class="intro">${esc(s.resumo)}</p></div>
      <div class="notice"><span><b>${esc(s.status)}</b></span><span>Site oficial: <a href="${esc(s.site)}" target="_blank" rel="noopener">${esc(s.site.replace(/^https?:\/\//, ""))}</a></span></div>
      ${s.nome === SITE.servidor_parceiro ? promoBox(false) : ""}
      <h2>Sistemas próprios</h2>
      <div class="sys">${s.sistemas.map(x => `<article class="card"><span class="name">${esc(x.nome)}</span><p class="tip">${esc(x.texto)}</p></article>`).join("")}</div>`;
  }

  function homeView() {
    const nItens = new Set(BASE.vocacoes.flatMap(v => v.itens.map(i => i.item))).size;
    const stats = [[BASE.vocacoes.length, "vocações"], [nItens, "itens"], [Object.keys(BASE.monstros).length, "monstros e bosses"]]
      .map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join("");
    const srvCards = Object.values(SERVERS).map(s => `
      <a class="path srv-path" href="#${esc(s.id)}">
        <span class="path-kicker">Servidor</span>
        <span class="path-title">${esc(s.nome)}</span>
        <span class="path-txt">${esc(s.resumo)}</span>
        <span class="path-tags"><span class="pill srv">${esc(s.status)}</span>${s.sistemas.map(x => `<span class="pill">${esc(x.nome)}</span>`).join("")}</span>
        <span class="path-go">Ver os sistemas do ${esc(s.nome)} →</span>
      </a>`).join("");
    return `<section class="home-hero">
        <div class="home-hero-txt">
          <h1>A rota do level 8 ao 600: onde caçar, o que comprar e onde dropa</h1>
          <p>Passo a passo por faixa de level: hunts, equipamento na ordem de compra, magias com NPC e preço, quests e treino. Com a chance de drop de cada item.</p>
        </div>
        <div class="stats">${stats}</div>
      </section>
      ${promoBox(true)}
      <section class="home-block">
        <h2 class="block-h">Por onde começar</h2>
        <div class="paths">
          <button class="path" type="button" data-go-base>
            <span class="path-kicker">Guia geral</span>
            <span class="path-title">Tibia (base)</span>
            <span class="path-txt">Rota e equipamento por level das 5 vocações. Vale para o Tibia oficial e para qualquer servidor com o mapa do Tibia.</span>
            <span class="path-go">Escolher vocação ↓</span>
          </button>
          ${srvCards}
        </div>
      </section>
      <section class="home-block" id="vocacoes">
        <h2 class="block-h">Escolha sua vocação</h2>
        <div class="vocs">${BASE.vocacoes.map(v => {
          const i = VOC_INFO[v.id] || {};
          return `<a class="voc" href="#${esc(v.id)}">${slot(i.icon, true)}<span class="voc-txt"><span class="name">${esc(v.nome)}</span><span class="voc-desc">${esc(i.txt || "")}</span></span></a>`;
        }).join("")}
          <a class="voc" href="#quests">${slot("img/itens/falcon-shield.webp", true)}<span class="voc-txt"><span class="name">Quests por level</span><span class="voc-desc">As quests que mais valem a pena em cada faixa: acessos, descontos, bosses e itens.</span></span></a>
          <a class="voc" href="#imbuements">${slot("img/itens/soulbiter.webp", true)}<span class="voc-txt"><span class="name">Imbuements</span><span class="voc-desc">O que imbuir em cada item da sua vocação e os materiais de cada imbuement.</span></span></a>
          <a class="voc" href="#outfits">${slot("img/montarias/draptor.webp", true)}<span class="voc-txt"><span class="name">Outfits e montarias</span><span class="voc-desc">Como conseguir cada montaria e outfit jogando, com as da loja separadas.</span></span></a>
          <a class="voc" href="#monstros">${slot("img/monstros/grand-master-oberon.gif", true)}<span class="voc-txt"><span class="name">Monstros e bosses</span><span class="voc-desc">Todos os monstros e bosses do guia: onde ficam, o que dropam e vídeos de cada um.</span></span></a>
        </div>
      </section>`;
  }

  const DEFAULT_DESC = "Guia de Tibia por vocação e level: qual equipamento usar, qual monstro dropa, chance de drop e NPC que vende. Com seções para servidores como o HeroOT.";
  const PAGE_META = {
    inicio: ["Jantar Guia: rota de Tibia do level 8 ao 600, hunts e drops", DEFAULT_DESC],
    quests: ["Quests do Tibia por level: acessos, bosses e itens | Jantar Guia", "As quests do Tibia que mais valem a pena em cada faixa de level: acessos, descontos, bosses, itens, outfits e montarias."],
    imbuements: ["Imbuements por vocação: o que imbuir em cada item | Jantar Guia", "O que imbuir em cada item de Knight, Paladin, Sorcerer, Druid e Monk, com os materiais de cada imbuement."],
    outfits: ["Outfits e montarias do Tibia: como conseguir | Jantar Guia", "Como conseguir cada montaria e outfit do Tibia jogando, com as da loja separadas."],
    monstros: ["Monstros e bosses do Tibia: onde ficam e o que dropam | Jantar Guia", "Monstros e bosses do Tibia: onde ficam, level para caçar, o que dropam com a chance de drop e vídeos de cada um."]
  };
  function setMeta() {
    let m = PAGE_META[st.view];
    if (!m && SERVERS[st.view]) { const s = SERVERS[st.view]; m = [`${s.nome}: sistemas e guia do servidor | Jantar Guia`, `Guia do servidor ${s.nome}: sistemas, rates e o que muda em relação ao Tibia oficial.`]; }
    if (!m) { const v = BASE.vocacoes.find(x => x.id === st.view); if (v) m = [`${v.nome} no Tibia: rota do level 8 ao 600, hunts e equipamento | Jantar Guia`, `Rota do ${v.nome} no Tibia do level 8 ao 600: onde caçar, o que comprar em cada level, magias com NPC e preço, quests e treino.`]; }
    if (!m) m = PAGE_META.inicio;
    document.title = m[0];
    const d = document.querySelector('meta[name="description"]'); if (d) d.content = m[1];
  }

  function render() {
    nav();
    setMeta();
    const v = $("#view");
    document.body.classList.toggle("is-home", st.view === "inicio");
    if (st.view === "inicio") v.innerHTML = homeView();
    else if (st.view === "quests") v.innerHTML = questsView();
    else if (st.view === "imbuements") v.innerHTML = imbuView();
    else if (st.view === "outfits") v.innerHTML = lookView();
    else if (st.view === "monstros") { v.innerHTML = monstersView(); filterMon(); }
    else if (SERVERS[st.view]) v.innerHTML = serverView(SERVERS[st.view]);
    else v.innerHTML = vocationView(BASE.vocacoes.find(x => x.id === st.view) || BASE.vocacoes[0]);
  }

  function footer() {
    const parts = [`Feito por <b>${esc(SITE.criador)}</b>.`];
    if (SITE.canal) parts.push(`<a href="${esc(SITE.canal)}" target="_blank" rel="noopener">Canal do ${esc(SITE.criador)}</a>`);
    const tb = $("#topcupom");
    if (tb && SITE.codigo_streamer) { tb.hidden = false; tb.innerHTML = `<div class="wrap"><span>Crie sua conta no <b>${esc(SITE.servidor_parceiro)}</b> pelo link do ${esc(SITE.criador)} e, ao comprar cash, use o cupom <button class="tb-code" type="button" data-copy="${esc(SITE.codigo_streamer)}">${esc(SITE.codigo_streamer)}</button>${SITE.bonus_cupom ? ` para ganhar <b>${esc(SITE.bonus_cupom)}</b>` : ""}</span>${SITE.link_cadastro ? `<a href="${esc(SITE.link_cadastro)}" target="_blank" rel="sponsored noopener">Criar conta →</a>` : ""}</div>`; }
    $("#foot").innerHTML = `<span>${parts.join(" · ")}</span>
      <span>Dados de drop, XP e NPC: ${esc(BASE.fonte)}. Servidores podem mudar drops; o que foi conferido em cada servidor aparece marcado. Atualizado em ${esc(BASE.atualizado.split("-").reverse().join("/"))}.</span>
      <span>Tibia é marca da CipSoft GmbH. Este é um site de fã, sem ligação com a CipSoft.</span>`;
  }

  function fromHash() {
    const h = location.hash.slice(1);
    if (!h) return;
    if (SERVERS[h]) { st.srv = h; $("#srv").value = h; store.set("srv", h); }
    if (views().some(v => v.id === h)) st.view = h;
  }

  document.addEventListener("click", e => {
    const w = e.target.closest("[data-w]");
    if (w) { st.weapon = w.dataset.w; render(); }
    const lk = e.target.closest("[data-look]");
    if (lk) { st.look = lk.dataset.look; st.lookCat = "todas"; render(); }
    const lc = e.target.closest("[data-lcat]");
    if (lc) { st.lookCat = lc.dataset.lcat; render(); }
    const jp = e.target.closest("[data-jump]");
    if (jp) {
      e.preventDefault();
      const lv = parseInt(jp.dataset.jump), idx = TIERS.findIndex(t => lv >= t[1] && lv < t[2]);
      const el = document.getElementById("etapa-" + (idx < 0 ? TIERS.length - 1 : idx));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const ib = e.target.closest("[data-imbu]");
    if (ib) { st.imbuVoc = ib.dataset.imbu; render(); }
    const mf = e.target.closest("[data-monf]");
    if (mf) { st.monF = mf.dataset.monf; render(); }
    const ig = e.target.closest("[data-imbu-go]");
    if (ig) { e.preventDefault(); const el = document.getElementById(ig.dataset.imbuGo); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    const cp = e.target.closest("[data-copy]");
    if (cp) {
      const t = cp.dataset.copy, done = () => { cp.classList.add("copied"); const l = cp.querySelector(".copy-lbl"); const old = l ? l.textContent : ""; if (l) l.textContent = "Copiado!"; setTimeout(() => { cp.classList.remove("copied"); if (l) l.textContent = old; }, 1600); };
      try { navigator.clipboard.writeText(t).then(done, done); } catch (_) { done(); }
    }
    const qf = e.target.closest("[data-q]");
    if (qf) { st.qfilter = qf.dataset.q; render(); }
    if (e.target.closest("[data-go-base]")) {
      st.srv = ""; $("#srv").value = ""; store.set("srv", ""); render();
      const el = document.getElementById("vocacoes"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (e.target.closest("[data-clear-lvl]")) { st.level = null; $("#mylvl").value = ""; store.set("lvl", ""); render(); }
    if (e.target.closest("#theme")) {
      const light = document.documentElement.dataset.theme !== "light";
      if (light) document.documentElement.dataset.theme = "light"; else delete document.documentElement.dataset.theme;
      store.set("tema", light ? "light" : "dark"); themeLabel();
    }
  });
  window.addEventListener("hashchange", () => { fromHash(); render(); window.scrollTo(0, 0); });

  function themeLabel() {
    const light = document.documentElement.dataset.theme === "light";
    const t = $("#theme"); t.title = t.ariaLabel = light ? "Mudar para o modo escuro" : "Mudar para o modo claro";
    t.innerHTML = light ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg>`
      : `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g></svg>`;
  }

  async function boot() {
    themeLabel();
    try {
      const get = p => fetch(p, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
      [SITE, BASE, QUESTS, LOOK, ROTAS, IMBU] = await Promise.all([get("data/site.json"), get("data/tibia.json"), get("data/quests.json"), get("data/outfits-montarias.json"), get("data/rotas.json"), get("data/imbuements.json")]);
      const list = await Promise.all(SITE.servidores.map(id => get(`data/servidores/${id}.json`)));
      list.forEach(s => SERVERS[s.id] = s);
    } catch (e) {
      $("#view").innerHTML = `<p class="intro">Não foi possível carregar os dados do guia. Recarregue a página.</p>`;
      return;
    }
    $("#criador").textContent = SITE.criador;
    $("#srv").innerHTML = `<option value="">Tibia (base)</option>` + Object.values(SERVERS).map(s => `<option value="${esc(s.id)}">${esc(s.nome)}</option>`).join("");
    const savedSrv = store.get("srv"); if (savedSrv && SERVERS[savedSrv]) { st.srv = savedSrv; $("#srv").value = savedSrv; }
    const lv = parseInt(store.get("lvl")); if (lv > 0) { st.level = lv; $("#mylvl").value = lv; }
    $("#srv").addEventListener("change", e => {
      st.srv = e.target.value; store.set("srv", st.srv);
      if (!st.srv && !views().some(v => v.id === st.view)) location.hash = "inicio";
      render();
    });
    document.addEventListener("input", e => {
      if (e.target.id === "monq") { st.monQ = e.target.value; filterMon(); return; }
      if (e.target.id !== "lookq") return;
      st.lookQ = e.target.value; const pos = e.target.selectionStart; render();
      const el = $("#lookq"); if (el) { el.focus(); el.setSelectionRange(pos, pos); }
    });
    $("#mylvl").addEventListener("input", e => {
      const v = parseInt(e.target.value); st.level = v > 0 ? v : null; store.set("lvl", st.level || ""); render();
    });
    fromHash();
    footer();
    render();
  }
  boot();
})();
