// views/invoices.js
// Módulo de Notas Fiscais - Conectado à API
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

  // ========= Form: Nota Fiscal =========
  function openInvoiceForm(invoiceRef=null){
    const invoiceId = (invoiceRef && typeof invoiceRef === "object") ? invoiceRef.id : invoiceRef;
    const isEdit = !!invoiceId;

    openDrawer(isEdit ? `NF • ${String(invoiceId).slice(-6)}` : "Nova Nota Fiscal", `
      <div class="card">
        <h3>${isEdit ? "Editar Nota Fiscal" : "Criar Nota Fiscal"}</h3>
        <div class="hint">Carregando dados...</div>
      </div>
    `);

    (async () => {
      try{
        const sess = NFStore.getSession();
        const user = sess?.user || null;

        let invoice = null;
        let selectedExpenses = [];
        
        if(isEdit){
          const r = await NFStore.apiFetch(`${API_BASE}/api/invoices/${invoiceId}`);
          if(!r.ok){
            toast("Nota fiscal não encontrada no servidor.");
            return;
          }
          invoice = await r.json();
          selectedExpenses = Array.isArray(invoice.expenses) ? invoice.expenses.map(e => e.id) : [];
        }

        // Buscar OS aprovadas disponíveis
        const expResp = await NFStore.apiFetch(`${API_BASE}/api/expenses?limit=199`);
        if(!expResp.ok){
          toast("Falha ao carregar despesas.");
          return;
        }

        const expPayload = await expResp.json();
        const allExpenses = Array.isArray(expPayload?.data) ? expPayload.data : [];

        // Filtrar OS aprovadas (status "Aprovado") + as já vinculadas a esta NF
        const eligibleExpenses = allExpenses.filter(exp => {
          const statusName = exp.status?.name || "";
          const hasInvoice = !!exp.invoice;
          const isLinkedToThis = invoice && exp.invoice?.id === invoice.id;
          
          // Mostrar se: (Aprovado E sem NF) OU (já vinculado a esta NF)
          return (statusName === ST.OS_APROVADA && !hasInvoice) || isLinkedToThis;
        });

        const statusLabel = invoice?.status?.name || ST.NF_ENVIADA;
        const fileName = invoice?.fileName || "";
        const monthComp = invoice?.monthCompetency || "";
        const monthIssue = invoice?.monthIssue || "";

        // Calcular total baseado nas OS selecionadas
        let total = 0;
        let items = [];
        
        if(invoice && invoice.items) {
          items = invoice.items;
          total = items.reduce((sum, it) => sum + Number(it.value || 0), 0);
        }

        const editable = !invoice || (isMaster() && statusLabel === ST.NF_ENVIADA);

        openDrawer(isEdit ? `NF • ${escapeHtml(invoice.code || String(invoiceId).slice(-6))}` : "Nova Nota Fiscal", `
          <div class="card">
            <h3>${isEdit ? "Editar Nota Fiscal" : "Criar Nota Fiscal"}</h3>
            <div class="hint">Vincule OS aprovadas para gerar a nota fiscal.</div>
            <div class="hr"></div>

            <div class="field">
              <!-- Campo de URL da nota fiscal oculto -->
              <input id="nfFileName" type="hidden" value="${escapeHtml(fileName)}" />
              <div class="field">
                <label>Arquivo da Nota Fiscal</label>
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
                  ${isEdit
                    ? (fileName
                        ? `<a href="${escapeHtml(fileName)}" target="_blank" class="btn small" style="text-decoration:none">Baixar arquivo</a>`
                        : `<span style="color:#c00;font-size:13px">Sem arquivo</span>`)
                    : ""}
                </div>
                <label class="custom-file-upload" id="nfFileUploadLabel">
                  <span class="icon">📎</span>
                  <span id="nfFileUploadText">Selecionar arquivo</span>
                  <input id="nfFileUpload" type="file" accept="application/pdf,image/*" ${!editable?"disabled":""}/>
                </label>
                <div id="nfFileUploadStatus" class="hint"></div>
              </div>
            </div>

            <div class="split">
              <div class="field">
                <label>Competência</label>
                <input id="nfComp" type="month" value="${escapeHtml(monthComp.slice(0,7)||"")}" ${!editable?"disabled":""}/>
              </div>
              <div class="field">
                <label>Emissão</label>
                <input id="nfIssue" type="month" value="${escapeHtml(monthIssue.slice(0,7)||"")}" ${!editable?"disabled":""}/>
              </div>
            </div>

            <div class="hr"></div>
            
            <h4>OS Aprovadas Disponíveis</h4>
            <div id="nfExpensesList" style="max-height:300px;overflow-y:auto">
              ${eligibleExpenses.length ? eligibleExpenses.map(exp => {
                const proj = exp.project || {};
                const srv = exp.service || {};
                const checked = selectedExpenses.includes(exp.id);
                const isLinkedToThis = invoice && exp.invoice?.id === invoice.id;
                const canToggle = editable && (isLinkedToThis || !exp.invoice);
                
                return `
                  <label class="card" style="padding:10px;display:flex;gap:10px;align-items:flex-start;cursor:${canToggle?'pointer':'not-allowed'}">
                    <input type="checkbox" 
                      data-exp-id="${exp.id}" 
                      data-exp-value="${exp.value||0}" 
                      data-exp-proj="${proj.id||''}" 
                      data-exp-proj-code="${escapeHtml(proj.code||'')}" 
                      data-exp-proj-name="${escapeHtml(proj.name||'')}" 
                      data-exp-srv="${srv.name||''}" 
                      ${checked?"checked":""} 
                      ${canToggle?"":"disabled"}
                    />
                    <div style="flex:1">
                      <div><strong>${escapeHtml(srv.name || "—")}</strong> ${exp.complement ? " · " + escapeHtml(exp.complement) : ""}</div>
                      <div class="hint">
                        ${escapeHtml(proj.code||"—")} · ${escapeHtml(proj.name||"")} · ${escapeHtml(exp.dateBuy||"")}
                        ${exp.invoice && exp.invoice.id !== invoiceId ? ` · <span class="chip bad">Já vinculada</span>` : ""}
                      </div>
                    </div>
                    <div><span class="chip gray">${fmtBRL(exp.value||0)}</span></div>
                  </label>
                `;
              }).join("") : '<div class="empty">Nenhuma OS aprovada disponível.</div>'}
            </div>

            <div class="hr"></div>

            <h4>Itens da NF (Automático)</h4>
            <div id="nfItemsPreview" class="card" style="padding:10px;background:var(--panel2)">
              ${items.length ? `
                <div class="table-scroll-x"><table class="table">
                  <thead>
                    <tr><th>Projeto</th><th>Descrição</th><th class="right">Valor</th></tr>
                  </thead>
                  <tbody>
                    ${items.map(it => `
                      <tr>
                        <td><span class="mono">${escapeHtml(it.project?.code||"—")}</span></td>
                        <td>${escapeHtml(it.description||"")}</td>
                        <td class="right">${fmtBRL(it.value||0)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table></div>
              ` : '<div class="empty">Nenhum item vinculado.</div>'}
            </div>

            <div class="hr"></div>

            <div class="split">
              <div class="field">
                <label>Total (automático)</label>
                <input id="nfTotal" type="number" step="0.01" value="${Number(total||0)}" disabled/>
              </div>
              <div class="field">
                <label>Status</label>
                <input id="nfStatus" value="${escapeHtml(statusLabel)}" disabled/>
              </div>
            </div>

            <div class="row">
              ${isEdit ? `<span class="chip gray">${escapeHtml(statusLabel||"")}</span>` : ``}
              <span style="flex:1"></span>
              ${editable ? `<button class="btn primary" id="nfSave">${isEdit?"Salvar":"Criar"}</button>` : ``}
              <button class="btn" id="nfClose">Fechar</button>
            </div>

            ${invoice && isMaster() && statusLabel === ST.NF_ENVIADA ? `
              <div class="hr"></div>
              <div class="row">
                <button class="btn" id="nfApprove">Aprovar</button>
                <button class="btn danger" id="nfReject">Reprovar</button>
              </div>
            `:``}

            ${invoice && isMaster() && statusLabel === ST.NF_APROVADA ? `
              <div class="hr"></div>
              <div class="row">
                <button class="btn chip ok" id="nfPay">Marcar como Paga</button>
                <button class="btn danger" id="nfReject">Reprovar</button>
              </div>
            `:``}
          </div>
        `);

        setTimeout(()=>{
          // Upload de arquivo da NF
          const nfFileInput = $("#nfFileUpload");
          const nfFileUrlInput = $("#nfFileName");
          const nfFileStatus = $("#nfFileUploadStatus");
          const nfFileLabel = $("#nfFileUploadLabel");
          const nfFileText = $("#nfFileUploadText");
          if(nfFileInput && nfFileLabel && nfFileText){
            nfFileInput.addEventListener('change', function(e) {
              if (this.files && this.files.length > 0) {
                nfFileLabel.classList.add('selected');
                nfFileText.textContent = this.files[0].name;
              } else {
                nfFileLabel.classList.remove('selected');
                nfFileText.textContent = 'Selecionar arquivo';
              }
            });
          }
          if(nfFileInput && nfFileUrlInput && editable){
            nfFileInput.onchange = async (e) => {
              const file = e.target.files[0];
              if(!file) return;
              nfFileStatus.textContent = "Enviando arquivo...";
              const formData = new FormData();
              formData.append("file", file);
              try {
                const token = localStorage.getItem('JWT_TOKEN');
                const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
                const resp = await fetch(`${API_BASE}/api/upload/invoice`, {
                  method: "POST",
                  body: formData,
                  headers
                });
                if(!resp.ok){
                  nfFileStatus.textContent = "Falha no upload.";
                  return;
                }
                const data = await resp.json();
                if(data?.url){
                  nfFileUrlInput.value = data.url;
                  nfFileStatus.textContent = "Arquivo enviado.";
                } else {
                  nfFileStatus.textContent = "Erro ao obter URL.";
                }
              } catch(err){
                nfFileStatus.textContent = "Erro no upload.";
              }
            };
          }
          $("#nfClose").onclick = ()=>closeDrawer();

          // Atualizar preview ao marcar/desmarcar OS
          const refreshPreview = () => {
            const checks = $$("[data-exp-id]");
            const selected = checks.filter(x => x.checked);
            
            selectedExpenses = selected.map(x => Number(x.dataset.expId));
            
            const newTotal = selected.reduce((sum, x) => sum + Number(x.dataset.expValue || 0), 0);
            $("#nfTotal").value = newTotal;

            // Agrupar por projeto
            const itemsByProject = {};
            selected.forEach(x => {
              const projId = x.dataset.expProj || "";
              const projCode = x.dataset.expProjCode || "";
              const projName = x.dataset.expProjName || "";
              const value = Number(x.dataset.expValue || 0);
              const srvName = x.dataset.expSrv || "Serviço";
              
              if(!projId) return;
              
              if(!itemsByProject[projId]){
                itemsByProject[projId] = {
                  projectId: projId,
                  projectCode: projCode,
                  projectName: projName,
                  description: srvName,
                  value: 0
                };
              }
              itemsByProject[projId].value += value;
            });

            items = Object.values(itemsByProject);

            const preview = $("#nfItemsPreview");
            if(items.length){
              preview.innerHTML = `
                <div class="table-scroll-x"><table class="table">
                  <thead>
                    <tr><th>Projeto</th><th>Descrição</th><th class="right">Valor</th></tr>
                  </thead>
                  <tbody>
                    ${items.map(it => `
                      <tr>
                        <td>
                          <span class="mono">${escapeHtml(it.projectCode||"—")}</span>
                          <div class="hint">${escapeHtml(it.projectName||"")}</div>
                        </td>
                        <td>${escapeHtml(it.description)}</td>
                        <td class="right">${fmtBRL(it.value)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table></div>
              `;
            } else {
              preview.innerHTML = '<div class="empty">Nenhum item vinculado.</div>';
            }
          };

          $$("[data-exp-id]").forEach(x => {
            x.onchange = refreshPreview;
          });

          // Chamar refreshPreview inicialmente ao editar para mostrar itens vinculados
          if(isEdit && selectedExpenses.length > 0){
            refreshPreview();
          }

          if(editable && $("#nfSave")){
            $("#nfSave").onclick = async ()=>{
              const fileName = ($("#nfFileName")?.value || "").trim();
              const monthComp = ($("#nfComp")?.value || "").trim();
              const monthIssue = ($("#nfIssue")?.value || "").trim();

              if(!fileName || !monthComp || !monthIssue){
                return toast("Preencha arquivo, competência e emissão.");
              }

              if(selectedExpenses.length === 0){
                return toast("Selecione ao menos 1 OS aprovada.");
              }

              const totalValue = selectedExpenses.reduce((sum, id) => {
                const checkbox = document.querySelector(`[data-exp-id="${id}"]`);
                return sum + Number(checkbox?.dataset.expValue || 0);
              }, 0);

              const body = {
                statusId: 1, // "Enviada" (ajustar conforme dados reais)
                monthCompetency: monthComp + "-01",
                monthIssue: monthIssue + "-01",
                fileName: fileName,
                total: totalValue,
                expenseIds: selectedExpenses
              };

              if(!isEdit && user?.id){
                body.issuerUserId = user.id;
              }

              try{
                const url = isEdit
                  ? `${API_BASE}/api/invoices/${invoiceId}`
                  : `${API_BASE}/api/invoices`;
                const method = isEdit ? 'PUT' : 'POST';

                const resp = await NFStore.apiFetch(url, {
                  method,
                  body: JSON.stringify(body)
                });

                if(!resp.ok){
                  let msg = isEdit ? "Falha ao salvar NF." : "Falha ao criar NF.";
                  try{
                    const err = await resp.json();
                    if(err?.message) msg = err.message;
                    else if(err?.error) msg = err.error;
                  }catch(_){ }
                  toast(msg);
                  return;
                }

                NFStore.audit(isEdit ? "INVOICE_UPDATE" : "INVOICE_CREATE", String(invoiceId || ""));
                toast(isEdit ? "NF atualizada." : "NF criada.");
                closeDrawer();
                viewInvoices();
              }catch(e){
                toast(isEdit ? "Erro ao salvar NF." : "Erro ao criar NF.");
              }
            };
          }

          if(invoice && isMaster() && statusLabel === ST.NF_ENVIADA){
            $("#nfApprove") && ($("#nfApprove").onclick = async ()=>{
              try{
                const r = await NFStore.apiFetch(`${API_BASE}/api/invoices/${invoiceId}/approve`, { method:'POST' });
                if(!r.ok){
                  let msg = "Falha ao aprovar NF.";
                  try{
                    const err = await r.json();
                    if(err?.message) msg = err.message;
                    else if(err?.error) msg = err.error;
                  }catch(_){ }
                  toast(msg);
                  return;
                }
                NFStore.audit("INVOICE_APPROVE", String(invoiceId));
                toast("Aprovada.");
                closeDrawer();
                viewInvoices();
              }catch(e){
                toast("Erro ao aprovar NF.");
              }
            });

            $("#nfReject") && ($("#nfReject").onclick = async ()=>{
              try{
                const r = await NFStore.apiFetch(`${API_BASE}/api/invoices/${invoiceId}/reject`, { method:'POST' });
                if(!r.ok){
                  let msg = "Falha ao reprovar NF.";
                  try{
                    const err = await r.json();
                    if(err?.message) msg = err.message;
                    else if(err?.error) msg = err.error;
                  }catch(_){ }
                  toast(msg);
                  return;
                }
                NFStore.audit("INVOICE_REJECT", String(invoiceId));
                toast("Reprovada.");
                closeDrawer();
                viewInvoices();
              }catch(e){
                toast("Erro ao reprovar NF.");
              }
            });
          }

          if(invoice && isMaster() && statusLabel === ST.NF_APROVADA){
            $("#nfPay") && ($("#nfPay").onclick = async ()=>{
              try{
                const r = await NFStore.apiFetch(`${API_BASE}/api/invoices/${invoiceId}/mark-as-paid`, { method:'POST' });
                if(!r.ok){
                  let msg = "Falha ao marcar como paga.";
                  try{
                    const err = await r.json();
                    if(err?.message) msg = err.message;
                    else if(err?.error) msg = err.error;
                  }catch(_){ }
                  toast(msg);
                  return;
                }
                NFStore.audit("INVOICE_PAY", String(invoiceId));
                toast("Marcada como paga.");
                closeDrawer();
                viewInvoices();
              }catch(e){
                toast("Erro ao marcar como paga.");
              }
            });

            $("#nfReject") && ($("#nfReject").onclick = async ()=>{
              try{
                const r = await NFStore.apiFetch(`${API_BASE}/api/invoices/${invoiceId}/reject`, { method:'POST' });
                if(!r.ok){
                  let msg = "Falha ao reprovar NF.";
                  try{
                    const err = await r.json();
                    if(err?.message) msg = err.message;
                    else if(err?.error) msg = err.error;
                  }catch(_){ }
                  toast(msg);
                  return;
                }
                NFStore.audit("INVOICE_REJECT", String(invoiceId));
                toast("Reprovada.");
                closeDrawer();
                viewInvoices();
              }catch(e){
                toast("Erro ao reprovar NF.");
              }
            });
          }
        },0);
      }catch(e){
        toast("Erro ao carregar dados da NF.");
      }
    })();
  }

  // ========= View: Listagem de Notas Fiscais =========
  function viewInvoices(){
    setTitle("Notas Fiscais", isOper() ? "Você vê somente suas notas" : "Master aprova/reprova e vê tudo");
    const month = DB().ui.month;
    const statuses = ["", ST.NF_ENVIADA, ST.NF_APROVADA, ST.NF_REPROVADA, ST.NF_PAGA];

    const qStatus = DB().ui.nfStatus || "";
    const qUser = DB().ui.nfUserId || "";

    const content = $("#content");
    if (!content) return;

    content.innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Notas Fiscais</h3>
          <div class="row">
            <button class="btn primary" id="nfNew">+ Nova Nota</button>
          </div>
        </div>
        <div class="spacer"></div>
        ${monthControlsHtml(month)}
        <div class="hr"></div>
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Carregando notas fiscais...</div>
        </div>
      </div>
    `;

    bindMonthControls((delta) => {
      const db = DB();
      if (delta === "now") db.ui.month = monthKeyFromDate(new Date());
      else db.ui.month = monthShift(db.ui.month, delta);
      db.ui.nfPage = 1;
      saveDB();
      window.NFApp?.rerender?.();
    });

    $("#nfNew").onclick = ()=>openInvoiceForm();

    (async () => {
      try{
        const [invResp, usersResp] = await Promise.all([
          NFStore.apiFetch(`${API_BASE}/api/invoices?limit=200`),
          NFStore.apiFetch(`${API_BASE}/api/users?limit=200`)
        ]);

        if(!invResp.ok){
          content.innerHTML = `<div class="card"><div class="hint">Falha ao carregar notas fiscais.</div></div>`;
          return;
        }

        const invPayload = await invResp.json();
        const usersPayload = usersResp.ok ? await usersResp.json() : null;

        const allInvoices = Array.isArray(invPayload?.data) ? invPayload.data : [];
        const allUsers = Array.isArray(usersPayload?.data) ? usersPayload.data : [];

        // Normalizar dados
        const normalized = allInvoices.map(d => ({
          ...d,
          statusStr: typeof d.status === 'string' ? d.status : (d.status?.name || ""),
          issuerIdStr: String(d.issuerUser?.id || "")
        }));

        // Filtrar por mês
        let filtered = normalized.filter(d => {
          const monthIssue = d.monthIssue || "";
          if (!monthIssue) return false;
          const invMonth = monthIssue.substring(0, 7);
          return invMonth === month;
        });

        // Aplicar filtros
        if (qStatus) {
          filtered = filtered.filter(d => d.statusStr === qStatus);
        }
        if (qUser) {
          filtered = filtered.filter(d => d.issuerIdStr === String(qUser));
        }

        // Paginação
        const itemsPerPage = 50;
        const currentPage = DB().ui.nfPage || 1;
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const paginatedItems = filtered.slice(startIdx, endIdx);

        content.innerHTML = `
          <div class="card">
            <div class="row" style="justify-content:space-between">
              <h3 style="margin:0">Notas Fiscais</h3>
              <div class="row">
                <button class="btn primary" id="nfNew">+ Nova Nota</button>
              </div>
            </div>
            <div class="spacer"></div>
            ${monthControlsHtml(month)}
            <div class="hr"></div>

            <div class="row" style="flex-wrap:wrap;align-items:flex-end;gap:8px">
              <div class="field" style="min-width:240px">
                <label>Status</label>
                <select id="nfStatus">
                  ${statuses.map(s=>`<option value="${escapeHtml(s)}" ${qStatus===s?'selected':''}>${escapeHtml(s||"Todos")}</option>`).join("")}
                </select>
              </div>

              <div class="field" style="min-width:260px">
                <label>Solicitante</label>
                <select id="nfUser">
                  <option value="">Todos</option>
                  ${allUsers.map(u=>`<option value="${u.id}" ${String(qUser)===String(u.id)?'selected':''}>${escapeHtml(u.name)} • ${escapeHtml(u.email)}</option>`).join("")}
                </select>
              </div>

              <div class="field" style="align-self:flex-end">
                <button class="btn" id="nfClear">Limpar</button>
              </div>

              <span style="flex:1"></span>
            </div>

            <div class="hr"></div>
            
            ${filtered.length > 0 ? `
              <div style="padding:8px 0;color:var(--muted);font-size:13px">
                Mostrando ${startIdx + 1}-${Math.min(endIdx, filtered.length)} de ${filtered.length} notas fiscais
              </div>
              <div class="table-scroll-x"><table class="table">
                <thead>
                  <tr>
                    <th>URL da Nota Fiscal</th>
                    <th>Competência</th>
                    <th>Emissão</th>
                    <th class="right">Total</th>
                    <th>Status</th>
                    <th>Solicitante</th>
                    <th class="right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${paginatedItems.map(d=>{
                    const issuer = d.issuerUser || {};
                    const status = d.statusStr || "";

                    return `
                      <tr>
                        <td>${escapeHtml(d.fileName || d.code || "NF")}</td>
                        <td>${escapeHtml(d.monthCompetency?.substring(0,7) || "—")}</td>
                        <td>${escapeHtml(d.monthIssue?.substring(0,7) || "—")}</td>
                        <td class="right">${fmtBRL(d.total || 0)}</td>
                        <td>${chipStatus(status)}</td>
                        <td>
                          ${escapeHtml(issuer.name || "—")}
                          <div class="hint">${escapeHtml(issuer.email || "")}</div>
                        </td>
                        <td class="right">
                          <div class="row" style="gap:8px;flex-wrap:wrap">
                            ${isMaster() ? `
                              ${status === ST.NF_ENVIADA ? `
                                <button class="btn small" data-nf-approve="${d.id}">Aprovar</button>
                                <button class="btn small danger" data-nf-reject="${d.id}">Reprovar</button>
                              ` : status === ST.NF_APROVADA ? `
                                <button class="btn small chip ok" data-nf-pay="${d.id}">Pago</button>
                                <button class="btn small danger" data-nf-reject="${d.id}">Reprovar</button>
                              ` : status === ST.NF_REPROVADA ? `
                                <button class="btn small" data-nf-approve="${d.id}">Aprovar</button>
                              ` : ""}
                            ` : ``}
                            <button class="btn small" data-open="invoice" data-id="${d.id}">Abrir</button>
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
                  <button class="btn small" id="nfPagePrev" ${currentPage <= 1 ? 'disabled' : ''}>← Anterior</button>
                  <span style="color:var(--muted);font-size:13px;padding:0 12px">Página ${currentPage} de ${totalPages}</span>
                  <button class="btn small" id="nfPageNext" ${currentPage >= totalPages ? 'disabled' : ''}>Próxima →</button>
                </div>
              ` : ``}
            ` : `<div class="empty">Sem notas fiscais neste mês (ou sem permissão).</div>`}
          </div>
        `;

        // Rebind
        bindMonthControls((delta) => {
          const db = DB();
          if (delta === "now") db.ui.month = monthKeyFromDate(new Date());
          else db.ui.month = monthShift(db.ui.month, delta);
          db.ui.nfPage = 1;
          saveDB();
          window.NFApp?.rerender?.();
        });

        $("#nfNew").onclick = ()=>openInvoiceForm();

        const apply = () => viewInvoices();

        if($("#nfStatus")) $("#nfStatus").onchange = (e)=>{ DB().ui.nfStatus = e.target.value; DB().ui.nfPage = 1; saveDB(); apply(); };
        if($("#nfUser")) $("#nfUser").onchange = (e)=>{ DB().ui.nfUserId = e.target.value; DB().ui.nfPage = 1; saveDB(); apply(); };

        if($("#nfClear")) $("#nfClear").onclick = ()=>{
          DB().ui.nfStatus = "";
          DB().ui.nfUserId = "";
          DB().ui.nfPage = 1;
          saveDB();
          apply();
        };

        // Paginação
        if($("#nfPagePrev")) $("#nfPagePrev").onclick = ()=>{
          if(currentPage > 1){
            DB().ui.nfPage = currentPage - 1;
            saveDB();
            apply();
          }
        };
        if($("#nfPageNext")) $("#nfPageNext").onclick = ()=>{
          if(currentPage < totalPages){
            DB().ui.nfPage = currentPage + 1;
            saveDB();
            apply();
          }
        };

        // Aprovar
        $$("[data-nf-approve]").forEach(b=>{
          b.onclick = async ()=>{
            try{
              const id = b.dataset.nfApprove;
              const resp = await NFStore.apiFetch(`${API_BASE}/api/invoices/${id}/approve`, {
                method: 'POST'
              });

              if(!resp.ok){
                let msg = "Falha ao aprovar NF.";
                try{
                  const err = await resp.json();
                  if(err?.message) msg = err.message;
                  else if(err?.error) msg = err.error;
                }catch(_){ }
                toast(msg);
                return;
              }

              NFStore.audit("INVOICE_APPROVE", String(id));
              toast("NF aprovada.");
              apply();
            }catch(e){
              toast(e?.message || "Falha ao aprovar.");
            }
          };
        });

        // Reprovar
        $$("[data-nf-reject]").forEach(b=>{
          b.onclick = async ()=>{
            try{
              const id = b.dataset.nfReject;
              const resp = await NFStore.apiFetch(`${API_BASE}/api/invoices/${id}/reject`, {
                method: 'POST'
              });

              if(!resp.ok){
                let msg = "Falha ao reprovar NF.";
                try{
                  const err = await resp.json();
                  if(err?.message) msg = err.message;
                  else if(err?.error) msg = err.error;
                }catch(_){ }
                toast(msg);
                return;
              }

              NFStore.audit("INVOICE_REJECT", String(id));
              toast("NF reprovada.");
              apply();
            }catch(e){
              toast(e?.message || "Falha ao reprovar.");
            }
          };
        });

        // Marcar como paga
        $$("[data-nf-pay]").forEach(b=>{
          b.onclick = async ()=>{
            try{
              const id = b.dataset.nfPay;
              const resp = await NFStore.apiFetch(`${API_BASE}/api/invoices/${id}/mark-as-paid`, {
                method: 'POST'
              });

              if(!resp.ok){
                let msg = "Falha ao marcar como paga.";
                try{
                  const err = await resp.json();
                  if(err?.message) msg = err.message;
                  else if(err?.error) msg = err.error;
                }catch(_){ }
                toast(msg);
                return;
              }

              NFStore.audit("INVOICE_PAY", String(id));
              toast("Marcada como paga.");
              apply();
            }catch(e){
              toast(e?.message || "Falha ao marcar como paga.");
            }
          };
        });

      }catch(e){
        console.error(e);
        content.innerHTML = `<div class="card"><div class="hint">Erro ao carregar notas fiscais: ${escapeHtml(e?.message||"")}</div></div>`;
      }
    })();
  }

  // Exporta para uso global
  global.NFViewsInvoices = {
    viewInvoices,
    openInvoiceForm
  };

})(window);
