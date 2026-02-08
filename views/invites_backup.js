/**
 * @file views/invites.js
 * @description Módulo de Convites (API) - Master gerencia convites
 */

(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  
  const escapeHtml = NFUI.escapeHtml;
  const toast = NFUI.toast;
  
  const setTitle = global.setTitle || (() => {});
  const isMaster = NFStore.isMaster || (() => false);

  // API Base URL
  const API_BASE = window.location.hostname === "localhost" && window.location.port === "5500"
    ? "http://localhost:8000"
    : "/apis/public/index.php";

  // =========================================================================
  // STATE
  // =========================================================================

  let ALL_INVITES = [];
  let ALL_ROLES = [];
  let ALL_CLIENTS = [];
  let ALL_PROJECTS = [];
  let SELECTED_CLIENTS = []; // Track selected clients for filtering projects

  // =========================================================================
  // VIEW INVITES ADMIN
  // =========================================================================

  async function viewInvitesAdmin() {
    console.log("🔵 viewInvitesAdmin() CHAMADA (views/invites.js)");

    if (!isMaster()) {
      console.warn("⚠️ Acesso negado - apenas Master pode gerenciar convites");
      if (typeof global.viewExpenses === "function") {
        return global.viewExpenses();
      }
      return;
    }

    setTitle("Convites", "Gerar links de cadastro");

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Convites</h3>
        </div>
        <div class="hr"></div>
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Carregando convites...</div>
        </div>
      </div>
    `;

    try {
      // Load roles
      const rolesResp = await NFStore.apiFetch(`${API_BASE}/api/roles`);
      if (rolesResp.ok) {
        const rolesPayload = await rolesResp.json();
        ALL_ROLES = Array.isArray(rolesPayload?.data) ? rolesPayload.data : [];
      }

      // Load clients
      const clientsResp = await NFStore.apiFetch(`${API_BASE}/api/clients`);
      if (clientsResp.ok) {
        const clientsPayload = await clientsResp.json();
        ALL_CLIENTS = Array.isArray(clientsPayload?.data) ? clientsPayload.data : [];
      }

      // Load projects
      const projectsResp = await NFStore.apiFetch(`${API_BASE}/api/projects`);
      if (projectsResp.ok) {
        const projectsPayload = await projectsResp.json();
        ALL_PROJECTS = Array.isArray(projectsPayload?.data) ? projectsPayload.data : [];
      }

      // Load invites
      const resp = await NFStore.apiFetch(`${API_BASE}/api/invites`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const payload = await resp.json();
      ALL_INVITES = Array.isArray(payload?.data) ? payload.data : [];

      console.log("📊 Convites carregados:", ALL_INVITES.length);

      renderInvites();
    } catch (err) {
      console.error("❌ Erro ao carregar convites:", err);
      $("#content").innerHTML = `
        <div class="card">
          <div class="hint error">⚠️ Erro ao carregar convites: ${escapeHtml(err.message)}</div>
        </div>
      `;
    }
  }

  function renderInvites() {
    const urlBase = window.location.href.split("#")[0].split("?")[0];

    $("#content").innerHTML = `
      <div class="grid">
        <!-- Form para criar convite -->
        <div class="card">
          <div class="row" style="justify-content:space-between">
            <h3 style="margin:0">Gerar convite</h3>
          </div>
          <div class="hr"></div>

          <div class="field">
            <label>Cliente <span class="required">*</span></label>
            <select id="invClient">
              <option value="">Selecione um cliente</option>
              ${ALL_CLIENTS.map(c => `
                <option value="${c.id}">${escapeHtml(c.name)}</option>
              `).join('')}
            </select>
          </div>

          <div class="field">
            <label>Email do convidado</label>
            <input id="invEmail" type="email" placeholder="usuario@exemplo.com" />
          </div>

          <div class="field">
            <label>Perfil</label>
            <select id="invRole">
              ${ALL_ROLES.map(r => `
                <option value="${r.id}">${escapeHtml(r.name)} (${escapeHtml(r.code)})</option>
              `).join('')}
            </select>
          </div>

          <div class="field">
            <label>Cliente <span class="required">*</span></label>
            <select id="invClient">
              <option value="">Selecione um cliente</option>
              ${ALL_CLIENTS.map(c => `
                <option value="${c.id}">${escapeHtml(c.name)}</option>
              `).join('')}
            </select>
          </div>

          <div class="field">
            <label>Projeto (opcional)</label>
            <select id="invProject">
              <option value="">Nenhum (acesso a todos os projetos do cliente)</option>
              ${ALL_PROJECTS.map(p => `
                <option value="${p.id}">${escapeHtml(p.title)}</option>
              `).join('')}
            </select>
            <div class="hint">Se vazio, terá acesso a todos os projetos do cliente.</div>
          </div>

          <div class="field">
            <label>Validade (dias)</label>
            <input id="invDays" type="number" value="7" min="1" max="30" />
            <div class="hint">O convite expirará após este período.</div>
          </div>

          <div class="row">
            <button class="btn primary" id="invCreate">Gerar link</button>
          </div>

          <div class="hr"></div>
          <div class="hint" id="invOut"></div>
        </div>

        <!-- Lista de convites -->
        <div class="card sticky">
          <h3>Convites gerados</h3>
          <div class="hr"></div>

          ${ALL_INVITES.length > 0 ? `
            <table class="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Cliente</th>
                  <th>Projeto</th>
                  <th>Status</th>
                  <th>Expira em</th>
                  <th class="right">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${ALL_INVITES.map((inv) => {
                  const statusClass = inv.status === 'ACTIVE' ? 'ok' : 
                                     inv.status === 'ACCEPTED' ? 'gray' : 'bad';
                  const statusLabel = inv.status === 'ACTIVE' ? 'Ativo' :
                                     inv.status === 'ACCEPTED' ? 'Aceito' : 'Expirado';
                  const canRevoke = inv.status === 'ACTIVE';
                  const expiresAt = inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString('pt-BR') : '—';

                  return `
                    <tr>
                      <td>${escapeHtml(inv.email)}</td>
                      <td><span class="chip gray">${escapeHtml(inv.role?.name || '—')}</span></td>
                      <td><span class="chip blue">${escapeHtml(inv.client?.name || '—')}</span></td>
                      <td>${inv.project ? escapeHtml(inv.project.title) : '<span class="hint">Todos</span>'}</td>
                      <td><span class="chip ${statusClass}">${statusLabel}</span></td>
                      <td>${expiresAt}</td>
                      <td class="right">
                        <button class="btn small danger" data-revoke="${inv.id}" ${canRevoke ? '' : 'disabled'}>
                          Revogar
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          ` : `
            <div class="empty">Nenhum convite gerado ainda.</div>
          `}
        </div>
      </div>
    `;

    // Bind create button
    $("#invCreate").onclick = async () => {
      await createInvite();
    };

    // Bind revoke buttons
    $$("[data-revoke]").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.getAttribute("data-revoke");
        await revokeInvite(id);
      };
    });
  }

  // =========================================================================
  // CREATE INVITE
  // =========================================================================

  async function createInvite() {
    const email = $("#invEmail").value.trim();
    const roleId = parseInt($("#invRole").value);
    const clientId = parseInt($("#invClient").value);
    const projectId = $("#invProject").value ? parseInt($("#invProject").value) : null;
    const expiresInDays = parseInt($("#invDays").value || 7);

    if (!email) {
      toast("Preencha o email do convidado.");
      return;
    }

    if (!roleId) {
      toast("Selecione um perfil.");
      return;
    }

    if (!clientId) {
      toast("Selecione um cliente.");
      return;
    }

    $("#invOut").innerHTML = `⏳ Gerando convite...`;

    try {
      const payload = { email, roleId, clientId, expiresInDays };
      if (projectId) payload.projectId = projectId;

      const resp = await NFStore.apiFetch(`${API_BASE}/api/invites`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      
      // Generate link
      const urlBase = window.location.href.split("#")[0].split("?")[0];
      const link = `${urlBase}#invite=${data.token}`;

      $("#invOut").innerHTML = `
        <div style="background:var(--panel2);padding:12px;border-radius:4px">
          <div><strong>✅ Convite gerado com sucesso!</strong></div>
          <div class="hint" style="margin-top:8px">Envie este link para <strong>${escapeHtml(email)}</strong>:</div>
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
            <input readonly value="${escapeHtml(link)}" 
                   style="flex:1;font-family:monospace;font-size:0.85em;padding:8px"
                   onclick="this.select()" />
            <button class="btn small" id="copyNewLink">Copiar</button>
          </div>
          <div class="hint" style="margin-top:8px">Expira em: ${new Date(data.expiresAt).toLocaleString('pt-BR')}</div>
        </div>
      `;

      $("#copyNewLink").onclick = async () => {
        try {
          await navigator.clipboard.writeText(link);
          toast("Link copiado!");
        } catch (e) {
          toast("Copie manualmente: " + link);
        }
      };

      // Clear form
      $("#invEmail").value = "";
      
      // Refresh list
      viewInvitesAdmin();
    } catch (err) {
      console.error("❌ Erro ao criar convite:", err);
      $("#invOut").innerHTML = `<span style="color:var(--danger)">❌ ${escapeHtml(err.message)}</span>`;
    }
  }

  // =========================================================================
  // REVOKE INVITE
  // =========================================================================

  async function revokeInvite(id) {
    if (!confirm("Revogar este convite?")) return;

    try {
      const resp = await NFStore.apiFetch(`${API_BASE}/api/invites/${id}`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }

      toast("Convite revogado com sucesso.");
      viewInvitesAdmin(); // Refresh
    } catch (err) {
      console.error("❌ Erro ao revogar convite:", err);
      toast(`Erro ao revogar: ${err.message}`);
    }
  }

  // =========================================================================
  // EXPORTS
  // =========================================================================

  global.NFViewsInvites = {
    viewInvitesAdmin,
  };

  console.log("✅ views/invites.js carregado");
})(window);
