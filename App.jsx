import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, User, LayoutTemplate, CloudSun, MonitorPlay, 
  Search, Copy, Check, Link, RefreshCw, EyeOff, Eye, 
  Sparkles, Loader2, Upload, Trash2, Video, Radio, 
  Info, MessageCircle
} from 'lucide-react';

// --- CONFIGURACIÓN DE LA API DE GEMINI ---
const apiKey = ""; 

async function generarZocaloIA(tema) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ 
      parts: [{ 
        text: `Actúa como un productor experto de noticieros de Argentina. Tema: "${tema}". Genera un título impactante (máximo 5 palabras, MAYÚSCULAS) y una bajada informativa profesional (entre 10 y 20 palabras).` 
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

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? JSON.parse(text) : { title: "ERROR", subtitle: "No se pudo generar" };
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
  cyberpunk: { name: 'Industrial Cyber', panelBg: 'bg-zinc-950/95', text: 'text-green-400', border: 'border-green-500', accent: 'bg-green-600 text-black', shadow: 'shadow-[0_0_25px_rgba(34,197,94,0.4)]', titleFont: 'font-["Orbitron"] font-black tracking-widest', bodyFont: 'font-mono font-bold' }
};

const DEFAULT_STATE = {
  theme: 'modernBlue',
  animation: 'slideUp',
  liveBadge: { show: true },
  lowerThird: { title: 'TÍTULO PRINCIPAL', subtitle: 'BAJADA INFORMATIVA...', show: false },
  hosts: [
    { id: 'izquierda', name: 'Conductor 1', xOffset: 0, show: true, image: null },
    { id: 'centro', name: 'Conductor 2', xOffset: 0, show: true, image: null },
    { id: 'derecha', name: 'Conductor 3', xOffset: 0, show: true, image: null }
  ],
  weather: { city: 'Buenos Aires', temp: 22, show: true },
  time: { show: true }
};

const LiveToggle = ({ active, onClick, label }) => (
  <button onClick={onClick} className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-black text-[10px] transition-all border overflow-hidden ${active ? 'bg-red-600 text-white border-red-400 shadow-lg scale-[1.02]' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-white animate-pulse' : 'bg-zinc-700'}`}></div>
    <span className="tracking-tighter uppercase">{active ? `EN AIRE (${label})` : `MOSTRAR ${label}`}</span>
  </button>
);

export default function App() {
  const isOverlay = window.location.search.includes('mode=overlay');
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('obs_pro_v5');
    return saved ? JSON.parse(saved) : DEFAULT_STATE;
  });
  const [activeTab, setActiveTab] = useState('zocalos');
  const bc = useRef(new BroadcastChannel('obs_sync_v5'));

  useEffect(() => {
    localStorage.setItem('obs_pro_v5', JSON.stringify(state));
    bc.current.postMessage({ type: 'UPDATE', payload: state });
  }, [state]);

  useEffect(() => {
    bc.current.onmessage = (e) => { if (isOverlay && e.data.type === 'UPDATE') setState(e.data.payload); };
  }, [isOverlay]);

  if (isOverlay) return <OverlayView state={state} />;

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white flex font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <Radio className="text-red-600 animate-pulse" size={18} />
          <h1 className="font-black text-xs uppercase tracking-widest">Broadcast Pro</h1>
        </div>
        <nav className="p-2 flex-1 space-y-1">
          {['zocalos', 'conductores', 'clima', 'tema', 'info'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {tab}
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
                alert("URL de Overlay Copiada");
            }} className="w-full bg-zinc-800 p-2 rounded text-[9px] font-black tracking-widest">COPIAR URL OBS</button>
        </div>
      </aside>

      {/* PANEL PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'zocalos' && <PanelZocalos state={state} setState={setState} />}
        {activeTab === 'conductores' && <PanelConductores state={state} setState={setState} />}
        {activeTab === 'clima' && <PanelClima state={state} setState={setState} />}
        {activeTab === 'tema' && <PanelTema state={state} setState={setState} />}
        {activeTab === 'info' && <PanelInfo />}
      </main>
    </div>
  );
}

// --- SUB-PANELES ---

function PanelZocalos({ state, setState }) {
  const [topic, setTopic] = useState('');
  const update = (f, v) => setState(s => ({ ...s, lowerThird: { ...s.lowerThird, [f]: v } }));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex justify-between items-center">
        <h2 className="font-black uppercase italic tracking-tighter text-xl">Zócalos</h2>
        <LiveToggle active={state.lowerThird.show} onClick={() => update('show', !state.lowerThird.show)} label="Zócalo" />
      </div>
      <div className="bg-blue-600/10 p-4 rounded-xl border border-blue-500/20 flex gap-2">
        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs outline-none" placeholder="Tema para la IA..." />
        <button onClick={async () => {
          const res = await generarZocaloIA(topic);
          setState(s => ({ ...s, lowerThird: { ...s.lowerThird, title: res.title, subtitle: res.subtitle } }));
        }} className="bg-blue-600 px-4 rounded-lg text-[10px] font-black">GENERAR IA</button>
      </div>
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <input type="text" value={state.lowerThird.title} onChange={e => update('title', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white font-black text-lg uppercase" placeholder="TÍTULO GRANDE" />
        <textarea value={state.lowerThird.subtitle} onChange={e => update('subtitle', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm font-bold h-24 resize-none" placeholder="Subtítulo informativo..." />
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {state.hosts.map((h, i) => (
        <div key={h.id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
          <div className="flex justify-between mb-4">
            <span className="text-[10px] font-black uppercase text-zinc-500">{h.id}</span>
            <LiveToggle active={h.show} onClick={() => upd(i, 'show', !h.show)} label="Aire" />
          </div>
          <input type="text" value={h.name} onChange={e => upd(i, 'name', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs font-bold mb-3" />
          <input type="range" min="-400" max="400" value={h.xOffset} onChange={e => upd(i, 'xOffset', parseInt(e.target.value))} className="w-full mb-3" />
          <label className="block bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-center cursor-pointer hover:bg-zinc-800 transition-all">
             <span className="text-[10px] font-black uppercase text-zinc-500">{h.image ? 'Cambiar Foto' : 'Subir Foto'}</span>
             <input type="file" className="hidden" accept="image/*" onChange={async e => upd(i, 'image', await resizeImage(e.target.files[0]))} />
          </label>
        </div>
      ))}
    </div>
  );
}

function PanelClima({ state, setState }) {
  return (
    <div className="max-w-md bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black uppercase text-sm">Clima y Hora</h2>
        <div className="flex gap-2">
            <LiveToggle active={state.weather.show} onClick={() => setState(s => ({ ...s, weather: { ...s.weather, show: !s.weather.show } }))} label="Clima" />
            <LiveToggle active={state.time.show} onClick={() => setState(s => ({ ...s, time: { ...s.time, show: !state.time.show } }))} label="Hora" />
        </div>
      </div>
      <input type="text" className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs" placeholder="Buscar Ciudad..." />
    </div>
  );
}

function PanelTema({ state, setState }) {
    return (
      <div className="space-y-4">
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-4">Cartel VIVO</h3>
            <LiveToggle active={state.liveBadge.show} onClick={() => setState(s => ({...s, liveBadge: {...s.liveBadge, show: !s.liveBadge.show}}))} label="Badge Vivo" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.keys(THEMES).map(k => (
                <button key={k} onClick={() => setState(s => ({...s, theme: k}))} className={`p-4 rounded-2xl border transition-all ${state.theme === k ? 'border-white bg-white/5' : 'border-zinc-800'}`}>
                    <div className={`w-full h-2 rounded mb-2 ${THEMES[k].panelBg}`}></div>
                    <span className="text-[9px] font-black uppercase">{THEMES[k].name}</span>
                </button>
            ))}
        </div>
      </div>
    );
}

function PanelInfo() {
  return (
    <div className="max-w-md mx-auto bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center">
      <h2 className="text-xl font-black uppercase italic mb-4 tracking-tighter">Información del Desarrollador</h2>
      <div className="h-px bg-zinc-800 w-full mb-6"></div>
      <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Creado por</p>
      <p className="text-lg font-bold mb-6">Mauro Maximiliano Polini</p>
      <a href="https://wa.me/543735500082" target="_blank" className="inline-flex items-center gap-2 bg-blue-600 px-6 py-3 rounded-2xl font-black text-xs">
        <MessageCircle size={18} /> +54 3735 500082
      </a>
    </div>
  );
}

// --- VISTA OVERLAY (OBS) ---

function OverlayView({ state, isPreview = false }) {
  const [t, setT] = useState('');
  const theme = THEMES[state.theme] || THEMES.modernBlue;

  useEffect(() => {
    const iv = setInterval(() => setT(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className={`absolute inset-0 w-[1920px] h-[1080px] pointer-events-none select-none ${isPreview ? '' : 'bg-transparent'}`}>
      <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Montserrat:wght@900&family=Orbitron:wght@700&family=Roboto:wght@900&display=swap');`}} />

      {/* Cartel VIVO (IZQUIERDA) */}
      <div className={`absolute top-10 left-10 transition-all duration-700 ${state.liveBadge.show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="bg-red-600 px-6 py-2 flex items-center gap-3 rounded-xl border border-white/20 shadow-2xl">
          <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
          <span className="text-sm font-black tracking-[0.4em] text-white font-['Montserrat']">VIVO</span>
        </div>
      </div>

      {/* Clima y Hora (DERECHA) */}
      <div className={`absolute top-10 right-10 flex items-center gap-8 px-10 py-5 rounded-2xl backdrop-blur-3xl border transition-all duration-700 ${state.time.show || state.weather.show ? 'opacity-100' : 'opacity-0'} ${theme.panelBg} ${theme.text} ${theme.border} ${theme.shadow}`}>
        {state.time.show && <div className="text-5xl font-black tracking-tighter border-r border-current/20 pr-10">{t || '00:00'}</div>}
        {state.weather.show && <div className="flex flex-col"><span className="text-4xl font-black leading-none">{state.weather.temp}°C</span><span className="text-[12px] uppercase font-black opacity-80">{state.weather.city}</span></div>}
      </div>

      {/* Conductores */}
      <div className="absolute bottom-[240px] w-full flex justify-around px-20">
        {state.hosts.map(h => h.show && (
          <div key={h.id} style={{ transform: `translateX(${h.xOffset}px)` }} className={`flex items-center px-10 py-5 rounded-3xl backdrop-blur-3xl border-2 transition-all duration-700 ${theme.panelBg} ${theme.text} ${theme.border} ${theme.shadow}`}>
            {h.image && <img src={h.image} className="w-16 h-16 rounded-full border-4 border-current/20 mr-4 object-cover" />}
            <h3 className={`text-3xl font-black uppercase ${theme.titleFont}`}>{h.name}</h3>
          </div>
        ))}
      </div>

      {/* Zócalo Stack Vertical */}
      <div className={`absolute bottom-0 w-full transition-all duration-700 ${state.lowerThird.show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <div className="w-full max-w-[1700px] mx-auto mb-10 flex flex-col px-12">
          <div className={`px-10 py-3 backdrop-blur-3xl border-x-2 border-t-2 rounded-t-3xl w-fit ml-4 relative z-10 -mb-0.5 ${theme.panelBg} ${theme.text} ${theme.border}`}>
            <p className="text-2xl font-black uppercase tracking-tighter">{state.lowerThird.subtitle}</p>
          </div>
          <div className={`p-10 w-full border-2 rounded-2xl rounded-tl-none relative z-20 ${theme.accent} ${theme.shadow}`}>
            <h2 className={`text-7xl text-white font-black tracking-tighter uppercase leading-none ${theme.titleFont}`}>{state.lowerThird.title}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
