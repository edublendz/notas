// views/index.js
// Módulo agregador de views - Sobrescreve funções migradas em NFViews

(function (global) {
  "use strict";

  // Aguarda carregar todos os módulos
  function initViews() {
    const { NFViewsDashboard, NFViewsHome, NFViewsExpenses, NFViewsReimbursements, NFViewsInvoices, NFViewsProjects, NFViewsClients, NFViewsUsers, NFViewsAudit, NFViewsInvites, NFViewsInviteSignup, NFViewsSettings, NFViewsServices, NFViewsUserTenants, NFViewsChangelog, NFViews } = global;

    if (!NFViews) {
      console.error("NFViews não foi carregado! Certifique-se de carregar views.js antes dos módulos.");
      return;
    }

    // Exporta funções de dashboard
    const viewDashboard = NFViewsDashboard?.viewDashboard || (()=>{});

    // Exporta funções de home
    const viewHome = NFViewsHome?.viewHome || (()=>{});

    // Exporta funções de expenses
    const viewExpenses = NFViewsExpenses?.viewExpenses || (()=>{});
    const openExpenseForm = NFViewsExpenses?.openExpenseForm || (()=>{});
    const openServiceForm = NFViewsExpenses?.openServiceForm || (()=>{});

    // Exporta funções de reimbursements
    const viewReimbursements = NFViewsReimbursements?.viewReimbursements || (()=>{});
    const openReimbursementForm = NFViewsReimbursements?.openReimbursementForm || (()=>{});

    // Exporta funções de invoices
    const viewInvoices = NFViewsInvoices?.viewInvoices || (()=>{});
    const openInvoiceForm = NFViewsInvoices?.openInvoiceForm || (()=>{});

    // Exporta funções de projects
    const viewProjects = NFViewsProjects?.viewProjects || (()=>{});
    const openProjectForm = NFViewsProjects?.openProjectForm || (()=>{});

    // Exporta funções de clients
    const viewClients = NFViewsClients?.viewClients || (()=>{});
    const openClientForm = NFViewsClients?.openClientForm || (()=>{});

    // Exporta funções de users
    const viewUsers = NFViewsUsers?.viewUsers || (()=>{});

    // Exporta funções de audit
    const viewAudit = NFViewsAudit?.viewAudit || (()=>{});

    // Exporta funções de invites
    const viewInvitesAdmin = NFViewsInvites?.viewInvitesAdmin || (()=>{});
    const viewInviteSignup = NFViewsInviteSignup?.viewInviteSignup || (()=>{});
    const getInviteToken = NFViewsInviteSignup?.getInviteToken || (()=>"");

    // Exporta funções de settings
    const viewSettings = NFViewsSettings?.viewSettings || (()=>{});

    // Exporta funções de services
    const openServiceDrawer = NFViewsServices?.openServiceDrawer || (()=>{});

    // Exporta funções de user-tenants
    const openUserTenantsDrawer = NFViewsUserTenants?.openUserTenantsDrawer || (()=>{});

    // Exporta funções de changelog
    const viewChangelog = NFViewsChangelog?.viewChangelog || (()=>{});


    // openEntity atualizado: trata expense, reimbursement, invoice, project, delega resto para versão original
    const originalOpenEntity = global.openEntity || (()=>{});
    function openEntity(kind, id) {
      if (kind === "expense") {
        return openExpenseForm(id);
      }
      if (kind === "reimbursement") {
        return openReimbursementForm(id);
      }
      if (kind === "invoice") {
        return openInvoiceForm(id);
      }
      if (kind === "project") {
        return openProjectForm(id);
      }
      if (kind === "client") {
        return openClientForm(id);
      }
      // Delega para implementação original do views.js
      return originalOpenEntity(kind, id);
    }

    // Sobrescreve apenas as funções migradas no NFViews existente
    NFViews.dashboard = viewDashboard;
    NFViews.home = viewHome;
    NFViews.expenses = viewExpenses;
    NFViews.openExpenseForm = openExpenseForm;
    NFViews.openServiceForm = openServiceForm;
    NFViews.reimbursements = viewReimbursements;
    NFViews.openReimbursementForm = openReimbursementForm;
    NFViews.invoices = viewInvoices;
    NFViews.openInvoiceForm = openInvoiceForm;
    NFViews.projects = viewProjects;
    NFViews.openProjectForm = openProjectForm;
    NFViews.clients = viewClients;
    NFViews.openClientForm = openClientForm;
    NFViews.users = viewUsers;
    NFViews.audit = viewAudit;
    NFViews.settings = viewSettings;
    NFViews.invites = viewInvitesAdmin;
    NFViews.invite = viewInviteSignup; // Public signup page
    NFViews.inviteSignup = viewInviteSignup; // Alias
    NFViews.changelog = viewChangelog;
    NFViews.bindOpenButtons = () => {}; // deprecated - event delegation já ativo

    // Exporta funções globalmente (sobrescreve views.js originais)
    global.viewDashboard = viewDashboard;
    global.viewHome = viewHome;
    global.viewExpenses = viewExpenses;
    global.openExpenseForm = openExpenseForm;
    global.openServiceForm = openServiceForm;
    global.viewReimbursements = viewReimbursements;
    global.openReimbursementForm = openReimbursementForm;
    global.viewInvoices = viewInvoices;
    global.openInvoiceForm = openInvoiceForm;
    global.viewProjects = viewProjects;
    global.openProjectForm = openProjectForm;
    global.viewClients = viewClients;
    global.openClientForm = openClientForm;
    global.viewUsers = viewUsers;
    global.viewAudit = viewAudit;
    global.viewInvitesAdmin = viewInvitesAdmin;
    global.viewInviteSignup = viewInviteSignup;
    global.viewSettings = viewSettings;
    global.viewChangelog = viewChangelog;
    global.openServiceDrawer = openServiceDrawer;
    global.openUserTenantsDrawer = openUserTenantsDrawer;
    global.getInviteToken = getInviteToken;
    global.openEntity = openEntity;

    // Re-bind melhorado: remove listener antigo e cria novo com referência atualizada
    global.__OPEN_BIND__ = false;
    
    // Remove listeners antigos
    const oldHandler = global.__OPEN_HANDLER__;
    if (oldHandler) {
      document.removeEventListener("click", oldHandler);
    }
    
    // Cria novo handler que sempre chama window.openEntity (dinâmico)
    const newHandler = (e) => {
      const btn = e.target.closest("[data-open]");
      if (!btn) return;
      e.preventDefault();
      window.openEntity(btn.dataset.open, btn.dataset.id);
    };
    
    document.addEventListener("click", newHandler);
    global.__OPEN_HANDLER__ = newHandler;
    global.__OPEN_BIND__ = true;

  }

  // Inicializa imediatamente (views.js já carregou antes)
  initViews();

})(window);
