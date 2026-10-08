# Calculadora de Venda — Balaclav

Site estático (HTML/CSS/JS puro, sem dependências) para calcular o valor de venda de Epinefrina, Morfina, Algema e Capuz, com preços diferentes para venda com e sem parceria.

## Estrutura

```
index.html          Página principal
css/style.css        Estilos (tema roxo/Balaclav)
js/script.js          Lógica da calculadora
data/precos.json      Preços dos itens (editar aqui)
img/                  Logo e tabela de preços
```

## Como alterar os preços

Edite `data/precos.json`. Cada item tem `id`, `nome`, `icone` (emoji), `precoComParceria` e `precoSemParceria`. Você pode adicionar ou remover itens livremente — a página é gerada automaticamente a partir deste arquivo.

```json
{
  "moeda": "R$ ",
  "itens": [
    { "id": "epinefrina", "nome": "Epinefrina", "icone": "💉", "precoComParceria": 1800, "precoSemParceria": 2400 }
  ]
}
```

Ao trocar a tabela, substitua também `img/tabela.png`.

## Publicar no GitHub Pages

1. Crie o repositório `Balaclav-Calc` no GitHub e envie o código (`git push`).
2. No GitHub, vá em **Settings → Pages**.
3. Em "Source", selecione a branch `main` e a pasta `/root`.
4. Salve. O site ficará disponível em `https://lorddarkspy.github.io/Balaclav-Calc/`.

## Testar localmente

Como a página carrega `data/precos.json` via `fetch`, abrir o `index.html` diretamente (`file://`) pode ser bloqueado pelo navegador. Para testar localmente, rode um servidor simples na pasta do projeto, por exemplo:

```
python -m http.server 8000
```

e acesse `http://localhost:8000`.
