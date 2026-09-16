const workflows = {
  network: {
    title: 'Conectividade e DNS',
    description: 'O objetivo é localizar em que ponto a comunicação falha, sem alterar configurações antes de registrar o estado atual.',
    steps: [
      'Confirme o escopo: ocorre em um dispositivo, em uma área ou em toda a operação?',
      'Verifique conexão física ou Wi-Fi, status do adaptador e modo avião antes de qualquer mudança.',
      'Colete IPv4, gateway e DNS. Registre o resultado antes de renovar IP ou reiniciar equipamentos.',
      'Teste em sequência: gateway local, um endereço IP autorizado e, por fim, resolução de nomes.',
      'Anote horário, mensagens de erro e resultados para concluir ou escalar a ocorrência.'
    ],
    commands: ['ipconfig /all', 'ping <gateway>', 'ping 8.8.8.8', 'nslookup exemplo.com', 'tracert exemplo.com'],
    escalation: 'Escale quando o gateway não responder, o impacto atingir mais de uma área, houver falha de VPN corporativa ou for necessária alteração em equipamentos de rede.'
  },
  device: {
    title: 'Computador, sistema ou aplicativo',
    description: 'A prioridade é diferenciar falha de recurso, perfil, sistema ou aplicação e preservar o contexto que o usuário observou.',
    steps: [
      'Registre o que mudou antes da falha, a mensagem apresentada e se outro usuário ou máquina reproduz o problema.',
      'Verifique espaço em disco, uso de CPU e memória e processos que estejam consumindo recursos anormalmente.',
      'Confirme conectividade, data/hora e permissões do usuário quando o problema estiver ligado a um aplicativo corporativo.',
      'Reinicie apenas serviços ou a estação quando isso for permitido pela política e após anotar o estado inicial.',
      'Documente o que foi testado, resultado e evidências que permitam ao próximo nível continuar sem repetir etapas.'
    ],
    commands: ['taskmgr', 'winver', 'systeminfo', 'Get-Process', 'eventvwr.msc'],
    escalation: 'Escale se houver perda de dados, tela azul, falha recorrente após procedimento aprovado, erro de licença corporativa ou necessidade de privilégio administrativo.'
  },
  security: {
    title: 'Segurança ou acesso suspeito',
    description: 'Em segurança, a rapidez precisa vir junto com preservação de evidências e respeito ao processo de resposta a incidentes.',
    steps: [
      'Não peça, registre ou compartilhe senhas. Anote o horário, remetente, URL ou alerta que originou a suspeita.',
      'Se houver indício de comprometimento ativo, interrompa a interação com o conteúdo e siga o procedimento interno de isolamento.',
      'Preserve a evidência disponível: mensagem, captura de tela, nome do arquivo e contexto, sem apagar itens ou “limpar” a máquina.',
      'Verifique com o usuário se houve clique, envio de informação ou execução de arquivo, sem realizar ações irreversíveis.',
      'Acione imediatamente o canal de segurança definido pela organização e registre o impacto conhecido.'
    ],
    commands: ['Registrar horário do alerta', 'Capturar mensagem/URL', 'Consultar canal de resposta', 'Documentar ações realizadas'],
    escalation: 'Escale imediatamente para Segurança/SOC se houver possível phishing, credencial exposta, malware, acesso indevido, dados sensíveis ou mais de um usuário afetado.'
  }
};

const presets = {
  internet: {
    category: 'network', impact: 'one', environment: 'office', urgency: 'high',
    symptom: 'Conectado ao Wi-Fi, mas nenhuma página abre. O problema começou há poucos minutos.'
  },
  slow: {
    category: 'device', impact: 'one', environment: 'office', urgency: 'normal',
    symptom: 'Computador muito lento ao abrir o sistema e realizar tarefas básicas.'
  },
  phishing: {
    category: 'security', impact: 'one', environment: 'office', urgency: 'critical',
    symptom: 'Usuário recebeu e-mail suspeito e informou que clicou no link.'
  }
};

const form = document.querySelector('#intake-form');
const category = document.querySelector('#category');
const impact = document.querySelector('#impact');
const environment = document.querySelector('#environment');
const urgency = document.querySelector('#urgency');
const symptom = document.querySelector('#symptom');
const resultTitle = document.querySelector('#result-title');
const resultContent = document.querySelector('#result-content');
const priority = document.querySelector('.priority');

function escapeHTML(value) {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function labelFor(select) {
  return select.options[select.selectedIndex].text;
}

function getPriority() {
  if (category.value === 'security' || impact.value === 'all' || urgency.value === 'critical') return { label: 'P1 · imediato', color: '#ff9a9f' };
  if (impact.value === 'team' || urgency.value === 'high') return { label: 'P2 · alta', color: '#ffcf7a' };
  return { label: 'P3 · normal', color: '#7cf2be' };
}

function buildTicket(flow, level) {
  const context = symptom.value.trim() || 'Não informado';
  return [
    `TÍTULO: ${flow.title}`,
    `PRIORIDADE SUGERIDA: ${level.label}`,
    `IMPACTO: ${labelFor(impact)}`,
    `AMBIENTE: ${labelFor(environment)}`,
    `SINTOMA: ${context}`,
    'PRÓXIMAS AÇÕES: seguir checklist de triagem e registrar resultados.',
    `ESCALONAR SE: ${flow.escalation}`
  ].join('\n');
}

function renderResult() {
  const flow = workflows[category.value];
  const level = getPriority();
  const ticket = buildTicket(flow, level);
  const visibleSymptom = symptom.value.trim() ? ` Sintoma informado: <strong>“${escapeHTML(symptom.value.trim())}”</strong>` : '';

  resultTitle.textContent = flow.title;
  priority.textContent = level.label;
  priority.classList.remove('muted');
  priority.style.color = level.color;
  resultContent.className = 'result-body';
  resultContent.innerHTML = `
    <p class="result-intro">${flow.description}${visibleSymptom}</p>
    <div class="result-section">
      <h4>Sequência recomendada</h4>
      <ol class="steps">${flow.steps.map(step => `<li>${step}</li>`).join('')}</ol>
    </div>
    <div class="result-section">
      <h4>Comandos ou evidências úteis</h4>
      <div class="command-list">${flow.commands.map(command => `<code>${command}</code>`).join('')}</div>
    </div>
    <div class="result-section">
      <h4>Critério de escalonamento</h4>
      <p class="escalate">${flow.escalation}</p>
    </div>
    <div class="result-section">
      <h4>Resumo para ticket</h4>
      <div class="ticket-box"><button class="copy-button" type="button" data-copy-ticket>Copiar</button><pre>${escapeHTML(ticket)}</pre></div>
    </div>`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  renderResult();
});

document.querySelectorAll('.scenario').forEach(button => {
  button.addEventListener('click', () => {
    const preset = presets[button.dataset.scenario];
    category.value = preset.category;
    impact.value = preset.impact;
    environment.value = preset.environment;
    urgency.value = preset.urgency;
    symptom.value = preset.symptom;
    document.querySelectorAll('.scenario').forEach(item => item.classList.toggle('active', item === button));
    renderResult();
  });
});

resultContent.addEventListener('click', async event => {
  const button = event.target.closest('[data-copy-ticket]');
  if (!button) return;
  const text = button.nextElementSibling.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copiado ✓';
    window.setTimeout(() => { button.textContent = 'Copiar'; }, 1700);
  } catch {
    button.textContent = 'Selecione o texto';
  }
});
