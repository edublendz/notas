// store.js
(function (global) {
  "use strict";

  const LS_KEY = "MVP_FINANCEIRO_V10";

  // ===== Utils base =====
  const uid = (p="id") =>
    `${p}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;

  // ===== Roles =====
  const ROLE = {
    MASTER: "MASTER",
    OPER: "OPERADOR"
  };

  // ===== Status do Usuário =====
  const USER_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED"
  };

  // ===== Status =====
  const ST = {
    // OS
    OS_ENVIADA: "Enviada",
    OS_APROVADA: "Aprovada",
    OS_REPROVADA: "Reprovada",
    OS_FATURADA: "Faturada",

    // Reembolso
    RB_SOLICITADO: "Solicitado",
    RB_APROVADO: "Aprovado",
    RB_REPROVADO: "Reprovado",

    // Nota Fornecedor
    NF_ENVIADA: "Enviada",
    NF_APROVADA: "Aprovada",
    NF_REPROVADA: "Reprovada",
    NF_PAGA: "Paga"
  };

  function eligibleExpensesForNF(){
    //const db = DB(); <- era um bug?
    const db = DB; 
    const me = db.session.userId;
    const isM = isMaster();

    return db.expenses
      .filter(d=>d.tenantId===db.session.tenantId)
      .filter(d=>d.status===ST.OS_APROVADA)
      .filter(d=>!d.nfId)
      .filter(d=> isM ? true : d.createdBy===me);
  }


  // ===== Datas =====
  function monthKeyFromDate(d){
    const dt = (d instanceof Date) ? d : new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
  }

  function monthShift(ym, delta){
    const [y,m] = ym.split("-").map(Number);
    const base = new Date(y, m-1, 1);
    base.setMonth(base.getMonth() + delta);
    return monthKeyFromDate(base);
  }

  // ===== DB =====
  function loadDB(){
    const raw = localStorage.getItem(LS_KEY);
    if(!raw){
      const db = seed();
      localStorage.setItem(LS_KEY, JSON.stringify(db));
      return db;
    }
    try {
      return JSON.parse(raw);
    } catch {
      const db = seed();
      localStorage.setItem(LS_KEY, JSON.stringify(db));
      return db;
    }
  }

  

  // ===== Normalização/Migração leve =====
  function normalizeDB(db){
    db = db || {};
    db.tenants = db.tenants || [];
    db.users = db.users || [];
    db.clients = db.clients || [];
    db.projects = db.projects || [];
    db.projectUsers = db.projectUsers || [];
    db.sales = db.sales || [];
    db.services = db.services || [];
    db.expenses = db.expenses || [];
    db.reimbursements = db.reimbursements || [];
    db.invoices = db.invoices || [];
    db.audit = db.audit || [];
    db.invites = db.invites || [];

    db.session = db.session || { userId: null, tenantId: null };
    db.ui = db.ui || { drawerFull:false, month: monthKeyFromDate(new Date()) };

    // default de status/senha para seeds antigos
    db.users.forEach(u=>{
      if(u.status == null) u.status = USER_STATUS.APPROVED;
      if(u.password == null) u.password = ""; // mock
      if(!Array.isArray(u.clientIds)) u.clientIds = [];
      if(!Array.isArray(u.projectIds)) u.projectIds = [];
      if(!Array.isArray(u.tenantIds)) u.tenantIds = [];
      if(u.active == null) u.active = true;
    });

    // garante tenantId na sessão
    if(!db.session.tenantId){
      const firstTenant = db.tenants[0]?.id || null;
      db.session.tenantId = firstTenant;
    }

    return db;
  }
let DB = normalizeDB(loadDB());
  const saveDB = () =>
    localStorage.setItem(LS_KEY, JSON.stringify(DB));

  // ===== Sessão =====
  function getSession(){
    const user = DB.users.find(u => u.id === DB.session.userId && u.active);
    const tenant = DB.tenants.find(t => t.id === DB.session.tenantId);
    return { user, tenant };
  }

  function ensureTenantAccess(){
    const { user } = getSession();
    if(!user) return false;
    if(!user.tenantIds.includes(DB.session.tenantId)){
      DB.session.tenantId = user.tenantIds[0] || DB.tenants[0]?.id;
      saveDB();
    }
    return true;
  }

  const isMaster = () => getSession().user?.role === ROLE.MASTER;
  const isOper   = () => getSession().user?.role === ROLE.OPER;


  // ===== Auth (login/senha) =====
  function isApproved(){
    const u = getSession().user;
    return !!u && (u.status || USER_STATUS.APPROVED) === USER_STATUS.APPROVED;
  }
  function isPending(){
    const u = getSession().user;
    return !!u && (u.status || USER_STATUS.APPROVED) === USER_STATUS.PENDING;
  }
  function isRejected(){
    const u = getSession().user;
    return !!u && (u.status || USER_STATUS.APPROVED) === USER_STATUS.REJECTED;
  }

  function findUserByEmail(email){
    const e = String(email||"").trim().toLowerCase();
    return DB.users.find(u => String(u.email||"").trim().toLowerCase() === e);
  }

 function login(email, password){
  const user = findUserByEmail(email);
  if(!user || !user.active){
    return { ok:false, code:"INVALID_CREDENTIALS", message:"Email ou senha inválidos." };
  }

  if(String(user.password||"") !== String(password||"")){
    return { ok:false, code:"INVALID_CREDENTIALS", message:"Email ou senha inválidos." };
  }

  // 🚫 bloqueia pendente
  const status = user.status || USER_STATUS.APPROVED;
  if(status === USER_STATUS.PENDING){
    return {
      ok: false,
      code: "USER_PENDING",
      message: "Usuário pendente de aprovação."
    };
  }

  if(status === USER_STATUS.REJECTED){
    return {
      ok: false,
      code: "USER_REJECTED",
      message: "Usuário reprovado. Fale com o administrador."
    };
  }

  // ✅ login permitido
  DB.session.userId = user.id;

  // tenant preferido
  const keep = DB.session.tenantId && user.tenantIds.includes(DB.session.tenantId);
  DB.session.tenantId = keep
    ? DB.session.tenantId
    : (user.tenantIds[0] || DB.tenants[0]?.id || null);

  saveDB();
  audit("AUTH_LOGIN", user.email);

  return {
    ok: true,
    status,
    userId: user.id,
    tenantId: DB.session.tenantId
  };
}


  function logout(){
    const prev = DB.session.userId;
    DB.session.userId = null;
    DB.session.tenantId = DB.tenants[0]?.id || null;
    saveDB();
    audit("AUTH_LOGOUT", String(prev||""));
    return { ok:true };
  }

  const auth = { login, logout, isApproved, isPending, isRejected };

  // ===== Convites =====
  function getInviteByToken(token){
    const tk = String(token||"").trim();
    if(!tk) return null;
    const inv = (DB.invites||[]).find(i => i.token === tk);
    if(!inv) return null;
    if(inv.status !== "ACTIVE") return null;
    if(inv.expiresAt){
      const exp = new Date(inv.expiresAt).getTime();
      if(!Number.isNaN(exp) && Date.now() > exp) return null;
    }
    return inv;
  }

  function createInvite({ tenantId, role, clientIds, projectIds, expiresAt }){
    if(!isMaster()) return { ok:false, code:"FORBIDDEN" };
    const inv = {
      id: uid("invite"),
      token: `INV-${Math.random().toString(36).slice(2,8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      tenantId,
      role: role || ROLE.OPER,
      clientIds: Array.isArray(clientIds) ? clientIds : [],
      projectIds: Array.isArray(projectIds) ? projectIds : [],
      status: "ACTIVE",
      createdBy: getSession().user?.id || null,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      usedAt: null,
      usedBy: null
    };
    DB.invites.push(inv);
    saveDB();
    audit("INVITE_CREATE", inv.token);
    return { ok:true, invite: inv };
  }

  function revokeInvite(inviteId){
    if(!isMaster()) return { ok:false, code:"FORBIDDEN" };
    const inv = DB.invites.find(i=>i.id===inviteId);
    if(!inv) return { ok:false, code:"NOT_FOUND" };
    inv.status = "EXPIRED";
    saveDB();
    audit("INVITE_REVOKE", inv.token);
    return { ok:true };
  }

  function acceptInvite(token, { name, email, password }){
    const inv = getInviteByToken(token);
    if(!inv) return { ok:false, code:"INVALID_INVITE" };

    const e = String(email||"").trim().toLowerCase();
    if(!e) return { ok:false, code:"EMAIL_REQUIRED" };
    if(findUserByEmail(e)) return { ok:false, code:"EMAIL_EXISTS" };

    const user = {
      id: uid("user"),
      name: String(name||"").trim() || "Novo usuário",
      email: e,
      password: String(password||""),
      role: inv.role || ROLE.OPER,
      status: USER_STATUS.PENDING,
      tenantIds: [inv.tenantId],
      clientIds: Array.isArray(inv.clientIds) ? [...inv.clientIds] : [],
      projectIds: Array.isArray(inv.projectIds) ? [...inv.projectIds] : [],
      active: true,
      createdAt: new Date().toISOString()
    };

    DB.users.push(user);

    // mantém compatibilidade com requireProjectLink: cria projectUsers links
    if(Array.isArray(user.projectIds) && user.projectIds.length){
      user.projectIds.forEach(pid=>{
        DB.projectUsers.push({ id: uid("pu"), tenantId: inv.tenantId, projectId: pid, userId: user.id });
      });
    }

    inv.status = "USED";
    inv.usedAt = new Date().toISOString();
    inv.usedBy = user.id;

    // loga o usuário automaticamente (vai cair em tela de pending)
    DB.session.userId = user.id;
    DB.session.tenantId = inv.tenantId;

    saveDB();
    audit("INVITE_ACCEPT", inv.token);

    return { ok:true, userId: user.id, status: user.status };
  }

  function listInvites(tenantId){
    const tid = tenantId || DB.session.tenantId;
    return (DB.invites||[]).filter(i=>i.tenantId===tid);
  }

  const invites = { getByToken: getInviteByToken, create: createInvite, revoke: revokeInvite, accept: acceptInvite, list: listInvites };

  // ===== Aprovação de usuários (Master) =====
  function listUsers(tenantId){
    const tid = tenantId || DB.session.tenantId;
    return DB.users.filter(u=>u.active && (u.tenantIds||[]).includes(tid));
  }

  function listPendingUsers(tenantId){
    const tid = tenantId || DB.session.tenantId;
    return listUsers(tid).filter(u=>(u.status||USER_STATUS.APPROVED)===USER_STATUS.PENDING);
  }

  function setUserStatus(userId, status){
    if(!isMaster()) return { ok:false, code:"FORBIDDEN" };
    const u = DB.users.find(x=>x.id===userId);
    if(!u) return { ok:false, code:"NOT_FOUND" };
    u.status = status;
    saveDB();
    audit("USER_STATUS", `${u.email} => ${status}`);
    return { ok:true };
  }

  function approveUser(userId){ return setUserStatus(userId, USER_STATUS.APPROVED); }
  function rejectUser(userId){ return setUserStatus(userId, USER_STATUS.REJECTED); }

  const usersAdmin = { list: listUsers, listPending: listPendingUsers, approve: approveUser, reject: rejectUser };

  // ===== Tenant =====
  function tenantSettings(){
    return getSession().tenant?.settings || {
      indicatorPct: 0.45,
      requireProjectLink: false
    };
  }

  const tenantIndicatorPct = () =>
    Number(tenantSettings().indicatorPct ?? 0.45);

  const requireProjectLink = () =>
    !!tenantSettings().requireProjectLink;

  // ===== Visibilidade =====
  function visibleClients(){
    const tenantId = DB.session.tenantId;
    const all = DB.clients.filter(c => c.tenantId === tenantId);
    if(isMaster()) return all;
    const u = getSession().user;
    const ids = Array.isArray(u?.clientIds) ? u.clientIds : [];
    return ids.length ? all.filter(c=>ids.includes(c.id)) : all;
  }

  function visibleProjects(){
    const tenantId = DB.session.tenantId;
    const all = DB.projects.filter(p => p.tenantId === tenantId);

    if(isMaster()) return all;

    const u = getSession().user;
    const explicit = Array.isArray(u?.projectIds) ? u.projectIds : [];
    if(explicit.length) return all.filter(p=>explicit.includes(p.id));

    if(!requireProjectLink()) return all;

    const uidUser = getSession().user.id;
    const linked = DB.projectUsers
      .filter(x => x.tenantId === tenantId && x.userId === uidUser)
      .map(x => x.projectId);

    return all.filter(p => linked.includes(p.id));
  }

  function visibleSales(){
    const tenantId = DB.session.tenantId;
    if(isMaster()) return DB.sales.filter(s => s.tenantId === tenantId);
    return [];
  }

  function visibleServices(){
    return DB.services.filter(s => s.tenantId === DB.session.tenantId);
  }

  function visibleExpenses(){
    const tenantId = DB.session.tenantId;
    const all = DB.expenses.filter(d => d.tenantId === tenantId);
    if(isMaster()) return all;
    return all.filter(d => d.createdBy === getSession().user.id);
  }

  function visibleReimbursements(){
    const tenantId = DB.session.tenantId;
    const all = DB.reimbursements.filter(r => r.tenantId === tenantId);
    if(isMaster()) return all;
    return all.filter(r => r.createdBy === getSession().user.id);
  }

  function visibleInvoices(){
    const tenantId = DB.session.tenantId;
    const all = DB.invoices.filter(nf => nf.tenantId === tenantId);
    if(isMaster()) return all;
    return all.filter(nf => nf.createdBy === getSession().user.id);
  }

  // ===== Helpers financeiros =====
  function indicatorForProject(project){
    return Number(project.indicatorOverridePct ?? tenantIndicatorPct());
  }

  function plannedIndicator(project){
    const value = Number(project.valueTotal || 0);
    const cost  = Number(project.costPlanned || 0);
    return value ? (cost / value) : 0;
  }

  function projectCostsReal(projectId, month){
    const tenantId = DB.session.tenantId;

    const nfCost = DB.invoices
      .filter(nf => nf.tenantId === tenantId && nf.monthIssue === month)
      .flatMap(nf => nf.items || [])
      .filter(it => it.projectId === projectId)
      .reduce((s,it)=>s+Number(it.value||0),0);

    const expCost = DB.expenses
      .filter(d =>
        d.tenantId === tenantId &&
        d.projectId === projectId &&
        monthKeyFromDate(d.dateBuy) === month &&
        d.status !== ST.OS_REPROVADA
      )
      .reduce((s,d)=>s+Number(d.value||0),0);

    const rbCost = DB.reimbursements
      .filter(r =>
        r.tenantId === tenantId &&
        r.projectId === projectId &&
        monthKeyFromDate(r.dateBuy) === month &&
        r.status !== ST.RB_REPROVADO
      )
      .reduce((s,r)=>s+Number(r.value||0),0);

    return {
      nfCost,
      otherCost: expCost + rbCost,
      total: nfCost + expCost + rbCost
    };
  }

  function projectOverruns(month){
    return visibleProjects()
      .map(p=>{
        const real = projectCostsReal(p.id, month);
        const planned = Number(p.costPlanned||0);
        return {
          project: p,
          real,
          planned,
          diff: real.total - planned
        };
      })
      .filter(x => x.diff > 0)
      .sort((a,b)=>b.diff-a.diff);
  }


  const reimbursementsApi = {
  approve(id){
    const { user } = getSession();
    if(user.role !== ROLE.MASTER) throw new Error("Apenas Master pode aprovar.");

    const r = DB.reimbursements.find(x=>x.id===id && x.tenantId===DB.session.tenantId);
    if(!r) throw new Error("Reembolso não encontrado.");
    if(r.status !== ST.RB_SOLICITADO) throw new Error("Ação permitida apenas para 'Solicitado'.");

    r.status = ST.RB_APROVADO;
    saveDB();
    audit("REIMB_APPROVE", id);
    return r;
  },

  reject(id){
    const { user } = getSession();
    if(user.role !== ROLE.MASTER) throw new Error("Apenas Master pode reprovar.");

    const r = DB.reimbursements.find(x=>x.id===id && x.tenantId===DB.session.tenantId);
    if(!r) throw new Error("Reembolso não encontrado.");
    if(r.status !== ST.RB_SOLICITADO) throw new Error("Ação permitida apenas para 'Solicitado'.");

    r.status = ST.RB_REPROVADO;
    saveDB();
    audit("REIMB_REJECT", id);
    return r;
  }
};



  // ===== Auditoria =====
  function audit(action, meta=""){
    const { user } = getSession();
    DB.audit.unshift({
      id: uid("aud"),
      tenantId: DB.session.tenantId,
      actorUserId: user?.id || "unknown",
      action,
      meta,
      createdAt: new Date().toISOString()
    });
    saveDB();
  }

  // ===== Exposição =====
  global.NFStore = {
    ROLE,
    ST,
    USER_STATUS,
    uid,

    auth,
    invites,
    usersAdmin,

    DB: () => DB,
    saveDB,

    getSession,
    ensureTenantAccess,
    isMaster,
    isOper,

    tenantSettings,
    tenantIndicatorPct,
    requireProjectLink,

    visibleClients,
    visibleProjects,
    visibleSales,
    visibleServices,
    visibleExpenses,
    visibleReimbursements,
    visibleInvoices,

    indicatorForProject,
    plannedIndicator,
    projectCostsReal,
    projectOverruns,

    monthKeyFromDate,
    monthShift,
    reimbursements: reimbursementsApi,
    audit
  };

})(window);
