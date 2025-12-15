
import { Holiday } from '../types';

// Mapeamento simples de cidades para UF/Região
const CITY_REGION_MAP: Record<string, { region: string, country: string }> = {
  // Brasil
  'São Paulo': { region: 'SP', country: 'BR' },
  'Rio de Janeiro': { region: 'RJ', country: 'BR' },
  'Belo Horizonte': { region: 'MG', country: 'BR' },
  'Porto Alegre': { region: 'RS', country: 'BR' },
  'Salvador': { region: 'BA', country: 'BR' },
  'Recife': { region: 'PE', country: 'BR' },
  'Curitiba': { region: 'PR', country: 'BR' },
  'Brasília': { region: 'DF', country: 'BR' },
  'Goiânia': { region: 'GO', country: 'BR' },
  'Campinas': { region: 'SP', country: 'BR' },
  'Santos': { region: 'SP', country: 'BR' },
  'Alegrete': { region: 'RS', country: 'BR' },
  // Latam Examples
  'Buenos Aires': { region: 'CABA', country: 'AR' },
  'Santiago': { region: 'RM', country: 'CL' },
  'Bogotá': { region: 'DC', country: 'CO' },
  'Lima': { region: 'LI', country: 'PE' },
  'Cidade do México': { region: 'CDMX', country: 'MX' }
};

// Cache para evitar requisições repetidas
const holidayCache: Record<string, Holiday[]> = {};

export const HolidayService = {
  // Simula uma API que busca feriados por Ano, País e Região
  getHolidays: async (year: number, city: string): Promise<Holiday[]> => {
    const location = CITY_REGION_MAP[city] || { region: 'SP', country: 'BR' };
    const cacheKey = `${year}-${location.country}-${location.region}`;

    if (holidayCache[cacheKey]) {
      return holidayCache[cacheKey];
    }

    // Simulação de delay de rede
    // await new Promise(r => setTimeout(r, 100)); // Removido delay para performance no cálculo pesado

    let holidays: Holiday[] = [];

    // Base de Feriados (Mock de uma API Real)
    if (location.country === 'BR') {
        holidays = [
            { date: `${year}-01-01`, name: 'Confraternização Universal', type: 'national', country: 'BR' },
            { date: `${year}-02-12`, name: 'Carnaval', type: 'national', country: 'BR' }, // Exemplo fixo
            { date: `${year}-03-29`, name: 'Sexta-feira Santa', type: 'national', country: 'BR' },
            { date: `${year}-04-21`, name: 'Tiradentes', type: 'national', country: 'BR' },
            { date: `${year}-05-01`, name: 'Dia do Trabalho', type: 'national', country: 'BR' },
            { date: `${year}-05-30`, name: 'Corpus Christi', type: 'national', country: 'BR' },
            { date: `${year}-09-07`, name: 'Independência do Brasil', type: 'national', country: 'BR' },
            { date: `${year}-10-12`, name: 'Nossa Senhora Aparecida', type: 'national', country: 'BR' },
            { date: `${year}-11-02`, name: 'Finados', type: 'national', country: 'BR' },
            { date: `${year}-11-15`, name: 'Proclamação da República', type: 'national', country: 'BR' },
            { date: `${year}-12-25`, name: 'Natal', type: 'national', country: 'BR' }
        ];
        
        if (location.region === 'SP') {
            holidays.push({ date: `${year}-07-09`, name: 'Revolução Constitucionalista', type: 'state', country: 'BR' });
            holidays.push({ date: `${year}-11-20`, name: 'Dia da Consciência Negra', type: 'state', country: 'BR' });
        }
        if (location.region === 'RS') {
            holidays.push({ date: `${year}-09-20`, name: 'Revolução Farroupilha', type: 'state', country: 'BR' });
        }
        if (location.region === 'RJ') {
            holidays.push({ date: `${year}-04-23`, name: 'Dia de São Jorge', type: 'state', country: 'BR' });
            holidays.push({ date: `${year}-11-20`, name: 'Zumbi dos Palmares', type: 'state', country: 'BR' });
        }
    } else {
        // Genérico Latam
        holidays = [
            { date: `${year}-01-01`, name: 'Año Nuevo', type: 'national', country: location.country },
            { date: `${year}-05-01`, name: 'Día del Trabajo', type: 'national', country: location.country },
            { date: `${year}-12-25`, name: 'Navidad', type: 'national', country: location.country }
        ];
    }

    holidayCache[cacheKey] = holidays;
    return holidays;
  },

  isBusinessDay: (date: Date, holidays: Holiday[]): boolean => {
    const day = date.getDay();
    if (day === 0 || day === 6) return false; // Sábado ou Domingo
    
    const dateStr = date.toISOString().split('T')[0];
    return !holidays.some(h => h.date === dateStr);
  },

  isValidStartDate: (date: Date, holidays: Holiday[]): boolean => {
    const day = date.getDay();
    if (day === 0 || day === 6) return false; 

    const dateStr = date.toISOString().split('T')[0];
    if (holidays.some(h => h.date === dateStr)) return false;

    // Verificar D-1 e D-2
    const dMinus1 = new Date(date); dMinus1.setDate(date.getDate() - 1);
    const dMinus2 = new Date(date); dMinus2.setDate(date.getDate() - 2);
    
    const h1 = holidays.some(h => h.date === dMinus1.toISOString().split('T')[0]);
    const h2 = holidays.some(h => h.date === dMinus2.toISOString().split('T')[0]);

    if (h1 || h2) return false;

    return true;
  },

  // --- NOVA FUNCIONALIDADE: CÁLCULO DE HORAS COM PONTES (JOIA DO LEGADO) ---
  getBridgeAwareBusinessHours: async (start: Date, end: Date, local: string): Promise<number> => {
      const year = start.getFullYear();
      const holidays = await HolidayService.getHolidays(year, local);
      
      // Se cruzar ano, pega do próximo também
      let allHolidays = [...holidays];
      if (end.getFullYear() > year) {
          const nextHolidays = await HolidayService.getHolidays(year + 1, local);
          allHolidays = [...allHolidays, ...nextHolidays];
      }

      const pontes: string[] = [];
      allHolidays.forEach(h => {
          // Ajuste de timezone simples para garantir dia correto
          const hDate = new Date(h.date + 'T00:00:00');
          const day = hDate.getDay();
          
          if (day === 2) { // Feriado Terça -> Ponte Segunda
             const p = new Date(hDate); p.setDate(p.getDate() - 1);
             pontes.push(p.toISOString().split('T')[0]);
          } else if (day === 4) { // Feriado Quinta -> Ponte Sexta
             const p = new Date(hDate); p.setDate(p.getDate() + 1);
             pontes.push(p.toISOString().split('T')[0]);
          }
      });

      let count = 0;
      let cur = new Date(start);
      while (cur <= end) {
          const curStr = cur.toISOString().split('T')[0];
          const dw = cur.getDay();
          const isWeekend = dw === 0 || dw === 6;
          const isHoliday = allHolidays.some(h => h.date === curStr);
          const isPonte = pontes.includes(curStr);

          if (!isWeekend && !isHoliday && !isPonte) {
              count++;
          }
          cur.setDate(cur.getDate() + 1);
      }

      return count * 8; // 8 horas por dia útil efetivo
  }
};
