/**
 * @file views/clients.js
 * @description Módulo de Clientes (API)
 */

(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  
  const escapeHtml = NFUI.escapeHtml;
  const toast = NFUI.toast;
  const openDrawer = NFUI.openDrawer;
  const closeDrawer = NFUI.closeDrawer;
  
  const setTitle = global.setTitle || (() => {});

  // API Base URL
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://api.notas.blendz.com.br';

  // =========================================================================
  // STATE
  // =========================================================================

  let ALL_CLIENTS = [];
  let FILTER_NAME = "";

  // =========================================================================
  // VIEW CLIENTS
  // =========================================================================

  async function viewClients() {

    setTitle("Clientes", "Listagem de clientes");

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Clientes</h3>
          <button class="btn primary" id="btnAddClient">+ Novo cliente</button>
        </div>
        <div class="hr"></div>
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Carregando clientes...</div>
        </div>
      </div>
    `;

    $("#btnAddClient").onclick = () => openClientForm();

    try {
      const resp = await NFStore.apiFetch(`${API_BASE}/api/clients?limit=200`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const payload = await resp.json();
      ALL_CLIENTS = Array.isArray(payload?.data) ? payload.data : [];


      renderClients();
    } catch (err) {
      console.error("❌ Erro ao carregar clientes:", err);
      $("#content").innerHTML = `
        <div class="card">
          <div class="hint error">⚠️ Erro ao carregar clientes: ${escapeHtml(err.message)}</div>
        </div>
      `;
    }
  }

  function renderClients() {
    // Filter
    let filtered = ALL_CLIENTS;
    if (FILTER_NAME) {
      const lower = FILTER_NAME.toLowerCase();
      filtered = filtered.filter((c) => 
        c.name?.toLowerCase().includes(lower) || 
        c.code?.toLowerCase().includes(lower)
      );
    }

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Clientes</h3>
          <button class="btn primary" id="btnAddClient">+ Novo cliente</button>
        </div>
        <div class="hr"></div>

        <!-- Filters -->
        <div class="row" style="flex-wrap:wrap;align-items:flex-end;gap:8px">
          <div class="field" style="min-width:300px">
            <label>Filtrar por nome ou código</label>
            <input id="filterName" value="${escapeHtml(FILTER_NAME)}" placeholder="Digite para buscar..." />
          </div>

          <div class="field" style="align-self:flex-end">
            <button class="btn" id="clClear">Limpar</button>
          </div>

          <span style="flex:1"></span>
        </div>

        <div class="hr"></div>

        <!-- Clients Table -->
        ${filtered.length > 0 ? `
          <div style="padding:8px 0;color:var(--muted);font-size:13px">
            Mostrando ${filtered.length} cliente${filtered.length !== 1 ? 's' : ''}
          </div>
          <div class="table-scroll-x"><table class="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Documento</th>
                <th class="right">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((c) => `
                <tr>
                  <td><span class="mono">${escapeHtml(c.code)}</span></td>
                  <td>${escapeHtml(c.name)}</td>
                  <td>${escapeHtml(c.doc || "—")}</td>
                  <td class="right">
                    <button class="btn small" data-edit="${c.id}">Editar</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table></div>
        ` : `
          <div class="empty">Sem clientes para exibir.</div>
        `}
      </div>
    `;

    // Bind events
    $("#btnAddClient").onclick = () => openClientForm();
    
    $("#filterName").oninput = (e) => {
      FILTER_NAME = e.target.value;
      renderClients();
    };

    $("#clClear").onclick = () => {
      FILTER_NAME = "";
      renderClients();
    };

    // Bind edit buttons
    $$("[data-edit]").forEach((btn) => {
      btn.onclick = () => {
        const clientId = btn.getAttribute("data-edit");
        openClientForm(clientId);
      };
    });
  }

  // =========================================================================
  // FORM: CREATE/EDIT CLIENT
  // =========================================================================

  async function openClientForm(clientId = null) {

    let edit = null;

    if (clientId) {
      try {
        const resp = await NFStore.apiFetch(`${API_BASE}/api/clients/${clientId}`);
        if (!resp.ok) {
          toast("Cliente não encontrado no servidor.");
          return;
        }
        const payload = await resp.json();
        edit = payload.data || payload;
      } catch (err) {
        toast(`Erro ao carregar cliente: ${err.message}`);
        return;
      }
    }

    openDrawer(
      edit ? `Cliente • ${escapeHtml(edit.code)}` : "Novo Cliente",
      `
      <div class="card">
        <h3>${edit ? "Editar Cliente" : "Criar Cliente"}</h3>
        <div class="hr"></div>

        <div class="field">
          <label>Código</label>
          <input id="clCode" value="${escapeHtml(edit?.code || "")}" placeholder="CLI-0001" ${edit ? 'readonly' : ''} />
          ${edit ? '<div class="hint">Código não pode ser alterado</div>' : ''}
        </div>

        <div class="field">
          <label>Nome</label>
          <input id="clName" value="${escapeHtml(edit?.name || "")}" placeholder="Nome do cliente" />
        </div>

        <div class="field">
          <label>Documento (CNPJ/CPF)</label>
          <input id="clDoc" value="${escapeHtml(edit?.doc || "")}" placeholder="00.000.000/0000-00" />
        </div>

        <div class="row">
          <span style="flex:1"></span>
          <button class="btn primary" id="clSave">Salvar</button>
        </div>
      </div>
      `
    );

    setTimeout(() => {
      $("#clSave").onclick = async () => {
        const code = ($("#clCode").value || "").trim();
        const name = ($("#clName").value || "").trim();
        const doc = ($("#clDoc").value || "").trim();

        if (!code || !name) {
          toast("Código e Nome são obrigatórios.");
          return;
        }

        const payload = { code, name, doc };

        try {
          let resp;
          if (edit) {
            resp = await NFStore.apiFetch(`${API_BASE}/api/clients/${edit.id}`, {
              method: "PUT",
              body: JSON.stringify(payload),
            });
            if (!resp.ok) {
              const errText = await resp.text();
              toast(`Erro ao atualizar: ${errText}`);
              return;
            }
            toast("Cliente atualizado.");
          } else {
            resp = await NFStore.apiFetch(`${API_BASE}/api/clients`, {
              method: "POST",
              body: JSON.stringify(payload),
            });
            if (!resp.ok) {
              const errText = await resp.text();
              toast(`Erro ao criar: ${errText}`);
              return;
            }
            toast("Cliente criado.");
          }

          closeDrawer();
          viewClients(); // Refresh
        } catch (err) {
          console.error("❌ Erro ao salvar cliente:", err);
          toast(`Erro ao salvar: ${err.message}`);
        }
      };
    }, 0);
  }

  // =========================================================================
  // EXPORTS
  // =========================================================================

  global.NFViewsClients = {
    viewClients,
    openClientForm,
  };
})(window);
