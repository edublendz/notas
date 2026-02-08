  // ===== PLACEHOLDER: viewInvoices migrada para views/invoices.js =====
// - Depende de: NFStore (store.js) e NFUI (ui.js)
// - Exponibiliza: window.NFViews = { dashboard, sales, clients, projects, expenses, reimbursements, invoices, users, settings, audit }


(function (global) {
  "use strict";

  if (!global.NFStore) throw new Error("NFStore nÃ£o encontrado. Verifique store.js antes de views.js");
  if (!global.NFUI) throw new Error("NFUI nÃ£o encontrado. Verifique ui.js antes de views.js");

  const { NFStore, NFUI } = global;

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  // ========= Aliases (compatibilidade com app_old) =========
  const DB = () => NFStore.DB();
  const saveDB = NFStore.saveDB;

  const isMaster = NFStore.isMaster;
  const isOper = NFStore.isOper;
  
  const ST = NFStore.ST;
  const ROLE = NFStore.ROLE;
  const USER_STATUS = NFStore.USER_STATUS;

  const visibleClients = NFStore.visibleClients;
  const visibleProjects = NFStore.visibleProjects;
  const visibleServices = NFStore.visibleServices;
  const visibleSales = NFStore.visibleSales;
  const visibleExpenses = NFStore.visibleExpenses;
  const visibleReimbursements = NFStore.visibleReimbursements;
  const visibleInvoices = NFStore.visibleInvoices;

  const monthKeyFromDate = NFStore.monthKeyFromDate;
  const monthShift = NFStore.monthShift;
  
  const escapeHtml = NFUI.escapeHtml;
  const fmtBRL = NFUI.fmtBRL;
  const chipStatus = NFUI.chipStatus;
  const chipProjectStatus = NFUI.chipProjectStatus;
  const monthControlsHtml = NFUI.monthControlsHtml;
  const bindMonthControls = NFUI.bindMonthControls;
  const toast = NFUI.toast;
  const openDrawer = NFUI.openDrawer;
  const closeDrawer = NFUI.closeDrawer;

  function setTitle(title, sub=""){
    //REMOVER DAQUI. esse view.js provavelmente irÃ¡ morrer ou serÃ¡ simlfiicado ao extremo. 
    const titleEl = $("#pageTitle");
    const subEl = $("#pageSub");
    const monthChipEl = $("#monthChip");
    if(titleEl) titleEl.textContent = title || "";
    if(subEl) subEl.textContent = sub || "";
    if(monthChipEl) monthChipEl.textContent = `Mês: ${NFStore.DB().ui.month}`;
  }

  // Exporta setTitle globalmente para uso nos mÃ³dulos de views
  global.setTitle = setTitle;

  function openExpenseForm(expenseRef=null){
    const expenseId = (expenseRef && typeof expenseRef === "object") ? expenseRef.id : expenseRef;
    const isEdit = !!expenseId;

    const base = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8000'
      : '/apis/public/index.php';

    openDrawer(isEdit ? `OS â€¢ ${escapeHtml(String(expenseId).slice(-6))}` : "Nova OS", `
      <div class="card">
        <h3>${isEdit ? "Editar despesa" : "Criar despesa"}</h3>
        <div class="hint">Carregando dados...</div>
      </div>
    `);

    (async () => {
      try{
        const [projResp, srvResp] = await Promise.all([
          NFStore.apiFetch(`${base}/api/projects?limit=200`),
          NFStore.apiFetch(`${base}/api/services?limit=200`)
        ]);

        if(!projResp.ok || !srvResp.ok){
          toast("Falha ao carregar projetos/serviÃ§os.");
          return;
        }

        const projPayload = await projResp.json();
        const srvPayload  = await srvResp.json();

        const projects = Array.isArray(projPayload?.data) ? projPayload.data : [];
        const services = Array.isArray(srvPayload?.data) ? srvPayload.data : [];

        let expense = null;
        if(isEdit){
          const r = await NFStore.apiFetch(`${base}/api/expenses/${expenseId}`);
          if(!r.ok){
            toast("OS nÃ£o encontrada no servidor.");
            return;
          }
          expense = await r.json();
        }

        const sess = NFStore.getSession();
        const user = sess?.user || null;

        let canEdit = true;
        let editable = true;

        if(expense){
          const requesterId = expense.requester?.id ?? null;
          const isOwner = requesterId && user && String(requesterId) === String(user.id);
          const statusName = expense.status?.name || "";
          const hasInvoice = !!expense.invoice;

          canEdit = isMaster() || (isOper() && isOwner);
          editable = statusName === ST.OS_ENVIADA && !hasInvoice;
        }

        const selectedProjectId = expense?.project?.id ?? (projects[0]?.id ?? "");
        const selectedServiceId = expense?.service?.id ?? (services[0]?.id ?? "");
        const dateBuy = expense?.dateBuy || "";
        const value   = Number(expense?.value || 0);
        const complement = expense?.complement || "";
        const statusLabel = expense?.status?.name || "";

        openDrawer(isEdit ? `OS â€¢ ${escapeHtml(String(expenseId).slice(-6))}` : "Nova OS", `
          <div class="card">
            <h3>${isEdit ? "Editar despesa" : "Criar despesa"}</h3>
            <div class="hint">OS tem serviÃ§o + descriÃ§Ã£o complementar.</div>
            <div class="hr"></div>

            <div class="field">
              <label>Projeto</label>
              <select id="dpProject" ${!canEdit||!editable?"disabled":""}>
                ${projects.map(p=>`<option value="${p.id}" ${String(selectedProjectId)===String(p.id)?"selected":""}>${escapeHtml(p.code)} â€¢ ${escapeHtml(p.name)}</option>`).join("")}
              </select>
            </div>

            <div class="field">
              <label>ServiÃ§o</label>
              <select id="dpService" ${!canEdit||!editable?"disabled":""}>
                ${services.map(s=>`<option value="${s.id}" ${String(selectedServiceId)===String(s.id)?"selected":""}>${escapeHtml(s.name)}</option>`).join("")}
              </select>
            </div>

            <div class="split">
              <div class="field">
                <label>Data da compra</label>
                <input id="dpDate" type="date" value="${escapeHtml(dateBuy||"")}" ${!canEdit||!editable?"disabled":""}/>
              </div>
              <div class="field">
                <label>Valor</label>
                <input id="dpValue" type="number" step="0.01" value="${Number(value||0)}" ${!canEdit||!editable?"disabled":""}/>
              </div>
            </div>

            <div class="field">
              <label>DescriÃ§Ã£o complementar</label>
              <input id="dpComp" value="${escapeHtml(complement||"")}" placeholder="Ex: Uber aeroporto" ${!canEdit||!editable?"disabled":""}/>
            </div>

            <div class="row">
              ${isEdit ? `<span class="chip gray">${escapeHtml(statusLabel||"")}</span>` : ``}
              <span style="flex:1"></span>
              ${canEdit && editable ? `<button class="btn primary" id="dpSave">${isEdit?"Salvar":"Criar"}</button>` : ``}
              <button class="btn" id="dpClose">Fechar</button>
            </div>

            ${expense && isMaster() && !expense.invoice ? `
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

          if(canEdit && editable && $("#dpSave")){
            $("#dpSave").onclick = async ()=>{
              const projectId = $("#dpProject")?.value || "";
              const serviceId = $("#dpService")?.value || "";
              const dt = ($("#dpDate")?.value||"").trim();
              const val = Number($("#dpValue")?.value||0);
              const comp = ($("#dpComp")?.value||"").trim();

              if(!projectId || !serviceId || !dt || !val){
                return toast("Preencha projeto, serviÃ§o, data e valor.");
              }

              const body = {
                projectId: Number(projectId),
                serviceId: Number(serviceId),
                dateBuy: dt,
                value: val,
                complement: comp
              };

              if(!isEdit && user?.id){
                body.requesterUserId = user.id;
              }

              try{
                const url = isEdit
                  ? `${base}/api/expenses/${expenseId}`
                  : `${base}/api/expenses`;
                const method = isEdit ? 'PUT' : 'POST';

                const resp = await NFStore.apiFetch(url, {
                  method,
                  body: JSON.stringify(body)
                });

                if(!resp.ok){
                  let msg = isEdit ? "Falha ao salvar despesa." : "Falha ao criar despesa.";
                  try{
                    const err = await resp.json();
                    if(err?.message) msg = err.message;
                    else if(err?.error) msg = err.error;
                  }catch(_){ }
                  toast(msg);
                  return;
                }

                NFStore.audit(isEdit ? "EXPENSE_UPDATE" : "EXPENSE_CREATE", String(expenseId || ""));
                toast(isEdit ? "Despesa atualizada." : "Despesa criada.");
                closeDrawer();
                viewRouter("expenses");
              }catch(e){
                toast(isEdit ? "Erro ao salvar despesa." : "Erro ao criar despesa.");
              }
            };
          }

          if(expense && isMaster() && !expense.invoice){
            $("#dpApprove") && ($("#dpApprove").onclick = async ()=>{
              try{
                const r = await NFStore.apiFetch(`${base}/api/expenses/${expenseId}/approve`, { method:'POST' });
                if(!r.ok){
                  let msg = "Falha ao aprovar OS.";
                  try{
                    const err = await r.json();
                    if(err?.message) msg = err.message;
                    else if(err?.error) msg = err.error;
                  }catch(_){ }
                  toast(msg);
                  return;
                }
                NFStore.audit("EXPENSE_APPROVE", String(expenseId));
                toast("Aprovada.");
                closeDrawer();
                viewRouter("expenses");
              }catch(e){
                toast("Erro ao aprovar OS.");
              }
            });

            $("#dpReject") && ($("#dpReject").onclick = async ()=>{
              try{
                const r = await NFStore.apiFetch(`${base}/api/expenses/${expenseId}/reject`, { method:'POST' });
                if(!r.ok){
                  let msg = "Falha ao reprovar OS.";
                  try{
                    const err = await r.json();
                    if(err?.message) msg = err.message;
                    else if(err?.error) msg = err.error;
                  }catch(_){ }
                  toast(msg);
                  return;
                }
                NFStore.audit("EXPENSE_REJECT", String(expenseId));
                toast("Reprovada.");
                closeDrawer();
                viewRouter("expenses");
              }catch(e){
                toast("Erro ao reprovar OS.");
              }
            });
          }
        },0);
      }catch(e){
        toast("Erro ao carregar dados da OS.");
      }
    })();
  }

  // ========= Lookups =========
  function getClient(id) { return DB().clients.find(x => x.id === id); }
  function getProject(id) { return DB().projects.find(x => x.id === id); }
  function getUser(id) { return DB().users.find(x => x.id === id); }

  // ========= Placeholders de forms (para nÃ£o quebrar) =========
  function openServiceForm(){
    const list = visibleServices();
    openDrawer("Cadastro de serviÃ§os", `
      <div class="card">
        <h3>ServiÃ§os</h3>
        <div class="hint">Usado no combo de OS.</div>
        <div class="hr"></div>
        <div class="row">
          
          ${isMaster() ? '<input id="srvName" placeholder="Nome do serviÃ§o" /><button class="btn primary" id="srvAdd">Adicionar</button>' : ''}
        </div>
        <div class="hr"></div>
        ${list.length ? `
          <table class="table">
            <thead><tr><th>ServiÃ§o</th><th class="right">AÃ§Ãµes</th></tr></thead>
            <tbody>
              ${list.map(s=>`
                <tr>
                  <td>${escapeHtml(s.name)}</td>
                  <td class="right"><button class="btn small danger" data-del="${s.id}">Remover</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `<div class="empty">Nenhum serviÃ§o.</div>`}
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
        toast("ServiÃ§o adicionado.");
        closeDrawer(); rerender();
      };

      $$("[data-del]").forEach(b=>b.onclick = ()=>{
        const id = b.dataset.del;
        DB().services = DB().services.filter(s=>s.id!==id);
        saveDB(); NFStore.audit("SERVICE_DELETE", id);
        toast("ServiÃ§o removido.");
        closeDrawer(); rerender();
      });
    },0);
  }
  function openSaleForm(saleId=null){
  if(!isMaster()) return toast("Apenas Master.");
  const edit = saleId ? DB().sales.find(s=>s.id===saleId) : null;
  const clients = visibleClients();

  openDrawer(edit ? `Venda â€¢ ${escapeHtml(edit.title)}` : "Nova Venda", `
    <div class="card">
      <h3>${edit ? "Editar venda" : "Criar venda"}</h3>
      <div class="hr"></div>

      <div class="split">
        <div class="field">
          <label>TÃ­tulo</label>
          <input id="saleTitle" value="${escapeHtml(edit?.title||"")}" placeholder="Ex: Venda â€“ Fee mensal" />
        </div>
        <div class="field">
          <label>Tipo</label>
          <input id="saleType" value="${escapeHtml(edit?.type||"Projeto")}" placeholder="Ex: Projeto / Fee mensal" />
        </div>
      </div>

      <div class="field">
        <label>Cliente</label>
        <select id="saleClient">
          ${clients.map(c=>`<option value="${c.id}" ${(edit?.clientId===c.id)?"selected":""}>${escapeHtml(c.code)} â€¢ ${escapeHtml(c.name)}</option>`).join("")}
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
      if(!title || !clientId) return toast("Preencha tÃ­tulo e cliente.");

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
        toast("Venda excluÃ­da.");
        closeDrawer(); rerender();
      };
    }
  },0);
}

// ===== PLACEHOLDER: openClientForm migrada para views/clients.js =====
  function openClientForm(clientId = null) {
    console.log('openClientForm placeholder - serï¿½ sobrescrita');
  }

  // ===== PLACEHOLDER: viewClients migrada para views/clients.js =====
  function viewClients(){
    setTitle("Clientes", "Carregando...");
    $("#content").innerHTML = `<div class="card"><div class="hint">Carregando mÃ³dulo de clientes...</div></div>`; 
  }

  // ===== PLACEHOLDER: viewProjects migrada para views/projects.js =====
  function viewProjects(){
    setTitle("Projetos", "Carregando...");
    $("#content").innerHTML = `<div class="card"><div class="hint">Carregando mÃ³dulo de projetos...</div></div>`; 
  }

  // ===== PLACEHOLDER: viewExpenses migrada para views/expenses.js =====
  function viewExpenses(){}

  // ===== PLACEHOLDER: viewReimbursements migrada para views/reimbursements.js =====
  function viewReimbursements(){ 
    setTitle("Reembolsos", "Carregando...");
    $("#content").innerHTML = `<div class="card"><div class="hint">Carregando mÃ³dulo de reembolsos...</div></div>`;
  }

  // ===== PLACEHOLDER: viewInvoices migrada para views/invoices.js =====
  function viewInvoices(){
    setTitle("Notas Fiscais", "Carregando...");
    $("#content").innerHTML = `<div class="card"><div class="hint">Carregando mÃ³dulo de notas fiscais...</div></div>`;
  }

  function viewUsers(){
    // MIGRADO PARA views/users.js (API)
    console.warn("viewUsers() - placeholder em views.js. Carregue views/users.js");
  }


  function viewSettings(){
  if(!isMaster()) return viewExpenses();

  setTitle("ConfiguraÃ§Ãµes", "Sinaleiro de custo + opÃ§Ã£o de vÃ­nculo projeto");

  const { tenant } = NFStore.getSession();
  const redPct = tenantIndicatorPct(); // reusa o campo atual como "limite vermelho"

  $("#content").innerHTML = `
    <div class="card">
      <h3>ConfiguraÃ§Ãµes do tenant</h3>
      <div class="hr"></div>

      <div class="split">
          <div class="field">
  <label>Limite vermelho (crÃ­tico)</label>
  <div class="input-suffix">
    <input id="setRedPct" type="number" step="1" min="0" max="100"
           value="${Math.round((redPct ?? 0.45) * 100)}"/>
    <span class="suffix">%</span>

   
</div>

          <div class="hint">
            Regras do sinaleiro:
            <ul style="margin:8px 0 0 18px">
              <li><strong>ðŸŸ¢ Verde</strong>: custo real â‰¤ custo previsto</li>
              <li><strong>ðŸŸ¡ Amarelo</strong>: custo real &gt; previsto e â‰¤ limite vermelho</li>
              <li><strong>ðŸ”´ Vermelho</strong>: custo real &gt; limite vermelho</li>
            </ul>
          </div>
        </div>

        <div class="field">
          <label>Exigir vÃ­nculo usuÃ¡rio x projeto</label>
          <select id="setLink">
            <option value="false" ${!requireProjectLink()?"selected":""}>NÃ£o (liberar projetos)</option>
            <option value="true" ${requireProjectLink()?"selected":""}>Sim (restringir para operador)</option>
          </select>
          <div class="hint">Quando ligado, operador sÃ³ enxerga projetos vinculados.</div>
        </div>
      </div>

      <div class="row">
        <button class="btn primary" id="setSave">Salvar</button>
        <span style="flex:1"></span>
        <button class="btn" id="setLinks">Gerenciar vÃ­nculos</button>
        <button class="btn" id="setSrv">Cadastro de serviÃ§os</button>
      </div>
    </div>
  `;

  $("#setSave").onclick = ()=>{
    const redPctUI = Number($("#setRedPct").value || 45); // ex: 45
    tenant.settings.indicatorPct = redPctUI / 100;       // salva 0.45

    const link = $("#setLink").value === "true";

    tenant.settings.requireProjectLink = link;

    saveDB();
    NFStore.audit("SETTINGS_UPDATE", JSON.stringify(tenant.settings));
    toast("ConfiguraÃ§Ãµes salvas.");
    rerender();
  };

  $("#setLinks").onclick = ()=>openUserLinks();
  $("#setSrv").onclick = ()=>openServiceForm();
}


  function viewAudit(){
    // MIGRADO PARA views/audit.js (API)
    console.warn("viewAudit() - placeholder em views.js. Carregue views/audit.js");
  }

  // ========= ExposiÃ§Ã£o das views =========


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
        <div class="hint">Mock local: senha padrÃ£o <span class="mono">123456</span> (seed).</div>
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
              placeholder="******"
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


    $("#lgGo").onclick = async (e)=>{
      e.preventDefault();

      const email = ($("#lgEmail").value || "").trim();
      const password = ($("#lgPass").value || "").trim();
      if(!email || !password) return NFUI.toast("Preencha email e senha.");

      const btnEl = $("#lgGo");
      const msgEl = $("#lgMsg");
      
      // Disable button durante login
      if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = "Entrando...";
      }

      try{
        const res = await NFStore.auth.login(email, password);

        if(!res?.ok){
          const msg = res?.message || "Email ou senha invÃ¡lidos.";
          if (msgEl) msgEl.textContent = msg;
          NFUI.toast(msg);
          return;
        }

        // âœ… Login bem-sucedido
        if (msgEl) msgEl.textContent = "";
        NFUI.toast("Bem-vindo! " + (NFStore.getJwtUser()?.name || ""));
        
        const home = NFStore.isMaster?.() ? "dashboard" : "reimbursements";
        // NavegaÃ§Ã£o inicial
        viewRouter(home);
        // Log temporÃ¡rio para debugging: confirmar que viewRouter foi chamado e sessÃ£o estÃ¡ disponÃ­vel
        console.log('[Login] viewRouter ->', home, 'session=', NFStore.getSession());
        // ForÃ§a atualizaÃ§Ã£o/navegaÃ§Ã£o extra para garantir que a UI reflita o novo usuÃ¡rio/tenant
        setTimeout(() => {
          try {
            viewRouter(home);
            if (typeof rerender === 'function') rerender();
            console.log('[Login] forced navigation + rerender executed');
          } catch (e) {
            console.warn('[Login] failed to force navigation:', e?.message || e);
          }
        }, 50);
        
        return;

      }catch(err){
        const msg = err?.message || "Falha no login.";
        if (msgEl) msgEl.textContent = msg;
        NFUI.toast(msg);
      } finally {
        // Re-enable button
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.textContent = "Entrar";
        }
      }
    };



  }

  function viewPending(){
    setTitle("Aguardando aprovaÃ§Ã£o", "Seu acesso estÃ¡ pendente de aprovaÃ§Ã£o pelo MASTER");
    const sess = NFStore.getSession?.();
    const u = sess?.user;

    $("#content").innerHTML = `
      <div class="card" style="max-width:720px;margin:0 auto">
        <h3 style="margin:0">Pendente de aprovaÃ§Ã£o</h3>
        <div class="hint">VocÃª jÃ¡ se cadastrou, mas ainda nÃ£o foi aprovado.</div>
        <div class="hr"></div>

        <div class="row" style="justify-content:space-between;gap:16px;flex-wrap:wrap">
          <div>
            <div><strong>UsuÃ¡rio</strong></div>
            <div>${escapeHtml(u?.name || "â€”")}</div>
            <div class="hint">${escapeHtml(u?.email || "")}</div>
          </div>
          <div>
            <div><strong>Empresa</strong></div>
            <div>${escapeHtml(sess?.tenant?.name || "â€”")}</div>
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
    // MIGRADO PARA views/invite-signup.js (API)
    console.warn("viewInviteSignup() - placeholder em views.js. Carregue views/invite-signup.js");
  }

  function viewInvitesAdmin(){
    // MIGRADO PARA views/invites.js (API)
    console.warn("viewInvitesAdmin() - placeholder em views.js. Carregue views/invites.js");
  }


  function viewDashboard() {
    setTitle("Dashboard", "Carregando...");
    $("#content").innerHTML = `<div class="card"><div class="hint">Carregando mÃ³dulo de dashboard...</div></div>`;
  }

  // ===== PLACEHOLDER: viewSales (ainda nï¿½o migrada) =====
  function viewSales() {
    setTitle("Vendas", "Placeholder");
    $("#content").innerHTML = `<div class="card"><div class="hint">mÃ³dulo de vendas ainda nï¿½o migrado</div></div>`;
  }

  // ===== PLACEHOLDER: viewUsers (ainda nï¿½o migrada) =====
  function viewUsers() {
    // MIGRADO PARA views/users.js (API)
    console.warn("viewUsers() - placeholder em views.js. Carregue views/users.js");
  }


  function viewSettings() {
    setTitle("Configuraï¿½ï¿½es", "Placeholder");
    $("#content").innerHTML = `<div class="card"><div class="hint">mÃ³dulo de configuraï¿½ï¿½es ainda nï¿½o migrado</div></div>`;
  }

  // ===== PLACEHOLDER: viewAudit (ainda nï¿½o migrada) =====
  function viewAudit() {
    setTitle("Auditoria", "Placeholder");
    $("#content").innerHTML = `<div class="card"><div class="hint">mÃ³dulo de auditoria ainda nï¿½o migrado</div></div>`;
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
    audit: viewAudit,
    bindOpenButtons: () => {} // deprecated - usar event delegation em views/index.js
  };

})(window);
