
import { Employee, Client } from '../types';

const CSV_DATA = `Nome;Data de Admissão; Rate ;Cliente;Local
Adelino Gaspar Lopes;22/08/2022; 192,00 ;CDHU;Porto Alegre
Adonis Grecco de Araujo;16/07/2018; 192,00 ;SAOG;Alegrete
Adriana da Silva Fernandes;10/09/2024; 192,00 ;Fazenda;Goiania
Alexandre Francisco Nikitin Silva;18/11/2020; 201,60 ;BI ACS;Salvador
Alexandre Marcelino Santos;08/06/2020; 160,00 ;Fazenda;São Paulo
Alexandre Pereira Mahmud;14/06/2024; 192,00 ;Mobile Cidadão;Santos
ALEXANDRE SANTOS CARDOSO;23/03/2021; 160,00 ;E-TCESP;Campinas
Alexandro de jesus silva;19/12/2023; 160,00 ;PGE;Porto Alegre
ALEXSANDRO DURANTI MACHADO;17/02/2025; 192,00 ;Defensoria Pública;Alegrete
Alison guilherme vanceto;04/04/2023; 192,00 ;Detran;Goiania
ALLAN FELLER DE OLIVEIRA;18/08/2022; 128,00 ;Folha Descentralizada;Salvador
Alvino Kazutoshi Sakamoto;05/09/2022; 153,60 ;Folha Centralizada;São Paulo
Amanda de Oliveira Cardoso;08/09/2020; 160,00 ;PGE;Santos
AMARILDO DA CONCEICAO GONCALVES;16/08/2022; 153,60 ;Folha Centralizada;Campinas
ANA CAROLINA GOMES DE OLIVEIRA ALVES;12/04/2023; 192,00 ;CND1;Porto Alegre
ANDERSON RIBEIRO PACHECO;08/06/2017; 192,00 ;Mobile Cidadão;Alegrete
ANDRE MOREIRA LEOPOLDINO;14/02/2024; 201,60 ;Fazenda;Goiania
ANDREA HONORATO SOARES;17/11/2020; 128,00 ;PGE;Salvador
Andrew Oliveira Rodrigues da Silva;04/06/2020; 160,00 ;PGE;São Paulo
Andry German Oliveros Choque;02/12/2024; 201,60 ;SGGD - Lucas;Santos
ANGELA MARCIA COSTA ROCHA PEREIRA;26/09/2023; 160,00 ;Detran;Campinas
Antonio Alexandre Alonso de Siqueira;12/08/2024; 192,00 ;Detran;Porto Alegre
Antonio Guilherme da Silva Filho;06/05/2025; 153,60 ;eSocial;Alegrete
Ariane Araujo de Souza;05/04/2022; 160,00 ;Comercial - Gabriela;Goiania
Athos Giom de Paiva Mesquita;22/06/2022; 160,00 ;Fazenda;Salvador
Baltazar de Brito Silva;08/03/2021; 160,00 ;CDHU;São Paulo
BARBARA ALMEIDA TUNES FERNANDES;06/01/2025; 160,00 ;Comercial - Gabriela;Santos
BENEDITO JOSE DOS SANTOS;16/08/2022; 153,60 ;Folha Centralizada;Campinas
BIANCA FERNANDES JANUARIO DE ALMEIDA;17/08/2023; 243,20 ;Portais;Porto Alegre
Bruno Botton Schultz;15/04/2024; 192,00 ;Detran;Alegrete
BRUNO DLUCCA SILVA CARVALHO;01/12/2022; 192,00 ;Detran;Goiania
Bruno Martins de Jesus;06/06/2022; 160,00 ;Mobile Cidadão;Salvador
Bruno Romero Zeferino;03/10/2022; 160,00 ;Folha Centralizada;São Paulo
CAIO MARCELO FUNCAO;02/06/2020; 195,84 ;CDHU;Santos
CARLOS ALEXANDRE SERAPIAO DO NASCIMENTO;01/12/2020; 128,00 ;CDHU;Campinas
CARLOS EDUARDO CASTRO DOS SANTOS;07/10/2021; 201,60 ;CDHU-SH;Porto Alegre
CARLOS MENGAI JUNIOR;10/04/2023; 160,00 ;Capacitação Poupatempo;Alegrete
CAROLINA DE ALENCAR SIQUEIRA;; 201,60 ;Agricultura;Goiania
Carolina Morena Duarte Barbosa Alves;28/10/2024; 201,60 ;Educação;Salvador
CELIA FRAGA INOJOSA;07/11/2022; 153,60 ;CDHU;São Paulo
CELIA MARIA FRANK;18/10/2022; 153,60 ;CDHU;Santos
CELSO FERNANDES DE OLIVEIRA JUNIOR;03/06/2020; 192,00 ;PGE;Campinas
CELSO KUROIWA;19/05/2015; 160,00 ;E-TCESP;Porto Alegre
CHARLENE ROLIM ARAUJO;; 160,00 ;Comercial - Gabriela;Alegrete
CHRISTIANO RIJO ALVES DE MATOS;26/09/2023; 192,00 ;Sem Papel;Goiania
CLAUDINEIA VIEIRA MEDRADO FERNANDES;09/04/2024; 192,00 ;PGE;Salvador
Claudio Moreira Vieira;10/10/2024; 291,84 ;Plataforma Serviços Digitais;São Paulo
CLAYTON RITCHELLY CONFESSOR LEITE;03/12/2024; 201,60 ;SGGD - Lucas;Santos
Cleverson Andrade Silva;26/01/2021; 160,00 ;Poupatempo;Campinas
Cristiane Alice Ribeiro;15/12/2023; 192,00 ;Mobile Cidadão;Porto Alegre
Cristiano Niewierowski;14/06/2022; 201,60 ;BI ACS;Alegrete
DAIANA DA SILVA ALVES;18/11/2024; 160,00 ;Comercial - Gabriela;Goiania
Daiane da Silva Souza;02/01/2025; 160,00 ;Comercial - Gabriela;Salvador
Daniel dos Santos Padua da Silva;16/08/2022; 192,00 ;Detran;São Paulo
DANILO LOURENCO FRANCO;15/12/2021; 160,00 ;Saúde - SSI;Santos
Dassaevy Oliveira de Santana;08/01/2025; 160,00 ;Defensoria Pública;Campinas
Dayana Nunes Lucas;13/04/2023; 160,00 ;Defensoria Pública;Porto Alegre
Demetrio Baladi Neto;16/08/2022; 128,00 ;eSocial;Alegrete
DENISE GUEDES MARQUES AMADEU;03/04/2014; 243,20 ;Plataforma Serviços Digitais;Goiania
Diego Duarte dos Santos;12/04/2023; 160,00 ;CND1;Salvador
DIONATHA JOSE DO PRADO;30/10/2024; 192,00 ;Comercial - Gabriela;São Paulo
Dirlea de Sousa Mendes;23/05/2022; 160,00 ;PGE;Santos
DIVANISE MARIA DE LIMA;; 128,00 ;Defensoria Pública;Campinas
Djalma Milan;10/08/2022; 153,60 ;Consignatária;Porto Alegre
Douglas Fragatti;06/10/2020; 192,00 ;Portais;Alegrete
Douglas Henrique Ribeiro;19/09/2022; 201,60 ;Portais;Goiania
DOUGLAS RODRIGUES DOS SANTOS;29/10/2024; 128,00 ;PGE;Salvador
Edilson Batista de Souza Filho;12/12/2022; 192,00 ;PGE;São Paulo
Edna Mayumi Shinohara;10/08/2022; 153,60 ;Folha Centralizada;Santos
Eduardo Ataide Amorim;16/08/2022; 128,00 ;eSocial;Campinas
Eduardo Augusto Moreira de Souza;23/09/2024; 153,60 ;Detran;Porto Alegre
Edvaldo Arruda Pereira;02/06/2020; 291,84 ;PGE;Alegrete
Elen Souto Caetano;25/09/2023; 192,00 ;Gerenciamento de Negocios;Goiania
Eliana Elmer;; 160,00 ;Avaliar;Salvador
Elizangela Rodrigues de Moraes;30/11/2022; 192,00 ;Sem Papel;São Paulo
ELIZIARIO FERREIRA BARBOSA JUNIOR;11/11/2024; 291,84 ;Educação;Santos
ELMER TORIYAMA;24/01/2023; 192,00 ;Poupatempo;Campinas
Emanuel Machado Haddad;13/11/2020; 201,60 ;BI ACS;Porto Alegre
Erika Fukay;03/01/2022; 160,00 ;CDHU;Alegrete
Esther Salvador Santos;03/06/2024; 128,00 ;CND1;Goiania
EZEQUIEL SOUZA DOS SANTOS;01/12/2022; 192,00 ;Sem Papel;Salvador
Fabiano dos Santos da Silva;14/07/2023; 128,00 ;PGE;São Paulo
Fabio Chan;16/06/2020; 192,00 ;Detran;Santos
FABIO GUIMARAES CUNHA;01/02/2021; 192,00 ;Agricultura;Campinas
Fabio Silva dos Anjos;30/11/2022; 128,00 ;Sem Papel;Porto Alegre
FAINER FAGUNDES DA GUARDA;04/12/2024; 201,60 ;SGGD - Lucas;Alegrete
Felipe Costa Ramos;13/02/2020; 192,00 ;Detran;Goiania
Fernando de Oliveira Hein Magalhaes;18/11/2020; 201,60 ;BI ACS;Salvador
Fernando Henrique Pascott;06/10/2023; 192,00 ;PGE;São Paulo
FERNANDO JUSTINO DE BARROS;12/11/2020; 192,00 ;Poupatempo;Santos
Fernando Silva Oliveira;30/11/2022; 192,00 ;Sem Papel;Campinas
FLAVIA MAGALHAES FARIAS LIMA;06/11/2024; 160,00 ;Comercial - Gabriela;Porto Alegre
FRANCISCO FREIRE DE LIMA FILHO;11/12/2017; 192,00 ;Detran;Alegrete
FREDIANO CAROLINO CARDERARO DOS SANTOS;12/04/2023; 192,00 ;CND1;Goiania
Gabriel Abrahão ;02/09/2024; 160,00 ;Defensoria Pública;Salvador
Gabriel Gustavo Mariano da Silva;01/11/2022; 160,00 ;Poupatempo;São Paulo
Gabriel Matias de Moraes;25/02/2025; 160,00 ;Defensoria Pública;Santos
Gabriel Rosa Kurth Sanches;01/04/2024; 270,40 ;Detran;Campinas
Gabriel Veras Miranda;22/02/2024; 160,00 ;Detran;Porto Alegre
Gilberto Vicente de Moraes Filho;24/10/2024; 192,00 ;Comercial - Gabriela;Alegrete
Gilmar Furtado de Almeida;01/04/2021; 201,60 ;BI ACS;Goiania
GLAUCE BARBOSA VERAO;22/04/2025; 160,00 ;PGE;Salvador
Glauce Heleneide Santos Riedel;27/02/2023; 192,00 ;Detran;São Paulo
GUILHERME ANDRE NUNES SOUZA ORTIZ;09/10/2023; 192,00 ;Balcão Único;Santos
Gustavo de Freitas Menezes;14/01/2021; 192,00 ;Fazenda;Campinas
GUSTAVO SOARES DE AVILA;28/08/2024; 160,00 ;PGE;Porto Alegre
Haniel Marlon Ribeiro;03/06/2020; 160,00 ;DIPOL;Alegrete
HEBER RIBEIRO DE SOUSA;23/08/2018; 160,00 ;CDHU;Goiania
Heitor Thomaz;11/04/2022; 160,00 ;Fazenda;Salvador
Helder Cunha Batista;01/06/2022; 192,00 ;Folha Centralizada;São Paulo
HELENA MARIA SALLA;18/11/2024; 201,60 ;Educação;Santos
HELIO MIRANDA DE SOUZA;03/11/2020; 192,00 ;Fazenda;Campinas
Henrique Cesar Carneiro de Moraes;24/10/2022; 160,00 ;Defensoria Pública;
Henrique Nunes;01/06/2025; 192,00 ;PGE;Porto Alegre
Herick Silva Dutra;05/05/2025; 160,00 ;Comercial - Gabriela;Alegrete
Hernany Souza Silva;04/03/2024; 192,00 ;Detran;Goiania
Humberto Pessolato;06/08/2020; 192,00 ;Agricultura;Salvador
HYGOR DO NASCIMENTO CAVALCANTE LEMOS DE OLIVEIRA;28/03/2025; 128,00 ;Gerenciamento Processos;São Paulo
Igor Azevedo de Almeida;07/06/2022; 128,00 ;Controladoria Geral do Estado;Santos
IGOR GONCALVES DA COSTA;02/10/2023; 192,00 ;Mobile Cidadão;Campinas
Igor Ivanoff Takats;05/08/2020; 192,00 ;Agricultura;Porto Alegre
Iris Alves dos Santos;10/01/2022; 160,00 ;CDHU-SH;Alegrete
ISMAEL SANTOS OLIVEIRA;01/12/2014; 160,00 ;PGE;Goiania
Ivan German Aguilar Calderon;01/09/2022; 160,00 ;Sem Papel;Salvador
Jackson dos Santos Roque da Silva;20/05/2025; 192,00 ;PGE;São Paulo
JAILSON DE OLIVEIRA LIBERATO MAGALHAES;08/02/2023; 192,00 ;Balcão Único;Santos
Jair Manoel Vieira;21/09/2023; 128,00 ;Folha Centralizada;Campinas
Jeferson de Oliveira Lima;24/09/2018; 192,00 ;PGE;Porto Alegre
JEFERSON FERNANDO SABINO;26/06/2017; 192,00 ;Defensoria Pública;Alegrete
JEONATA APOSTOLO DE OLIVEIRA;03/10/2023; 192,00 ;Balcão Único;Goiania
Jesler Teles de Campos Sales;13/02/2025; 324,48 ;Sem Papel;Salvador
JOAO CARLOS GONCALVES BASTOS;08/03/2021; 192,00 ;Poupatempo;São Paulo
JOAO PAULO PONTE ALVES DE LIMA;10/02/2025; 192,00 ;Agricultura;Santos
Jorge Augusto de Castro Martins da Silva;25/05/2020; 192,00 ;Fazenda;Campinas
Jose Orlando dos Santos;09/12/2020; 192,00 ;Detran;Porto Alegre
JOSE ROBERIO TELES DE BRITO;06/12/2022; 259,20 ;Portais;Alegrete
JOSE ROBERTO DOS SANTOS;09/08/2022; 128,00 ;Consignatária;Goiania
JOSIAS BORGES MARCONDES;22/06/2022; 160,00 ;Fazenda;Salvador
Jucyelle Barros do Nascimento;05/05/2025; 160,00 ;Defensoria Pública;São Paulo
JULIO CESAR MENDES DO NASCIMENTO;02/06/2020; 192,00 ;PGE;Santos
Jurandir Menezes de Souza;01/06/2022; 192,00 ;GDE  - PROCON;Campinas
Kelen Cristina Silva;10/11/2022; 160,00 ;Detran;Porto Alegre
LARISSA ARAUJO DE OLIVEIRA LIMA;15/04/2021; 201,60 ;BI ACS;Alegrete
LEANDRO BAESSE GOMES;25/09/2023; 192,00 ;Detran;Goiania
Leni Megumi Takahashi;18/10/2022; 153,60 ;CDHU;Salvador
Leni Rosa Cardoso;17/02/2025; 192,00 ;Detran;São Paulo
LEOCIR KOSVOSKI;11/01/2022; 192,00 ;PGE;Santos
LEONARDO DE SOUZA MACEDO;24/08/2022; 160,00 ;Fazenda;Campinas
LETICIA PAULO SAMPAIO PIRES;14/03/2022; 160,00 ;Detran;Porto Alegre
Lilian Fukuhara;10/08/2022; 128,00 ;Folha Centralizada;Alegrete
LUANNA KELLY DE OLIVEIRA PAIXAO;12/09/2022; 128,00 ;Detran;Goiania
Lucas Aparecido de Oliveira;16/05/2025; 128,00 ;Comercial - Gabriela;Salvador
LUCAS ARAUJO DE ABREU;23/10/2023; 160,00 ;Balcão Único;São Paulo
LUCAS FERNANDES INACIO;12/04/2023; 128,00 ;CND1;Santos
Lucas Helder Pires de Albuquerque;16/11/2023; 160,00 ;Detran;Campinas
Lucas Ramos Gabriel;31/10/2022; 192,00 ;SAOG;Porto Alegre
Lucas Roque Figueiredo;26/08/2024; 160,00 ;PGE;Alegrete
LUCIANE CAVALCANTI CAMACARY;17/11/2020; 134,40 ;BI ACS;Goiania
Luciano Silva Nascimento;16/02/2023; 192,00 ;Sem Papel;Salvador
LUCINEIA MARCELINA DOS SANTOS MARQUES;01/03/2021; 160,00 ;CDHU;São Paulo
LUIS RICARDO NARY SUCH;23/10/2023; 153,60 ;Educação;Santos
Luiz Kazuhiro Furuya;06/05/2025; 153,60 ;eSocial;Campinas
Luiz Carlos Alberto Costa Rodrigues;29/01/2025; 192,00 ;Detran;Porto Alegre
LUIZ EDUARDO SANTOS ARAUJO;22/08/2022; 168,00 ;BI ACS;Alegrete
Luiz Henrique Oliveira de Mesquita;23/09/2024; 160,00 ;Gerenciamento Processos;Goiania
LUIZ PEREIRA DAVID;05/04/2021; 192,00 ;Agricultura;Salvador
Luiza Toshiko Tsuda;19/01/2024; 153,60 ;Detran;São Paulo
Luziane Cristine Ferreira Bianco;08/05/2025; 192,00 ;Sem Papel;Santos
Maciel Laurindo da Silva;09/11/2020; 201,60 ;Fazenda;Campinas
Manoel Rodrigues da Silva Junior;01/12/2020; 192,00 ;RH - Folha;Porto Alegre
MARCEL COUTO OLIVEIRA CASTRO;03/11/2020; 192,00 ;Fazenda;Alegrete
Marcelo Gomes Ferreira;10/05/2021; 160,00 ;Fazenda;Goiania
MARCELO JOSE ALVES DE CASTRO;13/06/2024; 192,00 ;PGE;Salvador
Marcelo Maia Juvencio;04/10/2019; 160,00 ;Saúde - SSI;São Paulo
Marcelo Souza de Oliveira;04/11/2024; 201,60 ;Fazenda;Santos
Marcelo Yomoguita;26/02/2024; 192,00 ;Detran;Campinas
Marco Antonio dos Santos;12/09/2024; 160,00 ;Detran;Porto Alegre
Marcos Antonio Pimenta de Camargo;02/06/2020; 192,00 ;Fazenda;Alegrete
MARIA AUGUSTA GONCALVES MAGALHAES KATER;10/08/2022; 128,00 ;Folha Incentivo PIN;Goiania
Maria Luiza Vilella;04/11/2024; 243,20 ;Plataforma Serviços Digitais;Salvador
MARIA PAULA ANTONUCCI DA FONSECA OTAKE;16/06/2020; 160,00 ;Fazenda;São Paulo
Mariana Costa Santos;12/08/2022; 128,00 ;PGE;Santos
MARICI TIEMI AOKI EGUCHI;01/03/2025; 153,60 ;Folha Centralizada;Campinas
MARIO DE ALMEIDA ANGELINI;26/09/2023; 153,60 ;Fazenda;Porto Alegre
Mario Renato Pereira;10/06/2020; 201,60 ;CDHU;Alegrete
Marli Ferreira Batista Lucena;14/08/2018; 160,00 ;Defensoria Pública;Goiania
MATEUS PINTO GONCALVES;30/11/2022; 128,00 ;Sem Papel;Salvador
Matheus Penha Pita;05/11/2024; 160,00 ;Comercial - Gabriela;São Paulo
Mathias Ferreira Santos;29/06/2020; 128,00 ;PGE;Santos
MAURICIO CARNIELLI;17/11/2020; 201,60 ;BI ACS;Campinas
Mauricio Mendes da Silva;28/12/2020; 160,00 ;Fazenda;Porto Alegre
Mauro Leandro dos Santos;11/11/2020; 192,00 ;Sem Papel;Alegrete
Melina Dantas de Oliveira;22/10/2024; 243,20 ;Educação;Goiania
MICHEL ADAO TEIXEIRA;24/02/2025; 192,00 ;Agricultura;Salvador
Michel Sidney Dias da Silva;29/01/2025; 160,00 ;Comercial - Victor Hartman;São Paulo
Michelle da Silva Pacheco;22/10/2024; 291,84 ;Educação;Santos
MIGUEL DE SOUZA VILACA NETO;08/10/2024; 291,84 ;Detran;Campinas
MILTON GONCALVES JUNIOR;04/11/2021; 128,00 ;Detran;Porto Alegre
Natanael Oliveira Santos;06/11/2024; 192,00 ;Comercial - Gabriela;Alegrete
Newton Yodi Yohei;30/11/2022; 192,00 ;Sem Papel;Goiania
Nilton Carlos de Mattos;18/10/2022; 153,60 ;CDHU;Salvador
OLIVAR NUNES BEZERRA JUNIOR;29/11/2021; 192,00 ;SAP;São Paulo
Osvaldo Oyagawa;25/08/2022; 153,60 ;Folha Centralizada;Santos
Paulo Henrique Nogueira;02/05/2022; 192,00 ;Detran;Campinas
PAULO MARCELLO DA SILVA FERREIRA;02/01/2025; 160,00 ;Comercial - Gabriela;Porto Alegre
Pedro Braga Silva;05/11/2018; 172,80 ;Portais;Alegrete
Pedro Henrique Rodrigues de Sousa;03/10/2022; 201,60 ;Sem Papel;Goiania
PETERSON GONCALVES ROBERTO;26/06/2023; 324,48 ;Detran;Salvador
Priscila Beltoni Barquilha Rossini;09/11/2020; 201,60 ;Fazenda;São Paulo
Rafael Alves de Araujo;06/05/2025; 160,00 ;Educação;Santos
Ralph de França Lopes;14/04/2025; 160,00 ;Defensoria Pública;Campinas
Regis Vieira de Araujo Junior;18/01/2022; 160,00 ;Sem Papel;Porto Alegre
Renan Matheus Bueno Silva;02/01/2024; 262,40 ;CTR - Sistemas de Custos;Alegrete
Renato Tomaz Nati;26/02/2024; 192,00 ;Detran;Goiania
Ricardo Sanda;15/12/2023; 201,60 ;SGGD - Lucas;Salvador
Roan Oliveira Arraes;08/08/2022; 192,00 ;Balcão Único;São Paulo
Robert Bruno Pereira;05/06/2020; 192,00 ;Mobile Cidadão;Santos
Roberta Tatiana Rosini Zegunis;08/04/2024; 243,20 ;PGE;Campinas
ROBERTO DE LIMA;09/11/2020; 128,00 ;PGE;Porto Alegre
Robson Rodrigues de Andrade;20/02/2025; 291,84 ;Comercial - Victor Hartman;Alegrete
RODOLFO PITER DOS SANTOS BITU;27/11/2023; 194,56 ;SGGD;Goiania
RODOLPHO ARAUJO MEDEIROS;19/06/2023; 160,00 ;Balcão Único;Salvador
Rodrigo Candido da Silva;03/10/2022; 192,00 ;Sem Papel;São Paulo
RODRIGO YURI VELOSO;24/02/2025; 192,00 ;Sem Papel;Santos
ROGERIO MONTEIRO DA SILVA JUNIOR;08/08/2022; 160,00 ;Portais;Campinas
Ronoel Issao Watanabe;16/08/2022; 128,00 ;eSocial;Porto Alegre
Rosangela Toyoko Morishita;25/05/2020; 128,00 ;Fazenda;Alegrete
Roseli Santos de Oliveira;12/04/2024; 128,00 ;CDHU;Goiania
SAMUEL JOSE DA SILVA;03/11/2020; 160,00 ;Gerenciamento Processos;Salvador
Samuel Soares Lima;23/09/2024; 168,00 ;CDESP;São Paulo
SANDRA HARUMI HAGUI OTSUKI;10/05/2022; 201,60 ;PGE;Santos
Sandro Luiz Cardoso;02/06/2020; 192,00 ;PGE;Campinas
Sergio Severino de Almeida;12/08/2022; 128,00 ;Junta Comercial;Porto Alegre
Sidney Luzo Costa;16/08/2022; 153,60 ;eSocial;Alegrete
SILAS ROBERTO DA SILVA;26/04/2021; 160,00 ;CDHU;Goiania
SILVANIA FERREIRA DE ASSIS;27/09/2023; 192,00 ;Sem Papel;Salvador
Simon Matheus;15/12/2021; 160,00 ;Fazenda;São Paulo
Simone Previatti;28/10/2024; 128,00 ;Detran;Santos
Susana Maria Oliveira Carvalho;14/02/2022; 201,60 ;GDE;Campinas
Talia rocha da Silva;10/06/2022; 128,00 ;Fazenda;Porto Alegre
Thagner Moreira Uramoto;22/07/2024; 192,00 ;PGE;Alegrete
THAINA APARECIDA GALVANI;26/06/2023; 216,32 ;Detran;Goiania
Thais Barros Barbone;04/03/2024; 160,00 ;Detran;Salvador
THAMARA APARECIDA TRESKA MARTINS;11/04/2025; 160,00 ;Gerenciamento Processos;São Paulo
Thiago dos Santos Horta;12/11/2024; 201,60 ;SGGD - Lucas;Santos
VANESSA VIEIRA DA SILVA;13/01/2021; 160,00 ;PGE;Campinas
Victor Alves Paganotti Rodrigues;18/01/2022; 160,00 ;CDHU;Porto Alegre
Victor Medeiros Pereira;12/04/2023; 192,00 ;CND1;Alegrete
VICTORIA SALOMAO GODOI;06/01/2025; 160,00 ;Comercial - Gabriela;Goiania
VINICIUS LUCIANO SILVA DE MELO;09/09/2024; 201,60 ;Fazenda;Salvador
Vivian Vieira da Silva;03/06/2020; 192,00 ;PGE;São Paulo
Viviane Cardoso Martins;05/11/2024; 160,00 ;Comercial - Gabriela;Santos
VIVIANE VICENTE DOS SANTOS;10/04/2023; 153,60 ;Capacitação Poupatempo;Campinas
Walter Roberto Kroskinsque;22/08/2022; 128,00 ;Folha Descentralizada;Porto Alegre
Wanda Maria da Silva;12/09/2024; 160,00 ;Detran;Alegrete
Wanderson Aparecido Barrence Santos;18/08/2022; 192,00 ;Detran;Goiania
WENDEL CUNHA DA SILVA;01/09/2022; 160,00 ;Sem Papel;Salvador
Weslley Faustino Alves;14/10/2024; 160,00 ;PGE;São Paulo
William Medeiros Silva;24/02/2025; 192,00 ;Detran;Santos
Willian Korb;26/02/2024; 192,00 ;Detran;Campinas
Wislan Lopes Moraes;01/11/2024; 243,20 ;Educação;Porto Alegre`;

// This function now returns BOTH the Employees list AND the Updated Clients list
export const processImportData = (initialClients: Client[]) => {
  const lines = CSV_DATA.split('\n').filter(line => line.trim() !== '');
  const employees: Employee[] = [];

  // Clone to avoid mutation and enable expansion
  const updatedClients = [...initialClients];
  let nextClientId = Math.max(...updatedClients.map(c => c.id), 0) + 1;

  // Skip header (index 0)
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 5) continue;

    const rateStr = cols[2].replace(',', '.').trim();
    const rate = parseFloat(rateStr) || 0;
    const clientName = cols[3].trim();

    // Check if client already exists in our collection
    let matchedClient = updatedClients.find(c => c.name.toLowerCase() === clientName.toLowerCase());

    // If not found, CREATE IT automatically
    if (!matchedClient && clientName) {
      matchedClient = {
        id: nextClientId++,
        name: clientName,
        contact_person: 'Pendente de Cadastro',
        email: 'pendente@email.com',
        project_ids: ['PRJ-STF01'], // Auto-link to default project
        status: 'ACTIVE'
      };
      updatedClients.push(matchedClient);
    }

    // Default ID if name is missing
    const clientId = matchedClient ? matchedClient.id : 1;
    const finalClientName = matchedClient ? matchedClient.name : clientName || 'Desconhecido';

    employees.push({
      id: i,
      name: cols[0].trim(),
      admission_date: cols[1].trim(),
      rate: rate,
      client_name: finalClientName,
      client_id: clientId,
      project_id: 'PRJ-STF01', // Default to main project for data import
      local: cols[4].trim()
    });
  }
  return { employees, clients: updatedClients };
};

// Legacy compatibility (if needed)
export const getInitialEmployees = (clients: Client[]) => processImportData(clients).employees;
