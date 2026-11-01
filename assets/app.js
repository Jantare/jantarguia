(() => {
  const TIERS = [["8–20", 8, 20], ["20–35", 20, 35], ["35–60", 35, 60], ["60–100", 60, 100], ["100–150", 100, 150], ["150–200", 150, 200], ["200–300", 200, 300], ["300–400", 300, 400], ["400–500", 400, 500], ["500–600", 500, 600]];
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = n => Number(n).toLocaleString("pt-BR");
  const rarity = c => c >= 5 ? "common" : c >= 1 ? "uncommon" : "rare";
  const rlabel = c => c >= 5 ? "comum" : c >= 1 ? "incomum" : "raro";
  const pct = c => c.toFixed(2).replace(".", ",") + "%";
  const img = (src, cls) => src ? `<img class="${cls || ""}" src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">` : "";
  const slot = (src, big) => `<span class="slot${big ? " big" : ""}">${img(src)}</span>`;

  const st = { view: "inicio", weapon: "todas", level: null, srv: "" };
  let SITE, BASE, QUESTS, SERVERS = {};

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
    knight: { icon: "img/itens/heroic-axe.webp", txt: "Linha de frente. Aguenta o dano com escudo ou bate forte com arma de duas mãos. Guia separado para machado, espada e clava." },
    paladin: { icon: "img/itens/falcon-bow.webp", txt: "Ataca de longe com arco, besta, lança ou estrela. Dano alto e boa defesa." },
    sorcerer: { icon: "img/itens/wand-of-inferno.webp", txt: "Mago de dano. As magias mais fortes do jogo, mas com pouca vida." },
    druid: { icon: "img/itens/hailstorm-rod.webp", txt: "Mago de suporte. Cura o time e também causa bastante dano." },
    monk: { icon: "img/itens/jo-staff.webp", txt: "Luta corpo a corpo com punhos e bastões. A vocação mais nova do Tibia." }
  };

  function views() {
    const v = [{ id: "inicio", nome: "Início" }, ...BASE.vocacoes.map(x => ({ id: x.id, nome: x.nome }))];
    v.push({ id: "quests", nome: "Quests" });
    v.push({ id: "monstros", nome: "Monstros" });
    if (st.srv) v.push({ id: st.srv, nome: SERVERS[st.srv].nome, srv: true });
    return v;
  }

  function nav() {
    $("#tabs").innerHTML = views().map(v =>
      `<a class="tab${v.srv ? " srv" : ""}" href="#${v.id}" ${v.id === st.view ? 'aria-current="page"' : ""}>${esc(v.nome)}</a>`).join("");
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
      return `<div class="src">${img(m.img, "mon-ico") || "<span></span>"}<span class="m">${esc(s.m)}</span><span class="c"><span class="dot ${rarity(s.c)}" title="${rlabel(s.c)}"></span>${pct(s.c)}</span>` +
        `<span class="w">${m.boss ? `<span class="boss-tag">boss</span> ${m.loc ? esc(m.loc) : "veja na TibiaWiki"}` : `caça a partir do lvl ${esc(m.lvl)} · ${m.loc ? esc(m.loc) : "local no Hunt Finder"}`}</span></div>`;
    }).join("");
    const npc = it.shop.length ? `<div class="line"><b>NPC:</b> ${it.shop.map(s => `${esc(s.n)} (${num(s.p)} gp)`).join(", ")}</div>` : "";
    const quest = it.quest ? `<div class="line"><b>Recompensa:</b> ${esc(it.quest)}</div>` : "";
    const onlyNpc = !it.src.length && it.shop.length ? `<p class="tip">Não dropa em monstro acessível: compre no NPC.</p>` : "";
    return `<article class="card">
      <div class="head">${slot(it.img)}<div class="head-txt">
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

  function vocationView(voc) {
    let items = voc.itens;
    if (voc.id === "knight" && st.weapon !== "todas")
      items = items.filter(i => !i.slot.startsWith("Arma") || i.slot.includes(st.weapon));
    const cur = tierOf(st.level);
    const curIdx = cur ? TIERS.findIndex(t => t[0] === cur) : 0;
    const note = cur ? `<div class="filter-note"><span>Mostrando do level ${esc(cur)} em diante, para o level ${st.level}.</span><button type="button" data-clear-lvl>Ver todas as faixas</button></div>` : "";
    return `<div class="page-h"><h1>${esc(voc.nome)}: equipamento por level</h1>
      <p class="intro">Só aparece o que vale trocar em cada faixa; o resto você mantém da faixa anterior. Toque no nome do item para abrir a TibiaWiki.</p></div>
      ${serverBanner()}
      <div class="legend"><span><span class="dot common"></span> comum (5%+)</span><span><span class="dot uncommon"></span> incomum (1–5%)</span><span><span class="dot rare"></span> raro (&lt;1%)</span></div>
      ${note}
      ${TIERS.map(([t], idx) => {
        const its = items.filter(i => i.tier === t);
        if (!its.length || idx < curIdx) return "";
        return `<section class="tier"><div class="tier-h"><span class="lvl-badge">Lvl ${t}</span><h2>${its.length} ${its.length === 1 ? "troca" : "trocas"}</h2>${cur === t ? '<span class="here">você está aqui</span>' : ""}<span class="rule"></span></div>
          <div class="grid">${its.map(card).join("")}</div></section>`;
      }).join("")}`;
  }

  function monstersView() {
    const ms = Object.entries(BASE.monstros).sort((a, b) => parseInt(a[1].lvl) - parseInt(b[1].lvl));
    return `<div class="page-h"><h1>Monstros</h1>
      <p class="intro">Todos os monstros da rota, do mais fácil ao mais difícil. O level é uma estimativa pelo XP e pela vida: confirme no jogo.</p></div>
      ${serverBanner()}
      <div class="grid">${ms.map(([n, m]) => `<article class="card">
        <div class="head">${slot(m.img, true)}<div class="head-txt">
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
    return `<div class="page-h"><h1>Quests por level</h1>
      <p class="intro">As quests que os guias da comunidade mais recomendam, na ordem em que vale fazer. Cada uma mostra o que libera e quais itens do Jantar Guia vêm dela.</p></div>
      ${QUESTS.faixas.map(f => `<section class="tier">
        <div class="tier-h"><span class="lvl-badge">${esc(f.faixa)}</span><span class="rule"></span></div>
        <p class="intro">${esc(f.desc)}</p>
        <div class="grid">${f.quests.map(q => `<article class="card quest">
          <div class="q-head"><a class="name" href="${esc(q.wiki)}" target="_blank" rel="noopener">${esc(q.nome)}</a><span class="req">lvl ${esc(q.lvl)}</span></div>
          <div class="path-tags">${q.tags.map(t => `<span class="pill">${esc(t)}</span>`).join("")}</div>
          <p class="q-txt">${esc(q.txt)}</p>
          ${q.limite ? `<div class="q-warn">${esc(q.limite)}</div>` : ""}
          ${q.itens && q.itens.length ? `<div class="how"><span class="how-t">Itens do guia que vêm daqui</span><div class="q-items">${q.itens.map(n => `<span class="q-item">${img(itemImg[n], "q-ico")}${esc(n)}</span>`).join("")}</div></div>` : ""}
        </article>`).join("")}</div>
      </section>`).join("")}
      <p class="foot-note">Fontes: ${QUESTS.fontes.map(esc).join(", ")}. Os levels são os recomendados pela comunidade; confira o mínimo de cada quest na TibiaWiki.</p>`;
  }

  function serverView(s) {
    return `<div class="page-h"><h1>${esc(s.nome)}</h1>
      <p class="intro">${esc(s.resumo)}</p></div>
      <div class="notice"><span><b>${esc(s.status)}</b></span><span>Site oficial: <a href="${esc(s.site)}" target="_blank" rel="noopener">${esc(s.site.replace(/^https?:\/\//, ""))}</a></span></div>
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
          <h1>Qual equipamento usar em cada level, e onde ele dropa</h1>
          <p>O que vestir do level 8 ao 600 em cada vocação, qual monstro ou boss dropa cada item, a chance de drop e qual NPC vende.</p>
        </div>
        <div class="stats">${stats}</div>
      </section>
      <section class="home-block">
        <h2 class="block-h">Por onde começar</h2>
        <div class="paths">
          <button class="path" type="button" data-go-base>
            <span class="path-kicker">Guia geral</span>
            <span class="path-title">Tibia (base)</span>
            <span class="path-txt">Equipamento por level das 5 vocações. Vale para o Tibia oficial e para qualquer servidor com o mapa do Tibia.</span>
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
          <a class="voc" href="#monstros">${slot("img/monstros/grand-master-oberon.gif", true)}<span class="voc-txt"><span class="name">Monstros e bosses</span><span class="voc-desc">Todos os monstros e bosses do guia: onde ficam, o que dropam e vídeos de cada um.</span></span></a>
        </div>
      </section>`;
  }

  function render() {
    nav();
    const v = $("#view");
    document.body.classList.toggle("is-home", st.view === "inicio");
    if (st.view === "inicio") v.innerHTML = homeView();
    else if (st.view === "quests") v.innerHTML = questsView();
    else if (st.view === "monstros") v.innerHTML = monstersView();
    else if (SERVERS[st.view]) v.innerHTML = serverView(SERVERS[st.view]);
    else v.innerHTML = vocationView(BASE.vocacoes.find(x => x.id === st.view) || BASE.vocacoes[0]);
  }

  function footer() {
    const parts = [`Feito por <b>${esc(SITE.criador)}</b>.`];
    if (SITE.canal) parts.push(`<a href="${esc(SITE.canal)}" target="_blank" rel="noopener">Canal do ${esc(SITE.criador)}</a>`);
    if (SITE.codigo_streamer) parts.push(`Código de streamer: <b>${esc(SITE.codigo_streamer)}</b>`);
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
    $("#theme").textContent = document.documentElement.dataset.theme === "light" ? "Modo escuro" : "Modo claro";
  }

  async function boot() {
    themeLabel();
    try {
      const get = p => fetch(p, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
      [SITE, BASE, QUESTS] = await Promise.all([get("data/site.json"), get("data/tibia.json"), get("data/quests.json")]);
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
    $("#mylvl").addEventListener("input", e => {
      const v = parseInt(e.target.value); st.level = v > 0 ? v : null; store.set("lvl", st.level || ""); render();
    });
    fromHash();
    footer();
    render();
  }
  boot();
})();
