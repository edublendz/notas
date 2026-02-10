// views/reimbursements.js
// Módulo de Reembolsos - Conectado à API
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
  const viewRouter = global.NFApp?.viewRouter || (()=>{});
  const setTitle = global.setTitle || (()=>{});

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://api.notas.blendz.com.br';

  // ========= Form: Reembolso =========
  function openReimbursementForm(reimbursementRef=null){
    const reimbursementId = (reimbursementRef && typeof reimbursementRef === "object") ? reimbursementRef.id : reimbursementRef;
    const isEdit = !!reimbursementId;

    openDrawer(isEdit ? `Reembolso • ${escapeHtml(String(reimbursementId).slice(-6))}` : "Novo Reembolso", `
      <div class="card">
        <h3>${isEdit ? "Editar reembolso" : "Criar reembolso"}</h3>
        <div class="hint">Carregando dados...</div>
      </div>
    `);

    (async () => {
      try{
        const [projResp, typesResp] = await Promise.all([
          NFStore.apiFetch(`${API_BASE}/api/projects?limit=200`),
          NFStore.apiFetch(`${API_BASE}/api/reimbursement-types?limit=100`)
        ]);

        if(!projResp.ok){
          toast("Falha ao carregar projetos.");
          return;
        }

        const projPayload = await projResp.json();
        const typesPayload = typesResp.ok ? await typesResp.json() : null;
        const projects = Array.isArray(projPayload?.data) ? projPayload.data : [];
        const types = Array.isArray(typesPayload?.data) ? typesPayload.data : [];

        let reimbursement = null;
        if(isEdit){
          const r = await NFStore.apiFetch(`${API_BASE}/api/reimbursements/${reimbursementId}`);
          if(!r.ok){
            toast("Reembolso não encontrado no servidor.");
            return;
          }
          reimbursement = await r.json();
        }

        const sess = NFStore.getSession();
        const user = sess?.user || null;

        let canEdit = true;
        let editable = true;

        if(reimbursement){
          const requesterId = reimbursement.user?.id ?? null;
          const isOwner = requesterId && user && String(requesterId) === String(user.id);
          const statusName = reimbursement.status?.name || "";
          const hasInvoice = !!reimbursement.invoice;

          canEdit = isMaster() || (isOper() && isOwner);
          
          // Master pode editar qualquer status (exceto se tiver NF)
          // Operador só pode editar se status = "Enviada" E for o dono E sem NF
          if(isMaster()){
            editable = !hasInvoice;
          } else {
            editable = statusName === ST.RB_SOLICITADO && !hasInvoice && isOwner;
          }
        }

        const selectedProjectId = reimbursement?.project?.id ?? (projects[0]?.id ?? "");
        const selectedTypeId = reimbursement?.type?.id ?? (types[0]?.id ?? "");
        const dateBuy = reimbursement?.dateBuy || "";
        const value = Number(reimbursement?.value || 0);
        const description = reimbursement?.description || "";
        const statusLabel = reimbursement?.status?.name || "";

        if(projects.length === 0) {
          toast('Aviso: Nenhum projeto disponível. Verifique suas permissões.');
        }

        openDrawer(isEdit ? `Reembolso • ${escapeHtml(String(reimbursementId).slice(-6))}` : "Novo Reembolso", `
          <div class="card">
            <h3>${isEdit ? "Editar reembolso" : "Criar reembolso"}</h3>
            <div class="hint">Reembolso de despesas próprias do colaborador.</div>
            <div class="hr"></div>

            <div class="field">
              <label>Projeto</label>
              <select id="rmbProject" ${!canEdit||!editable?"disabled":""}>
                ${projects.length > 0 ? projects.map(p=>`<option value="${p.id}" ${String(selectedProjectId)===String(p.id)?"selected":""}>${escapeHtml(p.code)} • ${escapeHtml(p.name)}</option>`).join("") : '<option value="">Nenhum projeto disponível</option>'}
              </select>
            </div>

            <div class="field">
              <label>Tipo</label>
              <select id="rmbType" ${!canEdit||!editable?"disabled":""}>
                ${types.length ? types.map(t=>`<option value="${t.id}" ${String(selectedTypeId)===String(t.id)?"selected":""}>${escapeHtml(t.name)}</option>`).join("") : '<option value="">Carregando...</option>'}
              </select>
            </div>

            <div class="split">
              <div class="field">
                <label>Data da despesa</label>
                <input id="rmbDate" type="date" value="${escapeHtml(dateBuy||"")}" ${!canEdit||!editable?"disabled":""}/>
              </div>
              <div class="field">
                <label>Valor</label>
                <input id="rmbValue" type="number" step="0.01" value="${Number(value||0)}" ${!canEdit||!editable?"disabled":""}/>
              </div>
            </div>

            <div class="field">
              <label>Descrição</label>
              <textarea id="rmbDesc" rows="3" placeholder="Descreva a despesa" ${!canEdit||!editable?"disabled":""}>${escapeHtml(description||"")}</textarea>
            </div>

            <div class="row">
              ${isEdit ? `<span class="chip gray">${escapeHtml(statusLabel||"")}</span>` : ``}
              <span style="flex:1"></span>
              ${canEdit && editable ? `<button class="btn primary" id="rmbSave">${isEdit?"Salvar":"Criar"}</button>` : ``}
              <button class="btn" id="rmbClose">Fechar</button>
            </div>

            ${reimbursement && isMaster() && !reimbursement.invoice && statusLabel === ST.RB_SOLICITADO ? `
              <div class="hr"></div>
              <div class="row">
                <button class="btn" id="rmbApprove">Aprovar</button>
                <button class="btn danger" id="rmbReject">Reprovar</button>
              </div>
            `:``}
          </div>
        `);

        setTimeout(()=>{
          $("#rmbClose").onclick = ()=>closeDrawer();

          if(canEdit && editable && $("#rmbSave")){
            $("#rmbSave").onclick = async ()=>{
              // Lê valores - se campo disabled ou não responde, busca option selected
              const projectSelect = document.querySelector("#rmbProject");
              const typeSelect = document.querySelector("#rmbType");
              
              // FORÇAR leitura pelo selectedIndex (mais confiável que .value)
              let projectId = "";
              let typeId = "";
              
              if(projectSelect && projectSelect.selectedIndex >= 0) {
                projectId = projectSelect.options[projectSelect.selectedIndex]?.value || "";
              }
              if(typeSelect && typeSelect.selectedIndex >= 0) {
                typeId = typeSelect.options[typeSelect.selectedIndex]?.value || "";
              }
              
              const dt = (document.querySelector("#rmbDate")?.value || "").trim();
              const val = Number(document.querySelector("#rmbValue")?.value || 0);
              const desc = (document.querySelector("#rmbDesc")?.value || "").trim();

              if(!projectId || !typeId || !dt || !val || !desc){
                return toast("Preencha projeto, tipo, data, valor e descrição.");
              }

              const body = {
                projectId: Number(projectId),
                typeId: Number(typeId),
                dateBuy: dt,
                value: val,
                description: desc
              };

              if(!isEdit && user?.id){
                body.userId = user.id;
                // Criar com status "Solicitado" (id: 2 conforme dados mostrados)
                body.statusId = 2;
              }

              try{
                const url = isEdit
                  ? `${API_BASE}/api/reimbursements/${reimbursementId}`
                  : `${API_BASE}/api/reimbursements`;
                const method = isEdit ? 'PUT' : 'POST';

                const resp = await NFStore.apiFetch(url, {
                  method,
                  body: JSON.stringify(body)
                });

                if(!resp.ok){
                  let msg = isEdit ? "Falha ao salvar reembolso." : "Falha ao criar reembolso.";
                  try{
                    const err = await resp.json();
                    if(err?.message) msg = err.message;
                    else if(err?.error) msg = err.error;
                  }catch(_){ }
                  toast(msg);
                  return;
                }

                NFStore.audit(isEdit ? "REIMBURSEMENT_UPDATE" : "REIMBURSEMENT_CREATE", String(reimbursementId || ""));
                toast(isEdit ? "Reembolso atualizado." : "Reembolso criado.");
                closeDrawer();
                viewReimbursements();
              }catch(e){
                toast(isEdit ? "Erro ao salvar reembolso." : "Erro ao criar reembolso.");
              }
            };
          }

          if(reimbursement && isMaster() && !reimbursement.invoice && statusLabel === ST.RB_SOLICITADO){
            $("#rmbApprove") && ($("#rmbApprove").onclick = async ()=>{
              try{
                const r = await NFStore.apiFetch(`${API_BASE}/api/reimbursements/${reimbursementId}/approve`, { method:'POST' });
                if(!r.ok){
                  let msg = "Falha ao aprovar reembolso.";
                  try{
                    const err = await r.json();
                    if(err?.message) msg = err.message;
                    else if(err?.error) msg = err.error;
                  }catch(_){ }
                  toast(msg);
                  return;
                }
                NFStore.audit("REIMBURSEMENT_APPROVE", String(reimbursementId));
                toast("Aprovado.");
                closeDrawer();
                viewReimbursements();
              }catch(e){
                toast("Erro ao aprovar reembolso.");
              }
            });

            $("#rmbReject") && ($("#rmbReject").onclick = async ()=>{
              try{
                const r = await NFStore.apiFetch(`${API_BASE}/api/reimbursements/${reimbursementId}/reject`, { method:'POST' });
                if(!r.ok){
                  let msg = "Falha ao reprovar reembolso.";
                  try{
                    const err = await r.json();
                    if(err?.message) msg = err.message;
                    else if(err?.error) msg = err.error;
                  }catch(_){ }
                  toast(msg);
                  return;
                }
                NFStore.audit("REIMBURSEMENT_REJECT", String(reimbursementId));
                toast("Reprovado.");
                closeDrawer();
                viewReimbursements();
              }catch(e){
                toast("Erro ao reprovar reembolso.");
              }
            });
          }
        },0);
      }catch(e){
        toast("Erro ao carregar dados do reembolso.");
      }
    })();
  }

  // ========= View: Listagem de Reembolsos com Paginação =========
  function viewReimbursements(){
    setTitle("Reembolsos", isOper() ? "Você vê somente seus reembolsos" : "Master aprova/reprova e vê tudo");
    const month = DB().ui.month;
    const statuses = ["", ST.RB_SOLICITADO, ST.RB_APROVADO, ST.RB_REPROVADO];

    const qStatus = DB().ui.rmbStatus || "";
    const qProject = DB().ui.rmbProjectId || "";
    const qRequester = DB().ui.rmbRequesterId || "";

    const content = $("#content");
    if (!content) return;

    // Layout inicial com loading animado
    content.innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Reembolsos</h3>
          <div class="row">
            <button class="btn primary" id="rmbNew">+ Novo reembolso</button>
          </div>
        </div>
        <div class="spacer"></div>
        ${monthControlsHtml(month)}
        <div class="hr"></div>
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Carregando reembolsos...</div>
        </div>
      </div>
    `;

    bindMonthControls((delta) => {
      const db = DB();
      if (delta === "now") db.ui.month = monthKeyFromDate(new Date());
      else db.ui.month = monthShift(db.ui.month, delta);
      db.ui.rmbPage = 1;
      saveDB();
      window.NFApp?.rerender?.();
    });

    $("#rmbNew").onclick = ()=>openReimbursementForm();

    (async () => {
      try{
        const resp = await NFStore.apiFetch(`${API_BASE}/api/reimbursements?limit=200`);
        if(!resp.ok){
          content.innerHTML = `<div class="card"><div class="hint">Falha ao carregar reembolsos.</div></div>`;
          return;
        }

        const payload = await resp.json();
        const allReimbursements = Array.isArray(payload?.data) ? payload.data : [];

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
        const normalized = allReimbursements.map(d => ({
          ...d,
          statusStr: typeof d.status === 'string' ? d.status : (d.status?.name || d.status?.title || ""),
          projectIdStr: String(d.project?.id || ""),
          requesterIdStr: String(d.user?.id || "")
        }));

        // Filtrar reembolsos por mês
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
        const currentPage = DB().ui.rmbPage || 1;
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const paginatedItems = filtered.slice(startIdx, endIdx);

        content.innerHTML = `
          <div class="card">
            <div class="row" style="justify-content:space-between">
              <h3 style="margin:0">Reembolsos</h3>
              <div class="row">
                <button class="btn primary" id="rmbNew">+ Novo reembolso</button>
              </div>
            </div>
            <div class="spacer"></div>
            ${monthControlsHtml(month)}
            <div class="hr"></div>

            <div class="row" style="flex-wrap:wrap;align-items:flex-end;gap:8px">
              <div class="field" style="min-width:240px">
                <label>Status</label>
                <select id="rmbStatus">
                  ${statuses.map(s=>`<option value="${escapeHtml(s)}" ${qStatus===s?'selected':''}>${escapeHtml(s||"Todos")}</option>`).join("")}
                </select>
              </div>

              <div class="field" style="min-width:260px">
                <label>Projeto</label>
                <select id="rmbFilterProject">
                  <option value="">Todos</option>
                  ${projects.map(p=>`<option value="${p.id}" ${String(qProject)===String(p.id)?'selected':''}>${escapeHtml(p.code)} • ${escapeHtml(p.name)}</option>`).join("")}
                </select>
              </div>

              <div class="field" style="min-width:260px">
                <label>Solicitante</label>
                <select id="rmbFilterRequester">
                  <option value="">Todos</option>
                  ${allUsers.map(u=>`<option value="${u.id}" ${String(qRequester)===String(u.id)?'selected':''}>${escapeHtml(u.name)} • ${escapeHtml(u.email)}</option>`).join("")}
                </select>
              </div>

              <div class="field" style="align-self:flex-end">
                <button class="btn" id="rmbClear">Limpar</button>
              </div>

              <span style="flex:1"></span>
            </div>

            <div class="hr"></div>
            
            ${filtered.length > 0 ? `
              <div style="padding:8px 0;color:var(--muted);font-size:13px">
                Mostrando ${startIdx + 1}-${Math.min(endIdx, filtered.length)} de ${filtered.length} reembolsos
              </div>
              <div class="table-scroll-x"><table class="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Projeto</th>
                    <th>Solicitante</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th class="right">Valor</th>
                    <th>Status</th>
                    <th class="right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${paginatedItems.map(d=>{
                    const proj = d.project || {};
                    const user = d.user || {};
                    const typeObj = d.type || {};

                    const dateBuy = d.dateBuy || "—";
                    const description = d.description || "—";
                    const value = d.value || 0;
                    const status = d.statusStr || "";

                    return `
                      <tr>
                        <td>${escapeHtml(dateBuy)}</td>
                        <td><span class="mono">${escapeHtml(proj.code||"—")}</span><div class="hint">${escapeHtml(proj.name||"")}</div></td>
                        <td>
                          ${escapeHtml(user.name || "—")}
                          <div class="hint">${escapeHtml(user.email || "")}</div>
                        </td>
                        <td>${escapeHtml(typeObj.name || "—")}</td>
                        <td>${escapeHtml(description)}</td>
                        <td class="right">${fmtBRL(value)}</td>
                        <td>${chipStatus(status)}</td>
                        <td class="left">
                          <div class="row" style="gap:8px;flex-wrap:wrap">
                            ${isMaster() ? `
                              <button class="btn small" data-rmb-approve="${d.id}" ${status!==ST.RB_SOLICITADO ? "disabled":""}>
                                Aprovar
                              </button>
                              <button class="btn small danger" data-rmb-reject="${d.id}"
                                ${status!==ST.RB_SOLICITADO ? "disabled":""}>
                                Reprovar
                              </button>
                            ` : ``}
                            <button class="btn small" data-open="reimbursement" data-id="${d.id}">Abrir</button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table></div>
              ${totalPages > 1 ? `
                <div class="hr"></div>
                <div class="row" style="justify-content:center;gap:8px;padding:12px 0">
                  <button class="btn small" id="rmbPagePrev" ${currentPage <= 1 ? 'disabled' : ''}>← Anterior</button>
                  <span style="color:var(--muted);font-size:13px;padding:0 12px">Página ${currentPage} de ${totalPages}</span>
                  <button class="btn small" id="rmbPageNext" ${currentPage >= totalPages ? 'disabled' : ''}>Próxima →</button>
                </div>
              ` : ``}
            ` : `<div class="empty">Sem reembolsos neste mês (ou sem permissão).</div>`}
          </div>
        `;

        // Rebind após recriar HTML
        bindMonthControls((delta) => {
          const db = DB();
          if (delta === "now") db.ui.month = monthKeyFromDate(new Date());
          else db.ui.month = monthShift(db.ui.month, delta);
          db.ui.rmbPage = 1;
          saveDB();
          window.NFApp?.rerender?.();
        });

        $("#rmbNew").onclick = ()=>openReimbursementForm();

        const apply = () => viewReimbursements();

        if($("#rmbStatus")) $("#rmbStatus").onchange = (e)=>{ DB().ui.rmbStatus = e.target.value; DB().ui.rmbPage = 1; saveDB(); apply(); };
        if($("#rmbFilterProject")) $("#rmbFilterProject").onchange = (e)=>{ DB().ui.rmbProjectId = e.target.value; DB().ui.rmbPage = 1; saveDB(); apply(); };
        if($("#rmbFilterRequester")) $("#rmbFilterRequester").onchange = (e)=>{ DB().ui.rmbRequesterId = e.target.value; DB().ui.rmbPage = 1; saveDB(); apply(); };

        if($("#rmbClear")) $("#rmbClear").onclick = ()=>{
          DB().ui.rmbStatus = "";
          DB().ui.rmbProjectId = "";
          DB().ui.rmbRequesterId = "";
          DB().ui.rmbPage = 1;
          saveDB();
          apply();
        };

        // Paginação
        if($("#rmbPagePrev")) $("#rmbPagePrev").onclick = ()=>{
          if(currentPage > 1){
            DB().ui.rmbPage = currentPage - 1;
            saveDB();
            apply();
          }
        };
        if($("#rmbPageNext")) $("#rmbPageNext").onclick = ()=>{
          if(currentPage < totalPages){
            DB().ui.rmbPage = currentPage + 1;
            saveDB();
            apply();
          }
        };

        // Aprovar via API
        $$("[data-rmb-approve]").forEach(b=>{
          b.onclick = async ()=>{
            try{
              const id = b.dataset.rmbApprove;
              const resp = await NFStore.apiFetch(`${API_BASE}/api/reimbursements/${id}/approve`, {
                method: 'POST'
              });

              if(!resp.ok){
                let msg = "Falha ao aprovar reembolso.";
                try{
                  const err = await resp.json();
                  if(err?.message) msg = err.message;
                  else if(err?.error) msg = err.error;
                }catch(_){ }
                toast(msg);
                return;
              }

              NFStore.audit("REIMBURSEMENT_APPROVE", String(id));
              toast("Reembolso aprovado.");
              apply();
            }catch(e){
              toast(e?.message || "Falha ao aprovar.");
            }
          };
        });

        // Reprovar via API
        $$("[data-rmb-reject]").forEach(b=>{
          b.onclick = async ()=>{
            try{
              const id = b.dataset.rmbReject;
              const resp = await NFStore.apiFetch(`${API_BASE}/api/reimbursements/${id}/reject`, {
                method: 'POST'
              });

              if(!resp.ok){
                let msg = "Falha ao reprovar reembolso.";
                try{
                  const err = await resp.json();
                  if(err?.message) msg = err.message;
                  else if(err?.error) msg = err.error;
                }catch(_){ }
                toast(msg);
                return;
              }

              NFStore.audit("REIMBURSEMENT_REJECT", String(id));
              toast("Reembolso reprovado.");
              apply();
            }catch(e){
              toast(e?.message || "Falha ao reprovar.");
            }
          };
        });

      }catch(e){
        console.error(e);
        content.innerHTML = `<div class="card"><div class="hint">Erro ao carregar reembolsos: ${escapeHtml(e?.message||"")}</div></div>`;
      }
    })();
  }

  // Exporta para uso global
  global.NFViewsReimbursements = {
    viewReimbursements,
    openReimbursementForm
  };

})(window);
