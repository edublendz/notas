/**
 * @file views/audit.js
 * @description Módulo de Auditoria (API) - Log de ações do sistema
 */

(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;

  const $ = (sel) => document.querySelector(sel);
  const escapeHtml = NFUI.escapeHtml;
  const toast = NFUI.toast;
  
  const setTitle = global.setTitle || (() => {});
  const isMaster = NFStore.isMaster || (() => false);

  // API Base URL
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://api.notas.blendz.com.br';

  // =========================================================================
  // STATE
  // =========================================================================

  let ALL_LOGS = [];

  // =========================================================================
  // VIEW AUDIT
  // =========================================================================

  async function viewAudit() {

    if (!isMaster()) {
      console.warn("⚠️ Acesso negado - apenas Master pode ver auditoria");
      if (typeof global.viewExpenses === "function") {
        return global.viewExpenses();
      }
      return;
    }

    setTitle("Auditoria", "Log de ações do sistema");

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Auditoria</h3>
        </div>
        <div class="hr"></div>
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Carregando logs...</div>
        </div>
      </div>
    `;

    try {
      const resp = await NFStore.apiFetch(`${API_BASE}/api/audit-logs?limit=100`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const payload = await resp.json();
      ALL_LOGS = Array.isArray(payload?.data) ? payload.data : [];


      renderAudit();
    } catch (err) {
      console.error("❌ Erro ao carregar auditoria:", err);
      $("#content").innerHTML = `
        <div class="card">
          <div class="hint error">⚠️ Erro ao carregar auditoria: ${escapeHtml(err.message)}</div>
        </div>
      `;
    }
  }

  function renderAudit() {
    const formatDate = (dateStr) => {
      if (!dateStr) return "—";
      try {
        const date = new Date(dateStr);
        return date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return dateStr;
      }
    };

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Auditoria</h3>
        </div>
        <div class="hr"></div>

        ${ALL_LOGS.length > 0 ? `
          <table class="table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Ação</th>
                <th>Ator</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              ${ALL_LOGS.map((log) => `
                <tr>
                  <td>${formatDate(log.createdAt)}</td>
                  <td><span class="chip gray">${escapeHtml(log.action)}</span></td>
                  <td>${escapeHtml(log.actorUser?.name || "—")}</td>
                  <td class="mono" style="font-size:0.85em;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                    ${escapeHtml(log.meta || "")}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `
          <div class="empty">Sem eventos de auditoria.</div>
        `}

        <div class="hr"></div>
        <div class="hint">
          Últimos ${ALL_LOGS.length} eventos registrados no sistema.
        </div>
      </div>
    `;
  }

  // =========================================================================
  // EXPORTS
  // =========================================================================

  global.NFViewsAudit = {
    viewAudit,
  };
})(window);
