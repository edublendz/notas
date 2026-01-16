// views.js
// Camada de Views/Telas (extraída do app_old.js e adaptada para o split):
// - Depende de: NFStore (store.js) e NFUI (ui.js)
// - Exponibiliza: window.NFViews = { dashboard, sales, clients, projects, expenses, reimbursements, invoices, users, settings, audit }
//
// Observação: formulários avançados (openProjectForm/openInvoiceForm etc.) aqui estão como placeholders
// para não quebrar. Você pode substituir pelo seu código original de forms quando quiser.

(function (global) {
  "use strict";

  if (!global.NFStore) throw new Error("NFStore não encontrado. Verifique store.js antes de views.js");
  if (!global.NFUI) throw new Error("NFUI não encontrado. Verifique ui.js antes de views.js");

  const { NFStore, NFUI } = global;

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  // ========= Aliases (compatibilidade com app_old) =========
  const DB = () => NFStore.DB();
  const saveDB = NFStore.saveDB;

  const isMaster = NFStore.isMaster;
  const isOper = NFStore.isOper;

  const visibleClients = NFStore.visibleClients;
  const visibleProjects = NFStore.visibleProjects;
  const visibleSales = NFStore.visibleSales;
  const visibleServices = NFStore.visibleServices;
  const visibleExpenses = NFStore.visibleExpenses;
  const visibleReimbursements = NFStore.visibleReimbursements;
  const visibleInvoices = NFStore.visibleInvoices;

  const tenantIndicatorPct = NFStore.tenantIndicatorPct;
  const requireProjectLink = NFStore.requireProjectLink;

  const indicatorForProject = NFStore.indicatorForProject;
  const plannedIndicator = NFStore.plannedIndicator;
  const projectCostsReal = NFStore.projectCostsReal;
  const projectOverruns = NFStore.projectOverruns;

  const monthKeyFromDate = NFStore.monthKeyFromDate;
  const monthShift = NFStore.monthShift;

  const ROLE = NFStore.ROLE;
  const ST = NFStore.ST;

  const openDrawer = NFUI.openDrawer;
  const closeDrawer = NFUI.closeDrawer;
  const toast = NFUI.toast;

  const rerender = () => global.NFApp?.rerender?.();

  // ========= Helpers UI =========
  const fmtBRL = (v) =>
    (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const fmtDT = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-BR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
    } catch {
      return String(iso);
    }
  };

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

  // Month controls render/bind (botões criados dentro da própria view)
  function monthControlsHtml() {
    const month = DB().ui.month;
    return `
      <div class="row">
        <button class="btn small" id="m_prev">←</button>
        <span class="chip gray">Mês: <strong>${escapeHtml(month)}</strong></span>
        <button class="btn small" id="m_next">→</button>
        <button class="btn small" id="m_now">Hoje</button>
      </div>
    `;
  }

  function bindMonthControls(){
  // pega todos (evita problema de ID duplicado)
  const prevs = $$("[id='m_prev']");
  const nexts = $$("[id='m_next']");
  const nows  = $$("[id='m_now']");

  const refresh = ()=>{
    // ✅ redesenha a tela atual (mais seguro que só rerender)
    if (typeof viewRouter === "function") {
      viewRouter(DB().ui.view || "dashboard");
    } else if (typeof rerender === "function") {
      rerender();
    }
  };

  const setMonth = (ym)=>{
    DB().ui.month = ym;
    saveDB();
    refresh(); // ✅ atualiza em tempo real
  };

  prevs.forEach(btn=>{
    btn.onclick = ()=> setMonth(monthShift(DB().ui.month, -1));
  });

  nexts.forEach(btn=>{
    btn.onclick = ()=> setMonth(monthShift(DB().ui.month, +1));
  });

  nows.forEach(btn=>{
    btn.onclick = ()=> setMonth(monthKeyFromDate(new Date()));
  });
}

function refreshView(){
  const v = DB().ui.view || CURRENT_VIEW || "dashboard";
  if (typeof viewRouter === "function") return viewRouter(v);
  return rerender();
}


  // Header title helper (usa ids existentes no index.html)
  function setTitle(title, sub) {
    const t = $("#pageTitle");
    const s = $("#pageSub");
    const m = $("#monthChip");
    if (t) t.textContent = title || "";
    if (s) s.textContent = sub || "";
    if (m) m.textContent = `Mês: ${DB().ui.month}`;
  }

  // ========= Lookups =========
  function getClient(id) { return DB().clients.find(x => x.id === id); }
  function getProject(id) { return DB().projects.find(x => x.id === id); }
  function getUser(id) { return DB().users.find(x => x.id === id); }

  // ========= Placeholders de forms (para não quebrar) =========
  function openServiceForm(){
  const list = visibleServices();
  openDrawer("Cadastro de serviços", `
    <div class="card">
      <h3>Serviços</h3>
      <div class="hint">Usado no combo de OS.</div>
      <div class="hr"></div>
      <div class="row">
        
        ${isMaster() ? '<input id="srvName" placeholder="Nome do serviço" /><button class="btn primary" id="srvAdd">Adicionar</button>' : ''}
      </div>
      <div class="hr"></div>
      ${list.length ? `
        <table class="table">
          <thead><tr><th>Serviço</th><th class="right">Ações</th></tr></thead>
          <tbody>
            ${list.map(s=>`
              <tr>
                <td>${escapeHtml(s.name)}</td>
                <td class="right"><button class="btn small danger" data-del="${s.id}">Remover</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `<div class="empty">Nenhum serviço.</div>`}
    </div>
  `);

  setTimeout(()=>{
    $("#srvAdd").onclick = ()=>{
      const name = ($("#srvName").value||"").trim();
      if(!name) return toast("Informe o nome.");
      DB().services.push({
        id: NFStore.uid("srv"),
        tenantId: DB().session.tenantId,
        name
      });
      saveDB(); NFStore.audit("SERVICE_CREATE", name);
      toast("Serviço adicionado.");
      closeDrawer(); rerender();
    };

    $$("[data-del]").forEach(b=>b.onclick = ()=>{
      const id = b.dataset.del;
      DB().services = DB().services.filter(s=>s.id!==id);
      saveDB(); NFStore.audit("SERVICE_DELETE", id);
      toast("Serviço removido.");
      closeDrawer(); rerender();
    });
  },0);
}
  function openSaleForm(saleId=null){
  if(!isMaster()) return toast("Apenas Master.");
  const edit = saleId ? DB().sales.find(s=>s.id===saleId) : null;
  const clients = visibleClients();

  openDrawer(edit ? `Venda • ${escapeHtml(edit.title)}` : "Nova Venda", `
    <div class="card">
      <h3>${edit ? "Editar venda" : "Criar venda"}</h3>
      <div class="hr"></div>

      <div class="split">
        <div class="field">
          <label>Título</label>
          <input id="saleTitle" value="${escapeHtml(edit?.title||"")}" placeholder="Ex: Venda – Fee mensal" />
        </div>
        <div class="field">
          <label>Tipo</label>
          <input id="saleType" value="${escapeHtml(edit?.type||"Projeto")}" placeholder="Ex: Projeto / Fee mensal" />
        </div>
      </div>

      <div class="field">
        <label>Cliente</label>
        <select id="saleClient">
          ${clients.map(c=>`<option value="${c.id}" ${(edit?.clientId===c.id)?"selected":""}>${escapeHtml(c.code)} • ${escapeHtml(c.name)}</option>`).join("")}
        </select>
      </div>

      <div class="split">
        <div class="field">
          <label>Faturamento previsto</label>
          <input id="saleValue" type="number" step="0.01" value="${Number(edit?.valueTotal||0)}" />
        </div>
        <div class="field">
          <label>Custo previsto</label>
          <input id="saleCost" type="number" step="0.01" value="${Number(edit?.plannedCost||0)}" />
        </div>
      </div>

      <div class="row">
        <button class="btn primary" id="saleSave">${edit ? "Salvar" : "Criar"}</button>
        ${edit ? `<button class="btn danger" id="saleDel">Excluir</button>` : ``}
        <span style="flex:1"></span>
        <button class="btn" id="saleClose">Fechar</button>
      </div>
    </div>
  `);

  setTimeout(()=>{
    $("#saleClose").onclick = ()=>closeDrawer();

    $("#saleSave").onclick = ()=>{
      const title = ($("#saleTitle").value||"").trim();
      const type = ($("#saleType").value||"").trim();
      const clientId = $("#saleClient").value;
      const valueTotal = Number($("#saleValue").value||0);
      const plannedCost = Number($("#saleCost").value||0);
      if(!title || !clientId) return toast("Preencha título e cliente.");

      const { user } = NFStore.getSession();

      if(edit){
        Object.assign(edit, { title, type, clientId, valueTotal, plannedCost });
        saveDB(); NFStore.audit("SALE_UPDATE", edit.id);
        toast("Venda atualizada.");
      }else{
        DB().sales.push({
          id: NFStore.uid("sale"),
          tenantId: DB().session.tenantId,
          clientId, type, title, valueTotal, plannedCost,
          createdBy: user.id,
          createdAt: new Date().toISOString()
        });
        saveDB(); NFStore.audit("SALE_CREATE", title);
        toast("Venda criada.");
      }
      closeDrawer(); rerender();
    };

    if(edit){
      $("#saleDel").onclick = ()=>{
        DB().sales = DB().sales.filter(s=>s.id!==edit.id);
        saveDB(); NFStore.audit("SALE_DELETE", edit.id);
        toast("Venda excluída.");
        closeDrawer(); rerender();
      };
    }
  },0);
}

function openClientForm(client = null) {

  const edit = !!client;

  const c = client || {
    id: null,
    tenantId: DB().session.tenantId,
    code: "",
    name: "",
    doc: ""
  };

  openDrawer(
    edit ? `Editar Cliente • ${escapeHtml(c.code)}` : "Novo Cliente",
    `
    <div class="card">
      <h3>${edit ? "Editar Cliente" : "Criar Cliente"}</h3>

      <div class="field">
        <label>Código</label>
        <input id="clCode" value="${escapeHtml(c.code)}" placeholder="CLI-0001">
      </div>

      <div class="field">
        <label>Nome</label>
        <input id="clName" value="${escapeHtml(c.name)}" placeholder="Nome do cliente">
      </div>

      <div class="field">
        <label>Documento</label>
        <input id="clDoc" value="${escapeHtml(c.doc || "")}" placeholder="CNPJ / CPF">
      </div>

      <div class="row">
        <span style="flex:1"></span>
        <button class="btn primary" id="clSave">
          ${edit ? "Salvar" : "Criar"}
        </button>
        <button class="btn" id="clCancel">Cancelar</button>
      </div>
    </div>
    `
  );

  setTimeout(() => {

    $("#clCancel").onclick = closeDrawer;

    $("#clSave").onclick = () => {

      const code = ($("#clCode").value || "").trim();
      const name = ($("#clName").value || "").trim();
      const doc  = ($("#clDoc").value || "").trim();

      if (!code || !name) {
        return toast("Código e Nome são obrigatórios.");
      }

      if (edit) {
        // ✏️ EDITAR
        c.code = code;
        c.name = name;
        c.doc  = doc;

        NFStore.audit("CLIENT_UPDATE", c.id);
        toast("Cliente atualizado.");
      } else {
        // ➕ CRIAR
        const newClient = {
          id: NFStore.uid("cli"),
          tenantId: DB().session.tenantId,
          code,
          name,
          doc,
          createdAt: new Date().toISOString()
        };

        DB().clients.push(newClient);
        NFStore.audit("CLIENT_CREATE", newClient.id);
        toast("Cliente criado.");
      }

      saveDB();
      closeDrawer();
      refreshView(); // ou rerender()
    };

  }, 0);
}



  function openProjectForm(projectId=null){
    if(!isMaster()) return toast("Apenas Master.");
    const edit = projectId ? DB().projects.find(p=>p.id===projectId) : null;
    const clients = visibleClients();
    openDrawer(edit ? `Projeto • ${escapeHtml(edit.code)}` : "Novo Projeto", `
      <div class="card">
        <h3>${edit ? "Editar projeto" : "Criar projeto"}</h3>
        <div class="hr"></div>
        <div class="split">
          <div class="field">
            <label>Cliente</label>
            <select id="prjClient">
              ${clients.map(c=>`<option value="${c.id}" ${(edit?.clientId===c.id)?"selected":""}>${escapeHtml(c.code)} • ${escapeHtml(c.name)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Nome</label>
            <input id="prjName" value="${escapeHtml(edit?.name||"")}" placeholder="Nome do projeto"/>
          </div>
        </div>
        
        <div class="split">
          <div class="field">
            <label>Custo previsto (NF)</label>
            <input id="prjCostNF" type="number" step="0.01" value="${Number(edit?.costPlannedNF ?? 0)}" />
          </div>

          <div class="field">
            <label>Custo previsto (Outras despesas)</label>
            <input id="prjCostOther" type="number" step="0.01" value="${Number(edit?.costPlannedOther ?? 0)}" />
          </div>
        </div>
              <div class="split">
          <div class="field">
            <label>Faturamento previsto</label>
            <input id="prjValue" type="number" step="0.01" value="${Number(edit?.valueTotal||0)}"/>
          </div>
          <div class="field">
            <label>Custo previsto (Total)</label>
            <input readonly id="prjCostPlanned" type="number" step="0.01"
                   value="${Number(edit?.costPlanned ?? 0)}" readonly />
            <div class="hint">Total calculado automaticamente: NF + Outras</div>
          </div>
        </div>
        <div class="split">
          <div class="field">
            <label>Indicador override (opcional)</label>
            <input id="prjOverride" type="number" step="0.01" value="${edit?.indicatorOverridePct ?? ""}" placeholder="Ex: 0.40"/>
            <div class="hint">Se vazio, usa o indicador do tenant.</div>
          </div>
          <div class="field">
            <label>Indicador ideal (auto)</label>
            <input disabled value="${Math.round(plannedIndicator(edit||{valueTotal:0,costPlanned:0})*100)}% (custo previsto / faturamento previsto)"/>
          </div>
        </div>
        <div class="row">
          <span class="hint">ID do projeto: <span class="mono">${escapeHtml(edit?.code || "gerado ao salvar")}</span></span>
          <span style="flex:1"></span>
          <button class="btn primary" id="prjSave">Salvar</button>
        </div>
      </div>
    `);
    setTimeout(()=>{
      $("#prjSave").onclick = ()=>{
        const clientId = $("#prjClient").value;
        const name = ($("#prjName").value||"").trim();
        const valueTotal = Number($("#prjValue").value||0);
        const costPlannedNF = Number($("#prjCostNF").value || 0);
        const costPlannedOther = Number($("#prjCostOther").value || 0);
        const costPlanned = costPlannedNF + costPlannedOther;
        const ovRaw = ($("#prjOverride").value||"").trim();
        const indicatorOverridePct = ovRaw==="" ? null : Number(ovRaw);
        if(!clientId || !name) return toast("Informe cliente e nome.");
        if(!valueTotal) return toast("Informe faturamento previsto.");
        if(edit){
          edit.clientId = clientId;
          edit.name = name;
          edit.valueTotal = valueTotal;
          edit.costPlannedNF = costPlannedNF;
          edit.costPlannedOther = costPlannedOther;
          edit.costPlanned = costPlanned; // mantém compatibilidade
          edit.indicatorOverridePct = indicatorOverridePct;
          saveDB(); NFStore.audit("PROJECT_UPDATE", edit.id); toast("Projeto atualizado.");
        } else {
          // generate sequential-ish code per tenant
          const tenantKey = DB().tenants.find(t=>t.id===DB().session.tenantId)?.key?.toUpperCase() || "PRJ";
          const n = DB().projects.filter(p=>p.tenantId===DB().session.tenantId).length + 1;
          const code = `${tenantKey}-PRJ-${String(1000+n).slice(-4)}`;
          DB().projects.unshift({
            id: NFStore.uid("prj"), code,
            tenantId: DB().session.tenantId,
            clientId, name,
            ownerUserId: NFStore.getSession().user.id,
            valueTotal: valueTotal,
            costPlannedNF : costPlannedNF,
            costPlannedOther : costPlannedOther,
            costPlanned : costPlanned,
            indicatorOverridePct,
            status:"Criado",
            createdAt: new Date().toISOString()
          });
          saveDB(); NFStore.audit("PROJECT_CREATE", code); toast("Projeto criado.");
        }

        closeDrawer(); 
        viewRouter("projects");

      };
      const calcPlanned = ()=>{
      const nf = Number($("#prjCostNF").value || 0);
      const other = Number($("#prjCostOther").value || 0);
      $("#prjCostPlanned").value = (nf + other).toFixed(2);
    };

    $("#prjCostNF").oninput = calcPlanned;
    $("#prjCostOther").oninput = calcPlanned;

    // já calcula na abertura também
    calcPlanned();

    },0);
  }
function openExpenseForm(expenseId=null){
  const edit = expenseId ? DB().expenses.find(d=>d.id===expenseId) : null;
  const canEdit = edit ? (isMaster() || (isOper() && edit.createdBy===NFStore.getSession().user.id)) : true;
  const editable = edit ? (edit.status===ST.OS_ENVIADA) : true; // regra
  const projects = visibleProjects();
  const services = visibleServices();

  openDrawer(edit ? `OS • ${escapeHtml(edit.id.slice(-6))}` : "Nova OS", `
    <div class="card">
      <h3>${edit ? "Editar despesa" : "Criar despesa"}</h3>
      <div class="hint">OS tem serviço + descrição complementar.</div>
      <div class="hr"></div>

      <div class="field">
        <label>Projeto</label>
        <select id="dpProject" ${!canEdit||!editable?"disabled":""}>
          ${projects.map(p=>`<option value="${p.id}" ${(edit?.projectId===p.id)?"selected":""}>${escapeHtml(p.code)} • ${escapeHtml(p.name)}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>Serviço</label>
        <select id="dpService" ${!canEdit||!editable?"disabled":""}>
          ${services.map(s=>`<option value="${s.id}" ${(edit?.serviceId===s.id)?"selected":""}>${escapeHtml(s.name)}</option>`).join("")}
        </select>
      </div>

      <div class="split">
        <div class="field">
          <label>Data da compra</label>
          <input id="dpDate" type="date" value="${escapeHtml(edit?.dateBuy||"")}" ${!canEdit||!editable?"disabled":""}/>
        </div>
        <div class="field">
          <label>Valor</label>
          <input id="dpValue" type="number" step="0.01" value="${Number(edit?.value||0)}" ${!canEdit||!editable?"disabled":""}/>
        </div>
      </div>

      <div class="field">
        <label>Descrição complementar</label>
        <input id="dpComp" value="${escapeHtml(edit?.complement||"")}" placeholder="Ex: Uber aeroporto" ${!canEdit||!editable?"disabled":""}/>
      </div>

      <div class="row">
        ${edit ? `<span class="chip gray">${escapeHtml(edit.status||"")}</span>` : ``}
        <span style="flex:1"></span>
        ${canEdit && editable ? `<button class="btn primary" id="dpSave">${edit?"Salvar":"Criar"}</button>` : ``}
        <button class="btn" id="dpClose">Fechar</button>
      </div>

      ${edit && isMaster() && !edit.nfId ? `
        <div class="hr"></div>
        <div class="row">
          <button class="btn" id="dpApprove">Aprovar</button>
          <button class="btn danger" id="dpReject">Reprovar</button>
        </div>
      `:``}
    </div>
  `);

  setTimeout(()=>{
    $("#dpClose").onclick = ()=>closeDrawer();

    if(canEdit && editable){
      $("#dpSave").onclick = ()=>{
        const projectId = $("#dpProject").value;
        const serviceId = $("#dpService").value;
        const dateBuy = ($("#dpDate").value||"").trim();
        const value = Number($("#dpValue").value||0);
        const complement = ($("#dpComp").value||"").trim();

        if(!projectId || !serviceId || !dateBuy || !value) return toast("Preencha projeto, serviço, data e valor.");

        const { user } = NFStore.getSession();

        if(edit){
          Object.assign(edit, { projectId, serviceId, dateBuy, value, complement });
          saveDB(); NFStore.audit("EXPENSE_UPDATE", edit.id);
          toast("Despesa atualizada.");
        }else{
          DB().expenses.push({
            id: NFStore.uid("dp"),
            tenantId: DB().session.tenantId,
            projectId, serviceId,
            desc:"",
            complement,
            value,
            dateBuy,
            status: ST.OS_ENVIADA,
            nfId: null,
            createdBy: user.id,
            createdAt: new Date().toISOString()
          });
          saveDB(); NFStore.audit("EXPENSE_CREATE", projectId);
          toast("Despesa criada.");

        }

        closeDrawer(); rerender();
        viewExpenses();
      };
    }

    if(edit && isMaster() && !edit.nfId){
      $("#dpApprove").onclick = ()=>{
        edit.status = ST.OS_APROVADA;
        saveDB(); NFStore.audit("EXPENSE_APPROVE", edit.id);
        toast("Aprovada.");
        closeDrawer(); rerender();
      };
      $("#dpReject").onclick = ()=>{
        edit.status = ST.OS_REPROVADA;
        saveDB(); NFStore.audit("EXPENSE_REJECT", edit.id);
        toast("Reprovada.");
        closeDrawer(); rerender();
      };
    }
  },0);
}

function openReimbForm(reimbId=null){
  const edit = reimbId ? DB().reimbursements.find(r=>r.id===reimbId) : null;
  const canEdit = edit ? (isMaster() || (isOper() && edit.createdBy===NFStore.getSession().user.id)) : true;
  const editable = edit ? (edit.status===ST.RB_SOLICITADO) : true;

  const projects = visibleProjects();
  const types = ["Transporte","Alimentação","Hospedagem","Software","Outros"];

  openDrawer(edit ? `Reembolso • ${escapeHtml(edit.id.slice(-6))}` : "Novo Reembolso", `
    <div class="card">
      <h3>${edit ? "Editar reembolso" : "Criar reembolso"}</h3>
      <div class="hint">Reembolso tem tipo + data da compra.</div>
      <div class="hr"></div>

      <div class="field">
        <label>Projeto</label>
        <select id="rbProject" ${!canEdit||!editable?"disabled":""}>
          ${projects.map(p=>`<option value="${p.id}" ${(edit?.projectId===p.id)?"selected":""}>${escapeHtml(p.code)} • ${escapeHtml(p.name)}</option>`).join("")}
        </select>
      </div>

      <div class="split">
        <div class="field">
          <label>Tipo</label>
          <select id="rbType" ${!canEdit||!editable?"disabled":""}>
            ${types.map(t=>`<option value="${escapeHtml(t)}" ${(edit?.type===t)?"selected":""}>${escapeHtml(t)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>Data da compra</label>
          <input id="rbDate" type="date" value="${escapeHtml(edit?.dateBuy||"")}" ${!canEdit||!editable?"disabled":""}/>
        </div>
      </div>

      <div class="split">
        <div class="field">
          <label>Valor</label>
          <input id="rbValue" type="number" step="0.01" value="${Number(edit?.value||0)}" ${!canEdit||!editable?"disabled":""}/>
        </div>
        <div class="field">
          <label>Complemento</label>
          <input id="rbComp" value="${escapeHtml(edit?.complement||"")}" ${!canEdit||!editable?"disabled":""}/>
        </div>
      </div>

      <div class="row">
        ${edit ? `<span class="chip gray">${escapeHtml(edit.status||"")}</span>` : ``}
        <span style="flex:1"></span>
        ${canEdit && editable ? `<button class="btn primary" id="rbSave">${edit?"Salvar":"Criar"}</button>` : ``}
        <button class="btn" id="rbClose">Fechar</button>
      </div>

      ${edit && isMaster() ? `
        <div class="hr"></div>
        <div class="row">
          <button class="btn" id="rbApprove">Aprovar</button>
          <button class="btn danger" id="rbReject">Reprovar</button>
        </div>
      `:``}
    </div>
  `);

  setTimeout(()=>{
    $("#rbClose").onclick = ()=>closeDrawer();

    if(canEdit && editable){
      $("#rbSave").onclick = ()=>{
        const projectId = $("#rbProject").value;
        const type = ($("#rbType").value||"").trim();
        const dateBuy = ($("#rbDate").value||"").trim();
        const value = Number($("#rbValue").value||0);
        const complement = ($("#rbComp").value||"").trim();
        if(!projectId || !type || !dateBuy || !value) return toast("Preencha projeto, tipo, data e valor.");

        const { user } = NFStore.getSession();

        if(edit){
          Object.assign(edit, { projectId, type, dateBuy, value, complement });
          saveDB(); NFStore.audit("REIMB_UPDATE", edit.id);
          toast("Reembolso atualizado.");
        }else{
          DB().reimbursements.push({
            id: NFStore.uid("rb"),
            tenantId: DB().session.tenantId,
            projectId,
            type,
            desc:"",
            complement,
            value,
            dateBuy,
            status: ST.RB_SOLICITADO,
            createdBy: user.id,
            createdAt: new Date().toISOString()
          });
          saveDB(); NFStore.audit("REIMB_CREATE", projectId);
          toast("Reembolso criado.");
        }

        closeDrawer(); viewRouter("reimbursements");
      };
    }

  if(edit && isMaster()){
  $("#rbApprove").onclick = ()=>{
    try{
      NFStore.reimbursements.approve(edit.id);
      toast("Reembolso aprovado.");
      closeDrawer();
      rerender();
    }catch(e){
      toast(e?.message || "Falha ao aprovar.");
    }
  };

  $("#rbReject").onclick = ()=>{
    try{
      NFStore.reimbursements.reject(edit.id);
      toast("Reembolso reprovado.");
      closeDrawer();
      rerender();
    }catch(e){
      toast(e?.message || "Falha ao reprovar.");
    }
  };
}

  },0);
}

function openInvoiceForm(invoiceId = null, fromExpenseIds = null, options = {}) {
  const edit = invoiceId
    ? DB().invoices.find(nf => nf.id === invoiceId)
    : null;

  const sess = NFStore.getSession();
  const user = sess?.user;

  const isM = isMaster();
  const isO = isOper();

  // Regra:
  // - Operador: só pode editar NF ENVIADA e criada por ele
  // - Master: pode editar sempre, inclusive APROVADA/REPROVADA
  const canEdit = edit
    ? (isM || (isO && edit.createdBy === user.id && edit.status === ST.NF_ENVIADA))
    : true;

  const editable = !!canEdit;

  const projects = visibleProjects();
  const tenantId = DB().session.tenantId;
  const monthDefault = DB().ui.month;

  // ---------- Helpers ----------
  const buildItemsFromExpenses = (expIds) => {
    const selected = DB().expenses.filter(d =>
      d.tenantId === tenantId &&
      expIds.includes(d.id)
    );

    const items = selected.map(d => {
      const srvName = DB().services.find(s => s.id === d.serviceId)?.name || "Serviço";
      return {
        id: NFStore.uid("it"),
        projectId: d.projectId,
        desc: `${srvName}${d.complement ? " • " + d.complement : ""}`,
        value: Number(d.value || 0),
        expId: d.id
      };
    });

    const total = items.reduce((sum, it) => sum + Number(it.value || 0), 0);
    return { items, total };
  };

  const inferExpenseIdsByNfId = (nfId) => {
    return DB().expenses
      .filter(d => d.tenantId === tenantId && d.nfId === nfId)
      .map(d => d.id);
  };

  // Pode selecionar:
  // - OS aprovadas sem NF vinculada
  // - + as que já estão nesta NF (mesmo se status mudou), para não sumirem no edit
  const getEligibleExpenses = (currentExpenseIds = []) => {
    return DB().expenses.filter(d => {
      if (d.tenantId !== tenantId) return false;

      const linkedToThis = currentExpenseIds.includes(d.id);

      // para adicionar novas: precisa estar aprovada e livre
      const isApproved = d.status === ST.OS_APROVADA;
      const free = !d.nfId;

      // no edit: sempre mostra as já vinculadas (mesmo que não estejam mais "aprovadas" hoje)
      if (linkedToThis) return true;

      // no novo / add: só aprovadas e sem NF
      return isApproved && free;
    });
  };

  // ---------- Estado inicial ----------
  // aceita ids por 2 canais:
  // - parâmetro fromExpenseIds (preferido)
  // - options.expenseIds (fallback)
  // - edit.expenseIds (se existir)
  let initialIds =
    (Array.isArray(fromExpenseIds) && fromExpenseIds.length) ? [...fromExpenseIds] :
    (Array.isArray(options.expenseIds) && options.expenseIds.length) ? [...options.expenseIds] :
    (edit?.expenseIds?.length ? [...edit.expenseIds] : []);

  // ✅ FIX EDIÇÃO: se NF antiga não salvou expenseIds, inferir por expenses.nfId
  if (edit && (!initialIds || !initialIds.length)) {
    initialIds = inferExpenseIdsByNfId(edit.id);
  }

  let expenseIds = [...(initialIds || [])];

  // Seu modelo: TOTAL sempre via OS (readonly)
  let items = [];
  let total = 0;

  if (expenseIds.length) {
    const built = buildItemsFromExpenses(expenseIds);
    items = built.items;
    total = built.total;
  } else {
    items = [];
    total = 0;
  }

  const title = edit
    ? `NF • ${escapeHtml(edit.file?.name || edit.id.slice(-6))}`
    : "Nova Nota Fiscal";

  // ---------- UI ----------
  openDrawer(title, `
    <div class="card">
      <h3>${edit ? "Editar Nota Fiscal" : "Criar Nota Fiscal"}</h3>
      <div class="hint">
        Selecione OS aprovadas (sem NF) para compor a NF. O TOTAL é sempre automático.
      </div>

      <div class="hr"></div>

      <div class="split">
        <div class="field">
          <label>Competência</label>
          <input id="nfComp"
            value="${escapeHtml(edit?.monthCompetency || monthDefault)}"
            placeholder="YYYY-MM"
            ${!editable ? "disabled" : ""}
          />
        </div>

        <div class="field">
          <label>Emissão</label>
          <input id="nfIssue"
            value="${escapeHtml(edit?.monthIssue || monthDefault)}"
            placeholder="YYYY-MM"
            ${!editable ? "disabled" : ""}
          />
        </div>
      </div>

      <div class="field">
        <label>Arquivo (nome)</label>
        <input id="nfFile"
          value="${escapeHtml(edit?.file?.name || "NF_mock.pdf")}"
          ${!editable ? "disabled" : ""}
        />
      </div>

      <div class="hr"></div>

      <h3>OS para vincular</h3>
      <div class="hint">
        Marque as OS para montar os itens da NF.
        ${edit ? " (As OS já vinculadas aparecem marcadas.)" : ""}
      </div>

      <div class="card" style="padding:10px;background:var(--panel2)">
        <div class="row" style="flex-direction:column;align-items:stretch;gap:8px" id="nfOsList">
          <!-- preenchido via bind -->
        </div>
      </div>

      <div class="hr"></div>

      

      <div class="split">
        <div class="field">
          <label>Total (automático)</label>
          <input id="nfTotal"
            type="number"
            step="0.01"
            value="${Number(total || 0)}"
            disabled
          />
        </div>

        <div class="field">
          <label>Status</label>
          <input id="nfStatus"
            value="${escapeHtml(edit?.status || ST.NF_ENVIADA)}"
            disabled
          />
        </div>
      </div>

      <div class="row">
        <span style="flex:1"></span>

        ${editable ? `
          <button class="btn primary" id="nfSave">${edit ? "Salvar" : "Criar"}</button>
        ` : ""}

        <button class="btn" id="nfClose">Fechar</button>
      </div>

      ${edit && isM ? `
        <div class="hr"></div>
        <div class="row">
          <button class="btn" id="nfApprove">Aprovar</button>
          <button class="btn danger" id="nfReject">Reprovar</button>
        </div>
      ` : ""}
    </div>
  `);

  // ---------- Binds ----------
  setTimeout(() => {
    $("#nfClose").onclick = () => closeDrawer();

    // Render lista de OS elegíveis (+ vinculadas)
    const eligible = getEligibleExpenses(expenseIds);
    const nfOsList = $("#nfOsList");

    if (!eligible.length) {
      nfOsList.innerHTML = `<div class="empty">Sem OS aprovadas disponíveis.</div>`;
    } else {
      nfOsList.innerHTML = eligible.map(d => {
        const p = getProject(d.projectId);
        const srv = DB().services.find(s => s.id === d.serviceId)?.name || "Serviço";

        const checked = expenseIds.includes(d.id);

        // ✅ regra de marcação:
        // - se já está vinculada a essa NF: sempre pode ficar marcada (mostra)
        // - para vincular nova: precisa estar OS_APROVADA e sem NF
        const isLinkedToThis = checked;
        const canToggleThis =
          editable &&
          (isLinkedToThis || (d.status === ST.OS_APROVADA && !d.nfId));

        const disabled = canToggleThis ? "" : "disabled";

        return `
          <label class="card" style="padding:10px;display:flex;gap:10px;align-items:flex-start">
            <input type="checkbox" data-exp="${d.id}" ${checked ? "checked" : ""} ${disabled}/>
            <div style="flex:1">
              <div><strong>${escapeHtml(srv)}</strong>${d.complement ? " • " + escapeHtml(d.complement) : ""}</div>
              <div class="hint">
                ${escapeHtml(p?.code || "—")} • ${escapeHtml(p?.name || "")} • ${escapeHtml(d.dateBuy || "")}
                ${d.nfId && d.nfId !== edit?.id ? ` • <span class="chip bad">Já vinculada</span>` : ""}
              </div>
            </div>
            <div class="right"><span class="chip gray">${fmtBRL(d.value || 0)}</span></div>
          </label>
        `;
      }).join("");
    }

    const refreshNFPreview = () => {
      const checks = $$("[data-exp]");

      // ✅ FIX: se não existe lista de checkboxes, não zera o estado na edição
      if (!checks.length) {
        $("#nfTotal").value = Number(total || 0);
        return;
      }

      const ids = checks.filter(x => x.checked).map(x => x.dataset.exp);
      expenseIds = [...ids];

      const built = buildItemsFromExpenses(expenseIds);
      items = built.items;
      total = built.total;

      $("#nfTotal").value = Number(total || 0);

      $("#nfItems").innerHTML = items.length ? `
        <table class="table">
          <thead>
            <tr><th>Projeto</th><th>Descrição</th><th class="right">Valor</th></tr>
          </thead>
          <tbody>
            ${items.map(it => {
              const p = projects.find(x => x.id === it.projectId);
              return `
                <tr>
                  <td><span class="mono">${escapeHtml(p?.code || "—")}</span></td>
                  <td>${escapeHtml(it.desc || "")}</td>
                  <td class="right">${fmtBRL(it.value || 0)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      ` : `<div class="empty">Nenhum item vinculado.</div>`;
    };

    // Bind checkboxes
    $$("[data-exp]").forEach(x => x.onchange = refreshNFPreview);

    // ✅ garante que ao abrir no EDIT, os itens reflitam as OS já vinculadas
    // (sem depender de "eligible" existir)
    if (edit) {
      // se por algum motivo ainda estiver vazio, tenta inferir de novo (robustez)
      if (!expenseIds.length) expenseIds = inferExpenseIdsByNfId(edit.id);

      const built = buildItemsFromExpenses(expenseIds);
      items = built.items;
      total = built.total;
      $("#nfTotal").value = Number(total || 0);

    }   

    // Save
    if (editable) {
      $("#nfSave").onclick = () => {
        const monthCompetency = ($("#nfComp").value || "").trim();
        const monthIssue = ($("#nfIssue").value || "").trim();
        const fileName = ($("#nfFile").value || "").trim() || "NF_mock.pdf";

        if (!monthCompetency || !monthIssue)
          return toast("Preencha competência e emissão.");

        if (!expenseIds.length)
          return toast("Selecione ao menos 1 OS aprovada para compor a NF.");

        // total SEMPRE automático
        const finalTotal = Number(total || 0);

        if (edit) {
          edit.monthCompetency = monthCompetency;
          edit.monthIssue = monthIssue;
          edit.file = { ...(edit.file || {}), name: fileName, note: "mock" };
          edit.total = finalTotal;
          edit.totalReadonly = true;

          // snapshot (opcional, mas útil pra audit/visual)
          edit.items = items.map(it => ({ id: it.id, projectId: it.projectId, desc: it.desc, value: it.value }));
          edit.expenseIds = [...expenseIds];

          // garante vínculo nas despesas:
          // - remove vínculo antigo desta NF se desmarcou
          // - adiciona vínculo novo
          DB().expenses.forEach(d => {
            if (d.tenantId !== tenantId) return;

            if (d.nfId === edit.id && !expenseIds.includes(d.id)) d.nfId = null;
            if (expenseIds.includes(d.id)) d.nfId = edit.id;
          });

          saveDB();
          NFStore.audit("NF_UPDATE", edit.id);
          toast("NF atualizada.");
        } else {
          const nf = {
            id: NFStore.uid("nf"),
            tenantId,
            issuerUserId: user.id,
            total: finalTotal,
            totalReadonly: true,
            monthCompetency,
            monthIssue,
            file: { name: fileName, note: "mock" },
            status: ST.NF_ENVIADA,
            items: items.map(it => ({ id: it.id, projectId: it.projectId, desc: it.desc, value: it.value })),
            expenseIds: [...expenseIds],
            createdBy: user.id,
            createdAt: new Date().toISOString()
          };

          DB().invoices.push(nf);

          // vincula nfId nas despesas selecionadas
          DB().expenses.forEach(d => {
            if (d.tenantId === tenantId && expenseIds.includes(d.id)) d.nfId = nf.id;
          });

          saveDB();
          NFStore.audit("NF_CREATE", nf.id);
          toast("NF criada.");
        }

        closeDrawer();
        refreshView();
      };
    }

    // Approve/Reject (master)
    if (edit && isM) {
      $("#nfApprove").onclick = () => {
        edit.status = ST.NF_APROVADA;
        saveDB();
        NFStore.audit("NF_APPROVE", edit.id);
        toast("NF aprovada.");
        closeDrawer();
        rerender();
      };

      $("#nfReject").onclick = () => {
        edit.status = ST.NF_REPROVADA;
        saveDB();
        NFStore.audit("NF_REJECT", edit.id);
        toast("NF reprovada.");
        closeDrawer();
        rerender();
      };
    }

    // ✅ Se abriu com OS selecionadas (novo), atualiza preview
    // (no edit, já fizemos render robusto acima)
    if (!edit && expenseIds.length) {
      refreshNFPreview();
    }

  }, 0);
}



function openUserLinks(){
  if(!isMaster()) return toast("Apenas Master.");
  const tenantId = DB().session.tenantId;
  const users = DB().users.filter(u=>u.active && (u.tenantIds||[]).includes(tenantId));
  const projects = DB().projects.filter(p=>p.tenantId===tenantId);
  const links = DB().projectUsers.filter(l=>l.tenantId===tenantId);

  const has = (userId, projectId) => links.some(l=>l.userId===userId && l.projectId===projectId);

  openDrawer("Vínculos usuário x projeto", `
    <div class="card">
      <h3>Vínculos</h3>
      <div class="hint">Use junto com Configuração “Exigir vínculo usuário x projeto”.</div>
      <div class="hr"></div>

      ${users.length && projects.length ? `
        <div style="overflow:auto">
          <table class="table">
            <thead>
              <tr>
                <th>Usuário</th>
                ${projects.map(p=>`<th class="right"><span class="mono">${escapeHtml(p.code)}</span></th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${users.map(u=>`
                <tr>
                  <td>${escapeHtml(u.name)}<div class="hint">${escapeHtml(u.email)}</div></td>
                  ${projects.map(p=>`
                    <td class="right">
                      <input type="checkbox" data-link="${u.id}|${p.id}" ${has(u.id,p.id)?"checked":""}/>
                    </td>
                  `).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : `<div class="empty">Sem usuários ou projetos para vincular.</div>`}

      <div class="hr"></div>
      <div class="row">
        <button class="btn primary" id="ulSave">Salvar</button>
        <span style="flex:1"></span>
        <button class="btn" id="ulClose">Fechar</button>
      </div>
    </div>
  `);

  setTimeout(()=>{
    $("#ulClose").onclick = ()=>closeDrawer();

    $("#ulSave").onclick = ()=>{
      // reconstroi os vínculos do tenant
      const kept = DB().projectUsers.filter(l=>l.tenantId!==tenantId);
      const next = [];
      $$("[data-link]").forEach(ch=>{
        if(ch.checked){
          const [userId, projectId] = ch.dataset.link.split("|");
          next.push({ id: NFStore.uid("pu"), tenantId, userId, projectId });
        }
      });
      DB().projectUsers = kept.concat(next);
      saveDB(); NFStore.audit("PROJECT_USERS_UPDATE", tenantId);
      toast("Vínculos salvos.");
      closeDrawer(); rerender();
    };
  },0);
}

  // ========= Drawer "Abrir" básico (para botões data-open) =========
  function openEntity(kind, id) {
    const db = DB();
    if (kind === "project") {
      const p = getProject(id);
      const cl = getClient(p?.clientId);
      const month = db.ui.month;
      const real = p ? projectCostsReal(p.id, month) : { nfCost:0, otherCost:0, total:0 };
      openDrawer("Projeto", `
        <div class="card">
          <h3 style="margin:0">${escapeHtml(p?.code || "—")} • ${escapeHtml(p?.name || "")}</h3>
          <div class="hint">${escapeHtml(cl?.name || "—")}</div>
          <div class="hr"></div>
          <div class="row" style="justify-content:space-between">
            <div><div class="label">Faturamento</div><div class="value">${fmtBRL(p?.valueTotal||0)}</div></div>
            <div><div class="label">Custo previsto</div><div class="value">${fmtBRL(p?.costPlanned||0)}</div></div>
          </div>
          <div class="hr"></div>
          <div class="row" style="justify-content:space-between">
            <div><div class="label">NF</div><div class="value">${fmtBRL(real.nfCost||0)}</div></div>
            <div><div class="label">Outras</div><div class="value">${fmtBRL(real.otherCost||0)}</div></div>
            <div><div class="label">Total (mês)</div><div class="value"><strong>${fmtBRL(real.total||0)}</strong></div></div>
          </div>
          <div class="hr"></div>
          <button class="btn primary" id="editProject">Editar</button>
        </div>
      `);
      setTimeout(()=>{ $("#editProject") && ($("#editProject").onclick = ()=>openProjectForm(id)); },0);
      return;
    }

    if (kind === "sale") {
      const s = db.sales.find(x=>x.id===id);
      openDrawer("Venda", `
        <div class="card">
          <h3 style="margin:0">${escapeHtml(s?.title||"—")}</h3>
          <div class="hint">${escapeHtml(s?.type||"—")} • ${fmtDT(s?.createdAt)}</div>
          <div class="hr"></div>
          <div class="row" style="justify-content:space-between">
            <div><div class="label">Faturamento</div><div class="value">${fmtBRL(s?.valueTotal||0)}</div></div>
            <div><div class="label">Custo previsto</div><div class="value">${fmtBRL(s?.plannedCost||0)}</div></div>
          </div>
          <div class="hr"></div>
          <button class="btn primary" id="editSale">Editar</button>
        </div>
      `);
      setTimeout(()=>{ $("#editSale") && ($("#editSale").onclick = ()=>openSaleForm(s)); },0);
      return;
    }

    if (kind === "client") {
      const c = db.clients.find(x=>x.id===id);
    const projs = db.projects.filter(p=>p.clientId===id);
     openDrawer(`Cliente • ${escapeHtml(c.code)}`, `
      <div class="card">
        <h3>${escapeHtml(c.name)}</h3>
        <div class="hint">ID: <span class="mono">${escapeHtml(c.code)}</span> • Doc: ${escapeHtml(c.doc||"—")}</div>
        <div class="hr"></div>
        <h3>Projetos</h3>
        ${projs.length ? `
          <table class="table">
            <thead><tr><th>ID</th><th>Projeto</th><th class="right">Ações</th></tr></thead>
            <tbody>
              ${projs.map(p=>`
                <tr>
                  <td><span class="mono">${escapeHtml(p.code)}</span></td>
                  <td>${escapeHtml(p.name)}</td>
                  <td class="right"><button class="btn small" data-open="project" data-id="${p.id}">Abrir</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `<div class="empty">Sem projetos.</div>`}
      </div>
    `);
      setTimeout(()=>{ $("#editClient") && ($("#editClient").onclick = ()=>openClientForm(c)); },0);
      return;
    }

    if (kind === "expense") {
      const d = db.expenses.find(x=>x.id===id);
      const p = getProject(d?.projectId);
      const srv = db.services.find(x=>x.id===d?.serviceId);
      openDrawer("OS / Despesa", `
        <div class="card">
          <h3 style="margin:0">${escapeHtml(srv?.name||"Serviço")} • ${fmtBRL(d?.value||0)}</h3>
          <div class="hint">${escapeHtml(p?.code||"—")} • ${escapeHtml(p?.name||"")}</div>
          <div class="hr"></div>
          <div class="row" style="justify-content:space-between">
            <div><div class="label">Data</div><div class="value">${escapeHtml(d?.dateBuy||"—")}</div></div>
            <div><div class="label">Status</div><div class="value">${chipStatus(d?.status)}</div></div>
          </div>
          <div class="hr"></div>
          <div class="hint">${escapeHtml(d?.complement||"—")}</div>
          <div class="hr"></div>
          <button class="btn primary" id="editExpense">Editar</button>
        </div>
      `);
      setTimeout(()=>{ $("#editExpense") && ($("#editExpense").onclick = ()=>openExpenseForm(d)); },0);
      return;
    }

    if (kind === "reimb") {
      const r = db.reimbursements.find(x=>x.id===id);
      const p = getProject(r?.projectId);
      openDrawer("Reembolso", `
        <div class="card">
          <h3 style="margin:0">${escapeHtml(r?.type||"Reembolso")} • ${fmtBRL(r?.value||0)}</h3>
          <div class="hint">${escapeHtml(p?.code||"—")} • ${escapeHtml(p?.name||"")}</div>
          <div class="hr"></div>
          <div class="row" style="justify-content:space-between">
            <div><div class="label">Data</div><div class="value">${escapeHtml(r?.dateBuy||"—")}</div></div>
            <div><div class="label">Status</div><div class="value">${chipStatus(r?.status)}</div></div>
          </div>
          <div class="hr"></div>
          <div class="hint">${escapeHtml(r?.complement||"—")}</div>
          <div class="hr"></div>
          <button class="btn primary" id="editReimb">Editar</button>
        </div>
      `);
      setTimeout(()=>{ $("#editReimb") && ($("#editReimb").onclick = ()=>openReimbForm(r)); },0);
      return;
    }

    if (kind === "invoice") {
      const nf = db.invoices.find(x=>x.id===id);
      const u = getUser(nf?.createdBy);
      openDrawer("Nota do Fornecedor", `
        <div class="card">
          <h3 style="margin:0">${escapeHtml(nf?.file?.name||"NF")} • ${fmtBRL(nf?.total||0)}</h3>
          <div class="hint">Enviada por ${escapeHtml(u?.name||"—")}</div>
          <div class="hr"></div>
          <div class="row" style="justify-content:space-between">
            <div><div class="label">Competência</div><div class="value">${escapeHtml(nf?.monthCompetency||"—")}</div></div>
            <div><div class="label">Emissão</div><div class="value">${escapeHtml(nf?.monthIssue||"—")}</div></div>
            <div><div class="label">Status</div><div class="value">${chipStatus(nf?.status)}</div></div>
          </div>
          <div class="hr"></div>
          <button class="btn primary" id="editInvoice">Editar</button>
        </div>
      `);
      setTimeout(()=>{ $("#editInvoice") && ($("#editInvoice").onclick = ()=>openInvoiceForm(nf.id)); },0);
      return;
    }

    toast("Abrir: tipo não suportado.");
  }

  function bindOpenButtons() {
    // evita múltiplos binds
    if (window.__OPEN_BIND__) return;
    window.__OPEN_BIND__ = true;

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open]");
      if (!btn) return;

      e.preventDefault();
      openEntity(btn.dataset.open, btn.dataset.id);
    });
  }


  // ========= Views (copiadas/adaptadas do app_old) =========

  function viewDashboard(){
    if(!isMaster()){
      // operador não tem dashboard
      return viewExpenses();
    }
    setTitle("Dashboard", "Visão mês a mês (padrão: mês atual)");
    const month = DB().ui.month;

    const clients = visibleClients();
    const projs = visibleProjects();

    // Filters
    const qClient = (DB().ui.dashClientId || "");
    const qStatus = (DB().ui.dashStatus || "");
    const statusOptions = ["", ST.NF_ENVIADA, ST.NF_APROVADA, ST.NF_REPROVADA]
     //ST.OS_ENVIADA, ST.OS_APROVADA, ST.OS_REPROVADA, ST.RB_SOLICITADO, ST.RB_APROVADO, ST.RB_REPROVADO];

    const invs = visibleInvoices().filter(nf=>nf.monthIssue===month).filter(nf=> !qStatus || nf.status===qStatus);
    const exps = visibleExpenses().filter(d=>monthKeyFromDate(d.dateBuy)===month).filter(d=> !qStatus || d.status===qStatus);
    const rbs  = visibleReimbursements().filter(r=>monthKeyFromDate(r.dateBuy)===month).filter(r=> !qStatus || r.status===qStatus);

    const invTotal = invs.reduce((s,nf)=>s+Number(nf.total||0),0);
    const expTotal = exps.reduce((s,d)=>s+Number(d.value||0),0);
    const rbTotal  = rbs.reduce((s,r)=>s+Number(r.value||0),0);

    const over = projectOverruns(month).slice(0,8);

    const kpiHtml = `
      <div class="kpi">
        <div class="box"><div class="t">NF (mês)</div><div class="v">${fmtBRL(invTotal)}</div></div>
        <div class="box"><div class="t">OSs (mês)</div><div class="v">${fmtBRL(expTotal)}</div></div>
        <div class="box"><div class="t">Reembolsos (mês)</div><div class="v">${fmtBRL(rbTotal)}</div></div>
        <div class="box"><div class="t">Projetos estourados</div><div class="v">${over.length}</div></div>
      </div>
    `;

    // projects table (filtered by client)
    const projsFiltered = qClient ? projs.filter(p=>p.clientId===qClient) : projs;
    const projRows = projsFiltered.map(p=>{
      const cl = getClient(p.clientId);
      const real = projectCostsReal(p.id, month);
      const indLimit = indicatorForProject(p);
      const indIdeal = plannedIndicator(p);
      const indReal = Number(p.valueTotal||0) ? (real.total/Number(p.valueTotal||0)) : 0;
      const warn = indReal > indLimit;
      const chip = `<span class="chip ${warn?'bad':'ok'}">Indicador: ${Math.round(indReal*100)}% • Limite: ${Math.round(indLimit*100)}%</span>`;
      return `
        <tr>
          <td><span class="mono">${escapeHtml(p.code)}</span><div class="hint">${escapeHtml(p.name)}</div></td>
          <td>${escapeHtml(cl?.name||"—")}<div class="hint"><span class="mono">${escapeHtml(cl?.code||"")}</span></div></td>
          <td class="right">${fmtBRL(p.valueTotal)}</td>
          <td class="right">${fmtBRL(p.costPlanned)}</td>
          <td class="right">${fmtBRL(real.nfCost)}<div class="hint">Notas</div></td>
          <td class="right">${fmtBRL(real.otherCost)}<div class="hint">Outras</div></td>
          <td class="right">${fmtBRL(real.total)}<div class="hint">${chip}</div></td>
          <td class="right"><button class="btn small" data-open="project" data-id="${p.id}">Abrir</button></td>
        </tr>
      `;
    }).join("");
    
    $("#content").innerHTML = `
      <div class="grid">
        <div class="card">
          <div class="row" style="justify-content:space-between">
            <h3 style="margin:0">Resumo do mês</h3>
            ${monthControlsHtml()}
          </div>
          <div class="spacer"></div>
          ${kpiHtml}
          <div class="hr"></div>

          <div class="row">
            <div class="field" style="min-width:240px">
              <label>Cliente</label>
              <select id="dashClient">
                <option value="">Todos</option>
                ${clients.map(c=>`<option value="${c.id}" ${qClient===c.id?'selected':''}>${escapeHtml(c.code)} • ${escapeHtml(c.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field" style="min-width:240px">
              <label>Status</label>
              <select id="dashStatus">
                ${statusOptions.map(s=>`<option value="${escapeHtml(s)}" ${qStatus===s?'selected':''}>${escapeHtml(s||"Todos")}</option>`).join("")}
              </select>
            </div>
            <div class="field" style="align-self:flex-end">
              <button class="btn" id="dashClear">Limpar filtros</button>
            </div>
          </div>

          <div class="hr"></div>
          <h3>Projetos</h3>
          ${projsFiltered.length ? `
            <table class="table">
              <thead>
                <tr>
                  <th>Projeto (ID)</th><th>Cliente</th>
                  <th class="right">Faturamento</th><th class="right">Custo previsto</th>
                  <th class="right">Custo NF</th><th class="right">Outras despesas</th>
                  <th class="right">Custo real</th><th class="right">Ações</th>
                </tr>
              </thead>
              <tbody>${projRows}</tbody>
            </table>
          ` : `<div class="empty">Nenhum projeto.</div>`}
        </div>

        <div class="card sticky">
          <h3>Projetos estourados</h3>
          <div class="hint">Custo real maior que custo previsto (no mês selecionado).</div>
          <div class="hr"></div>
          ${over.length ? `
            <div class="row" style="flex-direction:column;align-items:stretch">
              ${over.map(x=>`
                <div class="card" style="padding:10px;background:var(--panel2)">
                  <div class="row" style="justify-content:space-between">
                    <div>
                      <div><strong>${escapeHtml(x.project.code)}</strong> • ${escapeHtml(x.project.name)}</div>
                      <div class="hint">${escapeHtml(getClient(x.project.clientId)?.name||"—")}</div>
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
          <div class="hr"></div>
          <button class="btn" id="quickService">Cadastro de serviços</button>
        </div>
      </div>
    `;

    bindMonthControls();

    $("#dashClient").onchange = (e)=>{ DB().ui.dashClientId = e.target.value; saveDB();   refreshView();
 };
    $("#dashStatus").onchange = (e)=>{ DB().ui.dashStatus = e.target.value; saveDB();   refreshView();
 };
    $("#dashClear").onclick = ()=>{ DB().ui.dashClientId=""; DB().ui.dashStatus=""; saveDB();   refreshView();
 };
    $("#quickService").onclick = ()=>openServiceForm();

    //bindOpenButtons();
  }

  function viewSales(){
    if(!isMaster()) return viewExpenses();
    setTitle("Vendas", "Master cria/edita vendas");
    const month = DB().ui.month;
    const list = visibleSales().filter(s => monthKeyFromDate(s.createdAt) === month);
    const rows = list.map(s=>{
      const cl = getClient(s.clientId);
      const pct = Number(s.valueTotal||0) ? (Number(s.plannedCost||0)/Number(s.valueTotal||0)) : 0;
      return `
        <tr>
          <td>${escapeHtml(s.title)}<div class="hint">${escapeHtml(s.type)} • ${fmtDT(s.createdAt)}</div></td>
          <td>${escapeHtml(cl?.name||"—")}<div class="hint"><span class="mono">${escapeHtml(cl?.code||"")}</span></div></td>
          <td class="right">${fmtBRL(s.valueTotal)}</td>
          <td class="right">${fmtBRL(s.plannedCost)}</td>
          <td class="right"><span class="chip gray">${Math.round(pct*100)}%</span></td>
          <td class="right"><button class="btn small" data-open="sale" data-id="${s.id}">Editar</button></td>
        </tr>
      `;
    }).join("");
    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Vendas</h3>
          <button class="btn primary" id="saleNew">+ Nova venda</button>
        </div>
        <div class="spacer"></div>
        ${monthControlsHtml()}
        <div class="hr"></div>
        ${list.length ? `
          <table class="table">
            <thead><tr><th>Título</th><th>Cliente</th><th class="right">Faturamento</th><th class="right">Custo previsto</th><th class="right">Indicador</th><th class="right">Ações</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        ` : `<div class="empty">Sem vendas.</div>`}
      </div>
    `;
    $("#saleNew").onclick = ()=>openSaleForm();
    //bindOpenButtons();
  }

  function viewClients(){
    if(!isMaster()) return viewExpenses();
    setTitle("Clientes", "Clientes por empresa (com ID)");
    const list = visibleClients();
    $("#content").innerHTML = `
      <div class="card">
      <div class="row" style="justify-content:space-between;padding-bottom:20px;">
  <h3 style="margin:0">Clientes</h3>
  <button class="btn primary" id="btnAddClient">+ Novo cliente</button>
</div>
    ${list.length ? `
      <table class="table">
        <thead><tr><th>ID</th><th>Cliente</th><th>Documento</th><th class="right">Ações</th></tr></thead>
        <tbody>
          ${list.map(c=>`
            <tr>
              <td><span class="mono">${escapeHtml(c.code)}</span></td>
              <td>${escapeHtml(c.name)}</td>
              <td>${escapeHtml(c.doc||"—")}</td>
              <td class="right"><button class="btn small" data-open="client" data-id="${c.id}">Abrir</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : `<div class="empty">Sem clientes.</div>`}
      </div>
    `;
    $("#btnAddClient").onclick = () => openClientForm();


  }

  function viewProjects(){
    if(!isMaster()) return viewExpenses();
    setTitle("Projetos", "Projetos (com ID) e indicador override");
    const month = DB().ui.month;
    const list = visibleProjects();
    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Projetos</h3>
          <button class="btn primary" id="prjNew">+ Novo projeto</button>
        </div>
        <div class="spacer"></div>
        ${monthControlsHtml()}
        <div class="hr"></div>
        ${list.length ? `
          <table class="table">
            <thead>
              <tr>
                <th>ID</th><th>Projeto</th><th>Cliente</th>
                <th class="right">Prev. fat.</th><th class="right">Prev. custo</th>
                <th class="right">Ideal</th><th class="right">Limite</th>
                <th class="right">Custo real (mês)</th><th class="right">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(p=>{
                const cl = getClient(p.clientId);
                const ideal = plannedIndicator(p);
                const lim = indicatorForProject(p);
                const real = projectCostsReal(p.id, month);
                return `
                  <tr>
                    <td><span class="mono">${escapeHtml(p.code)}</span></td>
                    <td>${escapeHtml(p.name)}</td>
                    <td>${escapeHtml(cl?.name||"—")}<div class="hint"><span class="mono">${escapeHtml(cl?.code||"")}</span></div></td>
                    <td class="right">${fmtBRL(p.valueTotal)}</td>
                    <td class="right">${fmtBRL(p.costPlanned)}</td>
                    <td class="right"><span class="chip gray">${Math.round(ideal*100)}%</span></td>
                    <td class="right"><span class="chip gray">${Math.round(lim*100)}%</span></td>
                    <td class="right">${fmtBRL(real.total)}<div class="hint">NF ${fmtBRL(real.nfCost)} • Outras ${fmtBRL(real.otherCost)}</div></td>
                    <td class="right"><button class="btn small" data-open="project" data-id="${p.id}">Editar</button></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        ` : `<div class="empty">Sem projetos.</div>`}
      </div>
    `;
    bindMonthControls();
    $("#prjNew").onclick = ()=>openProjectForm();
    //bindOpenButtons();
  }

  function viewExpenses(){
    setTitle("OSs", isOper() ? "Você vê somente suas despesas" : "Master aprova/reprova e vê tudo");
    const month = DB().ui.month;
    const list = visibleExpenses().filter(d=>monthKeyFromDate(d.dateBuy)===month);
    const statuses = ["", ST.OS_ENVIADA, ST.OS_APROVADA, ST.OS_REPROVADA, ST.OS_FATURADA];
    const qStatus = DB().ui.expStatus || "";
    const filtered = list.filter(d=>!qStatus || d.status===qStatus);

    const canGenerate = isOper(); // operador gera NF a partir de despesas aprovadas sem NF

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">OSs</h3>
          <div class="row">
            <button class="btn" id="srvManage">${isMaster() ? "Serviços" : "Ver serviços"}</button>
            <button class="btn primary" id="dpNew">+ Nova despesa</button>
          </div>
        </div>
        <div class="spacer"></div>
        ${monthControlsHtml()}
        <div class="hr"></div>

        <div class="row">
          <div class="field" style="min-width:240px">
            <label>Status</label>
            <select id="expStatus">
              ${statuses.map(s=>`<option value="${escapeHtml(s)}" ${qStatus===s?'selected':''}>${escapeHtml(s||"Todos")}</option>`).join("")}
            </select>
          </div>
          <div class="field" style="align-self:flex-end">
            <button class="btn" id="expClear">Limpar</button>
          </div>
          <span style="flex:1"></span>
          
        </div>

        <div class="hr"></div>
        ${filtered.length ? `
          <table class="table">
            <thead>
              <tr>
                <th>Data</th><th>Projeto</th><th>Serviço</th><th>Complemento</th>
                <th class="right">Valor</th><th>Status</th><th class="right">Notas</th><th class="right">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(d=>{
                const p = getProject(d.projectId);
                const srv = DB().services.find(s=>s.id===d.serviceId);
                return `
                  <tr>
                    <td>${escapeHtml(d.dateBuy||"—")}</td>
                    <td><span class="mono">${escapeHtml(p?.code||"—")}</span><div class="hint">${escapeHtml(p?.name||"")}</div></td>
                    <td>${escapeHtml(srv?.name||"—")}</td>
                    <td>${escapeHtml(d.complement||"—")}</td>
                    <td class="right">${fmtBRL(d.value)}</td>
                    <td>${chipStatus(d.status)}</td>
                    <td class="right">${d.nfId ? `<span class="chip gray">Vinculada</span>` : `<span class="chip gray">—</span>`}</td>
                    <td class="left">
                    <div class="row" style=" gap:8px;flex-wrap:wrap">
                      ${isMaster() ? `
                        <button class="btn small" data-os-approve="${d.id}" ${d.status!==ST.OS_ENVIADA ? "disabled":""}>
                          Aprovar
                        </button>
                        <button class="btn small danger" data-os-reject="${d.id}"
                          ${ (d.status!==ST.OS_ENVIADA || d.nfId) ? "disabled":"" }>
                          Reprovar
                        </button>
                      ` : ``}
                      <button class="btn small" data-open="expense" data-id="${d.id}">Abrir</button>
                    </div>
                  </td>

                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        ` : `<div class="empty">Sem despesas neste mês (ou sem permissão).</div>`}
      </div>
    `;

    bindMonthControls();
    $("#dpNew").onclick = ()=>openExpenseForm();
    $("#srvManage").onclick = ()=>openServiceForm();
    $("#expStatus").onchange = (e)=>{
      DB().ui.expStatus = e.target.value;
      saveDB();
      viewRouter("expenses"); // ✅ atualiza na hora, sem F5
    };

    $("#expClear").onclick = ()=>{
      DB().ui.expStatus = "";
      saveDB();
      viewRouter("expenses"); // ✅ atualiza na hora, sem F5
    };

      //
    $$("[data-os-approve]").forEach(b=>{
      b.onclick = ()=>{
        try{
          const id = b.dataset.osApprove;
          const d = DB().expenses.find(x=>x.id===id);
          if(!d) return toast("OS não encontrada.");
          if(d.status !== ST.OS_ENVIADA) return;

          d.status = ST.OS_APROVADA;
          saveDB(); NFStore.audit("OS_APPROVE", id);
          toast("OS aprovada.");
          viewRouter("expenses"); // ✅ atualiza na hora
        }catch(e){
          toast(e?.message || "Falha ao aprovar.");
        }
      };
    });

    $$("[data-os-reject]").forEach(b=>{
      b.onclick = ()=>{
        try{
          const id = b.dataset.osReject;
          const d = DB().expenses.find(x=>x.id===id);
          if(!d) return toast("OS não encontrada.");
          if(d.nfId) return toast("Não pode reprovar: OS já vinculada a uma NF.");
          if(d.status !== ST.OS_ENVIADA) return;

          d.status = ST.OS_REPROVADA;
          saveDB(); NFStore.audit("OS_REJECT", id);
          toast("OS reprovada.");
          viewRouter("expenses"); // ✅ atualiza na hora
        }catch(e){
          toast(e?.message || "Falha ao reprovar.");
        }
      };
    });

    // Geração de NF (placeholder)
    

    //bindOpenButtons();
  }

function viewReimbursements(){
  setTitle("Reembolsos", isOper() ? "Você vê somente seus reembolsos" : "Master aprova/reprova e vê tudo");
  const month = DB().ui.month;

  const statuses = ["", ST.RB_SOLICITADO, ST.RB_APROVADO, ST.RB_REPROVADO];
  const qStatus = DB().ui.rbStatus || "";

  const list = visibleReimbursements()
    .filter(r => monthKeyFromDate(r.dateBuy) === month)
    .filter(r => !qStatus || r.status === qStatus);

  const isM = isMaster();

  $("#content").innerHTML = `
    <div class="card">
      <div class="row" style="justify-content:space-between">
        <h3 style="margin:0">Reembolsos</h3>
        <button class="btn primary" id="rbNew">+ Novo reembolso</button>
      </div>

      <div class="spacer"></div>
      ${monthControlsHtml()}

      <div class="hr"></div>
      <div class="row">
        <div class="field" style="min-width:240px">
          <label>Status</label>
          <select id="rbStatus">
            ${statuses.map(s=>`<option value="${escapeHtml(s)}" ${qStatus===s?'selected':''}>${escapeHtml(s||"Todos")}</option>`).join("")}
          </select>
        </div>
        <div class="field" style="align-self:flex-end">
          <button class="btn" id="rbClear">Limpar</button>
        </div>
      </div>

      <div class="hr"></div>

      ${list.length ? `
        <table class="table">
          <thead>
            <tr>
              <th>Data compra</th>
              <th>Projeto</th>
              <th>Tipo</th>
              <th>Complemento</th>
              <th>Solicitante</th>
              <th class="right">Valor</th>
              <th>Status</th>
              <th class="right">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(r=>{
              const p = getProject(r.projectId);
              const u = getUser(r.createdBy);
              const canAct = isM && (r.status === ST.RB_SOLICITADO);

              return `
                <tr>
                  <td>${escapeHtml(r.dateBuy || "—")}</td>
                  <td>
                    <span class="mono">${escapeHtml(p?.code || "—")}</span>
                    <div class="hint">${escapeHtml(p?.name || "")}</div>
                  </td>
                  <td>${escapeHtml(r.type || "—")}</td>
                  <td>${escapeHtml(r.complement || "—")}</td>
                  <td>${escapeHtml(u?.name || "—")}<div class="hint">${escapeHtml(u?.email || "")}</div></td>
                  <td class="right">${fmtBRL(r.value)}</td>
                  <td>${chipStatus(r.status)}</td>
                  <td class="right">
                    ${isM ? `
                      <button class="btn small" data-rb-approve="${r.id}" ${canAct ? "" : "disabled"}>Aprovar</button>
                      <button class="btn small danger" data-rb-reject="${r.id}" ${canAct ? "" : "disabled"}>Reprovar</button>
                    ` : ``}
                    <button class="btn small ${isM ? "" : "primary"}" data-open="reimb" data-id="${r.id}">Editar</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      ` : `<div class="empty">Sem reembolsos neste mês (ou sem permissão).</div>`}
    </div>
  `;

  bindMonthControls();

  $("#rbNew").onclick = ()=>openReimbForm();
  $("#rbStatus").onchange = (e)=>{ DB().ui.rbStatus = e.target.value; saveDB(); refreshView() };
  $("#rbClear").onclick  = ()=>{ DB().ui.rbStatus = ""; saveDB();  refreshView() };

  // ✅ binds (igual convites/usuários)
  $$("[data-rb-approve]").forEach(b=>{
    b.onclick = ()=>{
      try{
        NFStore.reimbursements.approve(b.dataset.rbApprove);
        toast("Reembolso aprovado.");
        viewRouter("reimbursements");

      }catch(e){
        toast(e?.message || "Falha ao aprovar.");
      }
    };
  });

  $$("[data-rb-reject]").forEach(b=>{
    b.onclick = ()=>{
      try{
        NFStore.reimbursements.reject(b.dataset.rbReject);
        toast("Reembolso reprovado.");
        viewRouter("reimbursements");

      }catch(e){
        toast(e?.message || "Falha ao reprovar.");
      }
    };
  });

  // mantém o seu padrão de abrir drawer
  //bindOpenButtons();
}


  function viewInvoices(){
    setTitle("Notas do Fornecedor", isOper() ? "Você vê somente suas notas" : "Master aprova/reprova e vê tudo");
    const month = DB().ui.month;
    const statuses = ["", ST.NF_ENVIADA, ST.NF_APROVADA, ST.NF_REPROVADA, ST.NF_PAGA];
    const qStatus = DB().ui.nfStatus || "";
    const list = visibleInvoices().filter(nf=>nf.monthIssue===month).filter(nf=>!qStatus || nf.status===qStatus);

    $("#content").innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Notas do Fornecedor</h3>
          <button class="btn primary" id="nfNew">+ Nova Nota</button>
        </div>
        <div class="spacer"></div>
        ${monthControlsHtml()}
        <div class="hr"></div>
        <div class="row">
          <div class="field" style="min-width:240px">
            <label>Status</label>
            <select id="nfStatus">
              ${statuses.map(s=>`<option value="${escapeHtml(s)}" ${qStatus===s?'selected':''}>${escapeHtml(s||"Todos")}</option>`).join("")}
            </select>
          </div>
          <div class="field" style="align-self:flex-end">
            <button class="btn" id="nfClear">Limpar</button>
          </div>
        </div>
        <div class="hr"></div>
        ${list.length ? `
          <table class="table">
            <thead>
              <tr>
                <th>Arquivo</th><th>Competência</th><th>Emissão</th><th class="right">Total</th><th>Status</th><th>Enviada por</th><th class="right">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(nf=>{
                const u = getUser(nf.createdBy);
                return `
                  <tr>
                    <td>${escapeHtml(nf.file?.name||"NF")}</td>
                    <td>${escapeHtml(nf.monthCompetency||"—")}</td>
                    <td>${escapeHtml(nf.monthIssue||"—")}</td>
                    <td class="right">${fmtBRL(nf.total)}</td>
                    <td>${chipStatus(nf.status)}</td>
                    <td>${escapeHtml(u?.name||"—")}</td>
                  <td class="right">
                  ${isMaster() ? `
                    ${
                      nf.status === ST.NF_ENVIADA ? `
                        <button class="btn small" data-nf-approve="${nf.id}">Aprovar</button>
                        <button class="btn small danger" data-nf-reject="${nf.id}">Reprovar</button>
                      ` : nf.status === ST.NF_APROVADA ? `
                        <button class=" btn small chip ok"  data-nf-pay="${nf.id}">Pago</button>
                        <button class="btn small danger" data-nf-reject="${nf.id}">Reprovar</button>
                      ` : nf.status === ST.NF_REPROVADA ? `
                        <button class="btn small" data-nf-approve="${nf.id}">Aprovar</button>
                      ` : nf.status === ST.NF_PAGA ? `
                        <!--span class="chip ok">Paga</span-->
                      ` : `
                        <span class="chip gray">${escapeHtml(nf.status||"—")}</span>
                      `
                    }
                  ` : `
                  `}
                    <button class="btn small" data-open="invoice" data-id="${nf.id}">Abrir</button>
                </td>

                    
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        ` : `<div class="empty">Sem NFs neste mês (ou sem permissão).</div>`}
      </div>
    `;
    // ==== binds ações NF (master) ====
    if (isMaster()) {
      $$("[data-nf-approve]").forEach(b => {
        b.onclick = () => {
          const id = b.dataset.nfApprove;
          const nf = DB().invoices.find(x => x.id === id);
          if (!nf) return toast("NF não encontrada.");

          nf.status = ST.NF_APROVADA;
          saveDB();
          NFStore.audit("NF_APPROVE", id);
          toast("NF aprovada.");
          refreshView(); // ✅ atualiza lista sem F5
        };
      });

      $$("[data-nf-reject]").forEach(b => {
        b.onclick = () => {
          const id = b.dataset.nfReject;
          const nf = DB().invoices.find(x => x.id === id);
          if (!nf) return toast("NF não encontrada.");

          nf.status = ST.NF_REPROVADA;
          saveDB();
          NFStore.audit("NF_REJECT", id);
          toast("NF reprovada.");
          refreshView(); // ✅
        };
      });

      $$("[data-nf-pay]").forEach(b => {
        b.onclick = () => {
          const id = b.dataset.nfPay;
          const nf = DB().invoices.find(x => x.id === id);
          if (!nf) return toast("NF não encontrada.");

          // opcional: só deixa pagar se estiver aprovada
          if (nf.status !== ST.NF_APROVADA) return toast("Só pode marcar como paga quando estiver aprovada.");

          nf.status = ST.NF_PAGA; // precisa existir no ST
          saveDB();
          NFStore.audit("NF_PAY", id);
          toast("NF marcada como paga.");
          refreshView(); // ✅
        };
      });
    }

    bindMonthControls();
    $("#nfNew").onclick = ()=>openInvoiceForm();
    $("#nfStatus").onchange = (e)=>{ DB().ui.nfStatus = e.target.value; saveDB(); refreshView() };
    $("#nfClear").onclick = ()=>{ DB().ui.nfStatus=""; saveDB();  refreshView() };
    //bindOpenButtons();
  }

  function viewUsers(){
  if(!isMaster()) return viewExpenses();
  setTitle("Usuários", "Master gerencia vínculos e aprova pendentes");

  const tenantId = DB().session.tenantId;
  const users = DB().users.filter(u => u.active && (u.tenantIds||[]).includes(tenantId));

  const normStatus = (s)=>{
    const x = String(s||"").toUpperCase();
    if(x === "PENDING" || x === "PENDENTE") return "PENDENTE";
    if(x === "APPROVED" || x === "APROVADO") return "APROVADO";
    if(x === "REJECTED" || x === "REPROVADO") return "REPROVADO";
    return (s || "—");
  };

  const chipStatusUser = (s)=>{
    const st = normStatus(s);
    const cls = st==="PENDENTE" ? "warn" : (st==="REPROVADO" ? "bad" : "ok");
    return `<span class="chip ${cls}">${escapeHtml(st)}</span>`;
  };

  $("#content").innerHTML = `
    <div class="card">
      <div class="row" style="justify-content:space-between">
        <h3 style="margin:0">Usuários</h3>
        <div class="row">
          
          <button class="btn" id="btnLinks">Vínculos usuário x projeto</button>
        </div>
      </div>

      <div class="hr"></div>

      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Perfil</th>
            <th>Status</th>
            <th class="right">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u=>{
            const st = normStatus(u.status);
            const roleLbl = (u.role===ROLE.MASTER ? "Master" : "Operador");
            const canAct = (st === "PENDENTE");
            return `
              <tr>
                <td>${escapeHtml(u.name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td><span class="chip gray">${escapeHtml(roleLbl)}</span></td>
                <td>${chipStatusUser(u.status)}</td>
                <td class="right">
                  ${canAct ? `
                    <button class="btn small" data-approve="${u.id}">Aprovar</button>
                    <button class="btn small danger" data-reject="${u.id}">Reprovar</button>
                  ` : `<span class="hint">—</span>`}
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>

      <div class="hr"></div>
      <div class="hint">
        Usuários <strong>PENDENTES</strong> não conseguem acessar o sistema até aprovação.
      </div>
    </div>
  `;

  $("#uaRefresh").onclick = ()=> rerender();
  $("#btnLinks").onclick = ()=> openUserLinks();

  $$("[data-approve]").forEach(b=>{
    b.onclick = ()=>{
      try{
        NFStore.usersAdmin?.approve?.(b.dataset.approve);
        toast("Aprovado.");
        rerender();
      }catch(e){
        toast(e?.message || "Falha ao aprovar.");
      }
    };
  });

  $$("[data-reject]").forEach(b=>{
    b.onclick = ()=>{
      try{
        NFStore.usersAdmin?.reject?.(b.dataset.reject);
        toast("Reprovado.");
        rerender();
      }catch(e){
        toast(e?.message || "Falha ao reprovar.");
      }
    };
  });
}


  function viewSettings(){
    if(!isMaster()) return viewExpenses();
    setTitle("Configurações", "Indicador por empresa + opção de vínculo projeto");
    const { tenant } = NFStore.getSession();
    const pct = tenantIndicatorPct();
    $("#content").innerHTML = `
      <div class="card">
        <h3>Configurações do tenant</h3>
        <div class="hr"></div>
        <div class="split">
          <div class="field">
            <label>Indicador padrão (limite)</label>
            <input id="setPct" type="number" step="0.01" value="${pct}"/>
            <div class="hint">Ex: 0.45 = 45%</div>
          </div>
          <div class="field">
            <label>Exigir vínculo usuário x projeto</label>
            <select id="setLink">
              <option value="false" ${!requireProjectLink()?"selected":""}>Não (liberar projetos)</option>
              <option value="true" ${requireProjectLink()?"selected":""}>Sim (restringir para operador)</option>
            </select>
            <div class="hint">Quando ligado, operador só enxerga projetos vinculados.</div>
          </div>
        </div>
        <div class="row">
          <button class="btn primary" id="setSave">Salvar</button>
          <button class="btn" id="setLinks">Gerenciar vínculos</button>
          <span style="flex:1"></span>
          <button class="btn" id="setSrv">Cadastro de serviços</button>
        </div>
      </div>
    `;
    $("#setSave").onclick = ()=>{
      const p = Number($("#setPct").value||0.45);
      const link = $("#setLink").value==="true";
      tenant.settings.indicatorPct = p;
      tenant.settings.requireProjectLink = link;
      saveDB(); NFStore.NFStore.audit("SETTINGS_UPDATE", JSON.stringify(tenant.settings));
      toast("Configurações salvas.");
      rerender();
    };
    $("#setLinks").onclick = ()=>openUserLinks();
    $("#setSrv").onclick = ()=>openServiceForm();
  }

  function viewAudit(){
    if(!isMaster()) return viewExpenses();
    setTitle("Auditoria", "Log simples do que aconteceu (mock)");
    const list = DB().audit.filter(a=>a.tenantId===DB().session.tenantId).slice(0,80);
    $("#content").innerHTML = `
      <div class="card">
        <h3>Auditoria</h3>
        ${list.length ? `
          <table class="table">
            <thead><tr><th>Quando</th><th>Ação</th><th>Ator</th><th>Meta</th></tr></thead>
            <tbody>
              ${list.map(a=>{
                const u = getUser(a.actorUserId);
                return `
                  <tr>
                    <td>${fmtDT(a.createdAt)}</td>
                    <td><span class="chip gray">${escapeHtml(a.action)}</span></td>
                    <td>${escapeHtml(u?.name||"—")}</td>
                    <td class="mono">${escapeHtml(a.meta||"")}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        ` : `<div class="empty">Sem eventos.</div>`}
      </div>
    `;
  }

  // ========= Exposição das views =========


  // ========= Auth + Convites (NOVO) =========
  function getInviteToken(){
    const q = new URLSearchParams(location.search);
    const qt = q.get("invite") || q.get("token");
    if(qt) return qt;

    const h = (location.hash || "").replace(/^#/, "");
    if(!h) return "";
    const hp = new URLSearchParams(h.includes("&") ? h : h.replace(/\?/g,"&"));
    return hp.get("invite") || hp.get("token") || "";
  }

  function viewLogin(){
    setTitle("Login", "Acesse com email e senha");
    $("#content").innerHTML = `
      <div class="card" style="max-width:520px;margin:0 auto">
        <h3 style="margin:0">Entrar</h3>
        <div class="hint">Mock local: senha padrão <span class="mono">123456</span> (seed).</div>
        <div class="hr"></div>

        <div class="field">
          <label>Email</label>
          <input id="lgEmail" type="email" placeholder="seu@email.com" autocomplete="username">
        </div>
        <div class="field password">
          <label>Senha</label>
          <div class="password-wrap">
            <input
              id="lgPass"
              type="password"
              placeholder="••••••"
              autocomplete="current-password"
            />
            <button type="button" class="eye" id="togglePass" aria-label="Mostrar senha">
  <svg id="eyeIcon" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M1 12C1 12 5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      stroke-width="2"
    />
  </svg>
</button>

          </div>
        </div>

        <div class="row">
          <button class="btn primary" id="lgGo">Entrar</button>
          <span style="flex:1"></span>
          <button class="btn" id="lgInvite">Tenho convite</button>
        </div>

      <div class="hr"></div>
      <div class="hint" id="lgMsg"></div>
      <div class="hint">
        <div class='row'>      
          <div>
            MASTER
            <ul>
              <li>master@corp.com</li>
              <li>diego@diapason.com.br</li>
              <li>rafael@blendz.com.br</li>
              <li>felipe@typic.com.br</li>
              <li>eduardo@vdt.com.br</li>
            </ul>
          </div>
          <div>
            OPERADOR
            <ul>
              <li>talita@vdt.com.br</li>
              <li>batata@diapason.com.br</li>
              <li>carol@typic.com.br</li>
            </ul>
          </div>
        </div>      
      </div>
    </div>
    `;
const pass = $("#lgPass");
const eyeBtn = $("#togglePass");
const eyeIcon = $("#eyeIcon");

eyeBtn.onclick = ()=>{
  const show = pass.type === "password";
  pass.type = show ? "text" : "password";

  eyeIcon.innerHTML = show
    ? `<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.91 21.91 0 0 1 5.06-5.94"
         stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
       <path d="M1 1l22 22"
         stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`
    : `<path d="M1 12C1 12 5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12Z"
         stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
       <circle cx="12" cy="12" r="3"
         stroke="currentColor" stroke-width="2"/>`;
};


    const token = getInviteToken();
    $("#lgInvite").onclick = ()=> {
      if(token) return viewRouter("invite");
      toast("Abra um link de convite (com #invite=TOKEN ou ?invite=TOKEN).");
    };

$("#lgEmail").onkeydown = (e)=>{
  if(e.key === "Enter"){
    e.preventDefault();
    $("#lgPass").focus();
  }
};

$("#lgPass").onkeydown = (e)=>{
  if(e.key === "Enter"){
    e.preventDefault();
    $("#lgGo").click();
  }
};


    $("#lgGo").onclick = (e)=>{
      e.preventDefault();

      const email = ($("#lgEmail").value || "").trim();
      const password = ($("#lgPass").value || "").trim();
      if(!email || !password) return NFUI.toast("Preencha email e senha.");

      try{
        const res = NFStore.auth.login(email, password);

        if(!res?.ok){
          const msg = res?.message || "Email ou senha inválidos.";
          $("#lgMsg").textContent = msg;
          NFUI.toast(msg);
          return;
        }

        const home = isMaster() ? "dashboard" : "reimbursements";
        return viewRouter(home);

      }catch(err){
        const msg = err?.message || "Falha no login.";
        $("#lgMsg").textContent = msg;
        NFUI.toast(msg);
      }
    };



  }

  function viewPending(){
    setTitle("Aguardando aprovação", "Seu acesso está pendente de aprovação pelo MASTER");
    const sess = NFStore.getSession?.();
    const u = sess?.user;

    $("#content").innerHTML = `
      <div class="card" style="max-width:720px;margin:0 auto">
        <h3 style="margin:0">Pendente de aprovação</h3>
        <div class="hint">Você já se cadastrou, mas ainda não foi aprovado.</div>
        <div class="hr"></div>

        <div class="row" style="justify-content:space-between;gap:16px;flex-wrap:wrap">
          <div>
            <div><strong>Usuário</strong></div>
            <div>${escapeHtml(u?.name || "—")}</div>
            <div class="hint">${escapeHtml(u?.email || "")}</div>
          </div>
          <div>
            <div><strong>Empresa</strong></div>
            <div>${escapeHtml(sess?.tenant?.name || "—")}</div>
          </div>
        </div>

        <div class="hr"></div>
        <div class="row">
          <button class="btn" id="pdRefresh">Atualizar</button>
          <span style="flex:1"></span>
          <button class="btn danger" id="pdOut">Sair</button>
        </div>
      </div>
    `;

    $("#pdRefresh").onclick = ()=> rerender();
    $("#pdOut").onclick = ()=>{
      NFStore.auth?.logout?.();
      rerender();
    };
  }

  function viewInviteSignup(){
    const token = getInviteToken();
    setTitle("Convite", token ? "Crie seu acesso com o token recebido" : "Token não encontrado");

    if(!token){
      $("#content").innerHTML = `<div class="empty">Abra um link com <span class="mono">#invite=TOKEN</span> ou <span class="mono">?invite=TOKEN</span>.</div>`;
      return;
    }

    let inv = null;
    try{ inv = NFStore.invites?.getByToken?.(token); } catch(e){ inv = null; }

    if(!inv){
      $("#content").innerHTML = `<div class="empty">Convite inválido ou expirado.</div>`;
      return;
    }

    const tenantName = (DB().tenants.find(t=>t.id===inv.tenantId)?.name || "—");


    $("#content").innerHTML = `
      <div class="card" style="max-width:720px;margin:0 auto">
        <h3 style="margin:0">Cadastro via convite</h3>
        <div class="hint">Você será criado como <strong>PENDENTE</strong> até aprovação do MASTER.</div>
        <div class="hr"></div>

        <div class="row" style="gap:14px;flex-wrap:wrap">
          <span class="chip gray">Empresa: <strong>${escapeHtml(tenantName)}</strong></span>
          <span class="chip gray">Perfil: <strong>${escapeHtml(inv.role || "")}</strong></span>
          <span class="chip gray">Token: <span class="mono">${escapeHtml(token)}</span></span>
        </div>

        <div class="hr"></div>

        <div class="split">
          <div class="field">
            <label>Nome</label>
            <input id="ivName" placeholder="Seu nome completo" autocomplete="name">
          </div>
          <div class="field">
            <label>Email</label>
            <input id="ivEmail" type="email" placeholder="seu@email.com" autocomplete="email">
          </div>
        </div>
        <div class="field">
          <label>Senha</label>
          <input id="ivPass" type="password" placeholder="Crie uma senha" autocomplete="new-password">
          <div class="hint">Mock: senha fica no browser (sem hash).</div>
        </div>

        <div class="row">
          <button class="btn primary" id="ivGo">Finalizar cadastro</button>
          <span style="flex:1"></span>
          <button class="btn" id="ivBack">Login</button>
        </div>

        <div class="hr"></div>
        <div class="hint" id="ivMsg"></div>
      </div>
    `;

    $("#ivBack").onclick = ()=> viewRouter("login");

    $("#ivGo").onclick = ()=>{
      const name = ($("#ivName").value || "").trim();
      const email = ($("#ivEmail").value || "").trim();
      const password = ($("#ivPass").value || "").trim();
      if(!name || !email || !password) return toast("Preencha nome, email e senha.");

      try{
        NFStore.invites?.accept?.(token, { name, email, pass: password, password });

        // ✅ garante sessão limpa
        try{ NFStore.auth?.logout?.(); }catch(e){}

        // ✅ remove token da URL (hash e query) sem recarregar
        try{
          const clean = location.href.split("#")[0].split("?")[0];
          history.replaceState({}, "", clean);
        }catch(e){}

        $("#ivMsg").innerHTML = `Cadastro enviado. <strong>Aguarde aprovação</strong>.`;
        setTimeout(function(){viewRouter("login")}, 300);
      }catch(e){
        $("#ivMsg").textContent = e?.message || "Falha ao aceitar convite.";
      }
    };

  }

  function viewInvitesAdmin(){
    if(!isMaster()) return viewExpenses();
    setTitle("Convites", "Gere links de cadastro (mock)");

    const tenantId = DB().session.tenantId;
    const clients = DB().clients.filter(c=>c.tenantId===tenantId);
    const projects = DB().projects.filter(p=>p.tenantId===tenantId);
    const list = NFStore.invites?.list?.(tenantId) || [];

    const urlBase = location.href.split("#")[0];
    const rows = list.map(inv=>{
  const link = `${urlBase}#invite=${encodeURIComponent(inv.token)}`;
  const st = inv.status || "—";
  const canRevoke = (st === "ACTIVE");
  return `
    <tr>
      <td><span class="mono">${escapeHtml(inv.token)}</span><div class="hint">${escapeHtml(st)}</div></td>
      <td>${escapeHtml(inv.role || "")}</td>
      <td class="right">${inv.clientIds?.length || 0}</td>
      <td class="right">${inv.projectIds?.length || 0}</td>
      <td class="right">
        <button class="btn small" data-copy="${escapeHtml(link)}">Copiar link</button>
        <button class="btn small danger" data-revoke="${inv.id}" ${canRevoke ? "" : "disabled"}>
          Revogar
        </button>
      </td>
    </tr>
  `;
}).join("");

    


    $("#content").innerHTML = `
      <div class="grid">
        <div class="card">
          <div class="row" style="justify-content:space-between">
            <h3 style="margin:0">Gerar convite</h3>
            <button class="btn primary" id="invCreate">Gerar link</button>
          </div>
          <div class="hint">Selecione clientes e projetos que o usuário terá acesso automaticamente.</div>
          <div class="hr"></div>

          <div class="field" style="max-width:260px">
            <label>Perfil do convidado</label>
            <select id="invRole">
              <option value="${ROLE.OPER}">Operador</option>
              <option value="${ROLE.MASTER}">Master</option>
            </select>
          </div>

          <div class="hr"></div>
          <h3 style="margin:0">Clientes</h3>
          <div class="row" style="flex-direction:column;align-items:stretch;gap:8px">
            ${clients.map(c=>`
              <label class="card" style="padding:10px;display:flex;gap:10px;align-items:flex-start;background:var(--panel2)">
                <input type="checkbox" data-client="${c.id}"/>
                <div style="flex:1">
                  <div><strong>${escapeHtml(c.code)}</strong> • ${escapeHtml(c.name)}</div>
                  <div class="hint">${escapeHtml(c.doc||"")}</div>
                </div>
              </label>
            `).join("") || `<div class="empty">Sem clientes.</div>`}
          </div>

          <div class="hr"></div>
          <h3 style="margin:0">Projetos</h3>
          <div class="hint">Os projetos podem ser filtrados pelo(s) cliente(s) selecionado(s).</div>
          <div class="row" style="flex-direction:column;align-items:stretch;gap:8px" id="projList">
            ${projects.map(p=>{
              const cl = DB().clients.find(c=>c.id===p.clientId);
              return `
                <label class="card" style="padding:10px;display:flex;gap:10px;align-items:flex-start;background:var(--panel2)">
                  <input type="checkbox" data-project="${p.id}" data-client="${p.clientId}"/>
                  <div style="flex:1">
                    <div><strong>${escapeHtml(p.code)}</strong> • ${escapeHtml(p.name)}</div>
                    <div class="hint">${escapeHtml(cl?.code||"")} • ${escapeHtml(cl?.name||"")}</div>
                  </div>
                </label>
              `;
            }).join("") || `<div class="empty">Sem projetos.</div>`}
          </div>

          <div class="hr"></div>
          <div class="hint" id="invOut"></div>
        </div>

        <div class="card sticky">
          <h3>Convites</h3>
          ${list.length ? `
            <table class="table">
              <thead><tr><th>Token</th><th>Perfil</th><th class="right">Clientes</th><th class="right">Projetos</th><th class="right">Ações</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          ` : `<div class="empty">Sem convites.</div>`}
        </div>
      </div>
    `;

    const applyProjFilter = ()=>{
      const selectedClients = $$("[data-client]").filter(x=>x.checked).map(x=>x.dataset.client);
      $$("[data-project]").forEach(cb=>{
        if(!selectedClients.length) cb.closest("label").style.display = "";
        else cb.closest("label").style.display = selectedClients.includes(cb.dataset.client) ? "" : "none";
      });
    };
    $$("[data-client]").forEach(cb=> cb.onchange = applyProjFilter);
    applyProjFilter();

    $$("[data-copy]").forEach(b=>{
      b.onclick = async ()=>{
        const link = b.dataset.copy;
        try{ await navigator.clipboard.writeText(link); toast("Link copiado."); }
        catch{ toast("Não consegui copiar. Copie manualmente: " + link); }
      };
    });

    $$("[data-revoke]").forEach(b=>{
      b.onclick = ()=>{
        const id = b.dataset.revoke;
        if(!id) return;
        if(!confirm("Revogar este convite? (vai ficar EXPIRED)")) return;

        const res = NFStore.invites?.revoke?.(id);
        if(res?.ok){
          toast("Convite revogado.");
          rerender();
        }else{
          toast("Não consegui revogar (verifique permissões).");
        }
      };
    });

    $("#invCreate").onclick = ()=>{
      const role = $("#invRole").value;
      const clientIds = $$("[data-client]").filter(x=>x.checked).map(x=>x.dataset.client);
      const projectIds = $$("[data-project]").filter(x=>x.checked).map(x=>x.dataset.project);

      try{
        const res = NFStore.invites?.create?.({ tenantId, role, clientIds, projectIds, expiresAt: null });
        const inv = res?.invite; // ✅ pega o objeto certo
        const link = `${urlBase}#invite=${encodeURIComponent(inv?.token || "")}`;

        $("#invOut").innerHTML = `Criado: <span class="mono">${escapeHtml(inv.token)}</span><br>Link: <span class="mono">${escapeHtml(link)}</span>`;
        rerender();
      }catch(e){
        $("#invOut").textContent = e?.message || "Falha ao criar convite.";
      }
    };
  }

  
  global.NFViews = {
    // auth + convite
    login: viewLogin,
    invite: viewInviteSignup,
    pending: viewPending,

    // admin
    invites: viewInvitesAdmin,
    dashboard: viewDashboard,
    sales: viewSales,
    clients: viewClients,
    projects: viewProjects,
    expenses: viewExpenses,
    reimbursements: viewReimbursements,
    invoices: viewInvoices,
    users: viewUsers,
    settings: viewSettings,
    audit:viewAudit,
    bindOpenButtons:bindOpenButtons
  };

})(window);
