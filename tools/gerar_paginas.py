#!/usr/bin/env python3
"""Gera as páginas reais do site a partir de data/*.json.

Rode na raiz do repositório depois de mudar qualquer dado:

    python tools/gerar_paginas.py

Cria druid/index.html, quests/index.html etc., atualiza o index.html da raiz,
o 404.html e o sitemap.xml. O conteúdo gerado é para o Google e para quem está
sem JavaScript; com JavaScript, o assets/app.js desenha a página completa.
"""
import datetime
import json
import os
import re
from html import escape as e

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_URL = "https://jantarguia.com.br/"
HOJE = datetime.date.today().isoformat()


def load(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return json.load(f)


def save(p, txt):
    full = os.path.join(ROOT, p)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(txt)


def num(n):
    return f"{n:,}".replace(",", ".")


def pct(c):
    return f"{c:.2f}".replace(".", ",") + "%"


def texto(s):
    """Tira os marcadores que o app.js troca pela arma escolhida."""
    if isinstance(s, dict):
        return " ".join(f"{k}: {v}" for k, v in s.items())
    s = str(s or "").replace("{skill}", "a skill da arma")
    return re.sub(r"\{[^{}]*\}", "", s).strip()


def ul(linhas):
    return "<ul>" + "".join(f"<li>{x}</li>" for x in linhas) + "</ul>" if linhas else ""


SITE, BASE, QUESTS, LOOK, ROTAS, IMBU = (
    load("data/site.json"), load("data/tibia.json"), load("data/quests.json"),
    load("data/outfits-montarias.json"), load("data/rotas.json"), load("data/imbuements.json"),
)
SERVERS = [load(f"data/servidores/{i}.json") for i in SITE["servidores"]]
VOCS = BASE["vocacoes"]
NOMES = [("", "Início")] + [(v["id"], v["nome"]) for v in VOCS] + [
    ("quests", "Quests"), ("imbuements", "Imbuements"), ("outfits", "Outfits"), ("monstros", "Monstros"), ("lootsplit", "Loot Split")]


def link(pid, nome):
    return f'<a href="{pid + "/" if pid else "./"}">{e(nome)}</a>'


def fonte(i):
    p = []
    if i.get("src"):
        p.append("drop: " + ", ".join(f'{s["m"]} ({pct(s["c"])})' for s in i["src"]))
    if i.get("shop"):
        p.append("NPC: " + ", ".join(f'{s["n"]} ({num(s["p"])} gp)' for s in i["shop"]))
    if i.get("quest"):
        p.append("quest: " + i["quest"])
    return "; ".join(p)


def faixa_max(vid):
    u = ROTAS["vocacoes"][vid]["etapas"][-1]["faixa"]
    return int(re.sub(r"\D", "", u.split("–")[-1]))


def pag_vocacao(v):
    r = ROTAS["vocacoes"][v["id"]]
    res = r["resumo"]
    h = [f'<h1>{e(v["nome"])}: rota do level 8 ao {faixa_max(v["id"])}</h1>',
         "<p>Cada etapa mostra onde caçar, o que comprar, quais magias pegar, as quests e o que treinar.</p>"]
    if r["pronta"] and res:
        h.append(f'<h2>{e(res.get("titulo") or "Resumo de " + v["nome"])}</h2><p>{e(res["papel"])}</p>')
        if res.get("skills"):
            h.append(f'<p>{e(res["skills"])}</p>')
        h.append(ul([e(x) for x in res.get("imbuements", [])]))
        if res.get("rtc"):
            h.append(f'<p>{e(res["rtc"])}</p>')
    for et in r["etapas"]:
        f = et["faixa"]
        h.append(f"<section><h2>{e(v['nome'])} level {e(f)}</h2>")
        if et.get("objetivo"):
            h.append(f'<p>{e(texto(et["objetivo"]))}</p>')
        if et["hunts"]:
            h.append("<h3>Onde caçar</h3>")
            h.append(ul([
                e(" · ".join(x for x in [x_h.get("onde") or x_h.get("m"), x_h.get("m") if x_h.get("onde") else "",
                                         f'level {x_h["lv"]}' if x_h.get("lv") else "",
                                         f'{num(x_h["exp"])} de XP' if x_h.get("exp") else "",
                                         {"solo": "solo", "pt": "em party", "ambos": "solo ou em party"}.get(x_h.get("modo"), ""),
                                         f'cerca de {num(x_h["xph"])} de XP e {num(x_h["profit"])} gp de profit por hora (Tibia oficial)' if x_h.get("xph") else "",
                                         texto(x_h.get("nota"))] if x))
                for x_h in et["hunts"]]))
        itens = [i for i in v["itens"] if i["tier"] == f]
        if itens:
            h.append("<h3>O que comprar ou trocar</h3>")
            h.append(ul([
                e(" · ".join(x for x in [f'{i["slot"]}: {i["item"]}', f'level {i["lv"]}' if i.get("lv") else "",
                                         i.get("attr"), fonte(i), texto(i.get("tip"))] if x))
                for i in itens]))
        if et["magias"]:
            h.append("<h3>Magias para comprar</h3>")
            h.append(ul([
                e(" · ".join(x for x in [s["n"], s.get("w"), f'level {s["lv"]}', f'{num(s["p"])} gp' if s.get("p") else "",
                                         ", ".join(s.get("npc") or [])] if x))
                for s in et["magias"]]))
        qs = ROTAS["quests"].get(f) or []
        if qs:
            h.append("<h3>Quests</h3>" + ul([link("quests", q) for q in qs]))
        if et.get("treino"):
            h.append(f'<h3>Treino</h3><p>{e(texto(et["treino"]))}</p>')
        h.append("</section>")
    return "".join(h)


def pag_quests():
    h = ["<h1>Quests do Tibia por level</h1>"]
    for f in QUESTS["faixas"]:
        h.append(f'<section><h2>{e(f["faixa"])}</h2><p>{e(f.get("desc") or "")}</p>')
        for q in f["quests"]:
            d = q.get("det") or {}
            h.append(f'<h3>{e(q["nome"])} ({e(q.get("lvl") or "")})</h3><p>{e(q.get("txt") or "")}</p>')
            extra = [f"{r}: {d[k]}" for k, r in (("onde", "Onde"), ("recompensa", "Recompensa"), ("perigos", "Perigos")) if d.get(k)]
            for k, r in (("outfit", "Outfit"), ("montaria", "Montaria")):
                if q.get(k):
                    extra.append(f"{r}: {q[k]}")
            if q.get("itens"):
                extra.append("Itens: " + ", ".join(q["itens"]))
            h.append(ul([e(x) for x in extra]))
        h.append("</section>")
    return "".join(h)


def pag_imbuements():
    h = ["<h1>Imbuements por vocação</h1>", ul([e(x) for x in IMBU["dicas"]]),
         "<h2>Custos</h2>", ul([e(f"{a}: {b}") for a, b in IMBU["custos"]])]
    for r in IMBU["rec"].values():
        h.append(f'<section><h2>Imbuements de {e(r["nome"])}</h2>')
        h.append(ul([e(" · ".join(s)) for s in r["slots"]]) + "</section>")
    h.append("<h2>Lista de imbuements</h2>")
    for i in IMBU["lista"]:
        h.append(f'<section><h3>{e(i["nome"])}: {e(i["efeito"])}</h3><p>{e(i.get("onde") or "")}</p>')
        h.append(ul([e(f'{n["n"]}: {n["v"]} · ' + ", ".join(m)) for n, m in zip(i["niveis"], i["itens"])]) + "</section>")
    return "".join(h)


def pag_outfits():
    h = ["<h1>Outfits e montarias do Tibia</h1>", "<h2>Montarias</h2>",
         ul([e(f'{m["nome"]}: {m["como"]}') for m in LOOK["montarias"]]), "<h2>Outfits</h2>",
         ul([e(f'{o["nome"]}: {o["como"]}') for o in LOOK["outfits"]])]
    return "".join(h)


def pag_monstros():
    def linha(n, m):
        p = [n + (" (boss)" if m.get("boss") else "")]
        if m.get("lvl"):
            p.append(f'level {m["lvl"]}')
        if m.get("hp"):
            p.append(f'{num(m["hp"])} de vida')
        if m.get("exp"):
            p.append(f'{num(m["exp"])} de XP')
        if m.get("loc"):
            p.append(m["loc"])
        if m.get("items"):
            p.append("dropa: " + ", ".join(m["items"]))
        return e(" · ".join(p))
    M = sorted(BASE["monstros"].items())
    return ("<h1>Monstros e bosses do Tibia</h1><h2>Bosses</h2>" + ul([linha(n, m) for n, m in M if m.get("boss")])
            + "<h2>Monstros</h2>" + ul([linha(n, m) for n, m in M if not m.get("boss")]))


def pag_lootsplit():
    return ("<h1>Loot Split: divisão de loot da party</h1>"
            "<p>Ferramenta para dividir o loot de uma party hunt no Tibia. Copie o texto do Party Hunt Analyser, cole na página "
            "e veja o lucro total, quanto fica para cada jogador e quem transfere para quem.</p>"
            "<p>Dá para somar gastos extras de um jogador, como entrada de boss, e tirar alguém da divisão. "
            "A ferramenta gera o comando de transferência para falar no NPC do banco.</p>")


def pag_servidor(s):
    return (f'<h1>{e(s["nome"])}</h1><p>{e(s["resumo"])}</p>'
            + "".join(f'<h2>{e(x["nome"])}</h2><p>{e(x["texto"])}</p>' for x in s["sistemas"]))


def pag_inicio():
    return ("<h1>A rota do level 8 ao 1000: onde caçar, o que comprar e onde dropa</h1>"
            "<p>Passo a passo por faixa de level: hunts, equipamento na ordem de compra, magias com NPC e preço, "
            "quests e treino. Com a chance de drop de cada item.</p><h2>Guias</h2>"
            + ul([link(v["id"], f'Guia de {v["nome"]}') for v in VOCS]
                 + [link("quests", "Quests por level"), link("imbuements", "Imbuements por vocação"),
                    link("outfits", "Outfits e montarias"), link("monstros", "Monstros e bosses"), link("lootsplit", "Loot Split: divisão de loot da party")]
                 + [link(s["id"], s["nome"]) for s in SERVERS]))


DESC_HOME = "Guia de Tibia por vocação e level: qual equipamento usar, qual monstro dropa, chance de drop e NPC que vende. Com seções para servidores como o HeroOT."
PAGS = [("", "Jantar Guia: rota de Tibia do level 8 ao 1000, hunts e drops", DESC_HOME, pag_inicio())]
for v in VOCS:
    n, m = v["nome"], faixa_max(v["id"])
    PAGS.append((v["id"], f"{n} no Tibia: rota do level 8 ao {m}, hunts e equipamento | Jantar Guia",
                 f"Rota do {n} no Tibia do level 8 ao {m}: onde caçar, o que comprar em cada level, magias com NPC e preço, quests e treino.",
                 pag_vocacao(v)))
PAGS += [
    ("quests", "Quests do Tibia por level: acessos, bosses e itens | Jantar Guia",
     "As quests do Tibia que mais valem a pena em cada faixa de level: acessos, descontos, bosses, itens, outfits e montarias.", pag_quests()),
    ("imbuements", "Imbuements por vocação: o que imbuir em cada item | Jantar Guia",
     "O que imbuir em cada item de Knight, Paladin, Sorcerer, Druid e Monk, com os materiais de cada imbuement.", pag_imbuements()),
    ("outfits", "Outfits e montarias do Tibia: como conseguir | Jantar Guia",
     "Como conseguir cada montaria e outfit do Tibia jogando, com as da loja separadas.", pag_outfits()),
    ("monstros", "Monstros e bosses do Tibia: onde ficam e o que dropam | Jantar Guia",
     "Monstros e bosses do Tibia: onde ficam, level para caçar, o que dropam com a chance de drop e vídeos de cada um.", pag_monstros()),
    ("lootsplit", "Loot Split: divisão de loot da party no Tibia | Jantar Guia",
     "Cole o texto do Party Hunt Analyser do Tibia e veja quanto cada jogador recebe e quem transfere para quem.", pag_lootsplit()),
]
for s in SERVERS:
    PAGS.append((s["id"], f'{s["nome"]}: sistemas e guia do servidor | Jantar Guia',
                 f'Guia do servidor {s["nome"]}: sistemas, rates e o que muda em relação ao Tibia oficial.', pag_servidor(s)))


def sub(pat, rep, txt):
    novo, n = re.subn(pat, lambda _: rep, txt, count=1, flags=re.S)
    assert n == 1, pat
    return novo


with open(os.path.join(ROOT, "index.html"), encoding="utf-8") as f:
    TEMPLATE = f.read()
NAV = "".join(f'<a class="tab" href="{i + "/" if i else "./"}"><span>{e(n)}</span></a>' for i, n in NOMES)


def montar(pid, titulo, desc, corpo):
    url = SITE_URL + (pid + "/" if pid else "")
    t = TEMPLATE
    t = sub(r"<title>.*?</title>", f"<title>{e(titulo, quote=False)}</title>", t)
    t = sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{e(desc)}">', t)
    t = sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', t)
    t = sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">', t)
    t = sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{e(titulo)}">', t)
    t = sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{e(desc)}">', t)
    ld = ({"@context": "https://schema.org", "@type": "WebSite", "name": "Jantar Guia", "url": SITE_URL, "inLanguage": "pt-BR",
           "description": "Guia de Tibia por vocação e level: hunts, equipamento, magias, quests e chance de drop."} if not pid else
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Início", "item": SITE_URL},
              {"@type": "ListItem", "position": 2, "name": titulo.split(":")[0].split(" |")[0], "item": url}]})
    t = sub(r'<script type="application/ld\+json">.*?</script>',
            f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>', t)
    t = sub(r'<nav class="tabs" id="tabs" aria-label="Seções">.*?</nav>',
            f'<nav class="tabs" id="tabs" aria-label="Seções">{NAV}</nav>', t)
    t = sub(r'<main><div class="wrap" id="view">.*?</div></main>',
            f'<main><div class="wrap" id="view"><p class="loading">Carregando o guia…</p><div class="prerender">{corpo}</div></div></main>', t)
    return t


for pid, titulo, desc, corpo in PAGS:
    save(f"{pid}/index.html" if pid else "index.html", montar(pid, titulo, desc, corpo))

save("404.html", """<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<base href="/">
<title>Página não encontrada | Jantar Guia</title>
<meta name="robots" content="noindex">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<main><div class="wrap"><div class="prerender" style="display:block">
<h1>Página não encontrada</h1>
<p>Esse endereço não existe no Jantar Guia. Escolha um dos guias:</p>
""" + ul([link(i, n) for i, n in NOMES]) + """
</div></div></main>
</body>
</html>
""")

save("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
     + "".join(f"  <url>\n    <loc>{SITE_URL}{p + '/' if p else ''}</loc>\n    <lastmod>{HOJE}</lastmod>\n  </url>\n" for p, *_ in PAGS)
     + "</urlset>\n")
print(len(PAGS), "páginas geradas")
