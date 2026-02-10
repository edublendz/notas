/**
 * @file views/user-tenants.js
 * @description Gerenciamento de vínculos Usuário x Tenant (matriz com checkboxes)
 */

(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const escapeHtml = NFUI.escapeHtml;
  const toast = NFUI.toast;

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://api.notas.blendz.com.br';

  let ALL_USERS = [];
  let ALL_TENANTS = [];
  let USER_TENANTS = {}; // { userId: [tenantId1, tenantId2, ...] }

  async function openUserTenantsDrawer() {

    // Create drawer HTML
    const drawerHTML = `
      <div id="userTenantsDrawer" class="drawer fullpage">
        <div class="head">
          <h3 id="drawerTitle">Gerenciar vínculos Usuário x Tenant</h3>
          <div class="row">
            <button class="btn small" id="drawerClose">Fechar</button>
          </div>
        </div>
        <div class="body" id="drawerBody">
          <div class="card">
            <h3>Matriz de vínculos</h3>
            <div class="hint">Marque os checkboxes para vincular usuários aos tenants. Cada usuário precisa ter pelo menos um tenant.</div>
            <div class="hr"></div>

            <div id="matrixContainer">Carregando...</div>

            <div class="row" style="margin-top:24px">
              <span style="flex:1"></span>
              <button class="btn primary" id="saveLinks">Salvar vínculos</button>
              <button class="btn" id="cancelLinks">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add drawer to DOM
    document.body.insertAdjacentHTML('beforeend', drawerHTML);

    // Load data
    await loadData();

    // Open drawer with animation
    requestAnimationFrame(() => {
      $("#userTenantsDrawer").classList.add("open");
    });

    // Bind close handlers
    $("#drawerClose").onclick = closeUserTenantsDrawer;
    $("#cancelLinks").onclick = closeUserTenantsDrawer;
    $("#userTenantsDrawer").onclick = (e) => {
      if (e.target.id === "userTenantsDrawer") closeUserTenantsDrawer();
    };

    // Bind save handler
    $("#saveLinks").onclick = saveUserTenants;
  }

  function closeUserTenantsDrawer() {
    const drawer = $("#userTenantsDrawer");
    if (!drawer) return;

    drawer.classList.remove("open");
    setTimeout(() => drawer.remove(), 300);
  }

  async function loadData() {
    try {
      // Load users
      const usersResp = await NFStore.apiFetch(`${API_BASE}/api/users?limit=100`);
      if (!usersResp.ok) throw new Error("Erro ao carregar usuários");
      const usersData = await usersResp.json();
      ALL_USERS = usersData.data || [];

      // Load tenants
      const tenantsResp = await NFStore.apiFetch(`${API_BASE}/api/tenants?limit=100`);
      if (!tenantsResp.ok) throw new Error("Erro ao carregar tenants");
      const tenantsData = await tenantsResp.json();
      ALL_TENANTS = tenantsData.data || [];

      // Load user-tenant links
      const linksResp = await NFStore.apiFetch(`${API_BASE}/api/user-tenants`);
      if (!linksResp.ok) throw new Error("Erro ao carregar vínculos");
      const linksData = await linksResp.json();

      // Build USER_TENANTS map
      USER_TENANTS = {};
      (linksData.data || []).forEach(link => {
        if (!USER_TENANTS[link.userId]) {
          USER_TENANTS[link.userId] = [];
        }
        USER_TENANTS[link.userId].push(link.tenantId);
      });

      renderMatrix();
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast("Erro ao carregar dados");
      $("#matrixContainer").innerHTML = `<p class="error">Erro ao carregar dados: ${escapeHtml(err.message)}</p>`;
    }
  }

  function renderMatrix() {
    if (ALL_USERS.length === 0 || ALL_TENANTS.length === 0) {
      $("#matrixContainer").innerHTML = `<p class="hint">Nenhum usuário ou tenant disponível</p>`;
      return;
    }

    // Build table header
    const headerCells = ALL_TENANTS.map(t => `<th>${escapeHtml(t.name)}</th>`).join('');

    // Build table rows
    const rows = ALL_USERS.map(u => {
      const userTenants = USER_TENANTS[u.id] || [];
      const cells = ALL_TENANTS.map(t => {
        const isChecked = userTenants.includes(t.id);
        return `<td style="text-align:center">
          <input type="checkbox" 
                 data-user="${u.id}" 
                 data-tenant="${t.id}" 
                 ${isChecked ? 'checked' : ''}>
        </td>`;
      }).join('');

      return `<tr>
        <td style="min-width:200px"><strong>${escapeHtml(u.name)}</strong><br><span class="hint" style="font-size:12px">${escapeHtml(u.email)}</span></td>
        ${cells}
      </tr>`;
    }).join('');

    $("#matrixContainer").innerHTML = `
      <div style="overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th>Usuário</th>
              ${headerCells}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  async function saveUserTenants() {
    // Collect all checkbox states
    const links = [];
    $$("input[type=checkbox][data-user][data-tenant]").forEach(cb => {
      if (cb.checked) {
        links.push({
          userId: parseInt(cb.dataset.user),
          tenantId: parseInt(cb.dataset.tenant),
        });
      }
    });

    // Validate: each user must have at least one tenant
    const userCounts = {};
    links.forEach(link => {
      userCounts[link.userId] = (userCounts[link.userId] || 0) + 1;
    });

    for (const user of ALL_USERS) {
      if (!userCounts[user.id]) {
        toast(`Usuário "${user.name}" precisa ter pelo menos um tenant vinculado`);
        return;
      }
    }

    try {
      const resp = await NFStore.apiFetch(`${API_BASE}/api/user-tenants`, {
        method: "PUT",
        body: JSON.stringify({ links }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        toast(err.error || "Erro ao salvar vínculos");
        return;
      }

      toast("Vínculos salvos com sucesso");
      NFStore.audit("USER_TENANT_LINKS_UPDATE", JSON.stringify({ count: links.length }));

      closeUserTenantsDrawer();
    } catch (err) {
      console.error("Erro ao salvar vínculos:", err);
      toast("Erro ao salvar vínculos");
    }
  }

  // Exportar para uso global
  global.openUserTenantsDrawer = openUserTenantsDrawer;
  global.NFViewsUserTenants = { openUserTenantsDrawer };

})(window);
