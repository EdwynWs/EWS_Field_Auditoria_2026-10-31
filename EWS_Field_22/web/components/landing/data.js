export const PRODUCT_TABS = [
  {
    id: "gestao",
    label: "Visão do gestor",
    eyebrow: "PAINEL WEB",
    title: "Clareza para quem coordena.",
    description:
      "Organize clientes, técnicos e ordens em um painel que facilita o acompanhamento de cada atendimento.",
  },
  {
    id: "campo",
    label: "Aplicativo do técnico",
    eyebrow: "APP MOBILE",
    title: "Tudo à mão para quem executa.",
    description:
      "Consulte a ordem atribuída, registre chegada e saída com localização e reúna as evidências do atendimento.",
  },
  {
    id: "relatorio",
    label: "Registros e relatórios",
    eyebrow: "HISTÓRICO",
    title: "O trabalho feito não se perde.",
    description:
      "Observações, fotos, checklists e registros ficam associados à ordem de serviço para consulta posterior.",
  },
];

export const JOURNEY = [
  {
    id: "planejar",
    index: "01",
    title: "Planeje com clareza.",
    description:
      "Cadastre o cliente, organize os detalhes da solicitação e defina o técnico responsável.",
    indicator: "ORDEM CRIADA",
  },
  {
    id: "executar",
    index: "02",
    title: "Execute em campo.",
    description:
      "O técnico consulta sua ordem no aplicativo e registra a chegada e a saída com GPS e foto.",
    indicator: "VISITA REGISTRADA",
  },
  {
    id: "documentar",
    index: "03",
    title: "Documente o serviço.",
    description:
      "Checklists, observações e evidências fotográficas compõem o histórico do atendimento.",
    indicator: "RELATÓRIO ADICIONADO",
  },
  {
    id: "acompanhar",
    index: "04",
    title: "Acompanhe de perto.",
    description:
      "O escritório consulta o andamento das ordens e o histórico das atividades realizadas.",
    indicator: "VISÃO ATUALIZADA",
  },
];

export const INDUSTRIES = [
  {
    id: "01",
    title: "Assistência técnica",
    text: "Chamados, visitas e informações que não ficam perdidos em conversas.",
    icon: "Wrench",
  },
  {
    id: "02",
    title: "Manutenção industrial",
    text: "Histórico de atividades e evidências de intervenções realizadas.",
    icon: "Factory",
  },
  {
    id: "03",
    title: "Instalação e montagem",
    text: "Mais contexto para acompanhar equipes, clientes e serviços externos.",
    icon: "HardHat",
  },
  {
    id: "04",
    title: "Pós-venda em campo",
    text: "Acompanhamento organizado do atendimento até a conclusão.",
    icon: "Headset",
  },
];

export const FAQ = [
  [
    "O EWS Field funciona pelo navegador e pelo celular?",
    "Sim. A gestão utiliza o painel web, e os técnicos podem usar o aplicativo para consultar ordens atribuídas e registrar o atendimento.",
  ],
  [
    "O sistema registra localização e fotos?",
    "Sim. Os fluxos de visita permitem registrar chegada e saída com localização e fotografia, mediante as permissões do dispositivo. Relatórios também podem conter evidências fotográficas.",
  ],
  [
    "Posso cadastrar minha equipe e meus clientes?",
    "Sim. O gestor cadastra técnicos e clientes e pode atribuir ordens aos integrantes da própria empresa.",
  ],
  [
    "Quais segmentos podem utilizar a plataforma?",
    "A plataforma foi concebida para empresas de assistência técnica, manutenção, instalações, pós-venda e outras operações com equipes externas.",
  ],
  [
    "O EWS Field já realiza cobrança recorrente automática?",
    "Ainda não. A versão operacional atual não inclui pagamentos ou assinaturas automáticas; as condições comerciais são tratadas com a EWS Tech.",
  ],
];
