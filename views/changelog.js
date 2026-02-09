/**
 * @file views/changelog.js
 * @description Histórico de versões e alterações do sistema
 */

(function (global) {
  "use strict";

  const { NFUI } = global;

  const $ = (sel) => document.querySelector(sel);
  const escapeHtml = NFUI?.escapeHtml || ((s) => String(s));
  const setTitle = global.setTitle || (() => {});

  /**
   * Renderiza a view de Changelog
   */
  function viewChangelog() {
    console.log("📋 viewChangelog() CHAMADA");
    setTitle("Changelog", "Histórico de versões");

    const content = $("#content");
    if (!content) return;

    content.innerHTML = `
      <div class="card">
        <h2>📋 Histórico de Versões</h2>
        <p class="hint">Acompanhe a evolução da plataforma Notas Fiscais</p>
        <div class="hr"></div>

        <!-- Versão 2.1 - ATUAL -->
        <div class="changelog-version">
          <div class="version-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px;" onclick="toggleVersion('v2-1')">
            <div>
              <h3 style="margin: 0;">🔍 Versão 2.1 - Sistema de Auditoria Completo</h3>
              <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">Sistema híbrido de auditoria automática + manual com rastreamento completo</p>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="chip success">Atual</span>
              <span id="icon-v2-1" style="font-size: 20px;">▶</span>
            </div>
          </div>
          <div id="content-v2-1" style="display: none; padding: 16px 0;">
            <p class="version-date">09 de Fevereiro de 2026</p>
            
            <h4>🔍 Auditoria Automática</h4>
            <ul>
              <li>✅ <strong>DoctrineAuditSubscriber</strong> - Event listener configurado via onFlush</li>
              <li>✅ Auditoria automática de <strong>CREATE/UPDATE/DELETE</strong> para todas as 27 entidades</li>
              <li>✅ Extração inteligente de informações para campo <code>meta</code>:
                <ul style="margin-top:8px;">
                  <li>→ Código (getCode)</li>
                  <li>→ Nome/Título (getName, getTitle)</li>
                  <li>→ Descrição (primeiros 50 caracteres)</li>
                  <li>→ Email (para usuários)</li>
                </ul>
              </li>
              <li>✅ Captura automática de <code>actor_user_id</code> e <code>tenant_id</code> via JWT</li>
              <li>✅ Uso correto de persist() + computeChangeSet() sem flush recursivo</li>
            </ul>

            <h4>📝 Auditoria Manual</h4>
            <ul>
              <li>✅ <strong>AuditService</strong> - Serviço centralizado para ações de negócio</li>
              <li>✅ <code>logLogin()</code> / <code>logLogout()</code> - Autenticação</li>
              <li>✅ <code>logTenantSwitch()</code> - Troca de empresa (com detalhes "De X para Y")</li>
              <li>✅ <code>logExpenseApprove()</code> / <code>Reject()</code> - Despesas</li>
              <li>✅ <code>logInvoiceApprove()</code> / <code>Reject()</code> - Notas Fiscais</li>
              <li>✅ <code>logReimbursementApprove()</code> / <code>Reject()</code> - Reembolsos</li>
              <li>✅ <code>logUserApprove()</code> / <code>Reject()</code> - Usuários</li>
              <li>✅ <code>logInviteCreate()</code> / <code>Accept()</code> - Convites</li>
            </ul>

            <h4>🎯 Controllers Integrados</h4>
            <ul>
              <li>✅ <strong>AuthController</strong> - LOGIN</li>
              <li>✅ <strong>UserPreferenceController</strong> - TENANT_SWITCH</li>
              <li>✅ <strong>ExpenseController</strong> - APPROVE, REJECT</li>
              <li>✅ <strong>InvoiceController</strong> - APPROVE, REJECT</li>
              <li>✅ <strong>ReimbursementController</strong> - APPROVE, REJECT</li>
              <li>✅ <strong>InviteController</strong> - CREATE, ACCEPT</li>
            </ul>

            <h4>🖥️ Interface de Auditoria</h4>
            <ul>
              <li>✅ View dedicada em <code>views/audit.js</code></li>
              <li>✅ Filtro MASTER (vê tudo) vs OPERADOR (só seu tenant)</li>
              <li>✅ Colunas: Quando, Ação, Ator, Meta</li>
              <li>✅ Timestamps formatados em português</li>
              <li>✅ Paginação e ordenação por data (mais recente primeiro)</li>
            </ul>

            <h4>🐛 Correções Aplicadas</h4>
            <ul>
              <li>✅ <strong>Fix:</strong> Subscriber não rodava - alterada tag de <code>doctrine.event_subscriber</code> para <code>doctrine.event_listener</code></li>
              <li>✅ <strong>Fix:</strong> Duplo flush - removido flush() do AuditService.log()</li>
              <li>✅ <strong>Fix:</strong> Meta vazio - implementada extração automática de informações</li>
            </ul>

            <h4>🛠️ Ferramentas de Diagnóstico</h4>
            <ul>
              <li>✅ <code>DiagnosticAuditCommand</code> - Comando CLI para diagnóstico completo</li>
              <li>✅ Verifica se subscriber está registrado</li>
              <li>✅ Valida schema do AuditLog</li>
              <li>✅ Testa CREATE/UPDATE/DELETE em tempo real</li>
            </ul>

            <h4>📊 Cobertura</h4>
            <ul>
              <li><strong>Automático:</strong> 27 entidades × 3 operações (CREATE, UPDATE, DELETE) = 81 logs possíveis</li>
              <li><strong>Manual:</strong> 12 ações de negócio específicas</li>
              <li><strong>Total:</strong> Rastreamento completo de todas operações no sistema</li>
            </ul>
          </div>
        </div>

        <div class="hr"></div>

        <!-- Versão 2.0 -->
        <div class="changelog-version">
          <div class="version-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px;" onclick="toggleVersion('v2-0')">
            <div>
              <h3 style="margin: 0;">🚀 Versão 2.0 - Arquitetura Moderna</h3>
              <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">Migração completa para Symfony 6 REST API com autenticação JWT e frontend modular</p>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="chip primary">Fev 2026</span>
              <span id="icon-v2-0" style="font-size: 20px;">▶</span>
            </div>
          </div>
          <div id="content-v2-0" style="display: none; padding: 16px 0;">
            <p class="version-date">Fevereiro de 2026</p>
          
          <h4>🏗️ Backend & Infraestrutura</h4>
          <ul>
            <li>✅ Migração completa para <strong>Symfony 6</strong> REST API</li>
            <li>✅ Banco de dados <strong>MySQL</strong> com Doctrine ORM</li>
            <li>✅ Autenticação <strong>JWT</strong> (JSON Web Tokens)</li>
            <li>✅ Docker Compose para ambiente de desenvolvimento</li>
            <li>✅ Migrations gerenciadas com Doctrine Migrations</li>
          </ul>

          <h4>🎨 Frontend</h4>
          <ul>
            <li>✅ Arquitetura modular com <strong>IIFE pattern</strong></li>
            <li>✅ Separação de views em módulos individuais</li>
            <li>✅ Comunicação assíncrona via API REST</li>
            <li>✅ Sistema de drawers para formulários</li>
            <li>✅ Loading states e feedback visual aprimorado</li>
          </ul>

          <h4>📊 Funcionalidades</h4>
          <ul>
            <li>✅ <strong>Dashboard</strong> - Visão geral com métricas e gráficos</li>
            <li>✅ <strong>OSs (Despesas)</strong> - CRUD completo com aprovação/rejeição</li>
            <li>✅ <strong>Reembolsos</strong> - Gestão de reembolsos com workflow</li>
            <li>✅ <strong>NF Faturamento</strong> - Notas fiscais com itens e composição</li>
            <li>✅ <strong>Projetos</strong> - Gerenciamento de projetos com códigos</li>
            <li>✅ <strong>Clientes</strong> - Cadastro de clientes/tenants</li>
            <li>✅ <strong>Usuários</strong> - Aprovação de usuários PENDING</li>
            <li>✅ <strong>Convites</strong> - Sistema de convites many-to-many (múltiplos clientes + projetos)</li>
            <li>✅ <strong>Serviços</strong> - Cadastro de serviços com busca e filtros</li>
            <li>✅ <strong>Configurações</strong> - Sinaleiro (%) e vínculo com projetos</li>
            <li>✅ <strong>Gestão de Vínculos</strong> - Matrix usuário x tenant</li>
          </ul>

          <h4>🔐 Segurança</h4>
          <ul>
            <li>✅ Bloqueio de login para usuários PENDING</li>
            <li>✅ Permissões por role (MASTER/OPERADOR)</li>
            <li>✅ Validação de dados no backend</li>
            <li>✅ Proteção contra lazy loading com eager loading</li>
          </ul>

          <h4>🐛 Correções Críticas</h4>
          <ul>
            <li>✅ Fix: role_id null em User e UserTenant (invite acceptance)</li>
            <li>✅ Fix: Lazy loading com QueryBuilder + addSelect()</li>
            <li>✅ Fix: Ordenação de rotas (/settings antes de /{id})</li>
            <li>✅ Fix: PasswordHasher signature</li>
            <li>✅ Fix: Module scoping com IIFE patterns</li>
          </ul>
        </div>

        <div class="hr"></div>

        <!-- Versão 1.0 - MVP -->
        <div class="changelog-version">
          <div class="version-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px;" onclick="toggleVersion('v1-0')">
            <div>
              <h3 style="margin: 0;">🌟 Versão 1.0 - MVP</h3>
              <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">Protótipo funcional com localStorage para validação de conceito</p>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="chip gray">26 Jan 2026</span>
              <span id="icon-v1-0" style="font-size: 20px;">▶</span>
            </div>
          </div>
          <div id="content-v1-0" style="display: none; padding: 16px 0;">
            <p class="version-date">26 de Janeiro de 2026</p>
          
          <h4>✨ Features Iniciais</h4>
          <ul>
            <li>✅ Protótipo funcional com localStorage</li>
            <li>✅ Interface responsive (desktop + mobile)</li>
            <li>✅ CRUD básico de despesas, reembolsos e notas fiscais</li>
            <li>✅ Sistema de autenticação mock</li>
            <li>✅ Navegação SPA (Single Page Application)</li>
            <li>✅ Filtros básicos por mês e status</li>
            <li>✅ Temas visuais com CSS moderno</li>
          </ul>

          <h4>🎯 Objetivo</h4>
          <ul>
            <li>Validação rápida do conceito e fluxo de trabalho</li>
            <li>Prova de conceito para apresentação aos stakeholders</li>
            <li>Base visual para evolução do produto</li>
          </ul>
          </div>
        </div>

        <div class="hr"></div>

        <!-- Roadmap Futuro -->
        <div class="changelog-version">
          <div class="version-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px;" onclick="toggleVersion('roadmap')">
            <div>
              <h3 style="margin: 0;">🔮 Próximas Versões</h3>
              <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">Features planejadas para as próximas releases</p>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="chip info">Roadmap</span>
              <span id="icon-roadmap" style="font-size: 20px;">▶</span>
            </div>
          </div>
          <div id="content-roadmap" style="display: none; padding: 16px 0;">
          
          <h4>🎯 Em Planejamento</h4>
          <ul>
            <li>⏳ Notificações por e-mail </li>   
            <li>⏳ Notificações em tempo real</li>
            <li>⏳ Exportação de relatórios (PDF, Excel)</li>
            <li>⏳ Testes automatizados</li>
            <li>⏳ Performance: caching e otimizações</li>
          </ul>
          </div>
        </div>

        <div class="spacer"></div>
        <div class="hint" style="text-align:center;">
          💙 Desenvolvido por Blendz
        </div>
      </div>
    `;

    // Adiciona função de toggle aos accordions
    window.toggleVersion = function(versionId) {
      const content = document.getElementById('content-' + versionId);
      const icon = document.getElementById('icon-' + versionId);
      
      if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
      } else {
        content.style.display = 'none';
        icon.textContent = '▶';
      }
    };
  }

  // Exportar para uso global
  global.viewChangelog = viewChangelog;
  global.NFViewsChangelog = { viewChangelog };

  console.log("✅ views/changelog.js carregado");

})(window);
