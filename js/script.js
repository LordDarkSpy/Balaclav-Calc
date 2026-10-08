const listaItensEl = document.getElementById('lista-itens');
const resumoListaEl = document.getElementById('resumo-lista');
const resumoTipoEl = document.getElementById('resumo-tipo');
const totalValorEl = document.getElementById('total-valor');
const limparBtn = document.getElementById('limpar');
const copiarBtn = document.getElementById('copiar');
const radiosParceria = document.querySelectorAll('input[name="parceria"]');

let moeda = 'R$ ';
let totalAtual = 0;
let comParceria = false;
const quantidades = {};

function formatarValor(valor) {
  return moeda + valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function precoAtual(item) {
  return comParceria ? item.precoComParceria : item.precoSemParceria;
}

function calcularTotal(itens) {
  return itens.reduce((total, item) => total + precoAtual(item) * (quantidades[item.id] || 0), 0);
}

function atualizarResumo(itens) {
  const selecionados = itens.filter((item) => (quantidades[item.id] || 0) > 0);

  resumoTipoEl.textContent = comParceria ? 'Com parceria' : 'Sem parceria';
  resumoTipoEl.classList.toggle('com-parceria', comParceria);

  resumoListaEl.innerHTML = '';
  if (selecionados.length === 0) {
    resumoListaEl.innerHTML = '<li class="resumo-vazio">Nenhum item selecionado</li>';
  } else {
    selecionados.forEach((item) => {
      const qtd = quantidades[item.id];
      const li = document.createElement('li');
      li.innerHTML = `<span>${item.icone} ${item.nome} x${qtd}</span><span>${formatarValor(precoAtual(item) * qtd)}</span>`;
      resumoListaEl.appendChild(li);
    });
  }

  totalAtual = calcularTotal(itens);
  totalValorEl.textContent = formatarValor(totalAtual);
}

function copiarComExecCommand(texto) {
  const textarea = document.createElement('textarea');
  textarea.value = texto;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, texto.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (e) {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

function copiarParaAreaDeTransferencia(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texto).catch(() => {
      if (!copiarComExecCommand(texto)) throw new Error('Falha ao copiar');
    });
  }

  return copiarComExecCommand(texto) ? Promise.resolve() : Promise.reject(new Error('Falha ao copiar'));
}

function atualizarLinha(item) {
  const qtd = quantidades[item.id] || 0;
  const linha = document.getElementById(`linha-${item.id}`);
  linha.querySelector('.item-qtd input').value = qtd;
  linha.querySelector('.item-preco').textContent = `${formatarValor(precoAtual(item))} / unidade`;
  linha.querySelector('.item-subtotal').textContent = formatarValor(precoAtual(item) * qtd);
}

function renderizarItens(itens) {
  listaItensEl.innerHTML = '';

  itens.forEach((item) => {
    quantidades[item.id] = 0;

    const linha = document.createElement('div');
    linha.className = 'item-linha';
    linha.id = `linha-${item.id}`;
    const iconeHtml = item.imagem
      ? `<img class="item-icone-img" src="${item.imagem}" alt="${item.nome}">`
      : `<span class="item-icone">${item.icone}</span>`;

    linha.innerHTML = `
      ${iconeHtml}
      <div class="item-info">
        <p class="item-nome">${item.nome}</p>
        ${item.descricao ? `<p class="item-descricao">${item.descricao}</p>` : ''}
        <p class="item-preco">${formatarValor(precoAtual(item))} / unidade</p>
      </div>
      <div class="item-qtd">
        <button type="button" class="passo-grande" data-passo="-10" aria-label="Diminuir 10">-10</button>
        <button type="button" class="passo-grande" data-passo="-5" aria-label="Diminuir 5">-5</button>
        <button type="button" data-passo="-1" aria-label="Diminuir quantidade">-</button>
        <input type="number" min="0" value="0" inputmode="numeric" aria-label="Quantidade de ${item.nome}">
        <button type="button" data-passo="1" aria-label="Aumentar quantidade">+</button>
        <button type="button" class="passo-grande" data-passo="5" aria-label="Aumentar 5">+5</button>
        <button type="button" class="passo-grande" data-passo="10" aria-label="Aumentar 10">+10</button>
      </div>
      <div class="item-subtotal">${formatarValor(0)}</div>
    `;
    listaItensEl.appendChild(linha);

    const input = linha.querySelector('.item-qtd input');

    linha.querySelectorAll('[data-passo]').forEach((botao) => {
      botao.addEventListener('click', () => {
        const passo = parseInt(botao.dataset.passo, 10);
        quantidades[item.id] = Math.max(0, (quantidades[item.id] || 0) + passo);
        atualizarLinha(item);
        atualizarResumo(itens);
      });
    });

    input.addEventListener('input', () => {
      const valor = parseInt(input.value, 10);
      quantidades[item.id] = isNaN(valor) || valor < 0 ? 0 : valor;
      atualizarLinha(item);
      atualizarResumo(itens);
    });
  });

  radiosParceria.forEach((radio) => {
    radio.addEventListener('change', () => {
      comParceria = radio.value === 'com' && radio.checked;
      itens.forEach(atualizarLinha);
      atualizarResumo(itens);
    });
  });

  limparBtn.addEventListener('click', () => {
    itens.forEach((item) => {
      quantidades[item.id] = 0;
      atualizarLinha(item);
    });
    atualizarResumo(itens);
  });

  copiarBtn.addEventListener('click', () => {
    copiarParaAreaDeTransferencia(String(Math.round(totalAtual))).then(() => {
      const textoOriginal = copiarBtn.textContent;
      copiarBtn.textContent = '✅ Copiado!';
      copiarBtn.classList.add('copiado');
      setTimeout(() => {
        copiarBtn.textContent = textoOriginal;
        copiarBtn.classList.remove('copiado');
      }, 1500);
    });
  });

  comParceria = document.querySelector('input[name="parceria"]:checked').value === 'com';
  itens.forEach(atualizarLinha);
  atualizarResumo(itens);
}

const copiarLinkBtn = document.getElementById('copiar-link');
const linkCampo = document.getElementById('link-campo');
const textoCopiarLink = copiarLinkBtn.textContent;

linkCampo.addEventListener('focus', () => linkCampo.select());

copiarLinkBtn.addEventListener('click', () => {
  copiarParaAreaDeTransferencia(linkCampo.value)
    .then(() => {
      copiarLinkBtn.textContent = '✅ Link copiado!';
      copiarLinkBtn.classList.add('copiado');
    })
    .catch(() => {
      linkCampo.focus();
      linkCampo.select();
      copiarLinkBtn.textContent = 'Selecionado — aperte Ctrl+C';
    })
    .finally(() => {
      setTimeout(() => {
        copiarLinkBtn.textContent = textoCopiarLink;
        copiarLinkBtn.classList.remove('copiado');
      }, 2000);
    });
});

fetch('data/precos.json')
  .then((resposta) => {
    if (!resposta.ok) throw new Error('Falha ao carregar arquivo de preços');
    return resposta.json();
  })
  .then((dados) => {
    moeda = dados.moeda || 'R$ ';
    renderizarItens(dados.itens || []);
  })
  .catch((erro) => {
    listaItensEl.innerHTML = `<p class="erro">Não foi possível carregar os itens (${erro.message}). Verifique o arquivo data/precos.json.</p>`;
  });
