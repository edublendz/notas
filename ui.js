// ui.js
(function (global) {
  "use strict";

  const { NFStore } = global;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  // ===== Toast =====
  const toastEl = $("#toast");
  let timer = null;

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  // ===== Drawer =====
  const overlay = $("#overlay");
  const drawer = $("#drawer");
  const titleEl = $("#drawerTitle");
  const bodyEl = $("#drawerBody");

  function openDrawer(title, html) {
    if (titleEl) titleEl.textContent = title || "Detalhes";
    if (bodyEl) bodyEl.innerHTML = html || "";
    overlay?.classList.add("open");
    drawer?.classList.add("open");
  }

  function closeDrawer() {
    overlay?.classList.remove("open");
    drawer?.classList.remove("open");
  }

  $("#drawerClose")?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);

  // ===== Helpers UI =====
  const ST = NFStore?.ST || {};
  const fmtBRL = (v) =>
    (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const escapeHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  function chipStatus(status) {
    const s = String(status || "");
    const ok = [ST.NF_APROVADA, ST.RB_APROVADO, ST.OS_APROVADA].includes(s);
    const bad = [ST.NF_REPROVADA, ST.RB_REPROVADO, ST.OS_REPROVADA].includes(s);
    const warn = [ST.NF_ENVIADA, ST.RB_SOLICITADO, ST.OS_ENVIADA].includes(s);
    const cls = ok ? "ok" : bad ? "bad" : warn ? "warn" : "gray";
    return `<span class="chip ${cls}">${escapeHtml(s || "—")}</span>`;
  }
  function chipProjectStatus(status){
    return `<span class="chip gray">${status}</span>`;
  }


  function monthControlsHtml(month) {
    return `
      <div class="row">
        <button class="btn small" id="m_prev">←</button>
        <span class="chip gray">Mês: <strong>${escapeHtml(month)}</strong></span>
        <button class="btn small" id="m_next">→</button>
        <button class="btn small" id="m_now">Hoje</button>
      </div>
    `;
  }

  function bindMonthControls(onChange) {
    if($("#m_prev")) $("#m_prev").onclick = () => onChange(-1);
    if($("#m_next")) $("#m_next").onclick = () => onChange(+1);
    if($("#m_now")) $("#m_now").onclick = () => onChange("now");
  }

  // ===== Views =====
  function renderDashboard() {
    // Operador não tem dashboard -> manda pra OS
    if (NFStore.isOper?.()) return renderExpenses();

    const DB = NFStore.DB();
    const month = DB.ui.month;

    const clients = NFStore.visibleClients();
    const projs = NFStore.visibleProjects();

    // filtros
    const qClient = DB.ui.dashClientId || "";
    const qStatus = DB.ui.dashStatus || "";

    // custos por projeto
    const projsFiltered = projs.filter((p) => !qClient || p.clientId === qClient);

    const projRows = projsFiltered
      .map((p) => {
        const c = clients.find((x) => x.id === p.clientId);
        const real = NFStore.projectCostsReal(p.id, month);
        return `
          <tr>
            <td><span class="mono">${escapeHtml(p.code)}</span><div class="hint">${escapeHtml(p.name)}</div></td>
            <td>${escapeHtml(c?.name || "—")}</td>
            <td class="right">${fmtBRL(p.valueTotal || 0)}</td>
            <td class="right">${fmtBRL(p.costPlanned || 0)}</td>
            <td class="right">${fmtBRL(real.nfCost || 0)}</td>
            <td class="right">${fmtBRL(real.otherCost || 0)}</td>
            <td class="right"><strong>${fmtBRL(real.total || 0)}</strong></td>
            <td class="right"><span class="chip gray">—</span></td>
          </tr>
        `;
      })
      .join("");

    // KPIs simples
    const totalValue = projsFiltered.reduce((s, p) => s + Number(p.valueTotal || 0), 0);
    const planned = projsFiltered.reduce((s, p) => s + Number(p.costPlanned || 0), 0);
    const realTotal = projsFiltered.reduce(
      (s, p) => s + Number(NFStore.projectCostsReal(p.id, month).total || 0),
      0
    );
    const diff = realTotal - planned;

    const over = NFStore.projectOverruns(month).slice(0, 6);

    $("#content").innerHTML = `
      <div class="grid">
        <div class="card">
          <div class="row" style="justify-content:space-between">
            <h3 style="margin:0">Resumo do mês</h3>
            ${monthControlsHtml(month)}
          </div>

          <div class="spacer"></div>

          <div class="kpi">
            <div class="box"><div class="t">Faturamento</div><div class="v">${fmtBRL(totalValue)}</div></div>
            <div class="box"><div class="t">Custo previsto</div><div class="v">${fmtBRL(planned)}</div></div>
            <div class="box"><div class="t">Custo real</div><div class="v">${fmtBRL(realTotal)}</div></div>
            <div class="box"><div class="t">Delta</div><div class="v">${fmtBRL(diff)}</div></div>
          </div>

          <div class="hr"></div>

          <div class="row">
            <div class="field" style="min-width:240px">
              <label>Cliente</label>
              <select id="dashClient">
                <option value="">Todos</option>
                ${clients
                  .map(
                    (c) =>
                      `<option value="${c.id}" ${qClient === c.id ? "selected" : ""}>${escapeHtml(
                        c.code
                      )} • ${escapeHtml(c.name)}</option>`
                  )
                  .join("")}
              </select>
            </div>

            <div class="field" style="min-width:240px">
              <label>Status (placeholder)</label>
               
            </div>

            <div class="field" style="align-self:flex-end">
              <button class="btn" id="dashClear">Limpar filtros</button>
            </div>
          </div>

          <div class="hr"></div>

          <h3>Projetos</h3>
          ${
            projsFiltered.length
              ? `
              <table class="table">
                <thead>
                  <tr>
                    <th>Projeto (ID)</th><th>Cliente</th>
                    <th class="right">Faturamento</th>
                    <th class="right">Custo previsto</th>
                    <th class="right">Custo NF</th>
                    <th class="right">Outras despesas</th>
                    <th class="right">Custo real</th>
                    <th class="right">Ações</th>
                  </tr>
                </thead>
                <tbody>${projRows}</tbody>
              </table>
            `
              : `<div class="empty">Nenhum projeto.</div>`
          }
        </div>

        <div class="card sticky">
          <h3>Projetos estourados</h3>
          <div class="hint">Custo real maior que custo previsto (no mês selecionado).</div>
          <div class="hr"></div>
          ${
            over.length
              ? `
              <div class="row" style="flex-direction:column;align-items:stretch">
                ${over
                  .map((x) => {
                    const c = clients.find((cc) => cc.id === x.p.clientId);
                    return `
                      <div class="card" style="padding:10px;background:var(--panel2)">
                        <div class="row" style="justify-content:space-between">
                          <div>
                            <div><strong>${escapeHtml(x.p.code)}</strong> • ${escapeHtml(x.p.name)}</div>
                            <div class="hint">${escapeHtml(c?.name || "—")}</div>
                          </div>
                          <div class="right">
                            <div class="chip bad">+${fmtBRL(x.diff)}</div>
                            <div class="hint">Previsto ${fmtBRL(x.planned)}</div>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            `
              : `<div class="empty">Nenhum estouro neste mês.</div>`
          }
        </div>
      </div>
    `;

    // bindings
    bindMonthControls((delta) => {
      const DB2 = NFStore.DB();
      if (delta === "now") DB2.ui.month = NFStore.monthKeyFromDate(new Date());
      else DB2.ui.month = NFStore.monthShift(DB2.ui.month, delta);
      NFStore.saveDB();
      global.NFApp?.rerender?.();
    });

    $("#dashClient")?.addEventListener("change", (e) => {
      NFStore.DB().ui.dashClientId = e.target.value;
      NFStore.saveDB();
      global.NFApp?.rerender?.();
    });

    $("#dashStatus")?.addEventListener("change", (e) => {
      NFStore.DB().ui.dashStatus = e.target.value;
      NFStore.saveDB();
      global.NFApp?.rerender?.();
    });

    $("#dashClear")?.addEventListener("click", () => {
      const DB2 = NFStore.DB();
      DB2.ui.dashClientId = "";
      DB2.ui.dashStatus = "";
      NFStore.saveDB();
      global.NFApp?.rerender?.();
    });
  }

  function renderExpenses() {
    const DB = NFStore.DB();
    const month = DB.ui.month;

    const expsAll = NFStore.visibleExpenses();
    const exps = expsAll.filter((d) => NFStore.monthKeyFromDate(d.dateBuy) === month);

    const projects = NFStore.visibleProjects();
    const services = NFStore.visibleServices();

    const rows = exps
      .slice()
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .map((d) => {
        const p = projects.find((x) => x.id === d.projectId);
        const srv = services.find((x) => x.id === d.serviceId);
        return `
          <tr>
            <td>${escapeHtml(d.dateBuy || "—")}</td>
            <td><span class="mono">${escapeHtml(p?.code || "—")}</span><div class="hint">${escapeHtml(p?.name || "")}</div></td>
            <td>${escapeHtml(srv?.name || "—")}</td>
            <td>${escapeHtml(d.complement || "—")}</td>
            <td class="right">${fmtBRL(d.value)}</td>
            <td>${chipStatus(d.status)}</td>
          </tr>
        `;
      })
      .join("");

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">OS (Despesas)</h3>
          ${monthControlsHtml(month)}
        </div>
        <div class="hint">Mostrando OS do mês selecionado. (Aprovação/edição avançada você pode plugar depois.)</div>
        <div class="hr"></div>

        ${
          exps.length
            ? `
            <table class="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Projeto</th>
                  <th>Serviço</th>
                  <th>Complemento</th>
                  <th class="right">Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          `
            : `<div class="empty">Sem despesas neste mês (ou sem permissão).</div>`
        }
      </div>
    `;

    bindMonthControls((delta) => {
      const DB2 = NFStore.DB();
      if (delta === "now") DB2.ui.month = NFStore.monthKeyFromDate(new Date());
      else DB2.ui.month = NFStore.monthShift(DB2.ui.month, delta);
      NFStore.saveDB();
      global.NFApp?.rerender?.();
    });
  }

  global.NFUI = { 
    toast, 
    openDrawer, 
    closeDrawer, 
    escapeHtml, 
    fmtBRL, 
    chipStatus, 
    chipProjectStatus, 
    monthControlsHtml, 
    bindMonthControls 
  };

  // Exponho as views para o app.js chamar
  global.NFViews = {
    dashboard: renderDashboard,
    expenses: renderExpenses,
  };

})(window);
