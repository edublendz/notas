/**
 * @file views/users.js
 * @description Módulo de Usuários (API) - Master gerencia aprovações
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

  let ALL_USERS = [];
  let ALL_USER_STATUSES = [];
  let FILTER_ROLE = "";
  let FILTER_STATUS = "";

  // Status IDs (carregados da API)
  let STATUS_PENDING_ID = 2;  // Default
  let STATUS_APPROVED_ID = 1; // Default
  let STATUS_REJECTED_ID = 4; // Default

  // =========================================================================
  // VIEW USERS
  // =========================================================================

  async function viewUsers() {
    console.log("🔵 viewUsers() CHAMADA (views/users.js)");

    if (!isMaster()) {
      console.warn("⚠️ Acesso negado - apenas Master pode ver usuários");
      if (typeof global.viewExpenses === "function") {
        return global.viewExpenses();
      }
      return;
    }

    setTitle("Usuários", "Gerenciar usuários e aprovações");

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Usuários</h3>
        </div>
        <div class="hr"></div>
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Carregando usuários...</div>
        </div>
      </div>
    `;

    try {
      // Buscar status de usuários
      const statusResp = await NFStore.apiFetch(`${API_BASE}/api/user-statuses`);
      if (statusResp.ok) {
        const statusPayload = await statusResp.json();
        ALL_USER_STATUSES = Array.isArray(statusPayload?.data) ? statusPayload.data : [];
        
        // Mapear IDs corretos
        const pending = ALL_USER_STATUSES.find(s => s.code === 'PENDING');
        const approved = ALL_USER_STATUSES.find(s => s.code === 'APPROVED');
        const rejected = ALL_USER_STATUSES.find(s => s.code === 'REJECTED');
        
        if (pending) STATUS_PENDING_ID = pending.id;
        if (approved) STATUS_APPROVED_ID = approved.id;
        if (rejected) STATUS_REJECTED_ID = rejected.id;
        
        console.log("📊 Status carregados:", { pending: STATUS_PENDING_ID, approved: STATUS_APPROVED_ID, rejected: STATUS_REJECTED_ID });
      }

      // Buscar usuários
      const resp = await NFStore.apiFetch(`${API_BASE}/api/users?limit=200`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const payload = await resp.json();
      ALL_USERS = Array.isArray(payload?.data) ? payload.data : [];

      console.log("📊 Usuários carregados:", ALL_USERS.length);

      renderUsers();
    } catch (err) {
      console.error("❌ Erro ao carregar usuários:", err);
      $("#content").innerHTML = `
        <div class="card">
          <div class="hint error">⚠️ Erro ao carregar usuários: ${escapeHtml(err.message)}</div>
        </div>
      `;
    }
  }

  function renderUsers() {
    // Filter
    let filtered = ALL_USERS;
    
    if (FILTER_ROLE) {
      filtered = filtered.filter((u) => u.role === FILTER_ROLE);
    }
    
    if (FILTER_STATUS) {
      filtered = filtered.filter((u) => u.status?.code === FILTER_STATUS);
    }

    // Separate pending users
    const pending = filtered.filter(u => u.status?.code === 'PENDING' || u.status?.name === 'Pendente');
    const others = filtered.filter(u => u.status?.code !== 'PENDING' && u.status?.name !== 'Pendente');

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Usuários</h3>
        </div>
        <div class="hr"></div>

        <!-- Filters -->
        <div class="row" style="flex-wrap:wrap;align-items:flex-end;gap:8px">
          <div class="field" style="min-width:200px">
            <label>Filtrar por perfil</label>
            <select id="filterRole">
              <option value="">Todos os perfis</option>
              <option value="MASTER" ${FILTER_ROLE === "MASTER" ? "selected" : ""}>Master</option>
              <option value="OPER" ${FILTER_ROLE === "OPER" ? "selected" : ""}>Operador</option>
            </select>
          </div>

          <div class="field" style="min-width:200px">
            <label>Filtrar por status</label>
            <select id="filterStatus">
              <option value="">Todos os status</option>
              <option value="PENDING" ${FILTER_STATUS === "PENDING" ? "selected" : ""}>Pendente</option>
              <option value="APPROVED" ${FILTER_STATUS === "APPROVED" ? "selected" : ""}>Aprovado</option>
              <option value="REJECTED" ${FILTER_STATUS === "REJECTED" ? "selected" : ""}>Reprovado</option>
            </select>
          </div>

          <div class="field" style="align-self:flex-end">
            <button class="btn" id="usrClear">Limpar</button>
          </div>

          <span style="flex:1"></span>
        </div>

        <div class="hr"></div>

        ${pending.length > 0 ? `
          <h4 style="margin:16px 0 8px">⏳ Aguardando Aprovação (${pending.length})</h4>
          <table class="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Criado em</th>
                <th class="right">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${pending.map((u) => `
                <tr>
                  <td>${escapeHtml(u.name)}</td>
                  <td>${escapeHtml(u.email)}</td>
                  <td><span class="chip gray">${u.role === 'MASTER' ? 'Master' : 'Operador'}</span></td>
                  <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
                  <td class="right">
                    <button class="btn small primary" data-approve="${u.id}">Aprovar</button>
                    <button class="btn small danger" data-reject="${u.id}">Reprovar</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="hr"></div>
        ` : ''}

        ${others.length > 0 ? `
          <h4 style="margin:16px 0 8px">👥 Usuários (${others.length})</h4>
          <table class="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              ${others.map((u) => {
                const statusClass = u.status?.code === 'APPROVED' ? 'ok' : 
                                   u.status?.code === 'REJECTED' ? 'bad' : 'warn';
                const statusLabel = u.status?.name || u.status?.code || '—';
                
                return `
                  <tr>
                    <td>${escapeHtml(u.name)}</td>
                    <td>${escapeHtml(u.email)}</td>
                    <td><span class="chip gray">${u.role === 'MASTER' ? 'Master' : 'Operador'}</span></td>
                    <td><span class="chip ${statusClass}">${escapeHtml(statusLabel)}</span></td>
                    <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        ` : ''}

        ${filtered.length === 0 ? '<div class="empty">Sem usuários para exibir.</div>' : ''}

        <div class="hr"></div>
        <div class="hint">
          Usuários <strong>PENDENTES</strong> não conseguem acessar o sistema até aprovação.
        </div>
      </div>
    `;

    // Bind events
    $("#filterRole").onchange = (e) => {
      FILTER_ROLE = e.target.value;
      console.log("🔍 Filtro perfil:", FILTER_ROLE);
      renderUsers();
    };

    $("#filterStatus").onchange = (e) => {
      FILTER_STATUS = e.target.value;
      console.log("🔍 Filtro status:", FILTER_STATUS);
      renderUsers();
    };

    $("#usrClear").onclick = () => {
      FILTER_ROLE = "";
      FILTER_STATUS = "";
      renderUsers();
    };

    // Bind approve/reject buttons
    $$("[data-approve]").forEach((btn) => {
      btn.onclick = async () => {
        const userId = btn.getAttribute("data-approve");
        await approveUser(userId);
      };
    });

    $$("[data-reject]").forEach((btn) => {
      btn.onclick = async () => {
        const userId = btn.getAttribute("data-reject");
        await rejectUser(userId);
      };
    });
  }

  // =========================================================================
  // APPROVE / REJECT
  // =========================================================================

  async function approveUser(userId) {
    console.log("✅ Aprovando usuário:", userId);
    
    if (!confirm("Aprovar este usuário?")) return;

    try {
      const resp = await NFStore.apiFetch(`${API_BASE}/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ statusId: STATUS_APPROVED_ID }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        toast(`Erro ao aprovar: ${errText}`);
        return;
      }

      toast("Usuário aprovado com sucesso.");
      viewUsers(); // Refresh
    } catch (err) {
      console.error("❌ Erro ao aprovar usuário:", err);
      toast(`Erro ao aprovar: ${err.message}`);
    }
  }

  async function rejectUser(userId) {
    console.log("❌ Reprovando usuário:", userId);
    
    if (!confirm("Reprovar este usuário?")) return;

    try {
      const resp = await NFStore.apiFetch(`${API_BASE}/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ statusId: STATUS_REJECTED_ID }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        toast(`Erro ao reprovar: ${errText}`);
        return;
      }

      toast("Usuário reprovado.");
      viewUsers(); // Refresh
    } catch (err) {
      console.error("❌ Erro ao reprovar usuário:", err);
      toast(`Erro ao reprovar: ${err.message}`);
    }
  }

  // =========================================================================
  // EXPORTS
  // =========================================================================

  global.NFViewsUsers = {
    viewUsers,
  };

  console.log("✅ views/users.js carregado");
})(window);
