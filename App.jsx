const { useState, useEffect, useRef } = React;

// --- CONFIGURACIÓN DE LA API DE GEMINI ---
const apiKey = ""; 

async function generarZocaloIA(tema) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ 
      parts: [{ 
        text: `Actúa como un productor experto de noticieros de televisión de Argentina. Tema: "${tema}". Genera un título impactante (máximo 5 palabras, MAYÚSCULAS) y una bajada informativa profesional (entre 10 y 20 palabras).` 
      }] 
    }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          subtitle: { type: "STRING" }
        }
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? JSON.parse(text) : { title: "ERROR", subtitle: "No se pudo generar" };
  } catch (e) {
    return { title: "ERROR DE CONEXIÓN", subtitle: "Revisa tu clave de API o conexión." };
  }
}

const resizeImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 150; canvas.height = 150;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 150, 150);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const THEMES = {
  modernBlue: { name: 'Azul Moderno', panelBg: 'bg-blue-900/95', text: 'text-white', border: 'border-blue-400/50', accent: 'bg-blue-600', shadow: 'shadow-[0_0_15px_rgba(37,99,235,0.5)]', titleFont: 'font-["Montserrat"] font-black tracking-tight', bodyFont: 'font-["Inter"]' },
  elegantGold: { name: 'Elegante Pro', panelBg: 'bg-zinc-950/95', text: 'text-amber-50', border: 'border-amber-500/60', accent: 'bg-amber-600 text-black', shadow: 'shadow-[0_4px_25px_rgba(245,158,11,0.3)]', titleFont: 'font-["Montserrat"] font-black tracking-wide', bodyFont: 'font-["Inter"]' },
  breakingRed: { name: 'Último Momento', panelBg: 'bg-red-950/95', text: 'text-white', border: 'border-red-500', accent: 'bg-red-600', shadow: 'shadow-[0_0_30px_rgba(220,38,38,0.6)]', titleFont: 'font-["Montserrat"] font-black uppercase', bodyFont: 'font-["Inter"] font-bold' },
  cyberpunk: { name: 'Industrial Cyber', panelBg: 'bg-zinc-950/95', text: 'text-green-400', border: 'border-green-500', accent: 'bg-green-600 text-black', shadow: 'shadow-[0_0_25px_rgba(34,197,94,0.4)]', titleFont: 'font-["Orbitron"] font-black tracking-widest', bodyFont: 'font-mono font-bold' },
  minimalDark: { name: 'Mínimal Oscuro', panelBg: 'bg-zinc-900/95', text: 'text-zinc-100', border: 'border-zinc-700', accent: 'bg-blue-500 text-white', shadow: 'shadow-2xl', titleFont: 'font-["Roboto"] font-black uppercase', bodyFont: 'font-["Roboto"] font-bold' },
  morningShow: { name: 'Magazine Pro', panelBg: 'bg-white/95', text: 'text-slate-800', border: 'border-orange-400', accent: 'bg-orange-500 text-white', shadow: 'shadow-xl', titleFont: 'font-["Montserrat"] font-black', bodyFont: 'font-["Inter"] font-bold' },
  sportsAction: { name: 'Deportes Bold', panelBg: 'bg-black/95', text: 'text-white', border: 'border-yellow-400', accent: 'bg-yellow-400 text-black', shadow: 'shadow-[0_4px_20px_rgba(250,204,21,0.4)]', titleFont: 'font-["Oswald"] font-black uppercase', bodyFont: 'font-["Inter"] font-bold' },
  glassmorphism: { name: 'Cristal Premium', panelBg: 'bg-white/10 backdrop-blur-2xl', text: 'text-white', border: 'border-white/20', accent: 'bg-white/20', shadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]', titleFont: 'font-["Poppins"] font-black tracking-widest uppercase', bodyFont: 'font-["Poppins"] font-medium' }
};

const DEFAULT_STATE = {
  theme: 'modernBlue',
  animation: 'slideUp',
  liveBadge: { show: true },
  lowerThird: { title: 'TÍTULO PRINCIPAL', subtitle: 'BAJADA INFORMATIVA DE LA NOTICIA...', show: false },
  hosts: [
    { id: 'izquierda', name: 'Conductor 1', xOffset: 0, show: true, image: null },
    { id: 'centro', name: 'Conductor 2', xOffset: 0, show: true, image: null },
    { id: 'derecha', name: 'Conductor 3', xOffset: 0, show: true, image: null }
  ],
  weather: { city: 'Buenos Aires', temp: 22, show: true },
  time: { show: true }
};

const LiveToggle = ({ active, onClick, label }) => (
  <button onClick={onClick} className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-black text-[10px] transition-all border overflow-hidden ${active ? 'bg-red-600 text-white border-red-400 shadow-lg scale-[1.02]' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}>
    {active && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>}
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-white animate-pulse' : 'bg-zinc-700'}`}></div>
    <span className="tracking-tighter uppercase">{active ? `EN AIRE (${label})` : `MOSTRAR ${label}`}</span>
  </button>
);

function App() {
  const isOverlay = window.location.search.includes('mode=overlay');
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('obs_pro_vfinal');
    return saved ? JSON.parse(saved) : DEFAULT_STATE;
  });
  const [activeTab, setActiveTab] = useState('zocalos');
  const bc = useRef(new BroadcastChannel('obs_sync_vfinal'));

  useEffect(() => {
    localStorage.setItem('obs_pro_vfinal', JSON.stringify(state));
    bc.current.postMessage({ type: 'UPDATE', payload: state });
  }, [state]);

  useEffect(() => {
    bc.current.onmessage = (e) => { if (isOverlay && e.data.type === 'UPDATE') setState(e.data.payload); };
  }, [isOverlay]);

  if (isOverlay) return <OverlayView state={state} />;

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white flex font-sans overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `@keyframes shimmer { 100% { transform: translateX(100%); } }`}} />
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <lucide.Radio className="text-red-600 animate-pulse" size={18} />
          <h1 className="font-black text-xs uppercase tracking-widest">Broadcast Control Pro</h1>
        </div>
        <nav className="p-2 flex-1 space-y-1">
          {['zocalos', 'conductores', 'clima', 'tema', 'info'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <span>{tab}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
            <div className="aspect-video bg-black rounded border border-zinc-700 relative overflow-hidden mb-2">
                <div className="scale-[0.12] origin-top-left absolute w-[1920px] h-[1080px]">
                    <OverlayView state={state} isPreview={true} />
                </div>
            </div>
            <button onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('mode', 'overlay');
                navigator.clipboard.writeText(url.toString());
                alert("URL de Overlay Copiada para OBS");
            }} className="w-full bg-zinc-800 p-2 rounded text-[9px] font-black tracking-widest uppercase">Copiar URL OBS</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
            {activeTab === 'zocalos' && <PanelZocalos state={state} setState={setState} />}
            {activeTab === 'conductores' && <PanelConductores state={state} setState={setState} />}
            {activeTab === 'clima' && <PanelClima state={state} setState={setState} />}
            {activeTab === 'tema' && <PanelTema state={state} setState={setState} />}
            {activeTab === 'info' && <PanelInfo />}
        </div>
      </main>
    </div>
  );
}

function PanelZocalos({ state, setState }) {
  const [topic, setTopic] = useState('');
  const [gen, setGen] = useState(false);
  const update = (f, v) => setState(s => ({ ...s, lowerThird: { ...s.lowerThird, [f]: v } }));

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex justify-between items-center shadow-xl">
        <h2 className="font-black uppercase italic tracking-tighter text-xl text-white">Generador de Zócalos</h2>
        <LiveToggle active={state.lowerThird.show} onClick={() => update('show', !state.lowerThird.show)} label="Zócalo" />
      </div>
      <div className="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/20 flex gap-3">
        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs outline-none text-white" placeholder="IA: Escribe el tema de la noticia..." />
        <button onClick={async () => {
          setGen(true);
          const res = await generarZocaloIA(topic);
          setState(s => ({ ...s, lowerThird: { ...s.lowerThird, title: res.title, subtitle: res.subtitle } }));
          setGen(false);
        }} className="bg-blue-600 px-6 rounded-xl text-[10px] font-black tracking-widest">{gen ? '...' : 'GENERAR CON IA'}</button>
      </div>
      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-5">
        <div>
           <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Título Principal (Fuerte)</label>
           <input type="text" value={state.lowerThird.title} onChange={e => update('title', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white font-black text-xl uppercase outline-none focus:border-blue-500" />
        </div>
        <div>
           <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Bajada / Subtítulo</label>
           <textarea value={state.lowerThird.subtitle} onChange={e => update('subtitle', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-sm font-bold h-28 resize-none outline-none focus:border-blue-500" />
        </div>
      </div>
    </div>
  );
}

function PanelConductores({ state, setState }) {
  const upd = (i, f, v) => {
    const nh = [...state.hosts]; nh[i] = { ...nh[i], [f]: v };
    setState(s => ({ ...s, hosts: nh }));
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
        <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Conductores</h2>
        <div className="flex gap-2">
          <button onClick={() => setState(s => ({ ...s, hosts: state.hosts.map(h => ({ ...h, show: false })) }))} className="px-4 py-2 bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-black hover:text-red-500">QUITAR TODOS</button>
          <button onClick={() => setState(s => ({ ...s, hosts: state.hosts.map(h => ({ ...h, show: true })) }))} className="px-4 py-2 bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-black hover:text-blue-500">TODOS AL AIRE</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {state.hosts.map((h, i) => (
          <div key={h.id} className={`p-6 rounded-3xl border transition-all ${h.show ? 'bg-blue-600/5 border-blue-500/40 shadow-2xl' : 'bg-zinc-900 border-zinc-800 opacity-60'}`}>
            <div className="flex justify-between mb-5">
              <span className="text-[10px] font-black uppercase text-zinc-500">{h.id}</span>
              <LiveToggle active={h.show} onClick={() => upd(i, 'show', !h.show)} label="Live" />
            </div>
            <input type="text" value={h.name} onChange={e => upd(i, 'name', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-bold mb-4 outline-none text-white" />
            <input type="range" min="-400" max="400" value={h.xOffset} onChange={e => upd(i, 'xOffset', parseInt(e.target.value))} className="w-full mb-4 accent-blue-500" />
            <label className="block bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-center cursor-pointer hover:bg-zinc-800 transition-all">
               <span className="text-[10px] font-black uppercase text-zinc-500">{h.image ? 'Cambiar Foto' : 'Subir Foto'}</span>
               <input type="file" className="hidden" accept="image/*" onChange={async e => upd(i, 'image', await resizeImage(e.target.files[0]))} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelClima({ state, setState }) {
  const updateW = (f, v) => setState(s => ({ ...s, weather: { ...s.weather, [f]: v } }));
  const updateT = (f, v) => setState(s => ({ ...s, time: { ...s.time, [f]: v } }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Módulo Clima</h3>
            <LiveToggle active={state.weather.show} onClick={() => updateW('show', !state.weather.show)} label="Clima" />
        </div>
        <input type="text" value={state.weather.city} onChange={e => updateW('city', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm font-bold text-white outline-none" placeholder="Nombre de Ciudad..." />
        <div className="flex justify-between items-center bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
            <span className="font-black text-xl italic uppercase tracking-tighter text-white">{state.weather.city}</span>
            <div className="flex items-center gap-2">
                <input type="number" value={state.weather.temp} onChange={e => updateW('temp', e.target.value)} className="w-16 bg-transparent text-right font-black text-3xl text-blue-500 outline-none" />
                <span className="font-black text-3xl text-blue-500">°C</span>
            </div>
        </div>
      </div>
      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Módulo Hora</h3>
          <LiveToggle active={state.time.show} onClick={() => updateT('show', !state.time.show)} label="Reloj" />
        </div>
        <div className="text-center py-10 font-black text-5xl text-zinc-800 tracking-tighter uppercase italic opacity-20">Reloj de Sistema</div>
      </div>
    </div>
  );
}

function PanelTema({ state, setState }) {
    return (
      <div className="space-y-6">
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-zinc-500">Configuración Visual</h3>
            <LiveToggle active={state.liveBadge.show} onClick={() => setState(s => ({...s, liveBadge: {...s.liveBadge, show: !state.liveBadge.show}}))} label="Badge VIVO" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(THEMES).map(k => (
                <button key={k} onClick={() => setState(s => ({...s, theme: k}))} className={`p-5 rounded-3xl border transition-all text-left ${state.theme === k ? 'border-white bg-white/5 scale-105 shadow-2xl' : 'border-zinc-800 bg-zinc-900/50 grayscale'}`}>
                    <div className={`w-full h-3 rounded mb-3 ${THEMES[k].panelBg} ${THEMES[k].border} border-l-4`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{THEMES[k].name}</span>
                </button>
            ))}
        </div>
      </div>
    );
}

function PanelInfo() {
  return (
    <div className="max-w-xl mx-auto bg-zinc-900 p-10 rounded-[40px] border border-zinc-800 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
      <lucide.Info size={48} className="text-blue-500 mx-auto mb-6" />
      <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-4 text-white">Créditos del Sistema</h2>
      <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent w-full mb-8"></div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Desarrollado por</p>
      <p className="text-2xl font-bold text-white uppercase mb-8">Mauro Maximiliano Polini</p>
      <a href="https://wa.me/543735500082" target="_blank" className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-3xl font-black text-sm transition-transform hover:scale-105 shadow-xl shadow-blue-900/20">
        <lucide.MessageCircle size={20} /> CONTACTAR WHATSAPP
      </a>
      <p className="mt-10 text-[9px] text-zinc-600 font-mono tracking-widest">BROADCAST ENGINE V2.6.5 - 2026</p>
    </div>
  );
}

function OverlayView({ state, isPreview = false }) {
  const [t, setT] = useState('');
  const theme = THEMES[state.theme] || THEMES.modernBlue;

  useEffect(() => {
    const iv = setInterval(() => setT(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className={`absolute inset-0 w-[1920px] h-[1080px] pointer-events-none select-none ${isPreview ? '' : 'bg-transparent'}`}>
      <div className={`absolute top-10 left-10 transition-all duration-700 ${state.liveBadge.show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="bg-red-600 px-8 py-3 flex items-center justify-center gap-4 rounded-2xl border border-white/20 shadow-[0_0_30px_rgba(220,38,38,0.4)]">
          <div className="w-4 h-4 rounded-full bg-white animate-pulse shadow-[0_0_10px_#fff]"></div>
          <span className="text-xl font-black tracking-[0.5em] text-white uppercase">Vivo</span>
        </div>
      </div>
      <div className={`absolute top-10 right-10 flex items-center gap-10 px-12 py-6 rounded-3xl backdrop-blur-3xl border transition-all duration-700 ${state.time.show || state.weather.show ? 'opacity-100' : 'opacity-0'} ${theme.panelBg} ${theme.text} ${theme.border} ${theme.shadow}`}>
        {state.time.show && <div className="text-6xl font-black tracking-tighter border-r border-current/20 pr-10">{t || '00:00'}</div>}
        {state.weather.show && <div className="flex flex-col"><span className="text-5xl font-black leading-none">{state.weather.temp}°C</span><span className="text-[14px] uppercase font-black tracking-widest opacity-70 mt-2">{state.weather.city}</span></div>}
      </div>
      <div className="absolute bottom-[280px] w-full flex justify-around px-24">
        {state.hosts.map(h => h.show && (
          <div key={h.id} style={{ transform: `translateX(${h.xOffset}px)` }} className={`flex items-center px-12 py-6 rounded-[40px] backdrop-blur-3xl border-2 transition-all duration-700 ${theme.panelBg} ${theme.text} ${theme.border} ${theme.shadow}`}>
            {h.image && <img src={h.image} className="w-20 h-20 rounded-full border-4 border-current/20 mr-6 object-cover shadow-2xl" />}
            <h3 className={`text-4xl font-black uppercase tracking-tight ${theme.titleFont}`}>{h.name}</h3>
          </div>
        ))}
      </div>
      <div className={`absolute bottom-0 w-full transition-all duration-700 ${state.lowerThird.show ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
        <div className="w-full max-w-[1800px] mx-auto mb-12 flex flex-col px-16">
          <div className={`px-12 py-4 backdrop-blur-3xl border-x-2 border-t-2 rounded-t-[40px] w-fit ml-6 relative z-10 -mb-0.5 shadow-2xl ${theme.panelBg} ${theme.text} ${theme.border}`}>
            <p className="text-3xl font-black uppercase tracking-tighter italic">{state.lowerThird.subtitle}</p>
          </div>
          <div className={`p-12 w-full border-2 rounded-[40px] rounded-tl-none relative z-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${theme.accent} ${theme.shadow}`}>
            <h2 className={`text-8xl text-white font-black tracking-tighter uppercase leading-none ${theme.titleFont}`}>{state.lowerThird.title}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
