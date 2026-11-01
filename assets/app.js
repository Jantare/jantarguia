(() => {
  const TIERS = [["8–20", 8, 20], ["20–35", 20, 35], ["35–60", 35, 60], ["60–100", 60, 100], ["100–150", 100, 150]];
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = n => Number(n).toLocaleString("pt-BR");
  const rarity = c => c >= 5 ? "common" : c >= 1 ? "uncommon" : "rare";
  const rlabel = c => c >= 5 ? "comum" : c >= 1 ? "incomum" : "raro";
  const pct = c => c.toFixed(2).replace(".", ",") + "%";

  const st = { view: "knight", weapon: "todas", level: null, srv: "" };
  let SITE, BASE, SERVERS = {};

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  };

  function tierOf(lv) {
    if (!lv) return null;
    for (const t of TIERS) if (lv >= t[1] && lv < t[2]) return t[0];
    return lv >= 150 ? "100–150" : "8–20";
  }

  function views() {
    const v = BASE.vocacoes.map(x => ({ id: x.id, nome: x.nome }));
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
      return `<div class="src"><span class="m">${esc(s.m)}</span><span class="c"><span class="dot ${rarity(s.c)}" title="${rlabel(s.c)}"></span>${pct(s.c)}</span>` +
        `<span class="w">caça a partir do lvl ${esc(m.lvl)} · ${m.loc ? esc(m.loc) : "local no Hunt Finder"}</span></div>`;
    }).join("");
    const npc = it.shop.length ? `<div class="line"><b>NPC:</b> ${it.shop.map(s => `${esc(s.n)} (${num(s.p)} gp)`).join(", ")}</div>` : "";
    const quest = it.quest ? `<div class="line"><b>Recompensa:</b> ${esc(it.quest)}</div>` : "";
    const onlyNpc = !it.src.length && it.shop.length ? `<p class="tip">Não dropa em monstro acessível: compre no NPC.</p>` : "";
    return `<article class="card">
      <div class="meta"><span>${esc(it.slot)}</span><span class="req">${it.lv ? "lvl " + it.lv : "sem level"}</span></div>
      <a class="name" href="${esc(it.wiki)}" target="_blank" rel="noopener">${esc(it.item)}</a>
      <div class="attr">${esc(it.attr)}</div>
      <div class="how">${srcs}${npc}${quest}${onlyNpc}</div>
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
    return `<h1>${esc(voc.nome)}: equipamento por level</h1>
      <p class="intro">Só aparece o que vale trocar em cada faixa; o resto você mantém da faixa anterior. Toque no nome do item para abrir a TibiaWiki.</p>
      ${serverBanner()}
      <div class="legend"><span><span class="dot common"></span> comum (5%+)</span><span><span class="dot uncommon"></span> incomum (1–5%)</span><span><span class="dot rare"></span> raro (&lt;1%)</span></div>
      ${TIERS.map(([t]) => {
        const its = items.filter(i => i.tier === t);
        if (!its.length) return "";
        return `<section class="tier${cur && cur !== t ? " dim" : ""}"><div class="tier-h"><h2>Level ${t}</h2>${cur === t ? '<span class="here">você está aqui</span>' : ""}</div>
          <div class="grid">${its.map(card).join("")}</div></section>`;
      }).join("")}`;
  }

  function monstersView() {
    const ms = Object.entries(BASE.monstros).sort((a, b) => parseInt(a[1].lvl) - parseInt(b[1].lvl));
    return `<h1>Monstros</h1>
      <p class="intro">Todos os monstros da rota, do mais fácil ao mais difícil. O level é uma estimativa pelo XP e pela vida: confirme no jogo.</p>
      ${serverBanner()}
      <div class="grid">${ms.map(([n, m]) => `<article class="card">
        <div class="meta"><span>${num(m.exp)} xp · ${num(m.hp)} hp</span><span class="req">lvl ${esc(m.lvl)}</span></div>
        <span class="name">${esc(n)}</span>
        <div class="line"><b>Onde:</b> ${m.loc ? esc(m.loc) : "ver Hunt Finder"}</div>
        <div class="line"><b>Dropa:</b> ${m.items.map(esc).join(", ")}</div>
        ${srvNote("monstros", n)}
        <div class="links"><a href="${esc(m.wiki)}" target="_blank" rel="noopener">TibiaWiki</a><a href="${esc(m.yt)}" target="_blank" rel="noopener">Vídeos no YouTube</a></div>
      </article>`).join("")}</div>`;
  }

  function serverView(s) {
    return `<h1>${esc(s.nome)}</h1>
      <p class="intro">${esc(s.resumo)}</p>
      <div class="notice"><span><b>${esc(s.status)}</b></span><span>Site oficial: <a href="${esc(s.site)}" target="_blank" rel="noopener">${esc(s.site.replace(/^https?:\/\//, ""))}</a></span></div>
      <h2>Sistemas próprios</h2>
      <div class="sys">${s.sistemas.map(x => `<article class="card"><span class="name">${esc(x.nome)}</span><p class="tip">${esc(x.texto)}</p></article>`).join("")}</div>`;
  }

  function render() {
    nav();
    const v = $("#view");
    if (st.view === "monstros") v.innerHTML = monstersView();
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
  });
  window.addEventListener("hashchange", () => { fromHash(); render(); window.scrollTo(0, 0); });

  async function boot() {
    try {
      const get = p => fetch(p, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
      [SITE, BASE] = await Promise.all([get("data/site.json"), get("data/tibia.json")]);
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
      if (!st.srv && !views().some(v => v.id === st.view)) location.hash = "knight";
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
