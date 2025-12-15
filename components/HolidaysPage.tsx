
// =========================================================
//  SmartVacations - Enterprise 1.0
//  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
// =========================================================

import React, { useState, useEffect } from 'react';
import { Calendar, Globe, Search, MapPin } from 'lucide-react';
import { HolidayService } from '../services/holidayApi';
import { Holiday } from '../types';

const HolidaysPage: React.FC = () => {
    const [selectedCity, setSelectedCity] = useState('São Paulo');
    const [year, setYear] = useState(2025);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(false);

    // Lista de cidades suportadas pela API Simulada
    const cities = [
        'São Paulo', 'Rio de Janeiro', 'Porto Alegre', 'Salvador', 'Recife', 'Brasília', 'Goiânia', 'Campinas', 'Santos', 'Alegrete',
        'Buenos Aires', 'Santiago', 'Bogotá', 'Lima', 'Cidade do México'
    ];

    useEffect(() => {
        const fetchHolidays = async () => {
            setLoading(true);
            try {
                const data = await HolidayService.getHolidays(year, selectedCity);
                setHolidays(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchHolidays();
    }, [selectedCity, year]);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-blue-600" />
                        Calendário de Feriados
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Visualização dos feriados nacionais, estaduais e municipais utilizados pelo motor de otimização.
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Localidade / Cidade</label>
                        <div className="relative">
                            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="w-full border border-slate-300 rounded pl-9 pr-3 py-2 text-sm bg-white"
                            >
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ano de Referência</label>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="bg-blue-50 text-blue-800 p-2 rounded text-xs flex items-center gap-2 border border-blue-100">
                        <Globe className="w-4 h-4" />
                        <span>Os feriados são obtidos via API pública e cache local.</span>
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-slate-400">Carregando feriados...</div>
                ) : (
                    <div className="overflow-hidden border border-slate-200 rounded">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Data</th>
                                    <th className="px-6 py-3">Dia da Semana</th>
                                    <th className="px-6 py-3">Nome do Feriado</th>
                                    <th className="px-6 py-3 text-center">Tipo</th>
                                    <th className="px-6 py-3 text-center">País</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {holidays.map((h, idx) => {
                                    const dateObj = new Date(h.date + 'T00:00:00');
                                    const dayOfWeek = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 font-mono text-slate-700">{new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-3 capitalize text-slate-500">{dayOfWeek}</td>
                                            <td className="px-6 py-3 font-medium text-slate-800">{h.name}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border 
                                                ${h.type === 'national' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                    {h.type === 'national' ? 'NACIONAL' : 'REGIONAL'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center font-bold text-slate-400">{h.country || 'BR'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="p-4 bg-slate-50 text-xs text-slate-500 border-t border-slate-200 text-center">
                            Total de {holidays.length} feriados encontrados para esta localidade.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HolidaysPage;
