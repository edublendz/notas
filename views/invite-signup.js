/**
 * @file views/invite-signup.js
 * @description Tela pública de cadastro via convite
 */

(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;

  const $ = (sel) => document.querySelector(sel);
  const escapeHtml = NFUI.escapeHtml;
  const toast = NFUI.toast;
  const setTitle = global.setTitle || (() => {});

  // API Base URL
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : '/apis/public/index.php';

  // =========================================================================
  // HELPER: Get invite token from URL
  // =========================================================================

  function getInviteToken() {
    const q = new URLSearchParams(location.search);
    const qt = q.get("invite") || q.get("token");
    if (qt) return qt;

    const h = (location.hash || "").replace(/^#/, "");
    if (!h) return "";
    const hp = new URLSearchParams(h.includes("&") ? h : h.replace(/\?/g, "&"));
    return hp.get("invite") || hp.get("token") || "";
  }

  // =========================================================================
  // VIEW INVITE SIGNUP
  // =========================================================================

  async function viewInviteSignup() {
    console.log("🔵 viewInviteSignup() CHAMADA (views/invite-signup.js)");

    const token = getInviteToken();
    setTitle("Convite", token ? "Crie seu acesso" : "Token não encontrado");

    if (!token) {
      $("#content").innerHTML = `
        <div class="card" style="max-width:600px;margin:0 auto">
          <div class="empty">
            Abra um link com <span class="mono">#invite=TOKEN</span> ou <span class="mono">?invite=TOKEN</span>.
          </div>
        </div>
      `;
      return;
    }

    // Validate token with API
    $("#content").innerHTML = `
      <div class="card" style="max-width:600px;margin:0 auto">
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Validando convite...</div>
        </div>
      </div>
    `;

    try {
      const resp = await fetch(`${API_BASE}/api/public/invites/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Convite inválido");
      }

      const inviteData = await resp.json();
      renderSignupForm(token, inviteData);
    } catch (err) {
      console.error("❌ Erro ao validar convite:", err);
      $("#content").innerHTML = `
        <div class="card" style="max-width:600px;margin:0 auto">
          <div class="hint error">⚠️ ${escapeHtml(err.message)}</div>
          <div class="hr"></div>
          <button class="btn" onclick="window.location.hash='login'">Voltar para login</button>
        </div>
      `;
    }
  }

  function renderSignupForm(token, inviteData) {
    $("#content").innerHTML = `
      <div class="card" style="max-width:720px;margin:0 auto">
        <h3 style="margin:0">Cadastro via convite</h3>
        <div class="hint">
          Você será criado como <strong>PENDENTE</strong> até aprovação do MASTER.
        </div>
        <div class="hr"></div>

        <div class="row" style="gap:14px;flex-wrap:wrap">
          <span class="chip gray">Empresa: <strong>${escapeHtml(inviteData.tenant?.name || "—")}</strong></span>
          <span class="chip gray">Perfil: <strong>${escapeHtml(inviteData.role?.name || "—")}</strong></span>
        </div>

        <div class="hr"></div>

        <div class="split">
          <div class="field">
            <label>Nome completo</label>
            <input id="ivName" placeholder="Seu nome" autocomplete="name" />
          </div>
          <div class="field">
            <label>Email</label>
            <input id="ivEmail" type="email" 
                   value="${escapeHtml(inviteData.email || '')}"
                   placeholder="seu@email.com" 
                   autocomplete="email" />
          </div>
        </div>

        <div class="field">
          <label>Senha</label>
          <input id="ivPass" type="password" 
                 placeholder="Crie uma senha" 
                 autocomplete="new-password" />
          <div class="hint">Mínimo 6 caracteres.</div>
        </div>

        <div class="row">
          <button class="btn primary" id="ivGo">Finalizar cadastro</button>
          <span style="flex:1"></span>
          <button class="btn" id="ivBack">Voltar para login</button>
        </div>

        <div class="hr"></div>
        <div class="hint" id="ivMsg"></div>
      </div>
    `;

    $("#ivBack").onclick = () => {
      window.location.hash = "login";
    };

    $("#ivGo").onclick = async () => {
      await acceptInvite(token);
    };
  }

  async function acceptInvite(token) {
    const name = $("#ivName").value.trim();
    const email = $("#ivEmail").value.trim();
    const password = $("#ivPass").value;

    if (!name || !email || !password) {
      toast("Preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      toast("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    $("#ivMsg").innerHTML = `⏳ Processando cadastro...`;
    $("#ivGo").disabled = true;

    try {
      const resp = await fetch(`${API_BASE}/api/public/invites/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, email, password }),
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();

      $("#ivMsg").innerHTML = `
        <div style="background:var(--ok);color:white;padding:12px;border-radius:4px">
          ✅ ${escapeHtml(data.message || 'Cadastro realizado com sucesso!')}
        </div>
      `;

      // Limpar token da URL
      try {
        const clean = location.href.split("#")[0].split("?")[0];
        history.replaceState({}, "", clean);
      } catch (e) {}

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        window.location.hash = "login";
      }, 2000);
    } catch (err) {
      console.error("❌ Erro ao aceitar convite:", err);
      $("#ivMsg").innerHTML = `
        <span style="color:var(--danger)">❌ ${escapeHtml(err.message)}</span>
      `;
      $("#ivGo").disabled = false;
    }
  }

  // =========================================================================
  // EXPORTS
  // =========================================================================

  global.NFViewsInviteSignup = {
    viewInviteSignup,
    getInviteToken,
  };

  console.log("✅ views/invite-signup.js carregado");
})(window);
