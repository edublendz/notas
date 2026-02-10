// views/dashboard.js
// Dashboard - Conectado à API
(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;

  // Aliases
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  
  const DB = () => NFStore.DB();
  const saveDB = NFStore.saveDB;
  const isMaster = NFStore.isMaster;
  const isOper = NFStore.isOper;
  const ST = NFStore.ST;
  
  const escapeHtml = NFUI.escapeHtml;
  const fmtBRL = NFUI.fmtBRL;
  const monthControlsHtml = NFUI.monthControlsHtml;
  const bindMonthControls = NFUI.bindMonthControls;
  
  const monthKeyFromDate = NFStore.monthKeyFromDate;
  const monthShift = NFStore.monthShift;
  const setTitle = global.setTitle || (()=>{});

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://api.notas.blendz.com.br';

  // ========= View: Dashboard =========
  function viewDashboard(){
    // Operador não tem dashboard -> redireciona para OS
    if(isOper()) {
      return global.viewExpenses?.() || (()=>{});
    }

    setTitle("Dashboard", "Visão gerencial do mês");
    const month = DB().ui.month;
    
    const qClient = DB().ui.dashClientId || "";
    const qProjStatus = DB().ui.dashProjStatus || "";
    const projStatusOptions = ["", "A iniciar", "Em andamento", "Liberado para Faturamento", "Faturado"];

    const content = $("#content");
    if (!content) return;

    // Layout inicial com loading
    content.innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Resumo do mês</h3>
          ${monthControlsHtml(month)}
        </div>
        <div class="spacer"></div>
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Carregando dashboard...</div>
        </div>
      </div>
    `;

    bindMonthControls((delta) => {
      const db = DB();
      if (delta === "now") db.ui.month = monthKeyFromDate(new Date());
      else db.ui.month = monthShift(db.ui.month, delta);
      saveDB();
      window.NFApp?.rerender?.();
    });

    (async () => {
      try{
        // Buscar todos os dados em paralelo
        const [projResp, expResp, rbResp, invResp, clientsResp] = await Promise.all([
          NFStore.apiFetch(`${API_BASE}/api/projects?limit=200`),
          NFStore.apiFetch(`${API_BASE}/api/expenses?limit=200`),
          NFStore.apiFetch(`${API_BASE}/api/reimbursements?limit=200`),
          NFStore.apiFetch(`${API_BASE}/api/invoices?limit=200`),
          NFStore.apiFetch(`${API_BASE}/api/clients?limit=200`)
        ]);

        const projPayload = projResp.ok ? await projResp.json() : null;
        const expPayload = expResp.ok ? await expResp.json() : null;
        const rbPayload = rbResp.ok ? await rbResp.json() : null;
        const invPayload = invResp.ok ? await invResp.json() : null;
        const clientsPayload = clientsResp.ok ? await clientsResp.json() : null;

        const projects = Array.isArray(projPayload?.data) ? projPayload.data : [];
        const allExpenses = Array.isArray(expPayload?.data) ? expPayload.data : [];
        const allReimbursements = Array.isArray(rbPayload?.data) ? rbPayload.data : [];
        const allInvoices = Array.isArray(invPayload?.data) ? invPayload.data : [];
        const clients = Array.isArray(clientsPayload?.data) ? clientsPayload.data : [];

        // Filtrar por mês
        const expenses = allExpenses.filter(d => {
          const dateBuy = d.date_buy || d.dateBuy || "";
          return dateBuy.substring(0, 7) === month;
        });

        const reimbursements = allReimbursements.filter(r => {
          const dateBuy = r.date_buy || r.dateBuy || "";
          return dateBuy.substring(0, 7) === month;
        });

        const invoices = allInvoices.filter(nf => {
          const monthIssue = nf.month_issue || nf.monthIssue || "";
          return monthIssue === month;
        });

        // Calcular KPIs
        const invTotal = invoices.reduce((s,nf)=>s+Number(nf.total||0),0);
        const expTotal = expenses.reduce((s,d)=>s+Number(d.value||0),0);
        const rbTotal  = reimbursements.reduce((s,r)=>s+Number(r.value||0),0);

        // Calcular custo real por projeto no mês
        const projectCosts = {};
        projects.forEach(p => {
          projectCosts[p.id] = {
            nfCost: 0,
            expCost: 0,
            rbCost: 0,
            total: 0
          };
        });

        // Agregar custos de despesas
        expenses.forEach(d => {
          const projId = d.project?.id || d.project_id;
          if(!projId || !projectCosts[projId]) return;
          projectCosts[projId].expCost += Number(d.value || 0);
          projectCosts[projId].total += Number(d.value || 0);
        });

        // Agregar custos de reembolsos
        reimbursements.forEach(r => {
          const projId = r.project?.id || r.project_id;
          if(!projId || !projectCosts[projId]) return;
          projectCosts[projId].rbCost += Number(r.value || 0);
          projectCosts[projId].total += Number(r.value || 0);
        });

        // Agregar custos de notas
        invoices.forEach(nf => {
          // NF pode ter múltiplos projetos via items
          const items = nf.items || [];
          items.forEach(item => {
            const projId = item.project?.id || item.project_id;
            if(!projId || !projectCosts[projId]) return;
            projectCosts[projId].nfCost += Number(item.value || 0);
            projectCosts[projId].total += Number(item.value || 0);
          });
        });

        // Filtrar projetos
        let filteredProjects = projects;
        if(qClient){
          filteredProjects = filteredProjects.filter(p => String(p.client?.id || p.client_id) === String(qClient));
        }
        if(qProjStatus){
          filteredProjects = filteredProjects.filter(p => (p.status || "A iniciar") === qProjStatus);
        }

        // Buscar settings para sinaleiro
        const limitPct = Number(NFStore.getSession()?.tenant?.settings?.indicatorPct ?? 100) / 100;

        // Projetos estourados
        const overbudget = projects.filter(p => {
          const planned = Number(p.cost_planned || p.costPlanned || 0);
          const real = projectCosts[p.id]?.total || 0;
          return planned > 0 && real > planned;
        }).map(p => ({
          project: p,
          planned: Number(p.cost_planned || p.costPlanned || 0),
          real: projectCosts[p.id]?.total || 0,
          diff: (projectCosts[p.id]?.total || 0) - Number(p.cost_planned || p.costPlanned || 0)
        }));

        // Renderizar
        const kpiHtml = `
          <div class="kpi">
            <div class="box"><div class="t">NF (mês)</div><div class="v">${fmtBRL(invTotal)}</div></div>
            <div class="box"><div class="t">OSs (mês)</div><div class="v">${fmtBRL(expTotal)}</div></div>
            <div class="box"><div class="t">Reembolsos (mês)</div><div class="v">${fmtBRL(rbTotal)}</div></div>
            <div class="box"><div class="t">Projetos estourados</div><div class="v">${overbudget.length}</div></div>
          </div>
        `;

        const projRows = filteredProjects.map(p=>{
          const client = clients.find(c=>String(c.id)===String(p.client?.id || p.client_id));
          const costs = projectCosts[p.id] || { nfCost:0, expCost:0, rbCost:0, total:0 };
          const otherCost = costs.expCost + costs.rbCost;
          
          const planned = Number(p.cost_planned || p.costPlanned || 0);
          const realCost = costs.total;
          
          let sigCls = "gray";
          let sigTxt = "—";
          let deltaPct = 0;

          if(planned > 0){
            deltaPct = (realCost - planned) / planned;
            
            if(realCost <= planned){
              sigCls = "ok";
              sigTxt = "Verde";
            } else if(deltaPct <= limitPct){
              sigCls = "warn";
              sigTxt = "Amarelo";
            } else {
              sigCls = "bad";
              sigTxt = "Vermelho";
            }
          }

          const sigChip = `<span class="chip ${sigCls}">${sigTxt} • ${deltaPct >= 0 ? "+" : ""}${(deltaPct*100).toFixed(1)}%</span>`;

          return `
            <tr>
              <td><span class="mono">${escapeHtml(p.code||"—")}</span><div class="hint">${escapeHtml(p.name||"")}</div></td>
              <td>${escapeHtml(client?.name||"—")}<div class="hint"><span class="mono">${escapeHtml(client?.code||"")}</span></div></td>
              <td class="right">${fmtBRL(p.value_total || p.valueTotal)}</td>
              <td class="right">${fmtBRL(planned)}</td>
              <td class="right">${fmtBRL(costs.nfCost)}<div class="hint">Notas</div></td>
              <td class="right">${fmtBRL(otherCost)}<div class="hint">Outras</div></td>
              <td class="right">${fmtBRL(realCost)}</td>
              <td>${sigChip}</td>
              <td class="right"><button class="btn small" data-open="project" data-id="${p.id}">Abrir</button></td>
            </tr>
          `;
        }).join("");

        content.innerHTML = `
          <div class="card">
            <div class="row" style="justify-content:space-between">
              <h3 style="margin:0">Resumo do mês</h3>
              ${monthControlsHtml(month)}
            </div>
            <div class="spacer"></div>
            ${kpiHtml}
            <div class="hr"></div>

            <div class="row">
              <div class="field" style="min-width:240px">
                <label>Cliente</label>
                <select id="dashClient">
                  <option value="">Todos</option>
                  ${clients.map(c=>`<option value="${c.id}" ${String(qClient)===String(c.id)?'selected':''}>${escapeHtml(c.code)} • ${escapeHtml(c.name)}</option>`).join("")}
                </select>
              </div>
              <div class="field" style="min-width:260px">
                <label>Status do projeto</label>
                <select id="dashProjStatus">
                  ${projStatusOptions.map(s=>`<option value="${escapeHtml(s)}" ${qProjStatus===s?'selected':''}>${escapeHtml(s || "Todos")}</option>`).join("")}
                </select>
              </div>
              <div class="field" style="align-self:flex-end">
                <button class="btn" id="dashClear">Limpar filtros</button>
              </div>
            </div>

            <div class="hr"></div>
            <h3>Projetos</h3>
            ${filteredProjects.length ? `
              <table class="table">
                <thead>
                  <tr>
                    <th>Projeto</th><th>Cliente</th>
                    <th class="right">Faturamento</th><th class="right">Custo previsto</th>
                    <th class="right">Custo NF</th><th class="right">Outras despesas</th>
                    <th class="right">Custo real</th>
                    <th>Sinaleiro</th>
                    <th class="right">Ações</th>
                  </tr>
                </thead>
                <tbody>${projRows}</tbody>
              </table>
            ` : `<div class="empty">Nenhum projeto.</div>`}
          </div>
          
          <div class="spacer"></div>
          <div class="card sticky">
            <h3>Projetos estourados</h3>
            <div class="hint">Custo real maior que custo previsto (no mês selecionado).</div>
            <div class="hr"></div>
            ${overbudget.length ? `
              <div class="row" style="flex-direction:column;align-items:stretch;gap:8px">
                ${overbudget.map(x=>`
                  <div class="card" style="padding:10px;background:var(--panel2)">
                    <div class="row" style="justify-content:space-between">
                      <div>
                        <div><strong>${escapeHtml(x.project.code)}</strong> • ${escapeHtml(x.project.name)}</div>
                        <div class="hint">${escapeHtml(clients.find(c=>String(c.id)===String(x.project.client?.id || x.project.client_id))?.name||"—")}</div>
                      </div>
                      <div class="right">
                        <div class="chip bad">+${fmtBRL(x.diff)}</div>
                        <div class="hint">Previsto ${fmtBRL(x.planned)}</div>
                      </div>
                    </div>
                    <div class="row" style="justify-content:flex-end;margin-top:8px">
                      <button class="btn small" data-open="project" data-id="${x.project.id}">Abrir</button>
                    </div>
                  </div>
                `).join("")}
              </div>
            ` : `<div class="empty">Nenhum projeto estourado neste mês.</div>`}
          </div>
        `;

        // Rebind controles
        bindMonthControls((delta) => {
          const db = DB();
          if (delta === "now") db.ui.month = monthKeyFromDate(new Date());
          else db.ui.month = monthShift(db.ui.month, delta);
          saveDB();
          window.NFApp?.rerender?.();
        });

        const apply = () => viewDashboard();

        if($("#dashClient")) $("#dashClient").onchange = (e)=>{ DB().ui.dashClientId = e.target.value; saveDB(); apply(); };
        if($("#dashProjStatus")) $("#dashProjStatus").onchange = (e)=>{ DB().ui.dashProjStatus = e.target.value; saveDB(); apply(); };
        if($("#dashClear")) $("#dashClear").onclick = ()=>{
          DB().ui.dashClientId = "";
          DB().ui.dashProjStatus = "";
          saveDB();
          apply();
        };

      }catch(e){
        console.error(e);
        content.innerHTML = `<div class="card"><div class="hint">Erro ao carregar dashboard: ${escapeHtml(e?.message||"")}</div></div>`;
      }
    })();
  }

  // Exporta para uso global
  global.NFViewsDashboard = {
    viewDashboard
  };

})(window);
