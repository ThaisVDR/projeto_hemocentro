// Ficha fictícia FIC-0320 (Ana Luísa Martins), igual ao protótipo do Figma.
import { CampoRevisavel, EstadoCampo, FichaEmRevisao } from '@/domain/revisao'

function campo(
  rotulo: string,
  valor: string | null,
  estado: EstadoCampo,
  pagina: number,
  nota?: string
): CampoRevisavel {
  return { rotulo, valor, estado, pagina, nota }
}

const reacoesDiaPanel = ['0', '0', '4+', '4+', '4+', '4+', '4+', '4+', '4+', '4+', '4+'].map((enzima, i) => ({
  celula: String(i + 1),
  coombs: '0',
  enzima,
  frio: null
}))

export function criarFichaDemonstracao(): FichaEmRevisao {
  return {
    id: 'FIC-0320',
    lote: 'DEM-012',
    arquivo: 'Hemocentro.pdf',
    totalPaginas: 4,
    documentosPorPagina: [
      'Ficha transfusional',
      'ID-DiaCell I, II',
      'ID-DiaPanel',
      'Pesquisa imuno-hematológica'
    ],
    status: 'em_revisao',
    revisaoIniciada: { por: 'Camila Rocha', hora: '10:24' },
    origem: 'scanner • enviado por Rafael Nunes em 09/10/2026, 09:42',
    cadastroSemelhante: {
      prontuario: 'DEM-0142',
      motivo: 'Nome e nascimento coincidem. Vínculo não confirmado.'
    },
    identificacao: {
      nome: campo('Nome do receptor', 'Ana Luísa Martins', 'conferido', 1),
      prontuario: campo('Prontuário', 'FIC-0320', 'conferido', 1),
      racaCor: campo('Raça/cor', '1', 'sugerido', 1),
      aboRh: campo('ABO/Rh', 'O+', 'sugerido', 1),
      dataNascimento: campo('Data de nascimento (DN)', '1988-03-14', 'incerto', 1, 'Leitura incerta: dia 14 ou 19'),
      nomeMae: campo('Nome da mãe', 'Maria H. Martins', 'incerto', 1, 'Abreviação no original • conferir antes de expandir'),
      municipio: campo('Município', 'Cuiabá / MT', 'sugerido', 1),
      diagnostico: campo('Diagnóstico', 'Anemia falciforme', 'sugerido', 1),
      sexo: campo('Sexo', 'F', 'conferido', 4),
      cartaoSus: campo('Cartão SUS', null, 'nao_consta', 4)
    },
    transfusoes: [
      {
        dataEnvio: '2026-05-05',
        tipoHemocomponente: 'CHDF',
        numeroDoacao: 'DEMO-DOA-001',
        grsRhd: 'O positivo',
        volMl: '235',
        testesPai: 'NR',
        provaCruzada: 'NR',
        destino: 'Cuiabá / MT',
        responsavelLiberacao: 'Responsável A • DEMO'
      },
      {
        dataEnvio: '2026-05-05',
        tipoHemocomponente: 'CHDF',
        numeroDoacao: 'DEMO-DOA-002',
        grsRhd: 'O positivo',
        volMl: '252',
        testesPai: 'NR',
        provaCruzada: 'NR',
        destino: 'Cuiabá / MT',
        responsavelLiberacao: 'Responsável B • DEMO'
      },
      {
        dataEnvio: '2026-07-21',
        tipoHemocomponente: 'CHDF',
        numeroDoacao: 'DEMO-DOA-003',
        grsRhd: 'O positivo',
        volMl: '268',
        testesPai: 'NR',
        provaCruzada: 'NR',
        destino: 'Sorriso / MT',
        responsavelLiberacao: 'Responsável C • DEMO'
      }
    ],
    transfusoesConferencia: { rotulo: 'Tabela de envios', estado: 'sugerido', pagina: 1 },
    pesquisas: [
      {
        documento: 'ID-DiaCell I, II',
        pagina: 2,
        data: campo('Data', '2024-12-13', 'sugerido', 2),
        grupoAntigenos: campo('Grupo sanguíneo + antígenos', 'O RhD positivo', 'sugerido', 2),
        interpretacao: campo('Interpretação', 'Anti-c', 'sugerido', 2),
        loteKit: campo('Lote do kit', '45151.63.1', 'sugerido', 2),
        reacoes: [
          { celula: 'I', coombs: '0', enzima: '0', frio: null },
          { celula: 'II', coombs: '1+', enzima: '4+', frio: null },
          { celula: 'Autocontrole', coombs: '0', enzima: '0', frio: null }
        ],
        reacoesConferencia: { rotulo: 'Reações DiaCell', estado: 'sugerido', pagina: 2 }
      },
      {
        documento: 'ID-DiaPanel',
        pagina: 3,
        data: campo('Data', '2024-12-13', 'sugerido', 3),
        grupoAntigenos: campo('Grupo sanguíneo + antígenos', 'O RhD positivo', 'sugerido', 3),
        interpretacao: campo('Interpretação', 'Anti-c', 'sugerido', 3),
        loteKit: campo('Lote do kit', '45161.13.1', 'sugerido', 3),
        reacoes: [
          ...reacoesDiaPanel,
          { celula: 'Autocontrole', coombs: '0', enzima: '0', frio: null }
        ],
        reacoesConferencia: { rotulo: 'Reações DiaPanel', estado: 'sugerido', pagina: 3 }
      }
    ],
    imunohematologia: {
      grupoSanguineo: campo('Grupo sanguíneo', 'O', 'sugerido', 4),
      fatorRh: campo('Fator Rh', 'Positivo', 'sugerido', 4),
      dFraco: campo('D fraco', null, 'nao_consta', 4),
      pai: campo('Pesquisa de anticorpos irregulares (PAI)', 'Negativo', 'sugerido', 4),
      autocontrole: campo('Autocontrole', 'Negativo', 'sugerido', 4),
      tad: campo('Teste da antiglobulina humana (TAD)', 'Negativo', 'sugerido', 4),
      dcScreening: campo('Antiglobulina monoespecífico DC-Screening I', 'Não realizado', 'sugerido', 4),
      observacao: campo('Observação', 'Diagnóstico de anemia falciforme.', 'sugerido', 4),
      solicitante: campo('Solicitante', 'Equipe solicitante • DEMO', 'sugerido', 4),
      amostra: campo('Amostra', 'EDTA', 'sugerido', 4),
      metodologia: campo('Metodologia', 'Gel / Centrifugação', 'sugerido', 4),
      dataExame: campo('Data do exame', '2026-08-14', 'sugerido', 4),
      responsavelTecnico: campo('Responsável técnico', 'Profissional técnico • DEMO', 'sugerido', 4),
      fenotipo: {
        C: '4+', c: '0', E: '0', e: '4+', K: '0', k: '3+', Kpa: '0', Kpb: '2+',
        Jka: '4+', Jkb: '4+', M: '0', N: '2+', S: '0', s: '2+', Fya: '0', Fyb: '2+',
        P1: '4+', Lea: '0', Leb: '4+', Lua: '0', Lub: '4+'
      },
      fenotipoConferencia: { rotulo: 'Fenotipagem eritrocitária', estado: 'sugerido', pagina: 4 },
      anticorpos: [
        { data: '2024-12-13', metodo: 'Gel / Enzima', especificidade: 'Anti-c', classe: null }
      ],
      anticorposConferencia: { rotulo: 'Identificação de anticorpos irregulares', estado: 'sugerido', pagina: 4 }
    }
  }
}
