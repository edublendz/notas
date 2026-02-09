// views/home.js
// Home com atalhos principais
(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;

  const $ = (sel) => document.querySelector(sel);

  const setTitle = global.setTitle || (()=>{});

  function viewHome(){
    setTitle("Home", "Atalhos rapidos");

    const content = $("#content");
    if (!content) return;

    const sess = NFStore.getSession?.() || {};
    const user = sess.user || {};
    const isOper = NFStore.isOper?.() || false;

    const shortcuts = [
      { view: "dashboard", title: "Dashboard", desc: "Visao gerencial e indicadores do mes.", icon: "📊", roles: ["MASTER"] },
      { view: "expenses", title: "OS", desc: "Ordens de servico e despesas do periodo.", icon: "🧾", roles: ["MASTER", "OPERADOR"] },
      { view: "reimbursements", title: "Reembolsos", desc: "Solicitacoes e aprovacoes rapidas.", icon: "💸", roles: ["MASTER", "OPERADOR"] },
      { view: "invoices", title: "Notas", desc: "Notas do fornecedor e faturamento.", icon: "📄", roles: ["MASTER", "OPERADOR"] },
      { view: "projects", title: "Projetos", desc: "Status, custos e margem por projeto.", icon: "📦", roles: ["MASTER"] },
      { view: "clients", title: "Clientes", desc: "Cadastro e relacao com clientes.", icon: "👥", roles: ["MASTER"] },
      { view: "users", title: "Usuarios", desc: "Permissoes e membros da equipe.", icon: "👤", roles: ["MASTER"] },
      { view: "invites", title: "Convites", desc: "Convide usuarios para o tenant.", icon: "🔗", roles: ["MASTER"] },
      { view: "settings", title: "Configuracoes", desc: "Ajustes e parametros do sistema.", icon: "⚙️", roles: ["MASTER"] },
      { view: "audit", title: "Auditoria", desc: "Logs e rastreabilidade do sistema.", icon: "🕵️", roles: ["MASTER"] }
    ];

    const visible = shortcuts.filter(s => {
      if (!s.roles || s.roles.length === 0) return true;
      return isOper ? s.roles.includes("OPERADOR") : s.roles.includes("MASTER");
    });

    content.innerHTML = `
      <div class="home-hero">
        <div>
          <div class="home-kicker">Bem-vindo${user?.name ? ", " + NFUI.escapeHtml(user.name) : ""}</div>
          <h3 class="home-title">O que voce quer abrir agora?</h3>
          <div class="home-sub">Escolha um atalho para ir direto ao ponto.</div>
        </div>
        <div class="home-badge">Home</div>
      </div>

      <div class="home-section">
        <div class="home-section-title">Principais funcionalidades</div>
        <div class="home-grid">
          ${visible.map(s => `
            <button class="big-card" data-view="${s.view}" type="button">
              <div class="big-card-icon">${s.icon}</div>
              <div class="big-card-body">
                <div class="big-card-title">${s.title}</div>
                <div class="big-card-desc">${s.desc}</div>
              </div>
              <div class="big-card-cta">Abrir</div>
            </button>
          `).join("")}
        </div>
      </div>
    `;

    const go = (view) => {
      if (typeof global.viewRouter === "function") global.viewRouter(view);
    };

    content.querySelectorAll("[data-view]").forEach((el) => {
      el.addEventListener("click", () => go(el.dataset.view));
    });
  }

  global.NFViewsHome = {
    viewHome
  };

})(window);
