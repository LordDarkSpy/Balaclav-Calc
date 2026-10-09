const listaItensEl = document.getElementById('lista-itens');
const resumoListaEl = document.getElementById('resumo-lista');
const resumoTipoEl = document.getElementById('resumo-tipo');
const totalValorEl = document.getElementById('total-valor');
const limparBtn = document.getElementById('limpar');
const copiarBtn = document.getElementById('copiar');
const radiosParceria = document.querySelectorAll('input[name="parceria"]');
const registrarBtn = document.getElementById('registrar');
const registroStatusEl = document.getElementById('registro-status');
const campoParceriaEl = document.getElementById('campo-parceria');
const nomeParceriaInput = document.getElementById('nome-parceria');
const vendedorNomeEl = document.getElementById('vendedor-nome');
const trocarVendedorBtn = document.getElementById('trocar-vendedor');
const modalVendedorEl = document.getElementById('modal-vendedor');
const formVendedor = document.getElementById('form-vendedor');
const inputVendedor = document.getElementById('input-vendedor');
const modalErroEl = document.getElementById('modal-erro');

// A URL do webhook vem de js/config.js.
const WEBHOOK_URL = (window.BALACLAV_CONFIG && window.BALACLAV_CONFIG.webhookUrl) || '';
const CHAVE_VENDEDOR = 'balaclav-vendedor';
const CHAVE_VENDEDOR_ID = 'balaclav-vendedor-id';
const inputVendedorId = document.getElementById('input-vendedor-id');

let moeda = 'R$ ';
let vendedor = '';
let vendedorId = '';
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

function lerSalvo(chave) {
  try {
    return (localStorage.getItem(chave) || '').trim();
  } catch (e) {
    return '';
  }
}

function salvar(chave, valor) {
  try {
    if (valor) {
      localStorage.setItem(chave, valor);
    } else {
      localStorage.removeItem(chave);
    }
  } catch (e) {
    // Sem localStorage (ex.: aba anônima bloqueada): vale só nesta sessão.
  }
}

function definirVendedor(nome, id) {
  vendedor = nome;
  vendedorId = id;
  vendedorNomeEl.textContent = nome;
}

function mostrarErroModal(texto, campo) {
  modalErroEl.textContent = texto;
  modalErroEl.hidden = false;
  campo.focus();
}

function abrirModalVendedor() {
  inputVendedor.value = vendedor;
  inputVendedorId.value = vendedorId;
  modalErroEl.hidden = true;
  modalVendedorEl.hidden = false;
  document.body.classList.add('modal-aberto');
  inputVendedor.focus();
}

function fecharModalVendedor() {
  modalVendedorEl.hidden = true;
  document.body.classList.remove('modal-aberto');
}

formVendedor.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const nome = inputVendedor.value.trim();
  const id = inputVendedorId.value.trim();
  if (nome.length < 2) {
    mostrarErroModal('Digite seu nome para continuar.', inputVendedor);
    return;
  }
  if (id && !/^\d{17,20}$/.test(id)) {
    mostrarErroModal('ID do Discord inválido: deve ter de 17 a 20 números.', inputVendedorId);
    return;
  }
  salvar(CHAVE_VENDEDOR, nome);
  salvar(CHAVE_VENDEDOR_ID, id);
  definirVendedor(nome, id);
  fecharModalVendedor();
});

trocarVendedorBtn.addEventListener('click', abrirModalVendedor);

const vendedorSalvo = lerSalvo(CHAVE_VENDEDOR);
if (vendedorSalvo) {
  definirVendedor(vendedorSalvo, lerSalvo(CHAVE_VENDEDOR_ID));
} else {
  abrirModalVendedor();
}

const modalSucessoEl = document.getElementById('modal-sucesso');
const sucessoTotalEl = document.getElementById('sucesso-total');
const sucessoDetalheEl = document.getElementById('sucesso-detalhe');
const sucessoCopiarBtn = document.getElementById('sucesso-copiar');
const sucessoOkBtn = document.getElementById('sucesso-ok');
let totalSucesso = 0;

function abrirModalSucesso(total, detalhe) {
  totalSucesso = total;
  sucessoTotalEl.textContent = formatarValor(total);
  sucessoDetalheEl.textContent = detalhe;
  sucessoCopiarBtn.textContent = '📋 Copiar valor';
  modalSucessoEl.hidden = false;
  document.body.classList.add('modal-aberto');
  sucessoOkBtn.focus();
}

function fecharModalSucesso() {
  modalSucessoEl.hidden = true;
  document.body.classList.remove('modal-aberto');
}

sucessoOkBtn.addEventListener('click', fecharModalSucesso);

modalSucessoEl.addEventListener('click', (evento) => {
  if (evento.target === modalSucessoEl) fecharModalSucesso();
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && !modalSucessoEl.hidden) fecharModalSucesso();
});

sucessoCopiarBtn.addEventListener('click', () => {
  copiarParaAreaDeTransferencia(String(Math.round(totalSucesso))).then(() => {
    sucessoCopiarBtn.textContent = '✅ Copiado!';
  });
});

function atualizarCampoParceria() {
  campoParceriaEl.hidden = !comParceria;
  nomeParceriaInput.classList.remove('invalido');
}

function mostrarStatusRegistro(texto, tipo) {
  registroStatusEl.textContent = texto;
  registroStatusEl.className = `registro-status ${tipo}`;
  registroStatusEl.hidden = false;
}

function enviarWebhook(dados) {
  return fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  }).then((resposta) => {
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  });
}

function montarRegistro(itens) {
  const selecionados = itens.filter((item) => (quantidades[item.id] || 0) > 0);
  const linhasItens = selecionados.map((item) => {
    const qtd = quantidades[item.id];
    return `${item.icone} **${item.nome}** x${qtd} — ${formatarValor(precoAtual(item) * qtd)}`;
  });

  const campos = [
    { name: 'Vendedor', value: vendedor, inline: true },
    { name: 'Tipo de venda', value: comParceria ? 'Com parceria' : 'Sem parceria', inline: true },
  ];
  if (comParceria) {
    campos.push({ name: 'Parceria', value: nomeParceriaInput.value.trim(), inline: true });
  }
  campos.push(
    { name: 'Itens', value: linhasItens.join('\n') },
    { name: 'Total', value: `**${formatarValor(totalAtual)}**` },
  );

  const registro = {
    username: 'Balaclav — Registro de Vendas',
    allowed_mentions: { parse: [] },
    embeds: [{
      title: '📝 Registro de Venda',
      color: 0x9d3cff,
      fields: campos,
      footer: { text: 'Calculadora de Venda Balaclav' },
      timestamp: new Date().toISOString(),
    }],
  };

  // Marca o vendedor (em spoiler, para ficar discreto) só se ele informou o ID.
  if (vendedorId) {
    registro.content = `||<@${vendedorId}>||`;
    registro.allowed_mentions = { parse: [], users: [vendedorId] };
  }

  return registro;
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
      atualizarCampoParceria();
      itens.forEach(atualizarLinha);
      atualizarResumo(itens);
    });
  });

  function limparTudo() {
    itens.forEach((item) => {
      quantidades[item.id] = 0;
      atualizarLinha(item);
    });
    atualizarResumo(itens);
  }

  limparBtn.addEventListener('click', limparTudo);

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

  nomeParceriaInput.addEventListener('input', () => nomeParceriaInput.classList.remove('invalido'));

  registrarBtn.addEventListener('click', () => {
    if (!vendedor) {
      abrirModalVendedor();
      return;
    }
    if (totalAtual <= 0) {
      mostrarStatusRegistro('Adicione pelo menos um item antes de registrar.', 'erro');
      return;
    }
    if (comParceria && !nomeParceriaInput.value.trim()) {
      nomeParceriaInput.classList.add('invalido');
      nomeParceriaInput.focus();
      mostrarStatusRegistro('Informe o nome da parceria.', 'erro');
      return;
    }

    if (!WEBHOOK_URL) {
      mostrarStatusRegistro('Webhook não configurado (js/config.js).', 'erro');
      return;
    }

    registrarBtn.disabled = true;
    registrarBtn.textContent = '⏳ Registrando...';
    registroStatusEl.hidden = true;
    const totalRegistrado = totalAtual;
    const detalheVenda = comParceria
      ? `Com parceria — ${nomeParceriaInput.value.trim()}`
      : 'Sem parceria';

    enviarWebhook(montarRegistro(itens))
      .then(() => {
        limparTudo();
        nomeParceriaInput.value = '';
        abrirModalSucesso(totalRegistrado, detalheVenda);
      })
      .catch((erro) => {
        mostrarStatusRegistro(`Não foi possível registrar a venda (${erro.message}). Tente novamente.`, 'erro');
      })
      .finally(() => {
        registrarBtn.disabled = false;
        registrarBtn.textContent = '📝 Registrar venda';
      });
  });

  comParceria = document.querySelector('input[name="parceria"]:checked').value === 'com';
  atualizarCampoParceria();
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
