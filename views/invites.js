// views/invites.js
// Invite management - Multi-client & multi-project support
(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;

  // Aliases
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  
  const escapeHtml = NFUI.escapeHtml;
  const toast = NFUI.toast;
  const setTitle = global.setTitle || (()=>{});

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://api.notas.blendz.com.br';

  let ALL_INVITES = [];
  let ALL_ROLES = [];
  let CURRENT_TENANT = null;
  let ALL_CLIENTS = [];
  let ALL_PROJECTS = [];
  let SELECTED_CLIENTS = [];
  let SELECTED_PROJECTS = [];

  // =========================================================================
  // MAIN VIEW
  // =========================================================================

  async function viewInvitesAdmin() {
    SELECTED_CLIENTS = [];
    SELECTED_PROJECTS = [];
    
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

      // Get current tenant (from JWT or session)
      const jwtTenant = typeof NFStore.getJwtTenant === "function" ? NFStore.getJwtTenant() : null;
      const sessionTenantId = NFStore.DB()?.session?.tenantId || null;
      const defaultTenantId = jwtTenant?.id || sessionTenantId || null;
      if (!defaultTenantId) throw new Error("Tenant não encontrado na sessão");
      CURRENT_TENANT = jwtTenant || { id: defaultTenantId, name: "Tenant atual" };

      // Load clients (filtered by current tenant)
      const clientsResp = await NFStore.apiFetch(`${API_BASE}/api/clients`);
      if (clientsResp.ok) {
        const clientsPayload = await clientsResp.json();
        ALL_CLIENTS = Array.isArray(clientsPayload?.data) ? clientsPayload.data.filter(c => String(c.tenantId ?? c.tenant?.id) === String(CURRENT_TENANT.id)) : [];
      }

      // Load projects (filtered by current tenant)
      const projectsResp = await NFStore.apiFetch(`${API_BASE}/api/projects`);
      if (projectsResp.ok) {
        const projectsPayload = await projectsResp.json();
        ALL_PROJECTS = Array.isArray(projectsPayload?.data) ? projectsPayload.data.filter(p => String(p.tenantId ?? p.tenant?.id) === String(CURRENT_TENANT.id)) : [];
      }

      // Load invites (ALL from database, not filtered by tenant)
      const resp = await NFStore.apiFetch(`${API_BASE}/api/invites`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const payload = await resp.json();
      ALL_INVITES = Array.isArray(payload?.data) ? payload.data : [];

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
      // Preservar valor do campo email ao re-renderizar
      const prevEmail = $("#invEmail") ? $("#invEmail").value : "";
      const urlBase = window.location.href.split("#")[0].split("?")[0];

      const clientById = {};
      ALL_CLIENTS.forEach(c => { clientById[c.id] = c; });

      // Only one tenant: CURRENT_TENANT
      const tenantClients = ALL_CLIENTS;
      const selectedClients = SELECTED_CLIENTS;
      const tenantProjects = ALL_PROJECTS;
      const filteredProjects = selectedClients.length > 0
        ? tenantProjects.filter(p => selectedClients.includes(p.clientId))
        : tenantProjects;
      const allowedProjectIds = new Set(filteredProjects.map(p => p.id));
      const normalizedProjects = SELECTED_PROJECTS.filter(id => allowedProjectIds.has(id));
      SELECTED_PROJECTS = normalizedProjects;

      $("#content").innerHTML = `
      <!-- Form para criar convite -->
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Gerar convite</h3>
        </div>
        <div class="hr"></div>

        <div class="field">
          <label>Tenant</label>
          <div class="hint">Convite será criado para o tenant atual: <b>${escapeHtml(CURRENT_TENANT.name)}</b></div>
        </div>

        <div class="field">
          <label>Email do convidado <span class="required">*</span></label>
          <input id="invEmail" type="email" placeholder="usuario@exemplo.com" />
        </div>

        <div class="field">
          <label>Perfil <span class="required">*</span></label>
          <select id="invRole">
            ${ALL_ROLES.map(r => `
              <option value="${r.id}">${escapeHtml(r.name)} (${escapeHtml(r.code)})</option>
            `).join('')}
          </select>
        </div>

        <div class="field">
          <label>Clientes <span class="required">*</span></label>
          <div class="hint">Selecione um ou mais clientes (vazio = todos)</div>
          ${tenantClients.length > 0 ? `
            <div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);padding:8px;border-radius:4px;margin-top:4px;background:var(--panel)">
              ${tenantClients.map(c => `
                <label style="display:flex;align-items:center;padding:4px;cursor:pointer;user-select:none">
                  <input type="checkbox" class="client-checkbox" value="${c.id}"
                         ${selectedClients.includes(c.id) ? 'checked' : ''}
                         style="margin-right:8px" />
                  <span>${escapeHtml(c.name)}</span>
                </label>
              `).join('')}
            </div>
          ` : '<div class="hint">Nenhum cliente disponível para este tenant</div>'}
        </div>

        <div class="field">
          <label>Projetos (opcional)</label>
          <div class="hint">
            ${selectedClients.length === 0
              ? 'Deixe vazio para dar acesso a todos os clientes deste tenant'
              : 'Deixe vazio para dar acesso a todos os projetos dos clientes selecionados'}
          </div>
          ${filteredProjects.length > 0 ? `
            <div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);padding:8px;border-radius:4px;margin-top:4px;background:var(--panel)">
              ${filteredProjects.map(p => `
                <label style="display:flex;align-items:center;padding:4px;cursor:pointer;user-select:none">
                  <input type="checkbox" class="project-checkbox" value="${p.id}"
                         ${normalizedProjects.includes(p.id) ? 'checked' : ''}
                         style="margin-right:8px" />
                  <span>${escapeHtml(p.name)} <span class="hint">(${clientById[p.clientId]?.name || ''})</span></span>
                </label>
              `).join('')}
            </div>
          ` : (selectedClients.length > 0 ? '<div class="hint">Nenhum projeto encontrado para os clientes selecionados</div>' : '<div class="hint">Nenhum projeto disponível para este tenant</div>')}
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
      <div class="card" style="margin-top:16px">
        <h3>Convites gerados (${ALL_INVITES.length})</h3>
        <div class="hr"></div>

        ${ALL_INVITES.length > 0 ? `
          <div class="table-scroll-x"><table class="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Perfil</th>
                <th>Clientes</th>
                <th>Projetos</th>
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
                
                const clientNames = inv.clients?.length > 0 
                  ? inv.clients.map(c => c.name).join(', ') 
                  : '—';
                const projectTitles = inv.projects?.length > 0
                  ? inv.projects.map(p => p.name).join(', ')
                  : '<span class="hint">Todos</span>';

                return `
                  <tr>
                    <td>${escapeHtml(inv.email)}</td>
                    <td><span class="chip gray">${escapeHtml(inv.role?.name || '—')}</span></td>
                    <td><span class="chip blue">${escapeHtml(clientNames)}</span></td>
                    <td>${projectTitles}</td>
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
          </table></div>
        ` : `
          <div class="hint">Nenhum convite gerado ainda.</div>
        `}
      </div>
    `;

    // Após renderizar, restaurar valor do campo email
    if ($("#invEmail")) $("#invEmail").value = prevEmail;

    // Bind client checkboxes
    $$(".client-checkbox").forEach((checkbox) => {
      checkbox.onchange = () => {
        const clientId = parseInt(checkbox.value);
        if (checkbox.checked) {
          if (!SELECTED_CLIENTS.includes(clientId)) {
            SELECTED_CLIENTS.push(clientId);
          }
        } else {
          const idx = SELECTED_CLIENTS.indexOf(clientId);
          if (idx >= 0) {
            SELECTED_CLIENTS.splice(idx, 1);
          }
        }
        renderInvites();
      };
    });

    // Bind project checkboxes
    $$(".project-checkbox").forEach((checkbox) => {
      checkbox.onchange = () => {
        const projectId = parseInt(checkbox.value);
        if (checkbox.checked) {
          if (!SELECTED_PROJECTS.includes(projectId)) {
            SELECTED_PROJECTS.push(projectId);
          }
        } else {
          const idx = SELECTED_PROJECTS.indexOf(projectId);
          if (idx >= 0) {
            SELECTED_PROJECTS.splice(idx, 1);
          }
        }
      };
    });

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
    const expiresInDays = parseInt($("#invDays").value || 7);

    if (!email) {
      toast("Preencha o email do convidado.");
      return;
    }

    if (!roleId) {
      toast("Selecione um perfil.");
      return;
    }

    if (!CURRENT_TENANT) {
      toast("Tenant não encontrado na sessão.");
      return;
    }
    const clientIds = SELECTED_CLIENTS.map(Number);
    const projectIds = SELECTED_PROJECTS.map(Number);

    $("#invOut").innerHTML = `⏳ Gerando convite...`;

    try {
      const payload = {
        email,
        roleId,
        clientIds,
        projectIds,
        expiresInDays
      };

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

      const clientNames = clientIds.map(id => ALL_CLIENTS.find(c => c.id === id)?.name).filter(Boolean).join(', ');

      $("#invOut").innerHTML = `
        <div style="background:var(--panel2);padding:12px;border-radius:4px">
          <div><strong>✅ Convite gerado com sucesso!</strong></div>
          <div class="hint" style="margin-top:8px">
            Para: <strong>${escapeHtml(email)}</strong><br />
            Clientes: <strong>${escapeHtml(clientNames || '—')}</strong>
          </div>
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

      // Clear form inputs only (keep the success message visible)
      $("#invEmail").value = "";
      $$(".client-checkbox").forEach(cb => cb.checked = false);
      $$(".project-checkbox").forEach(cb => cb.checked = false);
      SELECTED_CLIENTS = [];
      SELECTED_PROJECTS = [];
      
      // Note: NOT calling viewInvitesAdmin() to keep the success message visible
      // User can manually refresh to see updated list
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
})(window);
