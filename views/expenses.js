// views/expenses.js
// Módulo de Despesas (OSs) - Conectado à API
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
  const chipStatus = NFUI.chipStatus;
  const monthControlsHtml = NFUI.monthControlsHtml;
  const bindMonthControls = NFUI.bindMonthControls;
  const toast = NFUI.toast;
  const openDrawer = NFUI.openDrawer;
  const closeDrawer = NFUI.closeDrawer;
  
  const monthKeyFromDate = NFStore.monthKeyFromDate;
  const monthShift = NFStore.monthShift;
  const visibleServices = NFStore.visibleServices;
  const viewRouter = global.NFApp?.viewRouter || (()=>{});
  const rerender = global.NFApp?.rerender || (()=>{});
  const setTitle = global.setTitle || (()=>{});

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://api.notas.blendz.com.br';

  // ========= Form: Despesa (OS) =========
  function openExpenseForm(expenseRef=null){
    const expenseId = (expenseRef && typeof expenseRef === "object") ? expenseRef.id : expenseRef;
    const isEdit = !!expenseId;

    openDrawer(isEdit ? `OS • ${escapeHtml(String(expenseId).slice(-6))}` : "Nova OS", `
      <div class="card">
        <h3>${isEdit ? "Editar despesa" : "Criar despesa"}</h3>
        <div class="hint">Carregando dados...</div>
      </div>
    `);

    (async () => {
      try{
        const [projResp, srvResp] = await Promise.all([
          NFStore.apiFetch(`${API_BASE}/api/projects?limit=200`),
          NFStore.apiFetch(`${API_BASE}/api/services?limit=200`)
        ]);

        if(!projResp.ok || !srvResp.ok){
          toast("Falha ao carregar projetos/serviços.");
          return;
        }

        const projPayload = await projResp.json();
        const srvPayload  = await srvResp.json();

        const projects = Array.isArray(projPayload?.data) ? projPayload.data : [];
        const services = Array.isArray(srvPayload?.data) ? srvPayload.data : [];

        let expense = null;
        if(isEdit){
          const r = await NFStore.apiFetch(`${API_BASE}/api/expenses/${expenseId}`);
          if(!r.ok){
            toast("OS não encontrada no servidor.");
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
          
          // Master pode editar qualquer status (exceto se tiver NF)
          // Operador só pode editar se status = "Enviada" E for o dono E sem NF
          if(isMaster()){
            editable = !hasInvoice;
          } else {
            editable = statusName === ST.OS_ENVIADA && !hasInvoice && isOwner;
          }
        }

        const selectedProjectId = expense?.project?.id ?? (projects[0]?.id ?? "");
        const selectedServiceId = expense?.service?.id ?? (services[0]?.id ?? "");
        const dateBuy = expense?.dateBuy || "";
        const value   = Number(expense?.value || 0);
        const complement = expense?.complement || "";
        const statusLabel = expense?.status?.name || "";

        openDrawer(isEdit ? `OS • ${escapeHtml(String(expenseId).slice(-6))}` : "Nova OS", `
          <div class="card">
            <h3>${isEdit ? "Editar despesa" : "Criar despesa"}</h3>
            <div class="hint">OS tem serviço + descrição complementar.</div>
            <div class="hr"></div>

            <div class="field">
              <label>Projeto</label>
              <select id="dpProject" ${!canEdit||!editable?"disabled":""}>
                ${projects.map(p=>`<option value="${p.id}" ${String(selectedProjectId)===String(p.id)?"selected":""}>${escapeHtml(p.code)} • ${escapeHtml(p.name)}</option>`).join("")}
              </select>
            </div>

            <div class="field">
              <label>Serviço</label>
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
              <label>Descrição complementar</label>
              <input id="dpComp" value="${escapeHtml(complement||"")}" placeholder="Ex: Uber aeroporto" ${!canEdit||!editable?"disabled":""}/>
            </div>

            <div class="row">
              ${isEdit ? `<span class="chip gray">${escapeHtml(statusLabel||"")}</span>` : ``}
              <span style="flex:1"></span>
              ${canEdit && editable ? `<button class="btn primary" id="dpSave">${isEdit?"Salvar":"Criar"}</button>` : ``}
              <button class="btn" id="dpClose">Fechar</button>
            </div>

            ${expense && isMaster() && !expense.invoice && statusLabel === ST.OS_ENVIADA ? `
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
                return toast("Preencha projeto, serviço, data e valor.");
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
                  ? `${API_BASE}/api/expenses/${expenseId}`
                  : `${API_BASE}/api/expenses`;
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
                viewExpenses();
              }catch(e){
                toast(isEdit ? "Erro ao salvar despesa." : "Erro ao criar despesa.");
              }
            };
          }

          if(expense && isMaster() && !expense.invoice && statusLabel === ST.OS_ENVIADA){
            $("#dpApprove") && ($("#dpApprove").onclick = async ()=>{
              try{
                const r = await NFStore.apiFetch(`${API_BASE}/api/expenses/${expenseId}/approve`, { method:'POST' });
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
                viewExpenses();
              }catch(e){
                toast("Erro ao aprovar OS.");
              }
            });

            $("#dpReject") && ($("#dpReject").onclick = async ()=>{
              try{
                const r = await NFStore.apiFetch(`${API_BASE}/api/expenses/${expenseId}/reject`, { method:'POST' });
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
                viewExpenses();
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

  // ========= Form: Serviços =========
  // DEPRECATED: Substituído por openServiceDrawer() de views/services.js (conectado à API)
  // Mantido apenas para compatibilidade temporária - delega para o drawer moderno
  function openServiceForm(){
    if(global.openServiceDrawer){
      global.openServiceDrawer();
    } else {
      toast("Drawer de serviços não disponível.");
    }
  }

  // ========= View: Listagem de Despesas com Paginação =========
  function viewExpenses(){
    setTitle("OSs", isOper() ? "Você vê somente suas despesas" : "Master aprova/reprova e vê tudo");
    const month = DB().ui.month;
    const statuses = ["", ST.OS_ENVIADA, ST.OS_APROVADA, ST.OS_REPROVADA, ST.OS_FATURADA];

    const qStatus = DB().ui.expStatus || "";
    const qProject = DB().ui.expProjectId || "";
    const qRequester = DB().ui.expRequesterId || "";

    const content = $("#content");
    if (!content) return;

    // Layout inicial com loading animado
    content.innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">OSs</h3>
          <div class="row">
            <button class="btn" id="srvManage">${isMaster() ? "Serviços" : "Ver serviços"}</button>
            <button class="btn primary" id="dpNew">+ Nova despesa</button>
          </div>
        </div>
        <div class="spacer"></div>
        ${monthControlsHtml(month)}
        <div class="hr"></div>
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Carregando despesas...</div>
        </div>
      </div>
    `;

    bindMonthControls((delta) => {
      const db = DB();
      if (delta === "now") db.ui.month = monthKeyFromDate(new Date());
      else db.ui.month = monthShift(db.ui.month, delta);
      db.ui.expPage = 1;
      saveDB();
      window.NFApp?.rerender?.();
    });

    $("#dpNew").onclick = ()=>openExpenseForm();

    (async () => {
      try{
        const resp = await NFStore.apiFetch(`${API_BASE}/api/expenses?limit=200`);
        if(!resp.ok){
          content.innerHTML = `<div class="card"><div class="hint">Falha ao carregar despesas.</div></div>`;
          return;
        }

        const payload = await resp.json();
        const allExpenses = Array.isArray(payload?.data) ? payload.data : [];

        // Buscar projetos e usuários para filtros
        const [projResp, usersResp] = await Promise.all([
          NFStore.apiFetch(`${API_BASE}/api/projects?limit=200`),
          NFStore.apiFetch(`${API_BASE}/api/users?limit=200`)
        ]);

        const projPayload = projResp.ok ? await projResp.json() : null;
        const usersPayload = usersResp.ok ? await usersResp.json() : null;

        const projects = Array.isArray(projPayload?.data) ? projPayload.data : [];
        const allUsers = Array.isArray(usersPayload?.data) ? usersPayload.data : [];

        // Normalizar dados antes de filtrar
        const normalized = allExpenses.map(d => ({
          ...d,
          statusStr: typeof d.status === 'string' ? d.status : (d.status?.name || d.status?.title || ""),
          projectIdStr: String(d.project?.id || ""),
          requesterIdStr: String(d.requester?.id || "")
        }));

        // Filtrar despesas por mês
        let filtered = normalized.filter(d => {
          const dateBuy = d.date_buy || d.dateBuy || "";
          if (!dateBuy) return false;
          const expMonth = dateBuy.substring(0, 7); // YYYY-MM
          return expMonth === month;
        });

        // Aplicar filtros
        if (qStatus) {
          filtered = filtered.filter(d => d.statusStr === qStatus);
        }
        if (qProject) {
          filtered = filtered.filter(d => d.projectIdStr === String(qProject));
        }
        if (qRequester) {
          filtered = filtered.filter(d => d.requesterIdStr === String(qRequester));
        }

        // Paginação
        const itemsPerPage = 50;
        const currentPage = DB().ui.expPage || 1;
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const paginatedItems = filtered.slice(startIdx, endIdx);

        content.innerHTML = `
          <div class="card">
            <div class="row" style="justify-content:space-between">
              <h3 style="margin:0">OSs</h3>
              <div class="row">
                <button class="btn" id="srvManage">${isMaster() ? "Serviços" : "Ver serviços"}</button>
                <button class="btn primary" id="dpNew">+ Nova despesa</button>
              </div>
            </div>
            <div class="spacer"></div>
            ${monthControlsHtml(month)}
            <div class="hr"></div>

            <div class="row" style="flex-wrap:wrap;align-items:flex-end;gap:8px">
              <div class="field" style="min-width:240px">
                <label>Status</label>
                <select id="expStatus">
                  ${statuses.map(s=>`<option value="${escapeHtml(s)}" ${qStatus===s?'selected':''}>${escapeHtml(s||"Todos")}</option>`).join("")}
                </select>
              </div>

              <div class="field" style="min-width:260px">
                <label>Projeto</label>
                <select id="expProject">
                  <option value="">Todos</option>
                  ${projects.map(p=>`<option value="${p.id}" ${String(qProject)===String(p.id)?'selected':''}>${escapeHtml(p.code)} • ${escapeHtml(p.name)}</option>`).join("")}
                </select>
              </div>

              <div class="field" style="min-width:260px">
                <label>Solicitante</label>
                <select id="expRequester">
                  <option value="">Todos</option>
                  ${allUsers.map(u=>`<option value="${u.id}" ${String(qRequester)===String(u.id)?'selected':''}>${escapeHtml(u.name)} • ${escapeHtml(u.email)}</option>`).join("")}
                </select>
              </div>

              <div class="field" style="align-self:flex-end">
                <button class="btn" id="expClear">Limpar</button>
              </div>

              <span style="flex:1"></span>
            </div>

            <div class="hr"></div>
            
            ${filtered.length > 0 ? `
              <div style="padding:8px 0;color:var(--muted);font-size:13px">
                Mostrando ${startIdx + 1}-${Math.min(endIdx, filtered.length)} de ${filtered.length} despesas
              </div>
              <table class="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Projeto</th>
                    <th>Solicitante</th>
                    <th>Serviço</th>
                    <th>Complemento</th>
                    <th class="right">Valor</th>
                    <th>Status</th>
                    <th class="right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${paginatedItems.map(d=>{
                    // Debug: verificar estrutura
                    if(!d.project) console.warn("Despesa sem projeto:", d);
                    
                    // API já retorna project completo, não precisa buscar
                    const proj = d.project || {};
                    const srv = d.service || {};
                    const req = d.requester || {};

                    const dateBuy = d.dateBuy || "—";
                    const complement = d.complement || "—";
                    const value = d.value || 0;
                    const status = d.statusStr || "";

                    return `
                      <tr>
                        <td>${escapeHtml(dateBuy)}</td>
                        <td><span class="mono">${escapeHtml(proj.code||"—")}</span><div class="hint">${escapeHtml(proj.name||"")}</div></td>
                        <td>
                          ${escapeHtml(req.name || "—")}
                          <div class="hint">${escapeHtml(req.email || "")}</div>
                        </td>
                        <td>${escapeHtml(srv.name||"—")}</td>
                        <td>${escapeHtml(complement)}</td>
                        <td class="right">${fmtBRL(value)}</td>
                        <td>${chipStatus(status)}</td>
                        <td class="left">
                          <div class="row" style="gap:8px;flex-wrap:wrap">
                            ${isMaster() ? `
                              <button class="btn small" data-os-approve="${d.id}" ${status!==ST.OS_ENVIADA ? "disabled":""}>
                                Aprovar
                              </button>
                              <button class="btn small danger" data-os-reject="${d.id}"
                                ${status!==ST.OS_ENVIADA ? "disabled":""}>
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
              ${totalPages > 1 ? `
                <div class="hr"></div>
                <div class="row" style="justify-content:center;gap:8px;padding:12px 0">
                  <button class="btn small" id="expPagePrev" ${currentPage <= 1 ? 'disabled' : ''}>← Anterior</button>
                  <span style="color:var(--muted);font-size:13px;padding:0 12px">Página ${currentPage} de ${totalPages}</span>
                  <button class="btn small" id="expPageNext" ${currentPage >= totalPages ? 'disabled' : ''}>Próxima →</button>
                </div>
              ` : ``}
            ` : `<div class="empty">Sem despesas neste mês (ou sem permissão).</div>`}
          </div>
        `;

        // Rebind após recriar HTML
        bindMonthControls((delta) => {
          const db = DB();
          if (delta === "now") db.ui.month = monthKeyFromDate(new Date());
          else db.ui.month = monthShift(db.ui.month, delta);
          db.ui.expPage = 1;
          saveDB();
          window.NFApp?.rerender?.();
        });

        $("#dpNew").onclick = ()=>openExpenseForm();
        $("#srvManage").onclick = ()=>{ if(global.openServiceDrawer) global.openServiceDrawer(); };
         
        const apply = () => viewExpenses();

        if($("#expStatus")) $("#expStatus").onchange = (e)=>{ DB().ui.expStatus = e.target.value; DB().ui.expPage = 1; saveDB(); apply(); };
        if($("#expProject")) $("#expProject").onchange = (e)=>{ DB().ui.expProjectId = e.target.value; DB().ui.expPage = 1; saveDB(); apply(); };
        if($("#expRequester")) $("#expRequester").onchange = (e)=>{ DB().ui.expRequesterId = e.target.value; DB().ui.expPage = 1; saveDB(); apply(); };

        if($("#expClear")) $("#expClear").onclick = ()=>{
          DB().ui.expStatus = "";
          DB().ui.expProjectId = "";
          DB().ui.expRequesterId = "";
          DB().ui.expPage = 1;
          saveDB();
          apply();
        };

        // Paginação
        if($("#expPagePrev")) $("#expPagePrev").onclick = ()=>{
          if(currentPage > 1){
            DB().ui.expPage = currentPage - 1;
            saveDB();
            apply();
          }
        };
        if($("#expPageNext")) $("#expPageNext").onclick = ()=>{
          if(currentPage < totalPages){
            DB().ui.expPage = currentPage + 1;
            saveDB();
            apply();
          }
        };

        // Aprovar via API
        $$("[data-os-approve]").forEach(b=>{
          b.onclick = async ()=>{
            try{
              const id = b.dataset.osApprove;
              const resp = await NFStore.apiFetch(`${API_BASE}/api/expenses/${id}/approve`, {
                method: 'POST'
              });

              if(!resp.ok){
                let msg = "Falha ao aprovar OS.";
                try{
                  const err = await resp.json();
                  if(err?.message) msg = err.message;
                  else if(err?.error) msg = err.error;
                }catch(_){ }
                toast(msg);
                return;
              }

              NFStore.audit("EXPENSE_APPROVE", String(id));
              toast("OS aprovada.");
              apply();
            }catch(e){
              toast(e?.message || "Falha ao aprovar.");
            }
          };
        });

        // Reprovar via API
        $$("[data-os-reject]").forEach(b=>{
          b.onclick = async ()=>{
            try{
              const id = b.dataset.osReject;
              const resp = await NFStore.apiFetch(`${API_BASE}/api/expenses/${id}/reject`, {
                method: 'POST'
              });

              if(!resp.ok){
                let msg = "Falha ao reprovar OS.";
                try{
                  const err = await resp.json();
                  if(err?.message) msg = err.message;
                  else if(err?.error) msg = err.error;
                }catch(_){ }
                toast(msg);
                return;
              }

              NFStore.audit("EXPENSE_REJECT", String(id));
              toast("OS reprovada.");
              apply();
            }catch(e){
              toast(e?.message || "Falha ao reprovar.");
            }
          };
        });

      }catch(e){
        console.error(e);
        content.innerHTML = `<div class="card"><div class="hint">Erro ao carregar despesas: ${escapeHtml(e?.message||"")}</div></div>`;
      }
    })();
  }

  // Exporta para uso global
  global.NFViewsExpenses = {
    viewExpenses,
    openExpenseForm,
    openServiceForm
  };

})(window);
