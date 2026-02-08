/**
 * @file views/projects.js
 * @description Módulo de Projetos (API)
 *
 * Carrega projetos do backend e exibe listagem com:
 * - Filtros por cliente e status
 * - Custo real calculado (NF + outras despesas)
 * - Indicador sinaleiro (verde/amarelo/vermelho)
 */

(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  
  const escapeHtml = NFUI.escapeHtml;
  const fmtBRL = NFUI.fmtBRL;
  const bindMonthControls = NFUI.bindMonthControls;
  const monthControlsHtml = NFUI.monthControlsHtml;
  const toast = NFUI.toast;
  const openDrawer = NFUI.openDrawer;
  const closeDrawer = NFUI.closeDrawer;
  
  const monthKeyFromDate = NFStore.monthKeyFromDate;
  const monthShift = NFStore.monthShift;
  const viewRouter = global.NFApp?.viewRouter || (() => {});
  const setTitle = global.setTitle || (() => {});

  // API Base URL
  const API_BASE = window.location.hostname === "localhost" && window.location.port === "5500"
    ? "http://localhost:8000"
    : "/apis/public/index.php";

  // =========================================================================
  // FORMATTERS
  // =========================================================================

  const formatCurrency = fmtBRL;

  // =========================================================================
  // STATE
  // =========================================================================

  let ALL_PROJECTS = [];
  let ALL_CLIENTS = [];
  let ALL_EXPENSES = [];
  let ALL_REIMBURSEMENTS = [];
  let ALL_INVOICES = [];
  let ALL_PROJECT_STATUSES = [];
  let CURRENT_MONTH = monthKeyFromDate(new Date());

  // Filters
  let FILTER_CLIENT = "";
  let FILTER_STATUS = "";

  // =========================================================================
  // COST CALCULATION
  // =========================================================================

  /**
   * Calcula custos reais de um projeto (NF + despesas + reembolsos)
   * Similar ao cálculo feito em dashboard.js
   */
  function calculateProjectCosts(projectId, month = null) {
    const costs = {
      nf: 0,
      expenses: 0,
      reimbursements: 0,
      total: 0,
    };

    // NF (invoices)
    const invoices = ALL_INVOICES.filter((inv) => {
      if (inv.projectId !== projectId) return false;
      if (month && !inv.issueDate?.startsWith(month)) return false;
      return true;
    });
    costs.nf = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

    // Despesas (expenses)
    const expenses = ALL_EXPENSES.filter((exp) => {
      if (exp.projectId !== projectId) return false;
      if (month && !exp.date?.startsWith(month)) return false;
      return true;
    });
    costs.expenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

    // Reembolsos (reimbursements)
    const reimbursements = ALL_REIMBURSEMENTS.filter((rb) => {
      if (rb.projectId !== projectId) return false;
      if (month && !rb.date?.startsWith(month)) return false;
      return true;
    });
    costs.reimbursements = reimbursements.reduce((sum, rb) => sum + Number(rb.amount || 0), 0);

    costs.total = costs.nf + costs.expenses + costs.reimbursements;

    return costs;
  }

  /**
   * Calcula indicador sinaleiro (verde/amarelo/vermelho)
   * Baseado em costPlanned e indicatorOverridePct
   */
  function getTrafficLight(project, realCost) {
    const planned = Number(project.costPlanned || 0);
    const limitPct = Number(project.indicatorOverridePct || 0.05); // 5% default

    if (realCost <= planned) return "🟢"; // Verde
    
    const overPct = (realCost - planned) / planned;
    if (overPct <= limitPct) return "🟡"; // Amarelo
    
    return "🔴"; // Vermelho
  }

  // =========================================================================
  // VIEW PROJECTS
  // =========================================================================

  async function viewProjects() {
    console.log("🔵 viewProjects() CHAMADA (views/projects.js)");

    setTitle("Projetos", "Projetos com indicador e custo real");

    const month = NFStore.DB().ui.month;

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Projetos</h3>
          <button class="btn primary" id="prjNew">+ Novo projeto</button>
        </div>
        <div class="spacer"></div>
        ${monthControlsHtml(month)}
        <div class="hr"></div>
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Carregando projetos...</div>
        </div>
      </div>
    `;

    $("#prjNew").onclick = () => openProjectForm();

    // Month controls - bind once em viewProjects, renderProjects só re-renderiza
    bindMonthControls((delta) => {
      const db = NFStore.DB();
      if (delta === "now") db.ui.month = monthKeyFromDate(new Date());
      else db.ui.month = monthShift(db.ui.month, delta);
      NFStore.saveDB();
      CURRENT_MONTH = db.ui.month;
      renderProjects(); // Apenas re-renderiza ao invés de recarregar tudo
    });

    try {
      // Fetch all data in parallel
      const [projResp, clientsResp, statusResp, expResp, rbResp, invResp] = await Promise.all([
        NFStore.apiFetch(`${API_BASE}/api/projects?limit=200`),
        NFStore.apiFetch(`${API_BASE}/api/clients?limit=200`),
        NFStore.apiFetch(`${API_BASE}/api/project-statuses`),
        NFStore.apiFetch(`${API_BASE}/api/expenses?limit=500`),
        NFStore.apiFetch(`${API_BASE}/api/reimbursements?limit=500`),
        NFStore.apiFetch(`${API_BASE}/api/invoices?limit=500`),
      ]);

      const projPayload = projResp.ok ? await projResp.json() : null;
      const clientsPayload = clientsResp.ok ? await clientsResp.json() : null;
      const statusPayload = statusResp.ok ? await statusResp.json() : null;
      const expPayload = expResp.ok ? await expResp.json() : null;
      const rbPayload = rbResp.ok ? await rbResp.json() : null;
      const invPayload = invResp.ok ? await invResp.json() : null;

      ALL_PROJECTS = Array.isArray(projPayload?.data) ? projPayload.data : [];
      ALL_CLIENTS = Array.isArray(clientsPayload?.data) ? clientsPayload.data : [];
      ALL_PROJECT_STATUSES = Array.isArray(statusPayload?.data) ? statusPayload.data : [];
      ALL_EXPENSES = Array.isArray(expPayload?.data) ? expPayload.data : [];
      ALL_REIMBURSEMENTS = Array.isArray(rbPayload?.data) ? rbPayload.data : [];
      ALL_INVOICES = Array.isArray(invPayload?.data) ? invPayload.data : [];

      console.log("📊 Dados carregados - Projetos:", ALL_PROJECTS.length, "Clientes:", ALL_CLIENTS.length, "Status:", ALL_PROJECT_STATUSES.length);

      renderProjects();
    } catch (err) {
      console.error("❌ Erro ao carregar projetos:", err);
      $("#content").innerHTML = `
        <div class="card">
          <div class="hint error">⚠️ Erro ao carregar projetos: ${escapeHtml(err.message)}</div>
        </div>
      `;
    }
  }

  function renderProjects() {
    // Filter projects
    let filtered = ALL_PROJECTS;

    if (FILTER_CLIENT) {
      filtered = filtered.filter((p) => String(p.clientId) === String(FILTER_CLIENT));
    }

    if (FILTER_STATUS) {
      filtered = filtered.filter((p) => p.status === FILTER_STATUS);
    }

    // Client lookup
    const getClientName = (clientId) => {
      const client = ALL_CLIENTS.find((c) => String(c.id) === String(clientId));
      if (!client) {
        console.warn("⚠️ Cliente não encontrado:", clientId, "Clientes disponíveis:", ALL_CLIENTS.map(c => c.id));
      }
      return client ? `${client.code} • ${client.name}` : "—";
    };

    // Calculate project costs (month-based)
    const projectCosts = {};
    filtered.forEach((p) => {
      projectCosts[p.id] = calculateProjectCosts(p.id, CURRENT_MONTH);
    });

    const month = NFStore.DB().ui.month;

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Projetos</h3>
          <button class="btn primary" id="prjNew">+ Novo projeto</button>
        </div>
        <div class="spacer"></div>
        ${monthControlsHtml(month)}
        <div class="hr"></div>

        <!-- Filters -->
        <div class="row" style="flex-wrap:wrap;align-items:flex-end;gap:8px">
          <div class="field" style="min-width:260px">
            <label>Filtrar por cliente</label>
            <select id="filterClient">
              <option value="">Todos os clientes</option>
              ${ALL_CLIENTS.map((c) => `
                <option value="${c.id}" ${FILTER_CLIENT == c.id ? "selected" : ""}>
                  ${escapeHtml(c.code)} • ${escapeHtml(c.name)}
                </option>
              `).join("")}
            </select>
          </div>

          <div class="field" style="min-width:240px">
            <label>Filtrar por status</label>
            <select id="filterStatus">
              <option value="">Todos os status</option>
              ${ALL_PROJECT_STATUSES.map((s) => `
                <option value="${escapeHtml(s.name)}" ${FILTER_STATUS === s.name ? "selected" : ""}>${escapeHtml(s.name)}</option>
              `).join("")}
            </select>
          </div>

          <div class="field" style="align-self:flex-end">
            <button class="btn" id="prjClear">Limpar</button>
          </div>

          <span style="flex:1"></span>
        </div>

        <div class="hr"></div>

        <!-- Project Table -->
        ${filtered.length > 0 ? `
          <div style="padding:8px 0;color:var(--muted);font-size:13px">
            Mostrando ${filtered.length} projeto${filtered.length !== 1 ? 's' : ''}
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Projeto</th>
                <th>Cliente</th>
                <th class="right">Prev. fat.</th>
                <th class="right">Prev. custo</th>
                <th class="right">Ideal</th>
                <th class="right">Limite</th>
                <th class="right">Custo real</th>
                <th>Sinaleiro</th>
                <th class="right">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((p) => {
                const costs = projectCosts[p.id];
                const planned = Number(p.costPlanned || 0);
                const valueTotal = Number(p.valueTotal || 0);
                const ideal = valueTotal - planned;
                const limitPct = Number(p.indicatorOverridePct || 0.05);
                const limit = planned * (1 + limitPct);
                const trafficLight = getTrafficLight(p, costs.total);

                return `
                  <tr>
                    <td><span class="mono">${escapeHtml(p.code || p.id)}</span></td>
                    <td>
                      ${escapeHtml(p.name)}
                      <div class="hint">${escapeHtml(p.status || "")}</div>
                    </td>
                    <td>${escapeHtml(getClientName(p.clientId))}</td>
                    <td class="right">${formatCurrency(valueTotal)}</td>
                    <td class="right">${formatCurrency(planned)}</td>
                    <td class="right">${formatCurrency(ideal)}</td>
                    <td class="right">${formatCurrency(limit)}</td>
                    <td class="right">
                      ${formatCurrency(costs.total)}
                      <div class="hint">NF ${formatCurrency(costs.nf)} • Outras ${formatCurrency(costs.expenses + costs.reimbursements)}</div>
                    </td>
                    <td style="font-size:1.5em;text-align:center;">${trafficLight}</td>
                    <td class="right">
                      <button class="btn small" data-open="project" data-id="${p.id}">Editar</button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        ` : `
          <div class="empty">Sem projetos para exibir.</div>
        `}
      </div>
    `;

    // Bind events
    $("#prjNew").onclick = () => openProjectForm();
    $("#filterClient").onchange = (e) => {
      FILTER_CLIENT = e.target.value;
      console.log("🔍 Filtro cliente:", FILTER_CLIENT);
      renderProjects();
    };
    $("#filterStatus").onchange = (e) => {
      FILTER_STATUS = e.target.value;
      console.log("🔍 Filtro status:", FILTER_STATUS);
      renderProjects();
    };
    $("#prjClear").onclick = () => {
      FILTER_CLIENT = "";
      FILTER_STATUS = "";
      renderProjects();
    };

    // Bind edit buttons
    $$("[data-open='project']").forEach((btn) => {
      btn.onclick = () => {
        const projectId = btn.getAttribute("data-id");
        openProjectForm(projectId);
      };
    });
  }

  function formatMonthLabel(monthKey) {
    const [y, m] = monthKey.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(m) - 1]} ${y}`;
  }

  // =========================================================================
  // FORM: CREATE/EDIT PROJECT
  // =========================================================================

  async function openProjectForm(projectId = null) {
    console.log("🔵 openProjectForm() CHAMADA:", projectId);
    console.log("📊 ALL_CLIENTS disponíveis:", ALL_CLIENTS.length);
    console.log("📊 ALL_PROJECT_STATUSES disponíveis:", ALL_PROJECT_STATUSES.length);

    // Se não tiver clientes ou status carregados, recarregar
    if (ALL_CLIENTS.length === 0 || ALL_PROJECT_STATUSES.length === 0) {
      toast("Carregando dados necessários...");
      try {
        const [clientsResp, statusResp] = await Promise.all([
          NFStore.apiFetch(`${API_BASE}/api/clients?limit=200`),
          NFStore.apiFetch(`${API_BASE}/api/project-statuses`),
        ]);
        const clientsPayload = clientsResp.ok ? await clientsResp.json() : null;
        const statusPayload = statusResp.ok ? await statusResp.json() : null;
        ALL_CLIENTS = Array.isArray(clientsPayload?.data) ? clientsPayload.data : [];
        ALL_PROJECT_STATUSES = Array.isArray(statusPayload?.data) ? statusPayload.data : [];
        console.log("✅ Dados recarregados - Clientes:", ALL_CLIENTS.length, "Status:", ALL_PROJECT_STATUSES.length);
      } catch (err) {
        toast("Erro ao carregar clientes e status.");
        return;
      }
    }

    let edit = null;

    if (projectId) {
      try {
        const resp = await NFStore.apiFetch(`${API_BASE}/api/projects/${projectId}`);
        if (!resp.ok) {
          toast("Projeto não encontrado no servidor.");
          return;
        }
        const payload = await resp.json();
        // API pode retornar {data: {...}} ou {...} direto
        edit = payload.data || payload;
        console.log("📝 Projeto carregado:", edit);
      } catch (err) {
        toast(`Erro ao carregar projeto: ${err.message}`);
        return;
      }
    }

    const clients = ALL_CLIENTS;
    const statuses = ALL_PROJECT_STATUSES;

    console.log("📋 Renderizando modal com:", clients.length, "clientes e", statuses.length, "status");

    openDrawer(
      edit ? `Projeto • ${escapeHtml(edit.code)}` : "Novo Projeto",
      `
      <div class="card">
        <h3>${edit ? "Editar projeto" : "Criar projeto"}</h3>
        <div class="hr"></div>

        <!-- Cliente | Nome -->
        <div class="split">
          <div class="field">
            <label>Cliente</label>
            <select id="prjClient">
              ${!edit ? '<option value="">Selecione um cliente</option>' : ''}
              ${clients.map((c) => `
                <option value="${c.id}" ${edit?.clientId && String(edit.clientId) === String(c.id) ? "selected" : ""}>
                  ${escapeHtml(c.code)} • ${escapeHtml(c.name)}
                </option>
              `).join("")}
            </select>
            <div class="hint">${clients.length} cliente(s) disponível(is)</div>
          </div>

          <div class="field">
            <label>Nome</label>
            <input id="prjName" value="${escapeHtml(edit?.name || "")}" placeholder="Nome do projeto"/>
          </div>
        </div>

        <!-- Tipo | Início | Fim -->
        <div class="split three">
          <div class="field">
            <label>Tipo</label>
            <select id="prjType">
              <option value="Projeto" ${edit?.type === "Projeto" ? "selected" : ""}>Projeto</option>
              <option value="Fee Mensal" ${edit?.type === "Fee Mensal" ? "selected" : ""}>Fee Mensal</option>
            </select>
            <div class="hint">Classificação do projeto (não muda a listagem).</div>
          </div>

          <div class="field">
            <label>Data de início</label>
            <input id="prjStart" type="date" value="${edit?.startDate || ""}" />
          </div>

          <div class="field">
            <label>Data de fim</label>
            <input id="prjEnd" type="date" value="${edit?.endDate || ""}" />
          </div>
        </div>

        <!-- URL contrato | URL DRE -->
        <div class="split">
          <div class="field">
            <label>URL do contrato</label>
            <input id="prjContractUrl" value="${edit?.contractUrl || ""}" placeholder="https://..." />
          </div>

          <div class="field">
            <label>URL do DRE</label>
            <input id="prjDreUrl" value="${edit?.dreUrl || ""}" placeholder="https://..." />
          </div>
        </div>

        <!-- Custo NF | Custo Outras -->
        <div class="split">
          <div class="field">
            <label>Custo previsto (NF)</label>
            <input id="prjCostNF" type="number" step="0.01" value="${edit?.costPlannedNF ?? 0}" />
          </div>

          <div class="field">
            <label>Custo previsto (Outras despesas)</label>
            <input id="prjCostOther" type="number" step="0.01" value="${edit?.costPlannedOther ?? 0}" />
          </div>
        </div>

        <!-- Faturamento | Custo Total -->
        <div class="split">
          <div class="field">
            <label>Faturamento previsto</label>
            <input id="prjValue" type="number" step="0.01" value="${edit?.valueTotal || 0}"/>
          </div>

          <div class="field">
            <label>Custo previsto (Total)</label>
            <input id="prjCostPlanned" type="number" step="0.01" value="${edit?.costPlanned ?? 0}" readonly />
            <div class="hint">Total calculado automaticamente: NF + Outras</div>
          </div>
        </div>

        <!-- Override | Status -->
        <div class="split">
          <div class="field">
            <label>Indicador override (opcional)</label>
            <input id="prjOverride" type="number" step="0.01" value="${edit?.indicatorOverridePct ?? ""}" placeholder="Ex: 0.40"/>
            <div class="hint">Se vazio, usa o indicador do tenant.</div>
          </div>

          <div class="field">
            <label>Status do projeto</label>
            <select id="projectStatus">
              ${statuses.map(s => `
                <option value="${s.id}" ${edit?.statusId && Number(edit.statusId) === s.id ? "selected" : ""}>${escapeHtml(s.name)}</option>
              `).join("")}
            </select>
            <div class="hint">${statuses.length} status disponível(is)</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="row">
          <span class="hint">ID do projeto: <span class="mono">${edit?.code || "gerado ao salvar"}</span></span>
          <span style="flex:1"></span>
          <button class="btn primary" id="prjSave">Salvar</button>
        </div>
      </div>
      `
    );

    setTimeout(() => {
      // Auto-calculate total planned cost
      const calcPlanned = () => {
        const nf = Number($("#prjCostNF").value || 0);
        const other = Number($("#prjCostOther").value || 0);
        $("#prjCostPlanned").value = (nf + other).toFixed(2);
      };

      $("#prjCostNF").oninput = calcPlanned;
      $("#prjCostOther").oninput = calcPlanned;
      calcPlanned();

      // Save button
      $("#prjSave").onclick = async () => {
        const clientId = $("#prjClient").value;
        const name = ($("#prjName").value || "").trim();
        const valueTotal = Number($("#prjValue").value || 0);
        const costPlannedNF = Number($("#prjCostNF").value || 0);
        const costPlannedOther = Number($("#prjCostOther").value || 0);
        const costPlanned = costPlannedNF + costPlannedOther;
        const statusId = Number($("#projectStatus").value);
        const ovRaw = ($("#prjOverride").value || "").trim();
        const indicatorOverridePct = ovRaw === "" ? null : Number(ovRaw);
        const type = $("#prjType").value;
        const contractUrl = ($("#prjContractUrl").value || "").trim();
        const dreUrl = ($("#prjDreUrl").value || "").trim();
        const startDate = ($("#prjStart").value || "").trim();
        const endDate = ($("#prjEnd").value || "").trim();

        if (!clientId || !name) {
          toast("Informe cliente e nome.");
          return;
        }
        if (!valueTotal) {
          toast("Informe faturamento previsto.");
          return;
        }

        // Generate code if creating new project
        const code = edit ? edit.code : `PRJ-${Date.now().toString().slice(-6)}`;

        const payload = {
          code,
          clientId,
          name,
          statusId,
          valueTotal,
          costPlannedNF,
          costPlannedOther,
          costPlanned,
          indicatorOverridePct,
          type,
          contractUrl,
          dreUrl,
          startDate,
          endDate,
        };

        console.log("📤 Enviando payload:", payload);

        try {
          let resp;
          if (edit) {
            resp = await NFStore.apiFetch(`${API_BASE}/api/projects/${edit.id}`, {
              method: "PUT",
              body: JSON.stringify(payload),
            });
            if (!resp.ok) {
              const errText = await resp.text();
              toast(`Erro ao atualizar: ${errText}`);
              return;
            }
            toast("Projeto atualizado.");
          } else {
            resp = await NFStore.apiFetch(`${API_BASE}/api/projects`, {
              method: "POST",
              body: JSON.stringify(payload),
            });
            if (!resp.ok) {
              const errText = await resp.text();
              toast(`Erro ao criar: ${errText}`);
              return;
            }
            toast("Projeto criado.");
          }

          closeDrawer();
          viewProjects(); // Refresh
        } catch (err) {
          console.error("❌ Erro ao salvar projeto:", err);
          toast(`Erro ao salvar: ${err.message}`);
        }
      };
    }, 0);
  }

  // =========================================================================
  // EXPORTS
  // =========================================================================

  global.NFViewsProjects = {
    viewProjects,
    openProjectForm,
  };

  console.log("✅ views/projects.js carregado");
})(window);
