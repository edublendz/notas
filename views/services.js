/**
 * @file views/services.js
 * @description Gerenciamento de Serviços com Drawer Modal (API)
 */

(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const escapeHtml = NFUI.escapeHtml;
  const toast = NFUI.toast;
  const setTitle = global.setTitle || (() => {});

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://api.notas.blendz.com.br';

  let ALL_SERVICES = [];

  async function openServiceDrawer() {

    // Create drawer HTML
    const drawerHTML = `
      <div id="serviceDrawer" class="drawer">
        <div class="head">
          <h3 id="drawerTitle">Cadastro de serviços</h3>
          <div class="row">
            <button class="btn small" id="drawerFull">Full page</button>
            <button class="btn small" id="drawerClose">Fechar</button>
          </div>
        </div>
        <div class="body" id="drawerBody">
          <div class="card">
            <h3>Serviços</h3>
            <div class="hint">Usado no combo de OS.</div>
            <div class="hr"></div>

            <div class="field">
              <label>Nome do serviço</label>
              <input id="srvName" type="text" placeholder="Ex: Transporte, Alimentação, Software...">
            </div>

            <div class="row">
              <span style="flex:1"></span>
              <button class="btn primary" id="srvSave">Adicionar Serviço</button>
            </div>

            <div class="hr"></div>

            <h4>Serviços cadastrados</h4>
            <div class="field">
              <input id="srvSearch" type="text" placeholder="🔍 Buscar serviço...">
            </div>
            <div id="servicesList">Carregando...</div>
          </div>
        </div>
      </div>
    `;

    // Add drawer to DOM
    document.body.insertAdjacentHTML('beforeend', drawerHTML);

    // Load services
    await loadServices();

    // Open drawer with animation
    requestAnimationFrame(() => {
      $("#serviceDrawer").classList.add("open");
    });

    // Bind close handlers
    $("#drawerClose").onclick = closeServiceDrawer;
    $("#serviceDrawer").onclick = (e) => {
      if (e.target.id === "serviceDrawer") closeServiceDrawer();
    };

    // Bind full page toggle
    $("#drawerFull").onclick = () => {
      $("#serviceDrawer").classList.toggle("fullpage");
    };

    // Bind save handler
    $("#srvSave").onclick = createService;

    // Bind search handler
    $("#srvSearch").oninput = (e) => {
      const query = e.target.value.toLowerCase().trim();
      renderServicesList(query);
    };
  }

  function closeServiceDrawer() {
    const drawer = $("#serviceDrawer");
    if (!drawer) return;

    drawer.classList.remove("open");
    setTimeout(() => drawer.remove(), 300);
  }

  async function loadServices() {
    try {
      const resp = await NFStore.apiFetch(`${API_BASE}/api/services?limit=100`);
      if (!resp.ok) {
        const err = await resp.json();
        toast(err.error || "Erro ao carregar serviços");
        $("#servicesList").innerHTML = `<p class="error">${escapeHtml(err.error || "Erro desconhecido")}</p>`;
        return;
      }

      const result = await resp.json();
      ALL_SERVICES = result.data || [];
      renderServicesList();
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
      toast("Erro ao carregar serviços");
      $("#servicesList").innerHTML = `<p class="error">Erro ao carregar serviços</p>`;
    }
  }

  function renderServicesList(searchQuery = "") {
    let filtered = ALL_SERVICES;

    // Apply search filter if provided
    if (searchQuery) {
      filtered = ALL_SERVICES.filter(s =>
        s.name.toLowerCase().includes(searchQuery)
      );
    }

    if (filtered.length === 0) {
      const msg = searchQuery
        ? `Nenhum serviço encontrado para "${escapeHtml(searchQuery)}"`
        : "Nenhum serviço cadastrado";
      $("#servicesList").innerHTML = `<p class="hint">${msg}</p>`;
      return;
    }

    const rows = filtered.map(s => `
      <tr>
        <td>${escapeHtml(s.name)}</td>
        <td style="text-align:right;width:120px">
          <button class="btn small danger" data-delete-service="${s.id}">Excluir</button>
        </td>
      </tr>
    `).join('');

    $("#servicesList").innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Serviço</th>
            <th style="text-align:right">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    // Bind delete handlers
    $$("[data-delete-service]").forEach(btn => {
      btn.onclick = () => deleteService(parseInt(btn.dataset.deleteService));
    });
  }

  async function createService() {
    const name = $("#srvName").value.trim();

    if (!name) {
      toast("Digite o nome do serviço");
      return;
    }

    try {
      const resp = await NFStore.apiFetch(`${API_BASE}/api/services`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        toast(err.error || "Erro ao criar serviço");
        return;
      }

      const newService = await resp.json();
      ALL_SERVICES.push(newService);
      ALL_SERVICES.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabeticamente

      toast("Serviço adicionado com sucesso");
      $("#srvName").value = ""; // Limpar input

      renderServicesList();

      // Audit log
      NFStore.audit("SERVICE_CREATE", JSON.stringify({ id: newService.id, name: newService.name }));
    } catch (err) {
      console.error("Erro ao criar serviço:", err);
      toast("Erro ao criar serviço");
    }
  }

  async function deleteService(id) {
    if (!confirm("Excluir este serviço?")) return;

    try {
      const resp = await NFStore.apiFetch(`${API_BASE}/api/services/${id}`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        const err = await resp.json();
        toast(err.error || "Erro ao excluir serviço");
        return;
      }

      ALL_SERVICES = ALL_SERVICES.filter(s => s.id !== id);

      toast("Serviço excluído com sucesso");
      renderServicesList();

      // Audit log
      NFStore.audit("SERVICE_DELETE", JSON.stringify({ id }));
    } catch (err) {
      console.error("Erro ao excluir serviço:", err);
      toast("Erro ao excluir serviço");
    }
  }

  // Exportar para uso global
  global.openServiceDrawer = openServiceDrawer;
  global.NFViewsServices = { openServiceDrawer };

})(window);
