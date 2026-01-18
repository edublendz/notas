// seed.js (corrigido: auto-suficiente)
(function (global) {
  "use strict";

  // ===== Utils (ANTES dependia do store.js) =====
  const uid = (p="id") =>
    `${p}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;

  const ROLE = { MASTER:"MASTER", OPER:"OPERADOR" };

  const ST = {
    // OS (Ordem de Serviço)
    OS_ENVIADA: "Enviada",
    OS_APROVADA: "Aprovada",
    OS_REPROVADA: "Reprovada",
    OS_FATURADA: "Faturada",

    // Reembolso
    RB_SOLICITADO: "Solicitado",
    RB_APROVADO: "Aprovado",
    RB_REPROVADO: "Reprovado",

    // Nota do Fornecedor (NF)
    NF_ENVIADA: "Enviada",
    NF_APROVADA: "Aprovada",
    NF_REPROVADA: "Reprovada",
    NF_PAGA: "Paga",
  };

  function monthKeyFromDate(d){
    const dt = (d instanceof Date) ? d : new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,"0");
    return `${y}-${m}`;
  }

  function monthShift(ym, delta){
    const [y,m] = ym.split("-").map(Number);
    const base = new Date(y, m-1, 1);
    base.setMonth(base.getMonth() + delta);
    return monthKeyFromDate(base);
  }

  // ===== SEED original (inalterado) =====
  function seed(){
    // tenants
    const tenants = [
      { id: uid("tenant"), key:"typic", name:"Typic", doc:"11.111.111/0001-11", settings:{ indicatorPct:0.45, requireProjectLink:false } },
      { id: uid("tenant"), key:"diapason", name:"Diapason", doc:"22.222.222/0001-22", settings:{ indicatorPct:0.45, requireProjectLink:false } },
      { id: uid("tenant"), key:"vdt", name:"Vou de Trip", doc:"33.333.333/0001-33", settings:{ indicatorPct:0.45, requireProjectLink:false } }
    ];
    const t = k => tenants.find(x=>x.key===k).id;

    // users
	const users = [
	  {
	    id: uid("user"),
	    name: "Master",
	    email: "master@corp.com",
	    password: "123456",
	    role: ROLE.MASTER,
	    status: "APPROVED",
	    tenantIds: [t("typic"), t("diapason"), t("vdt")],
	    clientIds: [],       // master vê tudo
	    projectIds: [],      // master vê tudo
	    active: true,
	    createdAt: new Date().toISOString()
	  },

	  {
	    id: uid("user"),
	    name: "Diego Rigolino",
	    email: "diego@diapason.com.br",
	    password: "123456",
	    role: ROLE.MASTER,
	    status: "APPROVED",
	    tenantIds: [t("diapason")],
	    clientIds: [],
	    projectIds: [],
	    active: true,
	    createdAt: new Date().toISOString()
	  },

	  {
	    id: uid("user"),
	    name: "Eduardo",
	    email: "eduardo@vdt.com.br",
	    password: "123456",
	    role: ROLE.MASTER,
	    status: "APPROVED",
	    tenantIds: [t("vdt")],
	    clientIds: [],
	    projectIds: [],
	    active: true,
	    createdAt: new Date().toISOString()
	  },

	  {
	    id: uid("user"),
	    name: "Felipe",
	    email: "felipe@typic.com.br",
	    password: "123456",
	    role: ROLE.MASTER,
	    status: "APPROVED",
	    tenantIds: [t("typic")],
	    clientIds: [],
	    projectIds: [],
	    active: true,
	    createdAt: new Date().toISOString()
	  },

	  {
	    id: uid("user"),
	    name: "Rafael",
	    email: "rafael@blendz.com.br",
	    password: "123456",
	    role: ROLE.MASTER,
	    status: "APPROVED",
	    tenantIds: [t("typic"), t("diapason"), t("vdt")],
	    clientIds: [],
	    projectIds: [],
	    active: true,
	    createdAt: new Date().toISOString()
	  },

	  {
	    id: uid("user"),
	    name: "Bruno Rigolino",
	    email: "bruno@corp.com",
	    password: "123456",
	    role: ROLE.MASTER,
	    status: "APPROVED",
	    tenantIds: [t("typic"), t("diapason")],
	    clientIds: [],
	    projectIds: [],
	    active: true,
	    createdAt: new Date().toISOString()
	  },

	  // Operadores
	  {
	    id: uid("user"),
	    name: "Talita",
	    email: "talita@vdt.com.br",
	    password: "123456",
	    role: ROLE.OPER,
	    status: "APPROVED",
	    tenantIds: [t("vdt")],
	    clientIds: [],
	    projectIds: [],
	    active: true,
	    createdAt: new Date().toISOString()
	  },

	  {
	    id: uid("user"),
	    name: "Batata",
	    email: "batata@diapason.com.br",
	    password: "123456",
	    role: ROLE.OPER,
	    status: "APPROVED",
	    tenantIds: [t("diapason")],
	    clientIds: [],
	    projectIds: [],
	    active: true,
	    createdAt: new Date().toISOString()
	  },

	  {
	    id: uid("user"),
	    name: "Carol",
	    email: "carol@typic.com.br",
	    password: "123456",
	    role: ROLE.OPER,
	    status: "APPROVED",
	    tenantIds: [t("typic")],
	    clientIds: [],
	    projectIds: [],
	    active: true,
	    createdAt: new Date().toISOString()
	  }
	];

	// helper existente — mantido
	const u = name => users.find(x => x.name === name).id;

	


    // clients (2 por tenant)
    const clients = [
      { id: uid("cli"), code:"CLI-1001", tenantId:t("typic"), name:"Squadra", doc:"00.000.000/0001-01" },
      { id: uid("cli"), code:"CLI-1002", tenantId:t("typic"), name:"PrimeControl", doc:"00.000.000/0001-02" },
      { id: uid("cli"), code:"CLI-2001", tenantId:t("diapason"), name:"Expo Canabis", doc:"00.000.000/0001-03" },
      { id: uid("cli"), code:"CLI-2002", tenantId:t("diapason"), name:"Tabu", doc:"00.000.000/0001-04" },
      { id: uid("cli"), code:"CLI-3001", tenantId:t("vdt"), name:"Cliente VDT 01", doc:"00.000.000/0001-05" },
      { id: uid("cli"), code:"CLI-3002", tenantId:t("vdt"), name:"Cliente VDT 02", doc:"00.000.000/0001-06" },
    ];
    const c = code => clients.find(x=>x.code===code).id;


    // projects (2 por cliente)
    function mkProject(tenantKey, clientCode, idx, nameBase){
      const code = `${tenantKey.toUpperCase()}-PRJ-${String(1000+idx).slice(-4)}`;
      const value = 60000 + idx*5000;
      const cost = Math.round(value * (0.35 + (idx%3)*0.05));
      return {
        id: uid("prj"),
        code,
        tenantId: t(tenantKey),
        clientId: c(clientCode),
        name: `${nameBase} ${idx%2? "A":"B"}`,
        ownerUserId: u("Rafael"),
        valueTotal: value,
        costPlanned: cost,
        indicatorOverridePct: null, // ex: 0.40
        status: "Em andamento",
        createdAt: new Date(Date.now()-1000*60*60*24*(10+idx)).toISOString()
      };
    }
    const projects = [
      mkProject("typic","CLI-1001",1,"Projeto Typic 01"),
      mkProject("typic","CLI-1001",2,"Projeto Typic 02"),
      mkProject("typic","CLI-1002",3,"Projeto Typic 03"),
      mkProject("typic","CLI-1002",4,"Projeto Typic 04"),
      mkProject("diapason","CLI-2001",5,"Projeto Diapason 01"),
      mkProject("diapason","CLI-2001",6,"Projeto Diapason 02"),
      mkProject("diapason","CLI-2002",7,"Projeto Diapason 03"),
      mkProject("diapason","CLI-2002",8,"Projeto Diapason 04"),
      mkProject("vdt","CLI-3001",9,"Projeto VDT 01"),
      mkProject("vdt","CLI-3001",10,"Projeto VDT 02"),
      mkProject("vdt","CLI-3002",11,"Projeto VDT 03"),
      mkProject("vdt","CLI-3002",12,"Projeto VDT 04"),
    ];
	const p = code => projects.find(x=>x.code===code).id;

    // user-project links (usado quando requireProjectLink=true)
    const projectUsers = [
      // VDT: Talita só em dois projetos
      { id: uid("pu"), tenantId:t("vdt"), projectId: projects[8].id, userId: u("Talita") },
      { id: uid("pu"), tenantId:t("vdt"), projectId: projects[9].id, userId: u("Talita") },
      // Typic: Carol em dois projetos
      { id: uid("pu"), tenantId:t("typic"), projectId: projects[0].id, userId: u("Carol") },
      { id: uid("pu"), tenantId:t("typic"), projectId: projects[2].id, userId: u("Carol") },
      // Diapason: Batata em dois projetos
      { id: uid("pu"), tenantId:t("diapason"), projectId: projects[4].id, userId: u("Batata") },
      { id: uid("pu"), tenantId:t("diapason"), projectId: projects[6].id, userId: u("Batata") },
    ];

	// invites 
	const invites = [
	  {
	    id: uid("invite"),
	    token: "INV-OPER-DIAPASON-001",
	    tenantId: t("diapason"),
	    role: ROLE.OPER,

	    // usa cliente/projeto que EXISTEM no seu seed
	    clientIds: [ c("CLI-2001") ],
	    projectIds: [ projects[4].code ? p(projects[4].code) : projects[4].id ],

	    status: "ACTIVE",
	    createdBy: u("Diego Rigolino"),
	    createdAt: new Date().toISOString(),
	    expiresAt: null,
	    usedAt: null,
	    usedBy: null
	  },

	  {
	    id: uid("invite"),
	    token: "INV-OPER-VDT-001",
	    tenantId: t("vdt"),
	    role: ROLE.OPER,

	    clientIds: [ c("CLI-3001") ],
	    projectIds: [ p(projects[8].code), p(projects[9].code) ],

	    status: "ACTIVE",
	    createdBy: u("Eduardo"),
	    createdAt: new Date().toISOString(),
	    expiresAt: null,
	    usedAt: null,
	    usedBy: null
	  }
	];



    // sales (mock)
    const sales = [
      { id: uid("sale"), tenantId:t("vdt"), clientId: c("CLI-3001"), type:"Projeto", title:"Venda – Projeto Growth", valueTotal:120000, plannedCost:52000, createdBy:u("Eduardo"), createdAt:new Date(Date.now()-1000*60*60*24*18).toISOString() },
      { id: uid("sale"), tenantId:t("vdt"), clientId: c("CLI-3002"), type:"Fee mensal", title:"Venda – Fee mensal Martech (3 meses)", valueTotal:25000, plannedCost:9000, createdBy:u("Eduardo"), createdAt:new Date(Date.now()-1000*60*60*24*35).toISOString() },
      { id: uid("sale"), tenantId:t("typic"), clientId: c("CLI-1001"), type:"Projeto", title:"Venda – Implantação", valueTotal:80000, plannedCost:32000, createdBy:u("Felipe"), createdAt:new Date(Date.now()-1000*60*60*24*22).toISOString() }
    ];

    // serviços (combo)
    const services = [
      { id: uid("srv"), tenantId:t("typic"), name:"Transporte" },
      { id: uid("srv"), tenantId:t("typic"), name:"Alimentação" },
      { id: uid("srv"), tenantId:t("typic"), name:"Software" },
      { id: uid("srv"), tenantId:t("diapason"), name:"Terceiros" },
      { id: uid("srv"), tenantId:t("diapason"), name:"Hospedagem" },
      { id: uid("srv"), tenantId:t("vdt"), name:"Passeio" },
      { id: uid("srv"), tenantId:t("vdt"), name:"Transporte" },
      { id: uid("srv"), tenantId:t("vdt"), name:"Alimentação" },
    ];

    const now = new Date();
    const thisMonth = monthKeyFromDate(now); // ex 2026-01
    const lastMonth = monthShift(thisMonth,-1);

    // despesas (nova entidade)
    const expenses = [
      { id: uid("dp"), tenantId:t("vdt"), projectId: projects[8].id, serviceId: services.find(s=>s.tenantId===t("vdt") && s.name==="Transporte")?.id, desc:"", complement:"Uber aeroporto", value: 180.00, dateBuy: `${thisMonth}-05`, status: ST.OS_APROVADA, nfId:null, createdBy: u("Talita"), createdAt: new Date(Date.now()-1000*60*60*24*2).toISOString() },
      { id: uid("dp"), tenantId:t("vdt"), projectId: projects[9].id, serviceId: services.find(s=>s.tenantId===t("vdt") && s.name==="Alimentação")?.id, desc:"", complement:"Almoço com cliente", value: 95.50, dateBuy: `${thisMonth}-06`, status: ST.OS_APROVADA, nfId:null, createdBy: u("Talita"), createdAt: new Date(Date.now()-1000*60*60*24*2).toISOString() },
      { id: uid("dp"), tenantId:t("diapason"), projectId: projects[4].id, serviceId: services.find(s=>s.tenantId===t("diapason") )?.id, desc:"", complement:"OS exemplo", value: 240.00, dateBuy: `${lastMonth}-18`, status: ST.OS_ENVIADA, nfId:null, createdBy: u("Batata"), createdAt: new Date(Date.now()-1000*60*60*24*20).toISOString() },
    ];

    // reembolsos (com tipos)
    const reimbursements = [
      { id: uid("rb"), tenantId:t("vdt"), projectId: projects[8].id, type:"Transporte", desc:"", complement:"Pedágio", value: 32.40, dateBuy: `${thisMonth}-03`, status: ST.RB_SOLICITADO, createdBy:u("Talita"), createdAt: new Date(Date.now()-1000*60*60*24*3).toISOString() },
      { id: uid("rb"), tenantId:t("typic"), projectId: projects[0].id, type:"Software", desc:"", complement:"Licença ferramenta", value: 149.90, dateBuy: `${thisMonth}-02`, status: ST.RB_APROVADO, createdBy:u("Carol"), createdAt: new Date(Date.now()-1000*60*60*24*6).toISOString() },
    ];

    // NF inicial (mock) - master aprova
    const invItems = [
      { id: uid("it"), projectId: projects[8].id, desc:"Serviço consultoria", value: 9000 },
      { id: uid("it"), projectId: projects[9].id, desc:"Serviço suporte", value: 6000 },
    ];
    const invoices = [
      { id: uid("nf"), tenantId:t("vdt"), issuerUserId: u("Talita"), total: 15000, totalReadonly:false,
        monthCompetency: lastMonth, monthIssue: thisMonth,
        file:{name:"NF_0001.pdf", note:"mock"}, status: ST.NF_ENVIADA,
        items: invItems,
        expenseIds: [],
        createdBy: u("Talita"), createdAt: new Date(Date.now()-1000*60*60*4).toISOString()
      }
    ];

    const audit = [
      { id: uid("aud"), tenantId:t("vdt"), actorUserId: u("Eduardo"), action:"SEED", meta:"Banco mock inicial (V10)", createdAt: new Date().toISOString() }
    ];

    // session default: Eduardo on VDT
    return {
      tenants, users, clients, projects, projectUsers, sales, services, expenses, reimbursements, invoices, audit,  invites, 
      //session: { userId: u("Eduardo"), tenantId: t("vdt") },
      ui: { drawerFull:false, month: thisMonth }
    };
  }

  // expõe para o store.js chamar
  global.seed = seed;

})(window);
