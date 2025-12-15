
import { Client, Project } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PRJ-STF01',
    name: 'Projeto STF01',
    manager: 'Diretoria de Sistemas',
    budget: 7343312.00,
    currency_code: 'BRL',
    start_date: '2024-01-01',
    end_date: '2028-12-31',
    status: 'IN_PROGRESS',
    description: 'Modernização dos sistemas de gestão do Estado.',
    max_concurrency_percent: 10,
    preferred_start_weekday: 1,
    country_code: 'BR'
  }
];

// Clientes onde os colaboradores são alocados
export const INITIAL_CLIENTS: Client[] = [
  { id: 1, name: 'CDHU', contact_person: 'Gestor CDHU', email: 'contato@cdhu.sp.gov.br', project_ids: ['PRJ-STF01'], status: 'ACTIVE' },
  { id: 2, name: 'Detran', contact_person: 'Gestor Detran', email: 'rh@detran.sp.gov.br', project_ids: ['PRJ-STF01'], status: 'ACTIVE' },
  { id: 3, name: 'Fazenda', contact_person: 'Gestor Fazenda', email: 'adm@fazenda.sp.gov.br', project_ids: ['PRJ-STF01'], status: 'ACTIVE' },
  { id: 4, name: 'PGE', contact_person: 'Gestor PGE', email: 'rh@pge.sp.gov.br', project_ids: ['PRJ-STF01'], status: 'ACTIVE' },
  { id: 5, name: 'Mobile Cidadão', contact_person: 'Tech Lead', email: 'mobile@prodesp.br', project_ids: ['PRJ-STF01'], status: 'ACTIVE' },
];
