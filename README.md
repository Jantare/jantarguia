# Jantar Guia

Guia de Tibia por vocação e level: qual equipamento usar, qual monstro dropa, chance de drop e NPC que vende. Tem seções por servidor (começando pelo HeroOT).

## Onde ficam as informações

| Arquivo | O que tem |
|---|---|
| `data/site.json` | Nome do site, criador, link do canal, código de streamer e lista de servidores |
| `data/tibia.json` | Base do Tibia: itens por vocação e faixa de level (8 a 600), monstros e bosses, chances de drop, NPCs e quests |
| `data/servidores/heroot.json` | O que é diferente no HeroOT: sistemas próprios e diferenças conferidas em itens e monstros |

O visual fica em `index.html` e `assets/`. Para atualizar o guia, só os arquivos de `data/` mudam.

### Marcar uma diferença conferida no servidor

Em `data/servidores/heroot.json`, use o nome do item ou monstro exatamente como aparece no site:

```json
"itens": {
  "Zaoan Legs": "Conferido no beta: dropa também do Lizard Legionnaire."
},
"monstros": {
  "Lizard Zaogun": "Fica na cave ao norte de Zao no HeroOT."
}
```

### Adicionar outro servidor

1. Copie `data/servidores/heroot.json` com outro nome (ex.: `outroot.json`) e mude `id`, `nome` e os textos.
2. Adicione o `id` na lista `servidores` de `data/site.json`.

## Fonte dos dados

Drops, XP, vida, level dos itens e NPCs vêm da base de dados do [Canary (OpenTibiaBR)](https://github.com/opentibiabr/canary), que espelha o Tibia 15.x. Tibia é marca da CipSoft GmbH; este é um site de fã.
