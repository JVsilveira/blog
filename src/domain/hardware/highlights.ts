import type {Hardware,HardwareKind,Specification} from './contracts';
import type {Locale} from '../../features/publication/i18n';
export type Section='battery'|'camera'|'screen'|'processing'|'memory'|'connectivity'|'system'|'design';
type Text=Record<Locale,string>;
type Field={id:string;section:Section;labels:Text;aliases:string[];kinds?:HardwareKind[];group?:RegExp};
const field=(id:string,section:Section,pt:string,en:string,es:string,aliases:string[],extra:Partial<Field>={}):Field=>({id,section,labels:{pt,en,es},aliases,...extra});
const fields:Field[]=[
 field('battery','battery','Capacidade da bateria','Battery capacity','Capacidad de la batería',['battery capacity','capacidade da bateria (mah)']),
 field('charger','battery','Carregador incluído','Charger included','Cargador incluido',['charger included','ac adapter included']),
 field('battery-tech','battery','Tecnologia da bateria','Battery technology','Tecnología de la batería',['battery technology','battery type']),
 field('fast-charge','battery','Carregamento rápido','Fast charging','Carga rápida',['fast charging']),
 field('charge-power','battery','Potência de carregamento','Charging power','Potencia de carga',['maximum charging power','maximum charging power (w)','charging power','fast charging power','carregamento (w)']),
 field('wireless-charge','battery','Carregamento sem fio','Wireless charging','Carga inalámbrica',['wireless charging']),
 field('legacy-camera','camera','Câmeras por lente','Cameras by lens','Cámaras por lente',['câmeras por lente']),
 field('rear-camera','camera','Câmera traseira','Rear camera','Cámara trasera',['rear camera resolution (numeric)','rear camera resolution']),
 field('rear-type','camera','Conjunto de câmeras traseiras','Rear camera setup','Conjunto de cámaras traseras',['rear camera type']),
 field('rear-second','camera','Segunda câmera traseira','Second rear camera','Segunda cámara trasera',['second rear camera resolution (numeric)']),
 field('rear-third','camera','Terceira câmera traseira','Third rear camera','Tercera cámara trasera',['third rear camera resolution (numeric)']),
 field('aperture','camera','Abertura da câmera traseira','Rear camera aperture','Apertura de la cámara trasera',['rear camera aperture number']),
 field('zoom','camera','Zoom óptico','Optical zoom','Zoom óptico',['optical zoom']),
 field('front-camera','camera','Câmera frontal','Front camera','Cámara frontal',['front camera resolution (numeric)','front camera resolution']),
 field('stabilizer','camera','Estabilização de imagem','Image stabilization','Estabilización de imagen',['image stabilizer','optical image stabilization (ois)','image stabilizer type']),
 field('video','camera','Resolução de vídeo','Video resolution','Resolución de vídeo',['video recording resolution (max)','maximum video resolution']),
 field('legacy-screen','screen','Tela','Display','Pantalla',['tela']),
 field('display-size','screen','Tamanho da tela','Screen size','Tamaño de pantalla',['display diagonal','screen size']),
 field('display-type','screen','Tecnologia da tela','Display technology','Tecnología de pantalla',['display technology','display type','panel type']),
 field('resolution','screen','Resolução da tela','Display resolution','Resolución de pantalla',['display resolution']),
 field('refresh','screen','Taxa de atualização','Refresh rate','Frecuencia de actualización',['maximum refresh rate','refresh rate']),
 field('brightness','screen','Brilho da tela','Display brightness','Brillo de pantalla',['display brightness','maximum display brightness (hdr)']),
 field('chip-family','processing','Família do processador','Processor family','Familia del procesador',['processor family']),
 field('chip','processing','Processador','Processor','Procesador',['processor model','chipset']),
 field('cores','processing','Núcleos','Cores','Núcleos',['processor cores','number of processor cores']),
 field('threads','processing','Threads','Threads','Hilos',['processor threads']),
 field('frequency','processing','Frequência do processador','Processor frequency','Frecuencia del procesador',['processor frequency','processor base frequency']),
 field('boost','processing','Frequência máxima','Boost frequency','Frecuencia máxima',['processor boost frequency']),
 field('gpu','processing','Processador gráfico','Graphics processor','Procesador gráfico',['graphics card','graphics card model','on-board graphics card model','graphics processor']),
 field('socket','processing','Socket','Socket','Zócalo',['processor socket'],{kinds:['cpu']}),
 field('tdp','processing','Potência térmica (TDP)','Thermal design power (TDP)','Potencia térmica (TDP)',['thermal design power (tdp)','processor base power'],{kinds:['cpu']}),
 field('cache','processing','Cache','Cache','Caché',['processor cache'],{kinds:['cpu']}),
 field('ram','memory','Memória RAM','RAM','Memoria RAM',['ram capacity','internal memory','memória ram (gb)']),
 field('ram-type','memory','Tipo de memória RAM','RAM type','Tipo de memoria RAM',['ram type','internal memory type']),
 field('storage','memory','Armazenamento','Storage capacity','Almacenamiento',['internal storage capacity','storage capacity','armazenamento (gb)'],{kinds:['phone']}),
 field('memory-card','memory','Cartão de memória','Memory card support','Tarjeta de memoria',['compatible memory cards'],{kinds:['phone']}),
 field('memory-speed','memory','Velocidade da memória','Memory speed','Velocidad de memoria',['memory clock speed','memory data transfer rate'],{kinds:['ram']}),
 field('memory-layout','memory','Composição do kit','Memory kit layout','Composición del kit',['memory layout (modules x size)'],{kinds:['ram']}),
 field('latency','memory','Latência CAS','CAS latency','Latencia CAS',['cas latency'],{kinds:['ram']}),
 field('form','memory','Formato','Form factor','Formato',['memory form factor'],{kinds:['ram']}),
 field('ecc','memory','ECC','ECC','ECC',['ecc'],{kinds:['ram']}),
 field('voltage','memory','Tensão','Voltage','Voltaje',['memory voltage'],{kinds:['ram']}),
 field('legacy-connectivity','connectivity','Conectividade','Connectivity','Conectividad',['conectividade']),
 field('network','connectivity','Rede móvel','Mobile network','Red móvil',['mobile network generation']),
 field('wifi','connectivity','Wi-Fi','Wi-Fi','Wi-Fi',['wi-fi standards','top wi-fi standard']),
 field('bluetooth','connectivity','Versão do Bluetooth','Bluetooth version','Versión de Bluetooth',['bluetooth version']),
 field('nfc','connectivity','NFC','NFC','NFC',['near field communication (nfc)','nfc']),
 field('sim','connectivity','Cartão SIM','SIM support','Tarjeta SIM',['sim card capability','sim card type']),
 field('usb','connectivity','Conector USB','USB connector','Conector USB',['usb connector type']),
 field('os','system','Sistema operacional','Operating system','Sistema operativo',['operating system installed','sistema no lançamento']),
 field('updates','system','Política de atualizações','Update policy','Política de actualizaciones',['política de atualizações']),
 field('dimensions','design','Dimensões','Dimensions','Dimensiones',['dimensões (mm)']),
 field('ip','design','Proteção contra água e poeira','Water and dust protection','Protección contra agua y polvo',['international protection (ip) code','proteção ip']),
 field('weight','design','Peso','Weight','Peso',['weight','peso (g)']),
 field('width','design','Largura','Width','Ancho',['width'],{group:/weight|dimension/}),
 field('height','design','Altura','Height','Altura',['height'],{group:/weight|dimension/}),
 field('depth','design','Espessura','Depth','Grosor',['depth'],{group:/weight|dimension/}),
];
export const sectionLabels:Record<Section,Text>={battery:{pt:'Bateria e carregamento',en:'Battery and charging',es:'Batería y carga'},camera:{pt:'Câmeras',en:'Cameras',es:'Cámaras'},screen:{pt:'Tela',en:'Display',es:'Pantalla'},processing:{pt:'Processamento',en:'Processing',es:'Procesamiento'},memory:{pt:'Memória e armazenamento',en:'Memory and storage',es:'Memoria y almacenamiento'},connectivity:{pt:'Conectividade',en:'Connectivity',es:'Conectividad'},system:{pt:'Sistema',en:'System',es:'Sistema'},design:{pt:'Dimensões e proteção',en:'Dimensions and protection',es:'Dimensiones y protección'}};
const normalize=(s:string)=>s.toLowerCase().trim().replace(/\s+/g,' ');
export type HighlightRow={id:string;section:Section;label:string;values:(Specification|undefined)[]};
export function comparisonHighlights(items:Hardware[],locale:Locale,onlyDifferences=false):HighlightRow[]{
 return fields.flatMap(f=>{
  if(f.kinds&&items.some(i=>!f.kinds!.includes(i.kind)))return [];
  const aliases=[...f.aliases,...Object.values(f.labels).map(normalize)];
  const values=items.map(item=>aliases.flatMap(alias=>item.specifications.filter(s=>normalize(s.label)===alias&&(!f.group||f.group.test(normalize(s.group))))).find(s=>s.value!==null)??item.specifications.find(s=>aliases.includes(normalize(s.label))&&(!f.group||f.group.test(normalize(s.group)))));
  if(!values.some(Boolean))return [];
  if(onlyDifferences&&values.every(s=>s?.value!==null&&s?.value!==undefined)&&new Set(values.map(s=>JSON.stringify([s?.value,s?.unit]))).size===1)return [];
  return [{id:f.id,section:f.section,label:f.labels[locale],values}];
 });
}
const words:Record<string,Text>={'lithium-ion (li-ion)':{pt:'Íons de lítio (Li-ion)',en:'Lithium-ion (Li-ion)',es:'Iones de litio (Li-ion)'},'lithium polymer (lipo)':{pt:'Polímero de lítio (LiPo)',en:'Lithium polymer (LiPo)',es:'Polímero de litio (LiPo)'},optical:{pt:'Óptica',en:'Optical',es:'Óptica'},yes:{pt:'Sim',en:'Yes',es:'Sí'},no:{pt:'Não',en:'No',es:'No'},'not supported':{pt:'Não compatível',en:'Not supported',es:'No compatible'},'single camera':{pt:'Uma câmera',en:'Single camera',es:'Una cámara'},'dual camera':{pt:'Duas câmeras',en:'Dual camera',es:'Dos cámaras'},'triple camera':{pt:'Três câmeras',en:'Triple camera',es:'Tres cámaras'},'quad camera':{pt:'Quatro câmeras',en:'Quad camera',es:'Cuatro cámaras'}};
export function highlightValue(spec:Specification|undefined,locale:Locale){
 if(!spec||spec.value===null)return {pt:'Não confirmado',en:'Not confirmed',es:'No confirmado'}[locale];
 const raw=spec.displayValue??spec.value;
 const text=typeof raw==='boolean'?words[raw?'yes':'no']![locale]:typeof raw==='number'?new Intl.NumberFormat(locale==='pt'?'pt-BR':locale,{maximumFractionDigits:6}).format(raw):words[normalize(raw)]?.[locale]??raw;
 const unit=spec.unit==='"'?'″':spec.unit;
 const normalizedText=String(text).toLowerCase().replace(/"/g,'″');
 return unit&&!normalizedText.includes(unit.toLowerCase())?`${text} ${unit}`:String(text);
}
