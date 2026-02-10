// ============================================================
// views/settings.js - Configurações do Tenant (migrado para API)
// ============================================================

(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;
  const $ = (sel) => document.querySelector(sel);
  const escapeHtml = NFUI.escapeHtml;
  const toast = NFUI.toast;
  const setTitle = global.setTitle || (()=>{});

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://api.notas.blendz.com.br';

  let CURRENT_SETTINGS = null;

  async function viewSettings() {
    setTitle("Configurações", "Sinaleiro de custo + opção de vínculo projeto");

    $("#content").innerHTML = `
      <div class="card">
        <h3>Configurações do tenant</h3>
        <div class="hr"></div>
        <div id="settingsForm">Carregando...</div>
      </div>
    `;

    await loadSettings();
  }

  async function loadSettings() {
    try {
      const resp = await NFStore.apiFetch(`${API_BASE}/api/tenants/settings`);
      if (!resp.ok) {
        const err = await resp.json();
        toast(err.error || "Erro ao carregar configurações");
        $("#settingsForm").innerHTML = `<p class="error">${escapeHtml(err.error || "Erro desconhecido")}</p>`;
        return;
      }

      CURRENT_SETTINGS = await resp.json();
      renderForm();
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
      toast("Erro ao carregar configurações");
      $("#settingsForm").innerHTML = `<p class="error">Erro ao carregar configurações</p>`;
    }
  }

  function renderForm() {
    const redPctDisplay = Math.round((CURRENT_SETTINGS.indicatorPct || 0.45) * 100);
    const requireLink = CURRENT_SETTINGS.requireProjectLink || false;

    $("#settingsForm").innerHTML = `
      <div class="split">
        <div class="field">
          <label>Limite vermelho (crítico)</label>
          <div class="input-suffix">
            <input id="setRedPct" type="number" step="1" min="0" max="100" value="${redPctDisplay}">
            <span class="suffix">%</span>
          </div>
          <div class="hint">
            Regras do sinaleiro:
            <ul style="margin:8px 0 0 18px">
              <li><strong>🟢 Verde</strong>: custo real ≤ custo previsto</li>
              <li><strong>🟡 Amarelo</strong>: custo real &gt; previsto e ≤ limite vermelho</li>
              <li><strong>🔴 Vermelho</strong>: custo real &gt; limite vermelho</li>
            </ul>
          </div>
        </div>

        <div class="field">
          <label>Exigir vínculo usuário x projeto</label>
          <select id="setLink">
            <option value="false" ${!requireLink ? 'selected' : ''}>Não (liberar projetos)</option>
            <option value="true" ${requireLink ? 'selected' : ''}>Sim (restringir para operador)</option>
          </select>
          <div class="hint">Quando ligado, operador só enxerga projetos vinculados.</div>
        </div>
      </div>

      <div class="row">
        <button class="btn primary" id="setSave">Salvar</button>
        <span style="flex:1"></span>
        <button class="btn" id="setLinks">Gerenciar vínculos</button>
        <button class="btn" id="setSrv">Cadastro de serviços</button>
      </div>
    `;

    $("#setSave").onclick = saveSettings;
    $("#setLinks").onclick = () => {
      // Abre drawer de gerenciamento de vínculos usuário x tenant
      if (typeof global.openUserTenantsDrawer === 'function') {
        global.openUserTenantsDrawer();
      } else {
        toast("Drawer de vínculos não disponível");
      }
    };
    $("#setSrv").onclick = () => {
      // Abre o drawer de serviços
      if (typeof global.openServiceDrawer === 'function') {
        global.openServiceDrawer();
      } else {
        toast("Drawer de serviços não disponível");
      }
    };
  }

  async function saveSettings() {
    const redPctUI = Number($("#setRedPct").value || 45);
    const indicatorPct = redPctUI / 100; // Converte 45 → 0.45

    const requireProjectLink = $("#setLink").value === "true";

    try {
      const resp = await NFStore.apiFetch(`${API_BASE}/api/tenants/settings`, {
        method: "PUT",
        body: JSON.stringify({
          indicatorPct,
          requireProjectLink,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        toast(err.error || "Erro ao salvar configurações");
        return;
      }

      const result = await resp.json();
      CURRENT_SETTINGS = result.settings;

      toast("Configurações salvas com sucesso");

      // Audit log
      NFStore.audit("SETTINGS_UPDATE", JSON.stringify({ indicatorPct, requireProjectLink }));

      renderForm();
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      toast("Erro ao salvar configurações");
    }
  }

  // Exportar para uso global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { viewSettings };
  } else {
    global.viewSettings = viewSettings;
    global.NFViewsSettings = { viewSettings }; // Wrapper para views/index.js
  }

})(window);
