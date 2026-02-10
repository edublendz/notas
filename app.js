// app.js
(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const LS_KEY = "MVP_FINANCEIRO_V10";
  let CURRENT_VIEW = "home";

	// Helpers globais (usados por app.js e views.js)
	window.isMaster = function(){
	  const s = window.NFStore?.getSession?.();
	  return (s?.user?.role === "MASTER");
	};

	window.isOper = function(){
	  const s = window.NFStore?.getSession?.();
	  return (s?.user?.role === "OPERADOR");
	};


	// Aliases de UI (compatibilidade)
	function openDrawer(title, html){
	  return NFUI.openDrawer(title, html);
	}

	function closeDrawer(){
	  return NFUI.closeDrawer();
	}

  // ===== Helpers =====
  function escapeHtml(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  // setTitle é definido e exportado por views.js (que carrega antes)
  const setTitle = (...args) => window.setTitle?.(...args);

  // ===== Session render =====
  function renderSession(){
    NFStore.ensureTenantAccess();
    const { user, tenant } = NFStore.getSession();
    $("#sessUser").textContent = user?.name || "—";
    $("#sessTenant").textContent = tenant?.name || "—";
    

    const roleEl = $("#sessRole");
    if(roleEl){
      const label = roleEl.querySelector("span:last-child");
      if(label) label.textContent = user?.role || "—";
      roleEl.classList.toggle("ok", user?.role === "MASTER");
    }
  }

  // ===== NAV render =====
  const NAV_ALL = [
    { view:"home", label:"Home", icon:"🏠" },
    { view:"dashboard", label:"Dashboard", icon:"📊" },
    { view:"expenses", label:"OS", icon:"🧾" },
    { view:"reimbursements", label:"Reembolsos", icon:"💸" },
    { view:"invoices", label:"NF Faturamento", icon:"📄" },
    { view:"projects", label:"Projetos", icon:"📦" },
    { view:"clients", label:"Clientes", icon:"👥" },
    /*{ view:"sales", label:"Vendas", icon:"📈" },*/
    { view:"users", label:"Usuários", icon:"👤" },
    { view:"invites", label:"Convites", icon:"🔗" },
    { view:"settings", label:"Config.", icon:"⚙️" },
    { view:"audit", label:"Auditoria", icon:"🕵️" },
    /*{ view:"changelog", label:"Changelog", icon:"📋" },*/
  ];

  function renderNav(){
    const nav = $("#nav");
    if (nav) {
      nav.innerHTML = NAV_ALL.map(i => `
        <button class="btn ghost" data-view="${i.view}">
          <span>${i.icon}</span><span>${i.label}</span>
        </button>
      `).join("");
    }

    const bottom = $("#bottomNav");
    if (bottom) {
      bottom.innerHTML = `
        <button class="btn ghost" data-view="home"><span>🏠</span><span>Home</span></button>
        <button class="btn ghost" data-view="expenses"><span>🧾</span><span>OS</span></button>
        <button class="btn ghost" data-view="invoices"><span>📄</span><span>Notas</span></button>
        <button class="btn ghost" data-view="more"><span>➕</span><span>Mais</span></button>
      `;
    }
  }

  function setActiveNav(view){
    $$("#nav button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    $$("#bottomNav button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  }

  function bindNav(){
    $$("#nav button").forEach(b => b.onclick = () => viewRouter(b.dataset.view));
    $$("#bottomNav button").forEach(b => b.onclick = () => {
      const v = b.dataset.view;
      if(v === "more") return openMoreMenu();
      viewRouter(v);
    });
  }

  function applyRoleMenu(){
    const oper = NFStore.isOper();
    const allowedOper = new Set(["home","expenses","reimbursements","invoices","more"]);

    // Desktop sidebar
    $$("#nav button").forEach(b=>{
      const v = b.dataset.view;
      const show = (!oper) || allowedOper.has(v);
      b.style.display = show ? "" : "none";
    });

    // Mobile bottom
    $$("#bottomNav button").forEach(b=>{
      const v = b.dataset.view;
      const show = (!oper) || allowedOper.has(v);
      // Se operador, mantém bottom simples, mas garante que Dashboard não apareça se quiser
      if(oper && v==="dashboard") b.style.display = "none";
      else b.style.display = show ? "" : "none";
    });

    // Se operador cair em view proibida, redireciona
    if(oper && !allowedOper.has(CURRENT_VIEW)){
      CURRENT_VIEW = "home";
      setActiveNav("home");
    }
    // ✅ LoginAs: só MASTER vê
    const canLoginAs =  isMaster();
    if (isMaster()) {
      const btnM = $("#btnLoginAsM");
      if (btnM) btnM.classList.toggle("is-hidden", !canLoginAs);
      const btnD = $("#btnLoginAs");
      if (btnD) btnD.classList.toggle("is-hidden", !canLoginAs);
    }

  }

  // ===== Views (por enquanto shells) =====
  function renderDashboard(){ setTitle("Dashboard","Visão geral"); $("#content").innerHTML = `<div class="empty">Dashboard</div>`; }
  function renderExpenses(){ setTitle("OSs","Ordens de Serviço"); $("#content").innerHTML = `<div class="empty">OS</div>`; }
  function renderReimbursements(){ setTitle("Reembolsos"); $("#content").innerHTML = `<div class="empty">Reembolsos</div>`; }
  function renderInvoices(){ setTitle("Notas do Fornecedor"); $("#content").innerHTML = `<div class="empty">Notas</div>`; }
  function renderProjects(){ setTitle("Projetos"); $("#content").innerHTML = `<div class="empty">Projetos</div>`; }
  function renderClients(){ setTitle("Clientes"); $("#content").innerHTML = `<div class="empty">Clientes</div>`; }
  function renderSales(){ setTitle("Vendas"); $("#content").innerHTML = `<div class="empty">Vendas</div>`; }
  function renderUsers(){ setTitle("Usuários"); $("#content").innerHTML = `<div class="empty">Usuários</div>`; }
  function renderSettings(){ setTitle("Configurações"); $("#content").innerHTML = `<div class="empty">Configurações</div>`; }
  function renderAudit(){ setTitle("Auditoria"); $("#content").innerHTML = `<div class="empty">Auditoria</div>`; }
  function viewChangelog(){ setTitle("Changelog"); $("#content").innerHTML = `<div class="empty">Changelog</div>`; }
  const HIDE_SIDEBAR_VIEWS = new Set(["login","invite","pending"]);
  function applyChromeForView(view){
    document.body.classList.toggle("no-sidebar", HIDE_SIDEBAR_VIEWS.has(view));
  }
  function setHashForView(view, params = {}) {
  // Mantém o modelo de convite #invite=TOKEN
  if (view === "invite" && (params.invite || params.token)) {
    const tok = encodeURIComponent(params.invite || params.token);
    location.hash = `invite=${tok}`;
    return;
  }

  // padrão: #view ou #view?x=y
  const qs = new URLSearchParams(params);
  const q = qs.toString();
  location.hash = q ? `${view}?${q}` : `${view}`;
}

function readHashRoute() {
  const raw = (location.hash || "").replace(/^#/, "").trim();
  if (!raw) return { view: null, params: {} };

  // Caso convite: invite=TOKEN ou token=TOKEN
  if (raw.startsWith("invite=") || raw.startsWith("token=")) {
    const hp = new URLSearchParams(raw);
    return { view: "invite", params: Object.fromEntries(hp.entries()) };
  }

  // padrão: view?x=y
  const [view, query] = raw.split("?");
  const params = query ? Object.fromEntries(new URLSearchParams(query).entries()) : {};
  return { view, params };
}
function viewRouter(view, params = {}, opts = { pushHash: true }) {
  applyChromeForView(view);

  const db = NFStore.DB();
  const publicViews = new Set(["login","invite","pending"]); // mantém

  if (db.ui.view !== view) {
    db.ui.view = view;
    NFStore.saveDB();
  }

  CURRENT_VIEW = view;

  // ✅ grava na URL (pra F5 e compartilhamento)
  if (opts.pushHash) {
    setHashForView(view, params);
  }

  setActiveNav(view);
  rerender();
}




function rerender(){
  // --- helpers locais (guard simples) ---
  const getInviteToken = ()=>{
    const q = new URLSearchParams(location.search);
    const qt = q.get("invite") || q.get("token");
    if(qt) return qt;

    const h = (location.hash || "").replace(/^#/, "");
    if(!h) return "";
    const hp = new URLSearchParams(h.includes("&") ? h : h.replace(/\?/g,"&"));
    return hp.get("invite") || hp.get("token") || "";
  };

  const sess = (window.NFStore && typeof window.NFStore.getSession === "function")
    ? window.NFStore.getSession()
    : getSession(); // fallback antigo

  const user = sess?.user || null;
  const token = getInviteToken();

  // 1) Se abriu link com token, manda pro cadastro por convite
  if(token){
    CURRENT_VIEW = "invite";
  }

  // 2) Se não está logado, manda pro login (exceto se já estiver em invite)
  if(!user && CURRENT_VIEW !== "invite"){
    CURRENT_VIEW = "login";
  }

  // 3) Se está pendente/reprovado, bloqueia tudo
  if(user && window.NFStore){
    if(window.NFStore.auth?.isPending?.()){
      CURRENT_VIEW = "pending";
    }
    if(window.NFStore.auth?.isRejected?.()){
      CURRENT_VIEW = "login";
      NFUI.toast("Usuário reprovado. Fale com o administrador.");
      window.NFStore.auth?.logout?.();
    }
  }

  // Header/menu
  renderSession();
  applyRoleMenu();

  const view = CURRENT_VIEW;
  
  applyChromeForView(view);

  // --- NOVO: se existir NFViews, prioriza ---
  if(window.NFViews && typeof window.NFViews[view] === "function"){
    return window.NFViews[view]();
  }

  // --- fallback: views antigas ---
  if(view==="home" && typeof window.viewHome === "function") return window.viewHome();
  if(view==="dashboard") return viewDashboard();
  /*if(view==="sales") return viewSales();*/
  if(view==="clients") return viewClients();
  if(view==="projects") return viewProjects();
  //if(view==="expenses") return viewExpenses();
  //if(view==="reimbursements") return viewReimbursements();
  //if(view==="invoices") return viewInvoices();
  if(view==="users") return viewUsers();
  if(view==="settings") return viewSettings();
  if(view==="audit") return viewAudit();
  if(view==="changelog") return viewChangelog();

  return viewExpenses();
}

// Expor para views.js conseguir navegar/forçar rerender
window.NFApp = {
  rerender,
  viewRouter,
  navigate: viewRouter
};
  // ===== Actions: Login / Tenant / Logout / Reset =====
  function openLoginAs(){
    if (!isMaster()) return NFUI.toast("Apenas Master pode trocar de usuário.");
    const db = NFStore.DB();
    NFUI.openDrawer("Login (mock)", `
      <div class="card">
        <h3>Escolha um usuário</h3>
        <div class="field">
          <label>Usuário</label>
          <select id="loginUser">
            ${db.users.filter(u=>u.active).map(u=>`
              <option value="${u.id}">${escapeHtml(u.name)} • ${escapeHtml(u.role)}</option>
            `).join("")}
          </select>
        </div>
        <button class="btn primary" id="loginBtn">Entrar</button>
        <div class="hint">O tenant ativo será ajustado para uma empresa permitida.</div>
      </div>
    `);

    setTimeout(()=>{
      $("#loginBtn").onclick = ()=>{
        const userId = $("#loginUser").value;
        NFStore.DB().session.userId = userId;
        NFStore.ensureTenantAccess();
        NFStore.saveDB();
        NFUI.closeDrawer();
        NFUI.toast("Sessão trocada.");
        NFStore.audit("LOGIN_AS", "Troca de usuário (mock)");
        initUI();
        rerender();
      };
    },0);
  }

  function openSwitchTenant(){
    const db = NFStore.DB();
    const sess = NFStore.getSession();
    const user = sess?.user;
    const currentTenantId = sess?.tenant?.id || db.session.tenantId;

    if(!user) return NFUI.toast("Sem usuário na sessão.");

    const base = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8000'
      : 'https://api.notas.blendz.com.br';

    (async () => {
      try {
        const resp = await NFStore.apiFetch(`${base}/api/tenants?limit=100`);
        if (!resp.ok) {
          NFUI.toast("Falha ao carregar empresas do servidor.");
          return;
        }

        const payload = await resp.json();
        const tenants = Array.isArray(payload?.data) ? payload.data : [];

        if (!tenants.length) {
          NFUI.toast("Nenhuma empresa disponível para este usuário.");
          return;
        }

        NFUI.openDrawer("Trocar empresa", `
          <div class="card">
            <h3>Empresa ativa</h3>
            <div class="field">
              <label>Empresa</label>
              <select id="tenantSel">
                ${tenants
                  .map(t=>`<option value="${t.id}" ${String(t.id)===String(currentTenantId)?'selected':''}>${escapeHtml(t.name)}</option>`)
                  .join("")}
              </select>
            </div>
            <button class="btn primary" id="tenantBtn">Aplicar</button>
          </div>
        `);

        setTimeout(()=>{
          $("#tenantBtn").onclick = async ()=>{
            const selectEl = $("#tenantSel");
            if(!selectEl) return;

            const newTenantId = selectEl.value;
            if(!newTenantId || String(newTenantId) === String(currentTenantId)){
              NFUI.closeDrawer();
              return;
            }

            try{
              const respPref = await NFStore.apiFetch(`${base}/api/user-preference`, {
                method: 'PUT',
                body: JSON.stringify({
                  selectedTenant: { id: newTenantId }
                })
              });

              if(!respPref.ok){
                let msg = "Falha ao atualizar empresa preferida.";
                try{
                  const err = await respPref.json();
                  if(err?.message) msg = err.message;
                  else if(err?.error) msg = err.error;
                }catch(_){ }
                NFUI.toast(msg);
                return;
              }

              const tenantObj = tenants.find(t => String(t.id) === String(newTenantId)) || null;
              if(tenantObj){
                try{
                  localStorage.setItem('JWT_TENANT', JSON.stringify({ id: tenantObj.id, name: tenantObj.name }));
                }catch(_){ }
              }

              db.session.tenantId = newTenantId;
              NFStore.saveDB();
              NFUI.closeDrawer();
              NFUI.toast("Empresa alterada.");
              NFStore.audit("TENANT_SWITCH", "Troca de empresa");
              initUI();
              rerender();
            }catch(e){
              NFUI.toast("Falha ao salvar empresa no servidor.");
            }
          };
        },0);
      } catch (e) {
        NFUI.toast("Erro ao comunicar com o servidor de empresas.");
      }
    })();
  }

  function logout(){
  try{
    // limpa sessão via store, se existir
    if(window.NFStore?.auth?.logout) window.NFStore.auth.logout();
  }catch(e){}

  const db = NFStore.DB();

  // ✅ logout REAL: remove sessão
  db.session = { userId: null, tenantId: null };
  NFStore.saveDB();

  try{ NFStore.audit("LOGOUT", "Saiu do sistema"); }catch(e){}

  // limpa URL (remove #invite etc)
  try{
    const clean = location.href.split("#")[0].split("?")[0];
    history.replaceState({}, "", clean);
  }catch(e){}

  // vai pra login
  viewRouter("login");
}


 

  function resetMock(){
    localStorage.removeItem(LS_KEY);
    // recarrega para o store recriar o DB local vazio
    location.reload();
  }

  function openQuickCreate(){
    NFUI.toast("Quick Create: em breve 🙂");
  }

  // ===== More (mobile) =====
function openMoreMenu(){
  const isM = isMaster();

  // filtra o menu conforme o perfil
  const items = NAV_ALL.filter(i=>{
    if(isM) return true;
    // OPERADOR: só algumas telas
    return ["reimbursements","expenses","invoices"].includes(i.view);
  });

  openDrawer("Menu", `
    <div class="card">
      <div class="row" style="flex-direction:column;gap:8px">
        ${items.map(i=>`
          <button class="btn ghost" data-more="${i.view}">
            <span style="width:24px;display:inline-block">${i.icon}</span>
            ${i.label}
          </button>
        `).join("")}
      </div>

      <div class="hr"></div>
      <button class="btn" id="moreTenant">Trocar empresa</button>
      <button class="btn" id="moreLogin">Login</button>
      <!--button class="btn danger" id="moreReset">Resetar Mock</button-->
    </div>
  `);

  // bind navegação
  $$("[data-more]").forEach(b=>{
    b.onclick = ()=>{
      closeDrawer();
      viewRouter(b.dataset.more);
    };
  });

  $("#moreTenant").onclick = ()=>{
    closeDrawer();
    openSwitchTenant();
  };

  $("#moreLogin").onclick = ()=>{
    closeDrawer();
    viewRouter("login");
  };

  $("#moreReset").onclick = ()=>{
    closeDrawer();
    resetMock();
  };
}


  // ===== UI init / binds =====
  function initUI(){
    renderSession();
    renderNav();
    bindNav();

    // Default view: operador começa em OS
    CURRENT_VIEW = "home";
    setActiveNav(CURRENT_VIEW);

    // Topbar
    $("#btnLoginAs") && ($("#btnLoginAs").onclick = openLoginAs);
    $("#btnLoginAsM") && ($("#btnLoginAsM").onclick = openLoginAs);
    $("#btnSwitchTenant") && ($("#btnSwitchTenant").onclick = openSwitchTenant);
    $("#btnMobileTenant") && ($("#btnMobileTenant").onclick = openSwitchTenant);
    $("#btnMobileSearch") && ($("#btnMobileSearch").onclick = ()=>NFUI.toast("Busca: em breve 🙂"));
    $("#globalSearch") && ($("#globalSearch").onkeydown = (e)=>{ if(e.key==="Enter") NFUI.toast("Busca: em breve 🙂"); });

    // Sidebar
    $("#btnQuickCreate") && ($("#btnQuickCreate").onclick = openQuickCreate);
    $("#fab") && ($("#fab").onclick = openQuickCreate);
    $("#btnReset") && ($("#btnReset").onclick = resetMock);
    $("#btnLogout") && ($("#btnLogout").onclick = logout);
  }

 // ===== Boot =====
function boot(){
  // ✅ Verifica autenticação JWT ANTES de fazer qualquer coisa
  if (typeof NFStore?.isJwtAuthenticated === "function" && !NFStore.isJwtAuthenticated()) {
    console.warn("⚠️ Não autenticado - redirecionando para login");
    CURRENT_VIEW = "login";
    applyChromeForView("login");
    window.location.hash = "";
    if (typeof NFStore?.viewLogin === "function") {
      NFStore.viewLogin();
    } else if (typeof NFViews?.login === "function") {
      NFViews.login();
    }
    return;
  }

  NFStore.ensureTenantAccess();
  initUI();

  // ✅ Se tiver hash, abre a view do hash (sem reescrever o hash)
  if (typeof readHashRoute === "function") {
    const r = readHashRoute();
    if (r?.view) {
      viewRouter(r.view, r.params || {}, { pushHash:false });
      NFViews.bindOpenButtons();
      return;
    }
  }

  // ✅ fallback: comportamento atual
  rerender();
  NFViews.bindOpenButtons();
}

window.addEventListener("hashchange", () => {
  if (typeof readHashRoute !== "function") return;
  const r = readHashRoute();
  if (!r?.view) return;
  
  // 🛑 Evita duplicação: só executa se a view for diferente da atual
  if (CURRENT_VIEW === r.view) {
    return;
  }
  
  viewRouter(r.view, r.params || {}, { pushHash:false });
});



  // ===== Expor navegação/render para as views (views.js) =====
  // setTitle é exportado por views.js (carrega antes de app.js)
  window.viewRouter = viewRouter;
  window.rerender = rerender;


  document.addEventListener("DOMContentLoaded", boot);
  //global.NFApp = { boot , openLoginAs};
  global.NFApp = Object.assign(global.NFApp || {}, { boot, openLoginAs, initUI });



})(window);
