import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// ─── Firebase config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAUaVfcNo6VJVmLndnzsr0H7z4UgjYnC0M",
  authDomain: "golf-36dde.firebaseapp.com",
  projectId: "golf-36dde",
  storageBucket: "golf-36dde.firebasestorage.app",
  messagingSenderId: "829361564287",
  appId: "1:829361564287:web:a404fcf5235dcbf823ad4a",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const DOC_REF = doc(db, "golf", "appdata");

// ─── Favicon injection ────────────────────────────────────────────────────────
function useFavicon(src) {
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = src;
    document.title = "Road 2 Jefke Peine";
  }, [src]);
}

// ─── DatePicker ───────────────────────────────────────────────────────────────
function fmtDate(d) {
  const dd=String(d.getDate()).padStart(2,'0');
  const mm=String(d.getMonth()+1).padStart(2,'0');
  const yyyy=d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [d,m,y] = value.split('/');
      const dt = new Date(+y, +m-1, +d);
      if (!isNaN(dt)) return dt;
    }
    return new Date();
  });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const startOffset = (firstDay + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month+1, 0).getDate();

  const selectDate = (d) => { onChange(fmtDate(d)); setOpen(false); };

  const parseValue = (v) => {
    if (!v) return null;
    const [d,m,y] = v.split('/');
    const dt = new Date(+y, +m-1, +d); dt.setHours(0,0,0,0);
    return isNaN(dt) ? null : dt;
  };
  const selected = parseValue(value);

  const monthNames = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];
  const dayNames = ['Ma','Di','Wo','Do','Vr','Za','Zo'];

  const cells = [];
  for (let i=0; i<startOffset; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div ref={ref} style={{position:"relative"}}>
      <div style={{display:"flex",gap:8}}>
        <div style={{position:"relative",flex:1}}>
          <input
            readOnly
            value={value||""}
            placeholder="dd/mm/yyyy"
            onClick={()=>setOpen(v=>!v)}
            className="input"
            style={{cursor:"pointer",paddingRight:36}}
          />
          <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none"}}>📅</span>
        </div>
        <button type="button" onClick={()=>{selectDate(today);}} style={{padding:"0 12px",borderRadius:8,border:"1px solid #2a3a2a",background:"#131a14",color:"#4ade80",fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontWeight:600}}>Vandaag</button>
        <button type="button" onClick={()=>{selectDate(yesterday);}} style={{padding:"0 12px",borderRadius:8,border:"1px solid #2a3a2a",background:"#131a14",color:"#a0b898",fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>Gisteren</button>
      </div>

      {open && (
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:200,background:"#111620",border:"1px solid #2a3a2a",borderRadius:12,padding:14,minWidth:280,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
          {/* Month nav */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <button onClick={()=>setViewDate(new Date(year,month-1,1))} style={{background:"none",border:"none",color:"#6b7563",cursor:"pointer",fontSize:18,padding:"2px 8px"}}>‹</button>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:"#e8e4d8"}}>{monthNames[month]} {year}</span>
            <button onClick={()=>setViewDate(new Date(year,month+1,1))} style={{background:"none",border:"none",color:"#6b7563",cursor:"pointer",fontSize:18,padding:"2px 8px"}}>›</button>
          </div>
          {/* Day names */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
            {dayNames.map(d=><div key={d} style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#4b5563",padding:"3px 0"}}>{d}</div>)}
          </div>
          {/* Day cells */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {cells.map((d,i)=>{
              if(!d) return <div key={i}/>;
              d.setHours(0,0,0,0);
              const isToday = d.getTime()===today.getTime();
              const isSelected = selected && d.getTime()===selected.getTime();
              const isYesterday = d.getTime()===yesterday.getTime();
              return(
                <button key={i} onClick={()=>selectDate(d)}
                  style={{padding:"6px 2px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:isSelected?700:400,
                    background:isSelected?"#4ade80":isToday?"#1e3a1e":isYesterday?"#1a2a1a":"transparent",
                    color:isSelected?"#0a1a0a":isToday?"#4ade80":"#e8e4d8",
                    outline:isToday&&!isSelected?"1px solid #2a4a2a":"none",
                    transition:"all 0.1s"}}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// Portal-based Modal — always renders on document.body, never affected by parent scroll/transform
function Modal({children}){
  return createPortal(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",boxSizing:"border-box"}}>
      {children}
    </div>,
    document.body
  );
}

// Firebase replaces localStorage

const defaultData = {
  zeroSum: [], // blank canvas
  r2b: {
    "2026": {
      holes: { Rob: [0,1,0,1,1,0,0,0,0,1,0,0,0,0,0,0,0,0], Joost: Array(18).fill(0), Joris: Array(18).fill(0), Thomas: [1,0,1,0,0,0,0,0,0,0,1,0,1,0,1,0,0,1] },
      b2b: { Rob: 1, Joost: 0, Joris: 0, Thomas: 0 },
    },
    "2025": {
      holes: { Rob:[0,1,1,0,1,0,1,1,1,1,1,1,0,0,0,1,0,0], Joost:[0,1,1,0,0,0,1,0,1,1,0,0,0,0,1,0,0,0], Joris:[1,0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,1,0], Thomas:[0,0,1,1,0,0,1,0,0,1,1,1,0,0,1,0,1,0] },
      b2b: { Rob:3,Joost:1,Joris:0,Thomas:0 }, bestImprRound:{Rob:1,Joost:1,Joris:0,Thomas:0}, foursomes:{Rob:0,Joost:0,Joris:0,Thomas:0},
    },
    "2023-2024": {
      holes: { Rob:[1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0], Joost:[0,1,1,1,1,0,1,1,1,1,1,1,0,0,1,1,1,1], Joris:[1,0,1,0,1,0,1,0,0,1,1,1,0,0,0,1,0,1], Thomas:[0,0,1,1,1,0,1,0,0,1,1,1,0,0,1,0,1,0] },
      b2b:{Rob:1,Joost:4,Joris:0,Thomas:1}, bestImprRound:{Rob:0,Joost:1,Joris:2,Thomas:3}, foursomes:{Rob:2,Joost:0,Joris:1,Thomas:1},
    },
    "2021-2022": {
      holes: { Rob:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], Joost:[0,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1], Joris:[1,1,1,0,1,0,1,0,0,1,1,1,0,0,0,1,1,1], Thomas:[1,0,1,1,1,1,1,0,0,1,1,1,0,0,1,0,1,1] },
      b2b:{Rob:0,Joost:0,Joris:0,Thomas:0},
    },
  },
  masters: [
    {year:2025,results:["Rob","Joost","Thomas","Joris"],scores:{Rob:7,Joost:12,Thomas:22,Joris:19},notes:"27 holes op Millenium met halvering na 18"},
    {year:2024,results:["Joost","Thomas","Rob","Joris"],scores:{Joost:6,Thomas:10,Rob:11,Joris:17},notes:"18 holes op Millenium"},
    {year:2023,results:["Joost","Rob","Thomas","Joris"],scores:{Joost:8,Rob:13,Thomas:23,Joris:32},notes:"Hasselt + Millenium 18 holes. Zelfs met de hoogste score ooit op de masters, kon Rob niet winnen. Joost pakt hem met maar liefst 5 strokes."},
    {year:2022,results:["Joost","Rob","Thomas","Joris"],scores:{Joost:13,Rob:19,Thomas:null,Joris:null},notes:"Millenium: 16 + 9 holes. Wintereditie 3 december."},
    {year:2021,results:["Rob","Thomas","Joost","Joris"],scores:{Rob:12,Thomas:19,Joost:20,Joris:39},notes:"Koudste masters ooit op 11/11. 2x Millenium. Rob speelt +4 op de 2de 18 holes en loopt uit en wint!"},
    {year:2020,results:["Rob","Joost","Thomas","Joris"],scores:{Rob:17,Joost:21,Thomas:27,Joris:33},notes:"Dag 1: Rigenee, Dag 2: Millenium. Rigenee met enorm veel wind."},
    {year:2019,results:["Joost","Rob","Joris","Thomas"],scores:{Joost:17,Rob:33,Joris:35,Thomas:43},notes:"Dag 1: Rigenee, Dag 2: Millenium. Totale heerschappij van Joost. Eerste dag 5 shot voorsprong op Rigenee."},
    {year:2018,results:["Rob","Thomas","Joost","Joris"],scores:{Rob:21,Thomas:26,Joost:26,Joris:42},notes:"Dag 1: Millenium, Dag 2: Best. Spannend tot hole 16 tussen Rob en Joost maar 2 ballen in het water."},
    {year:2017,results:["Joost","Thomas","Rob","Joris"],scores:{},notes:"Legendarische meltdown van Thomas. Joost playoff gewonnen in Gendersteyn."},
    {year:2016,results:["Joost","Thomas","Rob","Joris"],scores:{},notes:""},
    {year:2015,results:["Joost","Thomas","Joris","Rob"],scores:{},notes:""},
    {year:2014,results:["Joost","Thomas","Joris","Rob"],scores:{},notes:""},
    {year:2013,results:["Rob","Joris","Thomas","Joost"],scores:{},notes:""},
    {year:2012,results:["Rob","Joost","Thomas","Joris"],scores:{},notes:"4-daagse: Millenium, Hasselt, Haverleij, Gendersteyn"},
  ],
  usOpen: [
    {year:2025,venue:"Damme",results:["Rob","Thomas","Joost","Joris"],scores:{Rob:10,Thomas:11,Joost:11,Joris:null},notes:"US Open in Damme. Rob wint na kantelpunt op hole 16."},
    {year:2024,venue:"Royal Latem",results:["Joost","Rob","Thomas","Joris"],scores:{Joost:15,Rob:17,Thomas:19,Joris:21},notes:"Royal Latem. Old money club. Joost oppermachtig met zijn up and downs."},
    {year:2023,venue:"Royal Zoute",results:["Joost","Thomas","Joris","Rob"],scores:{Joost:11,Thomas:16,Joris:19,Rob:22},notes:"Zee-editie op Royal Zoute, Knokke. Hypersnelle greens. Joost even par front 9 met 3 birdies op rij."},
    {year:2022,venue:"Bossenstein",results:["Joost","Rob","Joris","Thomas"],scores:{Joost:15,Rob:18,Joris:19,Thomas:22},notes:"Bossenstein. Afschuwelijke greens. Thomas quad op hole 12."},
    {year:2021,venue:"Postel",results:["Rob","Joost","Thomas","Joris"],scores:{Rob:15,Joost:18,Thomas:null,Joris:27},notes:"1ste editie in Postel. Afschuwelijke greens, ongeziene hoeveelheid 3 en 4-putts."},
  ],
  ryderCup: [],
  r2bLog: [],
  appNotes: [],
  challenges: [],
  scores: [{id:1001,player:"Rob",course:"Millenium",holes:18,score:9,date:"11/11/2025"},{id:1002,player:"Rob",course:"Royal Ostend",holes:18,score:6,date:"12/10/2025"},{id:1003,player:"Rob",course:"Damme",holes:18,score:10,date:"11/10/2025"},{id:1004,player:"Rob",course:"Rigenee",holes:18,score:9,date:"10/10/2025"},{id:1005,player:"Rob",course:"Millenium",holes:18,score:11,date:"22/08/2025"},{id:1006,player:"Rob",course:"Millenium",holes:18,score:10,date:"15/07/2025"},{id:1007,player:"Rob",course:"Millenium",holes:18,score:7,date:"11/07/2025"},{id:1008,player:"Rob",course:"Millenium",holes:18,score:2,date:"29/06/2025"},{id:1009,player:"Rob",course:"Millenium",holes:18,score:7,date:"27/06/2025"},{id:1010,player:"Rob",course:"Millenium",holes:18,score:7,date:"09/06/2025"},{id:1011,player:"Rob",course:"Millenium",holes:18,score:5,date:"06/06/2025"},{id:1012,player:"Rob",course:"Millenium",holes:18,score:10,date:"25/05/2025"},{id:1013,player:"Rob",course:"Millenium",holes:18,score:8,date:"15/05/2025"},{id:1014,player:"Rob",course:"Millenium",holes:18,score:9,date:"11/05/2025"},{id:1015,player:"Rob",course:"Millenium",holes:18,score:15,date:"08/05/2025"},{id:1016,player:"Rob",course:"Millenium",holes:18,score:7,date:"26/04/2025"},{id:1017,player:"Rob",course:"Millenium",holes:18,score:6,date:"23/03/2025"},{id:1018,player:"Rob",course:"Millenium",holes:18,score:6,date:"20/03/2025"},{id:1019,player:"Rob",course:"Millenium",holes:9,score:6,date:"01/03/2025"}],
  records: {
    courses: [
      { course:"Millenium 18", sub:null,  Rob:"+2",  Joost:"+1", Thomas:"+4", Joris:"+8" },
      { course:"Millenium 18", sub:"Front",Rob:"-1",  Joost:"E",  Thomas:"E",  Joris:"+2" },
      { course:"Millenium 18", sub:"Back", Rob:"-2",  Joost:"-1", Thomas:"-1", Joris:""   },
      { course:"Haverleij 18", sub:null,   Rob:"+6",  Joost:"+4", Thomas:"+8", Joris:"+8" },
      { course:"Haverleij 18", sub:"Front",Rob:"+3",  Joost:"+1", Thomas:"+4", Joris:""   },
      { course:"Haverleij 18", sub:"Back", Rob:"+3",  Joost:"",   Thomas:"+1", Joris:""   },
      { course:"Gendersteyn G/R",sub:null, Rob:"+2",  Joost:"+9", Thomas:"",   Joris:"+9" },
      { course:"Ternesse 18",     sub:null,  Rob:"+9",  Joost:"",   Thomas:"",   Joris:""   },
      { course:"Ternesse 18",     sub:"Front",Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
      { course:"Ternesse 18",     sub:"Back", Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
      { course:"Rigenee 18",      sub:null,   Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
      { course:"Rigenee 18",      sub:"Front",Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
      { course:"Rigenee 18",      sub:"Back", Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
    ],
    stats: [
      { label:"70's streak",      Rob:"4",  Joost:"1", Thomas:"2",  Joris:"0"  },
      { label:"Eagles",           Rob:"5",  Joost:"5", Thomas:"3",  Joris:"1"  },
      { label:"Aantal birdies op 18", Rob:"5", Joost:"3", Thomas:"", Joris:""  },
      { label:"Aantal fairways op 18",Rob:"",  Joost:"",  Thomas:"14",Joris:"" },
      { label:"Aantal GIR op 18", Rob:"14", Joost:"",  Thomas:"",   Joris:""   },
      { label:"# Birdies op een rij", Rob:"3", Joost:"3", Thomas:"2", Joris:"" },
      { label:"Par streak",       Rob:"9",  Joost:"7", Thomas:"",   Joris:""   },
    ],
  },
};

const PLAYERS = ["Rob","Joost","Thomas","Joris"];
const PC = { Rob:"#e8a838", Joost:"#4ade80", Thomas:"#f472b6", Joris:"#60a5fa" };

function calcR2BTotal(sd) {
  return Object.fromEntries(PLAYERS.map(p => {
    const h = sd.holes[p]?.reduce((a,b)=>a+b,0)||0;
    const b = sd.b2b?.[p]||0;
    const r = sd.bestImprRound?.[p]||0;
    const f = sd.foursomes?.[p]||0;
    return [p, h+b+r+f];
  }));
}

function calcAllTimeTourney(history, isUSOpen=false) {
  const w1=isUSOpen?1.5:3, w2=isUSOpen?1:2, w3=isUSOpen?0.5:1;
  const s={};
  for(const p of PLAYERS) s[p]={p1:0,p2:0,p3:0,p4:0,pts:0};
  for(const e of history){
    const r=e.results;
    if(r[0]&&s[r[0]]){s[r[0]].p1++;s[r[0]].pts+=w1;}
    if(r[1]&&s[r[1]]){s[r[1]].p2++;s[r[1]].pts+=w2;}
    if(r[2]&&s[r[2]]){s[r[2]].p3++;s[r[2]].pts+=w3;}
    if(r[3]&&s[r[3]])s[r[3]].p4++;
  }
  return s;
}

function calcZeroSum(matches) {
  const pts={Rob:0,Joost:0,Thomas:0,Joris:0};
  const played={Rob:0,Joost:0,Thomas:0,Joris:0};
  const won={Rob:0,Joost:0,Thomas:0,Joris:0};
  for(const m of matches){
    if(!m.winner||!m.p1||!m.p2) continue;
    played[m.p1]=(played[m.p1]||0)+1;
    played[m.p2]=(played[m.p2]||0)+1;
    won[m.winner]=(won[m.winner]||0)+1;
    pts[m.winner]=(pts[m.winner]||0)+1;
    const loser=m.winner===m.p1?m.p2:m.p1;
    pts[loser]=(pts[loser]||0)-1;
  }
  return PLAYERS.map(p=>({player:p,pts:pts[p]||0,played:played[p]||0,won:won[p]||0}))
    .sort((a,b)=>b.pts-a.pts);
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function GolfApp() {
  const [data,setData] = useState(defaultData);
  const [loading,setLoading] = useState(true);
  const [tab,setTab] = useState("dashboard");
  const [toast,setToast] = useState(null);
  // Global modals — lifted here so they always render at root level (correct fixed positioning)
  const [editDateItem,setEditDateItem] = useState(null);

  // Load from Firebase on mount
  useEffect(()=>{
    getDoc(DOC_REF).then(snap=>{
      if(snap.exists()){
        const loaded={...defaultData,...snap.data()};
        // Migrate: add any missing course rows from defaultData
        const existingKeys=new Set((loaded.records?.courses||[]).map(r=>r.course+"||"+(r.sub||"")));
        const missing=defaultData.records.courses.filter(r=>!existingKeys.has(r.course+"||"+(r.sub||"")));
        if(missing.length>0){
          loaded.records={...loaded.records,courses:[...(loaded.records?.courses||[]),...missing]};
          setDoc(DOC_REF, loaded).catch(()=>{});
        }
        setData(loaded);
      }
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  const save = useCallback((nd)=>{
    setData(nd);
    setDoc(DOC_REF, nd).then(()=>{
      setToast("Opgeslagen ✓");
      setTimeout(()=>setToast(null),2000);
    }).catch(()=>{
      setToast("❌ Opslaan mislukt");
      setTimeout(()=>setToast(null),3000);
    });
  },[]);

  const tabs=[
    {id:"dashboard", label:"Dashboard",  icon:"🏌️"},
    {id:"r2b",       label:"R2B",        icon:"🐦"},
    {id:"zerogame",  label:"Zero Sum",   icon:"⚔️"},
    {id:"scores",    label:"Scores",     icon:"📊"},
    {id:"challenges",label:"Challenges", icon:"🎯"},
    {id:"tornooien", label:"Tornooien",  icon:"🏆"},
    {id:"records",   label:"Records",    icon:"📋"},
    {id:"handicap",  label:"Handicap",   icon:"🎯"},
  ];

  if(loading) return (
    <div style={{minHeight:"100vh",background:"#0a0e1a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:32}}>⛳</div>
      <div style={{fontFamily:"'DM Sans',sans-serif",color:"#4ade80",fontSize:14,letterSpacing:2}}>LADEN...</div>
    </div>
  );

  // Use a ref so update helpers always see latest data
  const dataRef = useRef(data);
  useEffect(()=>{ dataRef.current=data; },[data]);

  const updateR2BDate=(item,newDate)=>{
    const d=dataRef.current;
    let matched=false;
    const newLog=(d.r2bLog||[]).map(e=>{
      if(matched) return e; // only update first match
      const isB2B=e.type==="b2b";
      const matchB2B=isB2B&&item.isBb&&e.player===item.player&&e.date===item.currentDate;
      const matchBirdie=!isB2B&&!item.isBb&&e.player===item.player&&String(e.hole)===String(item.hole)&&e.date===item.currentDate;
      if(matchB2B||matchBirdie){ matched=true; return {...e,date:newDate}; }
      return e;
    });
    save({...d,r2bLog:newLog});
  };
  const updateChallengeDate=(item,newDate)=>{
    const d=dataRef.current;
    const newChallenges=(d.challenges||[]).map(c=>{
      if(c.title!==item.challengeTitle) return c;
      return {...c,doneDates:{...(c.doneDates||{}),[item.player]:newDate}};
    });
    save({...d,challenges:newChallenges});
  };
  const submitVote=()=>{
    if(!voteName.trim()||!voteModal) return;
    const d=dataRef.current;
    const {id,type}=voteModal;
    save({...d,challenges:(d.challenges||[]).map(c=>{
      if(c.id!==id) return c;
      const newUp=[...(c.upvotes||[])].filter(v=>v!==voteName.trim());
      const newDown=[...(c.downvotes||[])].filter(v=>v!==voteName.trim());
      if(type==="up") newUp.push(voteName.trim());
      else newDown.push(voteName.trim());
      return {...c,upvotes:newUp,downvotes:newDown};
    })});
    setVoteModal(null);
    setVoteName("");
  };

  const modalOverlay={position:"fixed",top:0,left:0,width:"100vw",height:"100vh",background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",boxSizing:"border-box"};
  const modalCard={background:"#111620",border:"1px solid #2a3a2a",borderRadius:14,padding:20,maxWidth:340,width:"100%",fontFamily:"'DM Sans',sans-serif"};
  const modalBtn=(primary,color)=>({flex:1,padding:"11px",borderRadius:8,border:primary?"none":"1px solid #2a3a2a",background:primary?(color||"#f472b6"):"#131a14",color:primary?"#0a0510":"#6b7563",fontFamily:"'DM Sans',sans-serif",fontWeight:primary?700:400,cursor:"pointer",fontSize:14});

  return (
    <>
    {editDateItem&&(
      <Modal>
        <div style={{...modalCard,borderColor:"#f472b6"}}>
          <div style={{fontWeight:700,fontSize:15,color:"#e8e4d8",marginBottom:6}}>📅 Datum aanpassen</div>
          <div style={{fontSize:13,color:"#8a9a88",marginBottom:14,lineHeight:1.4}}>{editDateItem.label}</div>
          <DatePicker value={editDateItem.newDate||editDateItem.currentDate} onChange={v=>setEditDateItem(d=>({...d,newDate:v}))}/>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={()=>setEditDateItem(null)} style={modalBtn(false)}>Annuleer</button>
            <button onClick={()=>{
              const nd=editDateItem.newDate||editDateItem.currentDate;
              if(!nd) return;
              if(editDateItem.sourceType==="r2b") updateR2BDate(editDateItem,nd);
              else updateChallengeDate(editDateItem,nd);
              setEditDateItem(null);
            }} style={modalBtn(true,"#f472b6")}>Opslaan</button>
          </div>
        </div>
      </Modal>
    )}
    {voteModal&&(
      <Modal>
        <div style={{...modalCard,borderColor:voteModal.type==="up"?"#4ade80":"#f87171"}}>
          <div style={{fontWeight:700,fontSize:15,color:"#e8e4d8",marginBottom:6}}>{voteModal.type==="up"?"👍 Upvote":"👎 Downvote"}</div>
          <div style={{fontSize:13,color:"#8a9a88",marginBottom:14}}>
            {voteModal.type==="down"?"Na 3 downvotes wordt de challenge doorgestreept.":"Wie stemt voor deze challenge?"}
          </div>
          <select value={voteName} onChange={e=>setVoteName(e.target.value)} style={{background:"#131a14",border:"1px solid #2a3a2a",borderRadius:8,color:"#e8e4d8",padding:"10px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:15,width:"100%",marginBottom:14}}>
            <option value="">— kies speler —</option>
            {PLAYERS.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setVoteModal(null);setVoteName("");}} style={modalBtn(false)}>Annuleer</button>
            <button onClick={submitVote} disabled={!voteName.trim()} style={modalBtn(true,voteModal.type==="up"?"#4ade80":"#f87171")}>
              Stem {voteModal.type==="up"?"👍":"👎"}
            </button>
          </div>
        </div>
      </Modal>
    )}
    <div style={{minHeight:"100vh",background:"#0a0e1a",fontFamily:"'Playfair Display',Georgia,serif",color:"#e8e4d8"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0e1a}::-webkit-scrollbar-thumb{background:#2a3a2a;border-radius:2px}
        .input{background:#131a14;border:1px solid #2a3a2a;border-radius:8px;color:#e8e4d8;padding:10px 12px;font-family:'DM Sans',sans-serif;font-size:15px;width:100%}
        .input:focus{outline:none;border-color:#4ade80}
        select.input option{background:#131a14}
        textarea.input{resize:vertical}
        .card{background:#111620;border:1px solid #1e2a1e;border-radius:14px;padding:18px}
        .fade{color:#6b7563}
        .tag{display:inline-block;padding:3px 8px;border-radius:5px;font-size:11px;font-family:'DM Sans',sans-serif;font-weight:500;letter-spacing:0.5px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .anim{animation:fadeIn 0.3s ease forwards}
        .hole-btn{width:42px;height:42px;border-radius:8px;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;border:2px solid #1e2a1e;transition:all 0.12s;display:flex;align-items:center;justify-content:center}
        .hole-btn:active{transform:scale(0.93)}
        .nav-btn{padding:9px 10px;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;cursor:pointer;border:none;transition:all 0.18s;display:flex;align-items:center;gap:4px;white-space:nowrap;justify-content:center}
        .nav-btn.active{background:#1e3a1e;color:#4ade80}
        .nav-btn:not(.active){background:transparent;color:#6b7563}
        table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;font-size:14px}
        th{padding:9px 10px;text-align:left;color:#6b7563;font-size:11px;font-weight:500;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #1e2a1e}
        td{padding:9px 10px;border-bottom:1px solid #131a14}
        tr:last-child td{border-bottom:none}
        .pill-btn{padding:6px 13px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;border:1px solid #1e2a1e;transition:all 0.15s}
        .rec-best{color:#e8a838;font-weight:700}
        @media(max-width:600px){
          .card{padding:13px}
          th,td{padding:7px 7px;font-size:12px}
          .hole-btn{width:36px;height:36px;font-size:12px}
        }
      `}</style>

      {/* Header */}
      <div style={{borderBottom:"1px solid #1e2a1e",padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0d1218",position:"sticky",top:0,zIndex:50}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10}}><img src="data:image/jpeg;base64,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zxzzFXS1SCT4sx9T7j4ni48+ec29/R11jl5OKFmA9PskY8nq/Q+GESESEQZttW1aCUpS1S0RBq23V1q3VtpRJJnOc4xjGMZhCQFurbq60tKIkRV80CqAtat1da1boqJELda3rprfTWrRIRVurrVqyTOcc8c8c8Y54xFW2lDN9vT815r9L7vL5nn8vl585d679/VPF5cZXWs4zG3X03N7X0JEQhCIhFXTRaIUKq0q0hBdW26urdW20CZmc5znGcYxJCJCVdW3TdtqgJIF80CqAt1WtXV1dKDLJa1re973vWtBCC3Vt1bUTOcY58+eMc8Yzkq20CPf5PH48fS+54/F8zw9r5mLvp6/W8vl5MJve+eb19/pxx8OO/r6duGUIEhGSFq26UEoNC1RVkQt01dW6turVKSSZzM4zjOcZkEkRVumtNaWqKiJKXyAVVC6W3V1dWrRJJFtut73vpvWqsQCtXWtKRMzPPnzxzxjlnMiratQj0fI7efH1vr+H53zO+ePDKa7+zrrh5efK+nzefpfZ6O3o9PSfP8Ak+X0v0P3c/lcAhERIDSrbQShdSlqVakQat1dW6q6rRQkmczOcTGcTKCRBbpq6uqqlJEgryJVWqC2tXTWrqqEkiLda3ve971rSCAumtatomZnGMc8c+eMYzkaVaVI383t5p973+P5mtePlzxma9fbeePKc8758+k5/W9vXvefzvkcN/b+vc/DwEBkZQW2qtAlKtooKjI01dW3Vtt0qlSSTOZnOc5zMwRIhbbrV1bVlVESCvHFtLVKWtW26uloSTKVq73vet71q2CQaab1q2kZziY588Y54xjMhVtUEcc8L+h6+PzuHn58uTr6tus5cc8c71rr2cPoers4fL+Zw9vv+jN/GzCiDJCDS1aBYLVqwKRBbbbdW6aaWmgmWZnMznMmZkSEkXV1bq6Wi1ESJTxi1VVqlNNW26pSSSQurvet63rWtCIGrdaurqjOc5zjnjnjHPOMxKW0oRrz8H6Dfl5583n453269dc+mueMTjhv0d+x6+jy/I+fP0ffpwz8iACJCEVbVooBWggAFttrWrbbaWrUkkzMzEkkzEiEZW6urdW2xVIiQt8IttW1VLbdVbVVEkkLda3ret61dIgLq3WrrVomc5xjGOeMc8YyhVWlEN/O9H2Onmzz5Yzu67OWdb254nPD09+t6aueHyPB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" alt="logo" style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",objectPosition:"center top",border:"2px solid #4ade80",flexShrink:0}}/><div style={{fontSize:16,fontWeight:900,letterSpacing:0.5}}>Road 2 Jefke Peine</div></div>

          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {toast && <div style={{background:"#1e3a1e",color:"#4ade80",padding:"7px 13px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,border:"1px solid #2a4a2a"}}>{toast}</div>}
          <NotesButton data={data} save={save}/>
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",gap:2,padding:"7px 10px",borderBottom:"1px solid #1e2a1e",background:"#0d1218",overflowX:"auto",position:"sticky",top:52,zIndex:49}}>
        {tabs.map(t=>(
          <button key={t.id} className={`nav-btn ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)} style={{flex:"1 1 0"}}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{padding:"16px",maxWidth:960,margin:"0 auto"}} className="anim" key={tab}>
        {tab==="dashboard" && <Dashboard data={data} save={save} editDateItem={editDateItem} setEditDateItem={setEditDateItem}/>}
        {tab==="zerogame"  && <ZeroSumGame data={data} save={save}/>}
        {tab==="r2b"       && <R2BTab data={data} save={save}/>}

        {tab==="challenges"&& <ChallengesTab data={data} save={save} voteModal={voteModal} setVoteModal={setVoteModal} voteName={voteName} setVoteName={setVoteName}/>}
        {tab==="scores"    && <ScoresTab data={data} save={save}/>}
        {tab==="tornooien" && <TornooienTab data={data} save={save}/>}
        {tab==="records"   && <RecordsTab data={data} save={save}/>}
        {tab==="handicap"  && <HandicapTab data={data}/>}
      </div>
    </div>
    </>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({data,save,editDateItem,setEditDateItem}){
  const mStats=calcAllTimeTourney(data.masters,false);
  const uStats=calcAllTimeTourney(data.usOpen,true);
  const allTime=PLAYERS.map(p=>({player:p,pts:(mStats[p]?.pts||0)+(uStats[p]?.pts||0),mPts:mStats[p]?.pts||0,uPts:uStats[p]?.pts||0})).sort((a,b)=>b.pts-a.pts);
  const r2bSeasons=Object.keys(data.r2b).sort().reverse();
  const latestR2B=r2bSeasons[0];
  const r2bTotals=calcR2BTotal(data.r2b[latestR2B]);
  const r2bRanked=[...PLAYERS].sort((a,b)=>r2bTotals[b]-r2bTotals[a]);
  const zsStandings=calcZeroSum(data.zeroSum||[]);
  const threeMonthsAgo=new Date();threeMonthsAgo.setMonth(threeMonthsAgo.getMonth()-3);
  const [showAllFeed,setShowAllFeed]=useState(false);
  const [showExpanded,setShowExpanded]=useState(false);

  const me=["🥇","🥈","🥉","4️⃣"];

  const parseDate=(str)=>{
    if(!str)return null;
    const parts=str.split('/');
    if(parts.length!==3)return null;
    return new Date(+parts[2],+parts[1]-1,+parts[0]);
  };
  const typeColor={Masters:"#4ade80","US Open":"#60a5fa","Zero Sum":"#e8a838",Score:"#a78bfa",R2B:"#4ade80",Record:"#e8a838",Challenge:"#f472b6"};

  const allEvents=[
    ...data.masters.map(e=>({date:String(e.year),label:"The Masters",winner:e.results[0],type:"Masters",sortDate:new Date(e.year,11,31)})),
    ...(data.usOpen||[]).map(e=>({date:e.venue?`${e.year} · ${e.venue}`:String(e.year),label:"US Open",winner:e.results[0],type:"US Open",sortDate:new Date(e.year,11,31)})),
    ...(data.zeroSum||[]).filter(m=>parseDate(m.date)).map(m=>({date:m.date,label:`${m.p1} vs ${m.p2}${m.margin?" ("+m.margin+")":""}`,winner:m.winner,type:"Zero Sum",sortDate:parseDate(m.date)})),
    ...(data.scores||[]).filter(s=>parseDate(s.date)).map(s=>({date:s.date,label:`${s.player} — ${s.course} (${s.holes}H)`,score:s.score,player:s.player,type:"Score",sortDate:parseDate(s.date)})),
    ...(data.r2bLog||[]).filter(e=>parseDate(e.date)).map(e=>e.type==="b2b"
      ? {date:e.date,label:`B2B ${e.player} — back 2 back`,type:"R2B",player:e.player,isBb:true,sortDate:parseDate(e.date)}
      : {date:e.date,label:`R2B ${e.player} — birdie hole ${e.hole}`,type:"R2B",player:e.player,hole:e.hole,isBb:false,sortDate:parseDate(e.date)}),
    ...(data.challenges||[]).flatMap(c=>PLAYERS.filter(p=>c.done[p]).map(p=>({date:c.doneDates?.[p]||null,label:`Challenge: ${p} — ${c.title}`,type:"Challenge",player:p,challengeTitle:c.title,sortDate:c.doneDates?.[p]?parseDate(c.doneDates[p]):new Date(0)}))),
  ].sort((a,b)=>b.sortDate-a.sortDate);

  const recent=allEvents.filter(e=>e.sortDate>=threeMonthsAgo).slice(0,18);
  const feedItems=showAllFeed?allEvents:recent;
  const visibleItems=showExpanded||showAllFeed?feedItems:feedItems.slice(0,6);
  const hasMore=!showAllFeed&&feedItems.length>6;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Recente activiteit — full width at top */}
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:12,color:"#f472b6",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase"}}>🕐 {showAllFeed?"Alle Activiteit":"Recente Activiteit"}</div>
          <button onClick={()=>setShowAllFeed(v=>!v)} style={{background:showAllFeed?"#3a1a2e":"#131a14",border:`1px solid ${showAllFeed?"#f472b6":"#2a3a2a"}`,color:showAllFeed?"#f472b6":"#6b7563",padding:"5px 11px",borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer",letterSpacing:0.5}}>
            {showAllFeed?"← Laatste 3 maanden":"📜 Volledige geschiedenis"}
          </button>
        </div>
        {visibleItems.length===0
          ?<div style={{color:"#4b5563",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Geen activiteit in de laatste 3 maanden.</div>
          :<>
            <div style={{columns:showAllFeed?"1":"2 280px",columnGap:16,maxHeight:showAllFeed?500:undefined,overflowY:showAllFeed?"auto":undefined}}>
              {visibleItems.map((m,i)=>{
                const isR2B = m.type==="R2B";
                const isChallenge = m.type==="Challenge";
                const canEditDate = isR2B||isChallenge;
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #131a14",fontFamily:"'DM Sans',sans-serif",fontSize:13,breakInside:"avoid"}}>
                    <span className="tag" style={{background:`${typeColor[m.type]||"#888"}18`,color:typeColor[m.type]||"#888",flexShrink:0,fontSize:10,minWidth:60,textAlign:"center"}}>{m.type}</span>
                    <span style={{flex:1,color:"#8a9a88",fontSize:12,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.label}</span>
                    {m.date&&<span style={{color:"#4b5563",fontSize:11,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>{m.date}</span>}
                    {canEditDate&&(
                      <button onClick={()=>setEditDateItem({
                        label:m.label,
                        currentDate:m.date||"",
                        sourceType:isR2B?"r2b":"challenge",
                        player:m.player,
                        hole:m.hole,
                        isBb:m.isBb,
                        challengeTitle:m.challengeTitle,
                      })} style={{background:"none",border:"1px solid #2a3a2a",borderRadius:5,color:"#4b5563",cursor:"pointer",fontSize:10,padding:"2px 6px",flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>📅</button>
                    )}
                    {m.type==="Score"
                      ?<span style={{color:PC[m.player]||"#a78bfa",fontWeight:700,flexShrink:0}}>{m.score===0?"E":m.score>0?"+"+m.score:m.score}</span>
                      :(m.winner&&<span style={{color:PC[m.winner],fontWeight:600,flexShrink:0}}>🏆 {m.winner}</span>)}
                  </div>
                );
              })}
            </div>
            {hasMore&&(
              <button onClick={()=>setShowExpanded(v=>!v)} style={{marginTop:10,width:"100%",background:"#131a14",border:"1px solid #2a3a2a",borderRadius:7,color:"#6b7563",padding:"7px",fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer"}}>
                {showExpanded?`▲ Minder tonen`:`▼ Nog ${feedItems.length-6} meer tonen`}
              </button>
            )}
          </>
        }
      </div>

      {/* Two stats cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
        <div className="card">
          <div style={{fontSize:12,color:"#e8a838",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>⚔️ Zero Sum 2026</div>
          {zsStandings.every(r=>r.played===0)
            ? <div style={{color:"#4b5563",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Nog geen matches gespeeld.</div>
            : <table><thead><tr><th>Speler</th><th>Ptn</th><th>W/L</th></tr></thead>
              <tbody>{zsStandings.map((row,i)=>(
                <tr key={row.player}>
                  <td style={{fontWeight:700,color:PC[row.player]}}>{me[i]} {row.player}</td>
                  <td style={{fontWeight:700,fontSize:17,color:row.pts>0?"#4ade80":row.pts<0?"#f87171":"#6b7563"}}>{row.pts>0?"+":""}{row.pts}</td>
                  <td className="fade">{row.won}/{row.played}</td>
                </tr>
              ))}</tbody></table>
          }
        </div>

        <div className="card">
          <div style={{fontSize:12,color:"#60a5fa",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🐦 R2B {latestR2B}</div>
          <table><thead><tr><th>Speler</th><th>Ptn</th><th>Birdies</th><th>B2B</th></tr></thead>
          <tbody>{r2bRanked.map((p,i)=>(
            <tr key={p}>
              <td style={{fontWeight:700,color:PC[p]}}>{me[i]} {p}</td>
              <td style={{fontWeight:700,fontSize:17,color:"#4ade80"}}>{r2bTotals[p]}</td>
              <td className="fade">{data.r2b[latestR2B].holes[p]?.reduce((a,b)=>a+b,0)||0}</td>
              <td style={{color:"#e8a838"}}>{data.r2b[latestR2B].b2b?.[p]||0}</td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>

      {/* All-time tourney */}
      <div className="card">
        <div style={{fontSize:12,color:"#4ade80",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🏆 All-Time Tornooi Klassement</div>
        <table><thead><tr><th>Speler</th><th>Totaal</th><th>Masters</th><th>US Open</th></tr></thead>
        <tbody>{allTime.map((row,i)=>(
          <tr key={row.player}>
            <td style={{fontWeight:700,color:PC[row.player]}}>{me[i]} {row.player}</td>
            <td style={{fontWeight:700,fontSize:17,color:"#e8a838"}}>{row.pts}</td>
            <td className="fade">{row.mPts}</td><td className="fade">{row.uPts}</td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}

// ─── Zero Sum Game ────────────────────────────────────────────────────────────
function ZeroSumGame({data,save}){
  const [form,setForm]=useState({date:"",p1:"Rob",p2:"Thomas",winner:"",margin:"",type:"2p",roundId:"",course:"Millenium",customCourse:"",notes:""});
  const [expandedMatch,setExpandedMatch]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const standings=calcZeroSum(data.zeroSum||[]);

  const thirdPlayer=(p1,p2)=>PLAYERS.find(p=>p!==p1&&p!==p2&&p!=="Joris")||PLAYERS.find(p=>p!==p1&&p!==p2);
  const availablePlayers=form.type==="3p"
    ?[...new Set([form.p1,form.p2,thirdPlayer(form.p1,form.p2)].filter(Boolean))]
    :[form.p1,form.p2];

  const addMatch=()=>{
    if(!form.winner||!form.date)return;
    const courseVal=form.course==="custom"?(form.customCourse||"?"):form.course;save({...data,zeroSum:[...(data.zeroSum||[]),{...form,course:courseVal,id:Date.now()}]});
    setForm(f=>({...f,winner:"",margin:"",date:""}));
    setShowForm(false);
  };

  const removeMatch=(id)=>save({...data,zeroSum:(data.zeroSum||[]).filter(m=>m.id!==id)});

  const marginOptions=["1 up","2 up","3 up","4 up","5 up","6 up","7 up","8 up","9 up","10 up","11 up","12 up","13 up","14 up","15 up","16 up","17 up","18 up"];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {/* Standings */}
      <div className="card">
        <div style={{fontSize:12,color:"#e8a838",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Klassement 2025</div>
        {standings.every(r=>r.played===0)
          ?<div style={{color:"#4b5563",fontFamily:"'DM Sans',sans-serif",fontSize:13,padding:"8px 0"}}>Nog geen matches gespeeld. Voeg de eerste match toe!</div>
          :<table><thead><tr><th>#</th><th>Speler</th><th>Punten</th><th>Gespeeld</th><th>Gewonnen</th><th>Verloren</th></tr></thead>
            <tbody>{standings.map((row,i)=>(
              <tr key={row.player}>
                <td className="fade">{i+1}</td>
                <td style={{fontWeight:700,color:PC[row.player]}}>{row.player}</td>
                <td style={{fontWeight:700,fontSize:17,color:row.pts>0?"#4ade80":row.pts<0?"#f87171":"#6b7563"}}>{row.pts>0?"+":""}{row.pts}</td>
                <td className="fade">{row.played}</td>
                <td style={{color:"#4ade80"}}>{row.won}</td>
                <td style={{color:"#f87171"}}>{row.played-row.won}</td>
              </tr>
            ))}</tbody></table>
        }
      </div>

      {/* Add match button */}
      <button onClick={()=>setShowForm(v=>!v)} style={{background:"#4ade80",color:"#0a1a0a",padding:"11px",borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,border:"none",cursor:"pointer"}}>
        {showForm?"✕ Annuleer":"+ Nieuwe Match"}
      </button>

      {/* Add form */}
      {showForm&&(
        <div className="card" style={{borderColor:"#4ade80"}}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {/* Type */}
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>TYPE</label>
              <div style={{display:"flex",gap:8}}>
                {["2p","3p"].map(t=>(
                  <button key={t} onClick={()=>setForm(f=>({...f,type:t,winner:""}))} style={{flex:1,padding:"9px",borderRadius:7,border:`1px solid ${form.type===t?"#4ade80":"#1e2a1e"}`,background:form.type===t?"#1e3a1e":"#131a14",color:form.type===t?"#4ade80":"#6b7563",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>
                    {t==="2p"?"2 Spelers":"3 Spelers"}
                  </button>
                ))}
              </div>
            </div>
            {/* Date */}
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>DATUM</label>
              <DatePicker value={form.date} onChange={v=>setForm(f=>({...f,date:v}))}/>
            </div>
            {/* Players */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>SPELER 1</label>
                <select value={form.p1} onChange={e=>setForm(f=>({...f,p1:e.target.value,winner:""}))} className="input">
                  {PLAYERS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>SPELER 2</label>
                <select value={form.p2} onChange={e=>setForm(f=>({...f,p2:e.target.value,winner:""}))} className="input">
                  {PLAYERS.filter(p=>p!==form.p1).map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            {/* 3p round ID */}
            {form.type==="3p"&&(
              <div>
                <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>RONDE ID</label>
                <input type="text" placeholder="bv. R3-1" value={form.roundId} onChange={e=>setForm(f=>({...f,roundId:e.target.value}))} className="input"/>
                <div style={{fontSize:11,color:"#4b5563",marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>3de: <b style={{color:"#a0b898"}}>{thirdPlayer(form.p1,form.p2)}</b></div>
              </div>
            )}
            {/* Winner */}
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:6}}>WINNAAR</label>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {availablePlayers.map(p=>(
                  <button key={p} onClick={()=>setForm(f=>({...f,winner:p}))} style={{flex:"1 1 auto",padding:"10px 8px",borderRadius:8,border:`1px solid ${form.winner===p?PC[p]:"#1e2a1e"}`,background:form.winner===p?`${PC[p]}22`:"#131a14",color:form.winner===p?PC[p]:"#8a9a88",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:form.winner===p?700:400,cursor:"pointer",transition:"all 0.12s"}}>
                    {form.winner===p?"🏆 ":""}{p}
                  </button>
                ))}
              </div>
            </div>
            {/* Margin */}
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>MARGE VAN OVERWINNING</label>
              <select value={form.margin} onChange={e=>setForm(f=>({...f,margin:e.target.value}))} className="input">
                <option value="">— selecteer —</option>
                {marginOptions.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {/* Golfbaan */}
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>GOLFBAAN</label>
              <select value={form.course} onChange={e=>setForm(f=>({...f,course:e.target.value,customCourse:""}))} className="input" style={{marginBottom:form.course==="custom"?8:0}}>
                <option value="Millenium">Millenium</option>
                <option value="Ternesse">Ternesse</option>
                <option value="custom">Andere...</option>
              </select>
              {form.course==="custom"&&(
                <input className="input" value={form.customCourse} onChange={e=>setForm(f=>({...f,customCourse:e.target.value}))} placeholder="Naam golfbaan..." style={{marginTop:0}}/>
              )}
            </div>
            {/* Verslag */}
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>VERSLAG (optioneel)</label>
              <textarea className="input" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Kort verslagje van de match..." rows={2} style={{resize:"vertical"}}/>
            </div>
            {/* Save */}
            <button onClick={addMatch} disabled={!form.winner||!form.date} style={{background:"#4ade80",color:"#0a1a0a",padding:"12px",borderRadius:9,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",border:"none",opacity:(!form.winner||!form.date)?0.4:1}}>
              Match Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Match history */}
      {(data.zeroSum||[]).length>0&&(
        <div className="card">
          <div style={{fontSize:12,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Match Geschiedenis</div>
          <div style={{maxHeight:400,overflowY:"auto"}}>
            {[...(data.zeroSum||[])].reverse().map((m,i)=>(
              <div key={m.id||i} style={{borderBottom:"1px solid #131a14",padding:"6px 0"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
                  <span className="fade" style={{width:82,flexShrink:0,fontSize:12}}>{m.date}</span>
                  {m.type==="3p"&&<span className="tag" style={{background:"#1a2a3a",color:"#60a5fa",flexShrink:0}}>3P</span>}
                  <span style={{flex:1}}>
                    <span style={{color:PC[m.p1]}}>{m.p1}</span>
                    <span className="fade"> vs </span>
                    <span style={{color:PC[m.p2]}}>{m.p2}</span>
                  </span>
                  <span style={{color:PC[m.winner],fontWeight:600}}>🏆 {m.winner}</span>
                  {m.course&&<span className="tag" style={{background:"#1a1a2e",color:"#a78bfa",flexShrink:0,fontSize:11}}>{m.course}</span>}
                  {m.margin&&<span className="tag" style={{background:"#1e2a0e",color:"#a0c870",flexShrink:0}}>{m.margin}</span>}
                  {m.notes&&<button onClick={()=>setExpandedMatch(expandedMatch===m.id?null:m.id)} style={{background:"none",border:"1px solid #2a3a2a",borderRadius:5,color:expandedMatch===m.id?"#e8a838":"#6b7563",cursor:"pointer",fontSize:11,padding:"2px 7px",fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>📖 {expandedMatch===m.id?"▲":"▼"}</button>}
                  <button onClick={()=>removeMatch(m.id)} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:17,padding:"0 4px",lineHeight:1}}>×</button>
                </div>
                {m.notes&&expandedMatch===m.id&&(
                  <div style={{marginTop:6,fontSize:13,color:"#8a9a88",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,fontStyle:"italic",borderLeft:"2px solid #2a3a1e",paddingLeft:10}}>{m.notes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── R2B Tab ──────────────────────────────────────────────────────────────────
function R2BTab({data,save}){
  const seasons=Object.keys(data.r2b).sort().reverse();
  const [season,setSeason]=useState(seasons[0]);
  const [view,setView]=useState("current");
  const [showCloseModal,setShowCloseModal]=useState(false);
  const [newSeasonName,setNewSeasonName]=useState("");
  const sd=data.r2b[season];

  const closeAndStartNew = () => {
    if (!newSeasonName.trim()) return;
    const newSd = {
      holes: { Rob:Array(18).fill(0), Joost:Array(18).fill(0), Thomas:Array(18).fill(0), Joris:Array(18).fill(0) },
      b2b: { Rob:0, Joost:0, Thomas:0, Joris:0 },
    };
    save({ ...data, r2b: { [newSeasonName.trim()]: newSd, ...data.r2b } });
    setSeason(newSeasonName.trim());
    setNewSeasonName("");
    setShowCloseModal(false);
  };
  const totals=calcR2BTotal(sd);
  const ranked=[...PLAYERS].sort((a,b)=>totals[b]-totals[a]);
  const me=["🥇","🥈","🥉","4️⃣"];

  const toggleHole=(player,idx)=>{
    const nh=[...(sd.holes[player]||Array(18).fill(0))];
    const wasOn=nh[idx]===1;
    nh[idx]=wasOn?0:1;
    const today=new Date();
    const dd=String(today.getDate()).padStart(2,'0');
    const mm=String(today.getMonth()+1).padStart(2,'0');
    const yyyy=today.getFullYear();
    const dateStr=`${dd}/${mm}/${yyyy}`;
    const log=data.r2bLog||[];
    let newLog;
    if(wasOn){
      // Remove the entry for this player+hole
      newLog=log.filter(e=>!(e.player===player&&e.hole===idx+1&&e.season===season));
    } else {
      newLog=[...log,{player,hole:idx+1,season,date:dateStr,id:Date.now()}];
    }
    save({...data,r2b:{...data.r2b,[season]:{...sd,holes:{...sd.holes,[player]:nh}}},r2bLog:newLog});
  };
  const updateCounter=(field,player,val)=>{
    const v=Math.max(0,parseInt(val)||0);
    const prev=sd[field]?.[player]||0;
    let newLog=data.r2bLog||[];
    if(field==="b2b"&&v>prev){
      const today=new Date();
      const dd=String(today.getDate()).padStart(2,'0');
      const mm=String(today.getMonth()+1).padStart(2,'0');
      const yyyy=today.getFullYear();
      newLog=[...newLog,{player,type:"b2b",season,date:`${dd}/${mm}/${yyyy}`,id:Date.now()}];
    }
    save({...data,r2b:{...data.r2b,[season]:{...sd,[field]:{...sd[field],[player]:v}}},r2bLog:newLog});
  };

  return(
    <div>
      <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {seasons.map(s=>(
            <button key={s} onClick={()=>setSeason(s)} className="pill-btn" style={{background:season===s?"#1a2a3a":"transparent",color:season===s?"#60a5fa":"#6b7563",borderColor:season===s?"#60a5fa":"#1e2a1e"}}>{s}</button>
          ))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:4}}>
          {["current","history"].map(v=>(
            <button key={v} onClick={()=>setView(v)} className="pill-btn" style={{background:view===v?"#1e3a1e":"transparent",color:view===v?"#4ade80":"#6b7563",borderColor:view===v?"#4ade80":"#1e2a1e"}}>
              {v==="current"?"Huidig":"Geschiedenis"}
            </button>
          ))}
          <button onClick={()=>setShowCloseModal(true)} className="pill-btn" style={{background:"transparent",color:"#e8a838",borderColor:"#3a2a0e"}} title="Seizoen afsluiten en nieuw starten">
            🔒
          </button>
        </div>
      </div>

      {/* Close season modal */}
      {showCloseModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div className="card" style={{maxWidth:400,width:"100%",borderColor:"#e8a838"}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>🔒 Seizoen Afsluiten</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#8a9a88",marginBottom:16,lineHeight:1.5}}>
              Het huidige seizoen <b style={{color:"#e8e4d8"}}>{season}</b> wordt afgesloten en bewaard in de geschiedenis. Geef een naam voor het nieuwe seizoen.
            </div>
            <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",display:"block",marginBottom:5}}>NAAM NIEUW SEIZOEN</label>
            <input
              className="input"
              value={newSeasonName}
              onChange={e=>setNewSeasonName(e.target.value)}
              placeholder="bv. 2026-2027"
              style={{marginBottom:14}}
            />
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setShowCloseModal(false);setNewSeasonName("");}} style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid #2a3a2a",background:"#131a14",color:"#6b7563",fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                Annuleer
              </button>
              <button onClick={closeAndStartNew} disabled={!newSeasonName.trim()} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:newSeasonName.trim()?"#e8a838":"#3a2a0e",color:newSeasonName.trim()?"#0a0a00":"#6b7563",fontFamily:"'DM Sans',sans-serif",fontWeight:700,cursor:newSeasonName.trim()?"pointer":"default",transition:"all 0.15s"}}>
                Afsluiten & Starten
              </button>
            </div>
          </div>
        </div>
      )}

      {view==="history"?<R2BHistory data={data}/>:(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
            {ranked.map((p,i)=>(
              <div key={p} className="card" style={{textAlign:"center",padding:"11px 6px",borderColor:i===0?"#e8a838":"#1e2a1e"}}>
                <div style={{fontSize:10,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>{me[i]} {p}</div>
                <div style={{fontSize:26,fontWeight:900,color:PC[p]}}>{totals[p]}</div>
                <div style={{fontSize:10,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginTop:3}}>{sd.holes[p]?.reduce((a,b)=>a+b,0)||0} birdies & {sd.b2b?.[p]||0} back2back</div>
              </div>
            ))}
          </div>
          {PLAYERS.map(player=>{
            const holes=sd.holes[player]||Array(18).fill(0);
            return(
              <div key={player} className="card" style={{marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{fontWeight:700,fontSize:15,color:PC[player]}}>{player}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#6b7563"}}>{holes.reduce((a,b)=>a+b,0)}/18</div>
                </div>
                {[0,1].map(side=>(
                  <div key={side} style={{marginBottom:side===0?10:0}}>
                    <div style={{fontSize:10,color:"#4b5563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{side===0?"Front 9":"Back 9"}</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(9,1fr)",gap:4}}>
                      {Array.from({length:9},(_,i)=>i+side*9).map(i=>(
                        <button key={i} className="hole-btn" onClick={()=>toggleHole(player,i)}
                          style={{width:"100%",minWidth:0,background:holes[i]?`${PC[player]}22`:"#131a14",color:holes[i]?PC[player]:"#4b5563",borderColor:holes[i]?PC[player]:"#1e2a1e"}}>
                          {i+1}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{display:"flex",gap:9,marginTop:11,flexWrap:"wrap"}}>
                  <Counter label="Back 2 Back" value={sd.b2b?.[player]||0} onChange={v=>updateCounter("b2b",player,v)} color="#e8a838"/>
                  {season!=="2026"&&sd.bestImprRound&&<Counter label="Best Impr." value={sd.bestImprRound[player]||0} onChange={v=>updateCounter("bestImprRound",player,v)} color="#60a5fa"/>}
                  {season!=="2026"&&sd.foursomes&&<Counter label="Foursomes" value={sd.foursomes[player]||0} onChange={v=>updateCounter("foursomes",player,v)} color="#f472b6"/>}
                </div>
                {(()=>{const missing=holes.map((v,i)=>v?null:i+1).filter(Boolean);return missing.length>0&&(
                  <div style={{marginTop:8,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#4b5563"}}>
                    Nog niet gebirdied: {missing.map(n=><span key={n} style={{display:"inline-block",background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:"1px 5px",margin:"1px 2px",color:"#6b7563"}}>{n}</span>)}
                  </div>
                );})()}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function Counter({label,value,onChange,color}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:5,background:"#131a14",borderRadius:8,padding:"6px 9px",border:"1px solid #1e2a1e"}}>
      <span style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif"}}>{label}</span>
      <button onClick={()=>onChange(value-1)} style={{background:"none",border:"none",color:"#6b7563",cursor:"pointer",fontSize:18,lineHeight:1,padding:"0 2px",minWidth:28,minHeight:28,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:16,color,minWidth:20,textAlign:"center"}}>{value}</span>
      <button onClick={()=>onChange(value+1)} style={{background:"none",border:"none",color,cursor:"pointer",fontSize:18,lineHeight:1,padding:"0 2px",minWidth:28,minHeight:28,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
    </div>
  );
}

function R2BHistory({data}){
  const allSeasons=Object.keys(data.r2b).sort().reverse();
  const me=["🥇","🥈","🥉","4️⃣"];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div className="card">
        <div style={{fontSize:12,color:"#60a5fa",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Winnaars per Seizoen</div>
        <div style={{overflowX:"auto"}}>
          <table style={{minWidth:300}}><thead><tr><th>Seizoen</th>{PLAYERS.map(p=><th key={p} style={{color:PC[p]}}>{p}</th>)}<th>Winnaar</th></tr></thead>
          <tbody>{allSeasons.map(s=>{
            const tots=calcR2BTotal(data.r2b[s]);
            const winner=PLAYERS.reduce((a,b)=>tots[b]>tots[a]?b:a);
            return(
              <tr key={s}>
                <td style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>{s}</td>
                {PLAYERS.map(p=><td key={p} style={{fontFamily:"'DM Sans',sans-serif",color:p===winner?"#4ade80":"#8a9a88"}}>{tots[p]}</td>)}
                <td style={{fontWeight:700,color:PC[winner]}}>🏆 {winner}</td>
              </tr>
            );
          })}</tbody></table>
        </div>
      </div>
      {allSeasons.map(s=>{
        const tots=calcR2BTotal(data.r2b[s]);
        const sd=data.r2b[s];
        return(
          <div key={s} className="card">
            <div style={{fontWeight:700,marginBottom:10,color:"#a0b898",fontFamily:"'DM Sans',sans-serif"}}>{s}</div>
            <div style={{overflowX:"auto"}}>
              <table style={{minWidth:260}}><thead><tr><th>Hole</th>{PLAYERS.map(p=><th key={p} style={{color:PC[p]}}>{p}</th>)}</tr></thead>
              <tbody>
                {Array.from({length:18},(_,i)=>(
                  <tr key={i}><td style={{fontFamily:"'DM Sans',sans-serif",color:"#6b7563",fontSize:12}}>H{i+1}</td>
                    {PLAYERS.map(p=>(<td key={p} style={{textAlign:"center"}}>{sd.holes[p]?.[i]?<span style={{color:PC[p]}}>●</span>:<span style={{color:"#1e2a1e"}}>○</span>}</td>))}
                  </tr>
                ))}
                <tr style={{borderTop:"2px solid #1e2a1e"}}>
                  <td style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12}}>B2B</td>
                  {PLAYERS.map(p=><td key={p} style={{fontFamily:"'DM Sans',sans-serif",color:"#e8a838",textAlign:"center"}}>{sd.b2b?.[p]||0}</td>)}
                </tr>
                <tr>
                  <td style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13}}>Totaal</td>
                  {PLAYERS.map(p=><td key={p} style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,color:PC[p],fontSize:16,textAlign:"center"}}>{tots[p]}</td>)}
                </tr>
              </tbody></table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Single Tourney Tab ──────────────────────────────────────────────────────────────
function SingleTourneyTab({data,save,tourney}){
  const isMasters=tourney==="masters";
  const history=isMasters?data.masters:data.usOpen;
  const stats=calcAllTimeTourney(history,!isMasters);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({year:new Date().getFullYear(),venue:"",results:["","","",""],scores:{},notes:""});
  const [expandedYear,setExpandedYear]=useState(history[0]?.year||null);
  const [showVerslag,setShowVerslag]=useState({});
  const allTimeSorted=[...PLAYERS].sort((a,b)=>(stats[b]?.pts||0)-(stats[a]?.pts||0));
  const posColor=["#e8a838","#b0b8c8","#cd7f32","#6b7563"];
  const posLabel=["1ste","2de","3de","4de"];
  const me=["🥇","🥈","🥉","4️⃣"];

  const addEdition=()=>{
    if(!form.results[0])return;
    const newHistory=[...history,{...form,year:parseInt(form.year)}].sort((a,b)=>b.year-a.year);
    save({...data,[isMasters?"masters":"usOpen"]:newHistory});
    setShowAdd(false);
    setForm({year:new Date().getFullYear(),venue:"",results:["","","",""],scores:{},notes:""});
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div className="card">
        <div style={{fontSize:12,color:"#e8a838",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>All-Time Stand</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10}}>
          {allTimeSorted.map((p,i)=>(
            <div key={p} style={{textAlign:"center",background:"#131a14",borderRadius:10,padding:"10px 6px",border:`1px solid ${i===0?"#e8a838":"#1e2a1e"}`}}>
              <div style={{fontSize:10,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>{me[i]} {p}</div>
              <div style={{fontSize:22,fontWeight:900,color:PC[p]}}>{stats[p]?.pts||0}</div>
              <div style={{fontSize:10,color:"#4b5563",fontFamily:"'DM Sans',sans-serif",marginTop:3}}>🥇{stats[p]?.p1||0} 🥈{stats[p]?.p2||0} 🥉{stats[p]?.p3||0} 💀{stats[p]?.p4||0}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:9,fontSize:11,color:"#4b5563",fontFamily:"'DM Sans',sans-serif"}}>{isMasters?"Punten: 1ste=3 · 2de=2 · 3de=1 · 4de=0":"Punten: 1ste=1.5 · 2de=1 · 3de=0.5 · 4de=0"}</div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:18,fontWeight:900}}>{isMasters?"🏆 The Masters":"🌊 US Open"}</div>
        <button onClick={()=>setShowAdd(v=>!v)} style={{background:"#4ade80",color:"#0a1a0a",padding:"9px 16px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,border:"none",cursor:"pointer"}}>
          {showAdd?"✕ Annuleer":"+ Editie"}
        </button>
      </div>

      {showAdd&&(
        <div className="card" style={{borderColor:"#4ade80"}}>
          <div style={{display:"grid",gridTemplateColumns:isMasters?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",display:"block",marginBottom:4}}>JAAR</label>
              <input type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} className="input"/>
            </div>
            {!isMasters&&(<div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",display:"block",marginBottom:4}}>BAAN</label>
              <input type="text" placeholder="bv. Royal Zoute" value={form.venue} onChange={e=>setForm(f=>({...f,venue:e.target.value}))} className="input"/>
            </div>)}
          </div>
          <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",display:"block",marginBottom:6}}>EINDSTAND</label>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:12,color:posColor[i],fontFamily:"'DM Sans',sans-serif",width:36,flexShrink:0}}>{posLabel[i]}</span>
              <select value={form.results[i]||""} onChange={e=>{const r=[...form.results];r[i]=e.target.value;setForm(f=>({...f,results:r}))}} className="input">
                <option value="">—</option>{PLAYERS.map(p=><option key={p}>{p}</option>)}
              </select>
              <input type="number" placeholder="+score" style={{width:80,flexShrink:0}} value={form.scores[form.results[i]]||""} className="input"
                onChange={e=>{const p=form.results[i];if(p)setForm(f=>({...f,scores:{...f.scores,[p]:parseInt(e.target.value)||""}}))}}/>
            </div>
          ))}
          <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",display:"block",marginTop:10,marginBottom:4}}>SAMENVATTING</label>
          <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="input" rows={3}/>
          <button onClick={addEdition} style={{marginTop:12,background:"#4ade80",color:"#0a1a0a",width:"100%",padding:"11px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontWeight:700,border:"none",cursor:"pointer"}}>Opslaan</button>
        </div>
      )}

      {history.map(ed=>(
        <div key={ed.year} className="card" style={{cursor:"pointer"}} onClick={()=>setExpandedYear(expandedYear===ed.year?null:ed.year)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{fontSize:20,fontWeight:900,color:"#e8a838"}}>{ed.year}</div>
              {ed.venue&&<span style={{fontSize:12,color:"#6b7563",fontFamily:"'DM Sans',sans-serif"}}>{ed.venue}</span>}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {ed.results.filter(Boolean).map((p,i)=>(
                  <span key={i} style={{fontSize:13,fontFamily:"'DM Sans',sans-serif",color:posColor[i],fontWeight:i===0?700:400}}>{i===0?"🏆 ":""}{p}</span>
                ))}
              </div>
            </div>
            <span style={{color:"#4b5563",fontSize:16,flexShrink:0}}>{expandedYear===ed.year?"▲":"▼"}</span>
          </div>
          {expandedYear===ed.year&&(
            <div style={{marginTop:14,borderTop:"1px solid #1e2a1e",paddingTop:14}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                {ed.results.filter(Boolean).map((p,i)=>(
                  <div key={i} style={{textAlign:"center",minWidth:58}}>
                    <div style={{fontSize:10,color:posColor[i],fontFamily:"'DM Sans',sans-serif",letterSpacing:1,marginBottom:3}}>{posLabel[i]}</div>
                    <div style={{fontWeight:700,color:PC[p],fontSize:15}}>{p}</div>
                    {ed.scores?.[p]!=null&&<div style={{fontSize:17,color:"#a0b898",fontFamily:"'DM Sans',sans-serif",fontWeight:300}}>+{ed.scores[p]}</div>}
                  </div>
                ))}
              </div>
              <div>
                <button onClick={()=>setShowVerslag(v=>({...v,[ed.year]:!v[ed.year]}))} style={{background:"#131a14",border:"1px solid #1e2a1e",borderRadius:6,color:showVerslag[ed.year]?"#e8a838":"#6b7563",fontFamily:"'DM Sans',sans-serif",fontSize:12,padding:"5px 12px",cursor:"pointer",marginBottom:showVerslag[ed.year]?10:0,transition:"all 0.15s"}}>
                  📖 Verslag {showVerslag[ed.year]?"▲":"▼"}
                </button>
                {showVerslag[ed.year]&&(
                  <div>
                    <textarea value={ed.notes||""} onChange={e=>{const newH=history.map(h=>h.year===ed.year?{...h,notes:e.target.value}:h);save({...data,[isMasters?"masters":"usOpen"]:newH});}} className="input" rows={4} style={{marginTop:8}}/>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Records Tab ──────────────────────────────────────────────────────────────
function RecordsTab({data,save}){
  const rec=data.records||defaultData.records;
  const [editMode,setEditMode]=useState(false);
  const [localRec,setLocalRec]=useState(()=>JSON.parse(JSON.stringify(rec)));

  const saveRec=()=>{save({...data,records:localRec});setEditMode(false);};
  const cancelEdit=()=>{setLocalRec(JSON.parse(JSON.stringify(rec)));setEditMode(false);};

  const updateCourse=(idx,field,val)=>{
    const nc=[...localRec.courses];
    nc[idx]={...nc[idx],[field]:val};
    setLocalRec({...localRec,courses:nc});
  };
  const updateStat=(idx,field,val)=>{
    const ns=[...localRec.stats];
    ns[idx]={...ns[idx],[field]:val};
    setLocalRec({...localRec,stats:ns});
  };

  // highlight best (lowest number / bold red in original) per player-column in courses
  // We just display as-is with special coloring for negative values
  const valColor=(val)=>{
    if(!val||val==="")return "#8a9a88";
    if(val.startsWith("-"))return "#4ade80"; // negative = better score = green
    if(val==="E")return "#e8e4d8";
    return "#e8e4d8";
  };

  const boldRed=(val)=>val&&(val.startsWith("-")||val.endsWith("up"));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:18,fontWeight:900}}>📋 Records</div>
        {!editMode
          ?<button onClick={()=>setEditMode(true)} style={{background:"#131a14",border:"1px solid #2a3a2a",color:"#a0b898",padding:"8px 14px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>✏️ Bewerken</button>
          :<div style={{display:"flex",gap:8}}>
            <button onClick={cancelEdit} style={{background:"#131a14",border:"1px solid #2a3a2a",color:"#6b7563",padding:"8px 14px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>Annuleer</button>
            <button onClick={saveRec} style={{background:"#4ade80",color:"#0a1a0a",padding:"8px 14px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,border:"none",cursor:"pointer"}}>Opslaan</button>
          </div>
        }
      </div>

      {/* Course records */}
      <div className="card">
        <div style={{fontSize:12,color:"#4ade80",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Course Records</div>
        <div style={{overflowX:"auto"}}>
          <table style={{minWidth:340}}>
            <thead><tr>
              <th style={{minWidth:130}}>Baan</th>
              {PLAYERS.map(p=><th key={p} style={{color:PC[p],textAlign:"center"}}>{p}</th>)}
            </tr></thead>
            <tbody>
              {(editMode?localRec:rec).courses.map((row,i)=>{
                const isMain=!row.sub;
                return(
                  <tr key={i} style={{background:isMain?"#0f1820":"transparent"}}>
                    <td style={{fontFamily:"'DM Sans',sans-serif",fontWeight:isMain?600:400,fontSize:isMain?14:12,paddingLeft:isMain?10:22,color:isMain?"#e8e4d8":"#6b7563"}}>
                      {isMain?row.course:row.sub}
                    </td>
                    {PLAYERS.map(p=>(
                      <td key={p} style={{textAlign:"center"}}>
                        {editMode
                          ?<input value={localRec.courses[i][p]||""} onChange={e=>updateCourse(i,p,e.target.value)} style={{background:"#131a14",border:"1px solid #2a3a2a",borderRadius:4,color:"#e8e4d8",padding:"3px 5px",width:56,fontFamily:"'DM Sans',sans-serif",fontSize:12,textAlign:"center"}}/>
                          :<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:boldRed(row[p])?700:400,color:valColor(row[p])}}>{row[p]||""}</span>
                        }
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats records */}
      <div className="card">
        <div style={{fontSize:12,color:"#e8a838",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Statistieken Records</div>
        <div style={{overflowX:"auto"}}>
          <table style={{minWidth:300}}>
            <thead><tr>
              <th style={{minWidth:160}}></th>
              {PLAYERS.map(p=><th key={p} style={{color:PC[p],textAlign:"center"}}>{p}</th>)}
            </tr></thead>
            <tbody>
              {(editMode?localRec:rec).stats.map((row,i)=>{
                // find best value per row
                const vals=PLAYERS.map(p=>parseFloat(row[p])).filter(v=>!isNaN(v));
                const best=vals.length?Math.max(...vals):null;
                return(
                  <tr key={i}>
                    <td style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#e8e4d8"}}>{row.label}</td>
                    {PLAYERS.map(p=>{
                      const v=parseFloat(row[p]);
                      const isBest=!isNaN(v)&&v===best;
                      return(
                        <td key={p} style={{textAlign:"center"}}>
                          {editMode
                            ?<input value={localRec.stats[i][p]||""} onChange={e=>updateStat(i,p,e.target.value)} style={{background:"#131a14",border:"1px solid #2a3a2a",borderRadius:4,color:"#e8e4d8",padding:"3px 5px",width:50,fontFamily:"'DM Sans',sans-serif",fontSize:12,textAlign:"center"}}/>
                            :<span className={isBest?"rec-best":""} style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:isBest?PC[p]:"#8a9a88"}}>{row[p]||""}</span>
                          }
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:10,fontSize:11,color:"#4b5563",fontFamily:"'DM Sans',sans-serif"}}>Beste waarde per rij is gekleurd weergegeven.</div>
      </div>
    </div>
  );
}

// ─── Challenges Tab ───────────────────────────────────────────────────────────
function ChallengesTab({data,save,voteModal,setVoteModal,voteName,setVoteName}){
  const challenges = data.challenges||[];
  const [showForm,setShowForm] = useState(false);
  const [form,setForm] = useState({title:"",desc:"",addedBy:""});
  const [editId,setEditId] = useState(null);

  const addOrEdit = () => {
    if(!form.title.trim()) return;
    if(editId!==null){
      save({...data,challenges:challenges.map(c=>c.id===editId?{...c,title:form.title,desc:form.desc,addedBy:form.addedBy}:c)});
      setEditId(null);
    } else {
      save({...data,challenges:[...challenges,{id:Date.now(),title:form.title,desc:form.desc,addedBy:form.addedBy,done:{},upvotes:[],downvotes:[]}]});
    }
    setForm({title:"",desc:"",addedBy:""});
    setShowForm(false);
  };

  const toggleDone = (id,player) => {
    const today=new Date();
    const dd=String(today.getDate()).padStart(2,"0");
    const mm=String(today.getMonth()+1).padStart(2,"0");
    const yyyy=today.getFullYear();
    const dateStr=dd+"/"+mm+"/"+yyyy;
    save({...data,challenges:challenges.map(c=>{
      if(c.id!==id) return c;
      const isDone=c.done[player];
      const newDone={...c.done,[player]:!isDone};
      const newDates={...(c.doneDates||{})};
      if(isDone){ delete newDates[player]; } else { newDates[player]=dateStr; }
      return {...c,done:newDone,doneDates:newDates};
    })});
  };

  const removeChallenge = (id) => save({...data,challenges:challenges.filter(c=>c.id!==id)});
  const startEdit = (c) => { setForm({title:c.title,desc:c.desc,addedBy:c.addedBy||""}); setEditId(c.id); setShowForm(true); };

  const validChallenges = challenges.filter(c=>(c.downvotes||[]).length < 3);
  const totals = Object.fromEntries(PLAYERS.map(p=>[p,validChallenges.filter(c=>c.done[p]).length]));
  const ranked = [...PLAYERS].sort((a,b)=>totals[b]-totals[a]);
  const total = validChallenges.length;

  const tiedLabel = (arr, getVal) => {
    return arr.map(item=>{
      const val=getVal(item);
      const rank=arr.filter(x=>getVal(x)>val).length+1;
      const tied=arr.filter(x=>getVal(x)===val).length>1;
      const medals=["🥇","🥈","🥉","4️⃣"];
      return {item,rank,tied,label:tied?"T"+rank:(medals[rank-1]||rank)};
    });
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {total>0&&(
        <div className="card">
          <div style={{fontSize:12,color:"#f472b6",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🏆 Standings</div>
          <table><thead><tr><th>Speler</th><th>Voltooid</th><th>Voortgang</th></tr></thead>
          <tbody>{tiedLabel(ranked,p=>totals[p]).map(({item:p,label})=>{
            const pct=total>0?Math.round(totals[p]/total*100):0;
            const allDone=totals[p]===total&&total>0;
            return(
              <tr key={p}>
                <td style={{fontWeight:700,color:PC[p]}}>{label} {p} {allDone&&"🎉"}</td>
                <td style={{fontWeight:700,fontSize:17,color:PC[p]}}>{totals[p]}/{total}</td>
                <td style={{width:160}}>
                  <div style={{background:"#131a14",borderRadius:4,height:8,overflow:"hidden"}}>
                    <div style={{width:pct+"%",height:"100%",background:PC[p],borderRadius:4,transition:"width 0.3s"}}/>
                  </div>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#6b7563"}}>{pct}%</span>
                </td>
              </tr>
            );
          })}</tbody></table>
        </div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <button onClick={()=>{setShowForm(v=>!v);setEditId(null);setForm({title:"",desc:"",addedBy:""});}} style={{background:"#f472b6",color:"#0a0510",padding:"11px 18px",borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,border:"none",cursor:"pointer"}}>
          {showForm&&editId===null?"✕ Annuleer":"+ Nieuwe Challenge"}
        </button>
      </div>

      {showForm&&(
        <div className="card" style={{borderColor:"#f472b6"}}>
          <div style={{fontSize:12,color:"#f472b6",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>
            {editId!==null?"✏️ Challenge Bewerken":"➕ Challenge Toevoegen"}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>TITEL</label>
              <input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="bv. Hole out vanuit de bunker"/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>BESCHRIJVING</label>
              <textarea className="input" value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Leg de challenge uit..." rows={3} style={{resize:"vertical",minHeight:70}}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>TOEGEVOEGD DOOR</label>
              <select className="input" value={form.addedBy} onChange={e=>setForm(f=>({...f,addedBy:e.target.value}))}>
                <option value="">— kies speler —</option>
                {PLAYERS.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={addOrEdit} disabled={!form.title.trim()} style={{background:form.title.trim()?"#f472b6":"#3a1a2e",color:form.title.trim()?"#0a0510":"#6b7563",padding:"12px",borderRadius:9,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,cursor:form.title.trim()?"pointer":"default",border:"none"}}>
              {editId!==null?"Opslaan":"Challenge Toevoegen"}
            </button>
          </div>
        </div>
      )}

      {challenges.length===0&&(
        <div className="card" style={{textAlign:"center",color:"#4b5563",fontFamily:"'DM Sans',sans-serif",padding:32}}>Nog geen challenges. Voeg de eerste toe! 🎯</div>
      )}
      {challenges.map(c=>{
        const upvotes=c.upvotes||[];
        const downvotes=c.downvotes||[];
        const vetoed=downvotes.length>=3;
        const doneCount=PLAYERS.filter(p=>c.done[p]).length;
        const allDone=doneCount===PLAYERS.length&&!vetoed;
        return(
          <div key={c.id} className="card" style={{borderColor:vetoed?"#3a1a1a":allDone?"#e8a838":"#1e2a1e",opacity:vetoed?0.65:1}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:c.desc?4:0,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",textDecoration:vetoed?"line-through":"none",color:vetoed?"#4b5563":"inherit"}}>
                  {allDone&&<span style={{color:"#e8a838"}}>🏆</span>}
                  {vetoed&&<span style={{fontSize:11,color:"#f87171"}}>❌ Gevetood</span>}
                  {c.title}
                  {c.addedBy&&<span style={{fontSize:11,fontFamily:"'DM Sans',sans-serif",fontWeight:400,color:PC[c.addedBy]||"#6b7563",background:(PC[c.addedBy]||"#6b7563")+"18",padding:"2px 7px",borderRadius:4}}>door {c.addedBy}</span>}
                </div>
                {c.desc&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#8a9a88",lineHeight:1.5}}>{c.desc}</div>}
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>startEdit(c)} style={{background:"none",border:"1px solid #2a3a2a",borderRadius:6,color:"#6b7563",cursor:"pointer",padding:"4px 8px",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>✏️</button>
                <button onClick={()=>removeChallenge(c.id)} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:17,padding:"2px 6px",lineHeight:1}}>×</button>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
              <button onClick={()=>{setVoteModal({id:c.id,type:"up"});setVoteName("");}}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:7,border:"1px solid "+(upvotes.length?"#2a4a2a":"#2a3a2a"),background:upvotes.length?"#1e3a1e":"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:upvotes.length?"#4ade80":"#6b7563"}}>
                👍 {upvotes.length}
              </button>
              <button onClick={()=>{setVoteModal({id:c.id,type:"down"});setVoteName("");}}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:7,border:"1px solid "+(downvotes.length>=3?"#4a1a1a":downvotes.length?"#3a2a2a":"#2a3a2a"),background:downvotes.length>=3?"#2a1010":downvotes.length?"#1e1414":"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:downvotes.length>=3?"#f87171":downvotes.length?"#e87171":"#6b7563"}}>
                👎 {downvotes.length}{downvotes.length>=3?" (gevetood)":""}
              </button>
              {(upvotes.length>0||downvotes.length>0)&&(
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#4b5563",flex:1,minWidth:0}}>
                  {upvotes.length>0&&"👍 "+upvotes.join(", ")}
                  {upvotes.length>0&&downvotes.length>0&&" · "}
                  {downvotes.length>0&&"👎 "+downvotes.join(", ")}
                </span>
              )}
            </div>
            {!vetoed&&(
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {PLAYERS.map(p=>{
                  const done=c.done[p];
                  return(
                    <button key={p} onClick={()=>toggleDone(c.id,p)}
                      style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:8,border:"2px solid "+(done?PC[p]:"#2a3a2a"),background:done?PC[p]+"22":"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:done?700:400,color:done?PC[p]:"#6b7563",transition:"all 0.15s"}}>
                      <span style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+(done?PC[p]:"#4b5563"),background:done?PC[p]:"transparent",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#0a0e1a",flexShrink:0}}>{done?"✓":""}</span>
                      {p}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"'DM Sans',sans-serif",fontSize:11}}>
              <span style={{color:"#4b5563"}}>{vetoed?"Niet geldig (gevetood)":doneCount+"/"+PLAYERS.length+" voltooid"}</span>
              {c.addedBy&&<span style={{color:PC[c.addedBy]||"#6b7563"}}>🏌️ {c.addedBy}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Scores Tab ───────────────────────────────────────────────────────────────
const COURSES_LIST = ["Millenium","Ternesse","Haverleij","Gendersteyn","Royal Latem","Royal Zoute","Royal Ostend","Bossenstein","Postel","Rigenee","Andere"];

function ScoresTab({data,save}){
  const scores = data.scores||[];
  const [showForm,setShowForm] = useState(false);
  const [form,setForm] = useState({player:"Rob",course:"Millenium",score:"",holes:18,date:"",customCourse:""});
  const [viewPlayer,setViewPlayer] = useState("all");
  const [filterPlayer,setFilterPlayer] = useState("all");
  const [filterCourse,setFilterCourse] = useState("all");
  const [sortCol,setSortCol] = useState("date");
  const [sortDir,setSortDir] = useState("desc");
  const parseDate = str=>{ if(!str)return 0; const p=str.split('/'); return p.length===3?new Date(+p[2],+p[1]-1,+p[0]).getTime():0; };

  const addScore = () => {
    if(!form.score||!form.date) return;
    const courseVal = form.course==="Andere"?(form.customCourse||"?"):form.course;
    save({...data,scores:[...scores,{...form,course:courseVal,id:Date.now(),score:Number(form.score)}]});
    setForm(f=>({...f,score:"",date:"",customCourse:""}));
    setShowForm(false);
  };

  const removeScore = (id) => save({...data,scores:scores.filter(s=>s.id!==id)});

  // Year filter
  const allYears=[...new Set(scores.map(s=>s.date?.split('/')?.[2]).filter(Boolean))].sort().reverse();
  const [statsYear,setStatsYear] = useState("all");

  // Stats helpers
  const filteredScores = statsYear==="all" ? scores : scores.filter(s=>s.date?.endsWith(statsYear));
  const playerScores = (p) => filteredScores.filter(s=>s.player===p);
  const avg = (arr) => arr.length?Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*10)/10:null;
  const best = (arr) => arr.length?Math.min(...arr):null;

  // Per-player stats
  const statsFor = (p) => {
    const ps = playerScores(p);
    const sc18 = ps.filter(s=>s.holes===18).map(s=>s.score);
    const sc9  = ps.filter(s=>s.holes===9).map(s=>s.score);
    const courseGroups = {};
    ps.forEach(s=>{courseGroups[s.course]=(courseGroups[s.course]||[]).concat(s.score);});
    const bestCourse = Object.entries(courseGroups).sort((a,b)=>avg(a[1])-avg(b[1]))[0];
    return { total:ps.length, avg18:avg(sc18), best18:best(sc18), avg9:avg(sc9), best9:best(sc9), bestCourse:bestCourse?{name:bestCourse[0],avg:avg(bestCourse[1])}:null, rounds18:sc18.length, rounds9:sc9.length };
  };

  // Rankings
  const rankBestScore = [...PLAYERS].filter(p=>best(playerScores(p).filter(s=>s.holes===18).map(s=>s.score))!==null).sort((a,b)=>best(playerScores(a).filter(s=>s.holes===18).map(s=>s.score))-best(playerScores(b).filter(s=>s.holes===18).map(s=>s.score)));
  const rankAvgScore  = [...PLAYERS].filter(p=>avg(playerScores(p).filter(s=>s.holes===18).map(s=>s.score))!==null).sort((a,b)=>avg(playerScores(a).filter(s=>s.holes===18).map(s=>s.score))-avg(playerScores(b).filter(s=>s.holes===18).map(s=>s.score)));
  const rankMostRounds= [...PLAYERS].sort((a,b)=>playerScores(b).length-playerScores(a).length);

  // Best course per player combined
  const courseAvgs = {};
  scores.filter(s=>s.holes===18).forEach(s=>{
    if(!courseAvgs[s.course]) courseAvgs[s.course]={total:0,count:0};
    courseAvgs[s.course].total+=s.score; courseAvgs[s.course].count++;
  });
  const bestCourseRank = Object.entries(courseAvgs).map(([c,v])=>({course:c,avg:Math.round(v.total/v.count*10)/10})).sort((a,b)=>a.avg-b.avg);

  const me = ["🥇","🥈","🥉","4️⃣"];
  const playerSc = viewPlayer==="all"
    ? [...scores].sort((a,b)=>parseDate(b.date)-parseDate(a.date))
    : playerScores(viewPlayer).sort((a,b)=>parseDate(b.date)-parseDate(a.date));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Add form button */}
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <button onClick={()=>setShowForm(v=>!v)} style={{background:"#60a5fa",color:"#00040a",padding:"11px 18px",borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,border:"none",cursor:"pointer"}}>
          {showForm?"✕ Annuleer":"+ Score Toevoegen"}
        </button>
      </div>

      {showForm&&(
        <div className="card" style={{borderColor:"#60a5fa"}}>
          <div style={{fontSize:12,color:"#60a5fa",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>📊 Score Toevoegen</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>SPELER</label>
                <select value={form.player} onChange={e=>setForm(f=>({...f,player:e.target.value}))} className="input">
                  {PLAYERS.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>HOLES</label>
                <select value={form.holes} onChange={e=>setForm(f=>({...f,holes:Number(e.target.value)}))} className="input">
                  <option value={18}>18 holes</option>
                  <option value={9}>9 holes</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>GOLFBAAN</label>
              <select value={form.course} onChange={e=>setForm(f=>({...f,course:e.target.value,customCourse:""}))} className="input">
                {COURSES_LIST.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              {form.course==="Andere"&&<input className="input" value={form.customCourse} onChange={e=>setForm(f=>({...f,customCourse:e.target.value}))} placeholder="Naam baan..." style={{marginTop:8}}/>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>SCORE (t.o.v. par)</label>
                <select className="input" value={form.score} onChange={e=>setForm(f=>({...f,score:e.target.value}))}>
                  <option value="">— kies score —</option>
                  {[-4,-3,-2,-1,0,...Array.from({length:31},(_,i)=>i+1)].map(n=>(
                    <option key={n} value={n}>{n<0?n:n===0?"E (par)":"+"+n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,display:"block",marginBottom:5}}>DATUM</label>
                <DatePicker value={form.date} onChange={v=>setForm(f=>({...f,date:v}))}/>
              </div>
            </div>
            <button onClick={addScore} disabled={!form.score||!form.date} style={{background:(form.score&&form.date)?"#60a5fa":"#0a1a2e",color:(form.score&&form.date)?"#00040a":"#6b7563",padding:"12px",borderRadius:9,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,cursor:(form.score&&form.date)?"pointer":"default",border:"none"}}>
              Score Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Year filter for stats */}
      {scores.length>0&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#6b7563",letterSpacing:1}}>STATISTIEKEN:</span>
          {["all",...allYears].map(y=>(
            <button key={y} onClick={()=>setStatsYear(y)} className="pill-btn" style={{background:statsYear===y?"#ffffff22":"transparent",color:statsYear===y?"#e8e4d8":"#6b7563",borderColor:statsYear===y?"#6b7563":"#1e2a1e",fontWeight:statsYear===y?700:400}}>
              {y==="all"?"All time":y}
            </button>
          ))}
        </div>
      )}

      {/* Rankings */}
      {scores.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
          {rankBestScore.length>0&&(
            <div className="card">
              <div style={{fontSize:11,color:"#e8a838",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🏆 Beste Score (18H)</div>
              {rankBestScore.map((p,i)=><div key={p} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontFamily:"'DM Sans',sans-serif",fontSize:13,borderBottom:"1px solid #131a14"}}>
                <span style={{color:PC[p],fontWeight:600}}>{me[i]} {p}</span>
                <span style={{color:"#e8a838",fontWeight:700}}>{(v=>v===0?"E":v>0?"+"+v:v)(best(playerScores(p).filter(s=>s.holes===18).map(s=>s.score)))}</span>
              </div>)}
            </div>
          )}
          {rankAvgScore.length>0&&(
            <div className="card">
              <div style={{fontSize:11,color:"#4ade80",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>📈 Gemiddelde Score (18H)</div>
              {rankAvgScore.map((p,i)=><div key={p} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontFamily:"'DM Sans',sans-serif",fontSize:13,borderBottom:"1px solid #131a14"}}>
                <span style={{color:PC[p],fontWeight:600}}>{me[i]} {p}</span>
                <span style={{color:"#4ade80",fontWeight:700}}>{(v=>v===0?"E":v>0?"+"+v:v)(avg(playerScores(p).filter(s=>s.holes===18).map(s=>s.score)))}</span>
              </div>)}
            </div>
          )}
          <div className="card">
            <div style={{fontSize:11,color:"#60a5fa",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🔁 Meeste Rondjes</div>
            {rankMostRounds.map((p,i)=><div key={p} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontFamily:"'DM Sans',sans-serif",fontSize:13,borderBottom:"1px solid #131a14"}}>
              <span style={{color:PC[p],fontWeight:600}}>{me[i]} {p}</span>
              <span style={{color:"#60a5fa",fontWeight:700}}>{playerScores(p).length}</span>
            </div>)}
          </div>
          {bestCourseRank.length>0&&(
            <div className="card">
              <div style={{fontSize:11,color:"#f472b6",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>⛳ Beste Baan (laagste gem.)</div>
              {bestCourseRank.slice(0,4).map((c,i)=><div key={c.course} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontFamily:"'DM Sans',sans-serif",fontSize:13,borderBottom:"1px solid #131a14"}}>
                <span style={{color:"#e8e4d8"}}>{me[i]||""} {c.course}</span>
                <span style={{color:"#f472b6",fontWeight:700}}>{c.avg}</span>
              </div>)}
            </div>
          )}
        </div>
      )}

      {/* Per player stats + history */}
      {scores.length>0&&(
        <>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>setViewPlayer("all")} className="pill-btn" style={{background:viewPlayer==="all"?"#ffffff22":"transparent",color:viewPlayer==="all"?"#e8e4d8":"#6b7563",borderColor:viewPlayer==="all"?"#6b7563":"#1e2a1e",fontWeight:viewPlayer==="all"?700:400}}>
            Alle
          </button>
          {PLAYERS.map(p=>(
            <button key={p} onClick={()=>setViewPlayer(p)} className="pill-btn" style={{background:viewPlayer===p?`${PC[p]}22`:"transparent",color:viewPlayer===p?PC[p]:"#6b7563",borderColor:viewPlayer===p?PC[p]:"#1e2a1e",fontWeight:viewPlayer===p?700:400}}>
              {p}
            </button>
          ))}
        </div>

        {viewPlayer!=="all"&&(()=>{
          const st=statsFor(viewPlayer);
          // Per-course averages for this player
          const ps=playerScores(viewPlayer);
          const cg={};
          ps.filter(s=>s.holes===18).forEach(s=>{cg[s.course]=(cg[s.course]||[]).concat(s.score);});
          const courseAvgRows=Object.entries(cg).map(([c,vals])=>({course:c,avg:avg(vals),best:best(vals),rounds:vals.length})).sort((a,b)=>a.avg-b.avg);
          return(
          <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
            {[
              {label:"Totaal rondjes",val:st.total,color:"#60a5fa"},
              {label:"18H rondjes",val:st.rounds18,color:"#4ade80"},
              {label:"9H rondjes",val:st.rounds9,color:"#a78bfa"},
              {label:"Beste score 18H",val:st.best18!=null?(st.best18===0?"E":st.best18>0?"+"+st.best18:st.best18):"-",color:"#e8a838"},
              {label:"Gemiddelde 18H",val:st.avg18!=null?(st.avg18===0?"E":st.avg18>0?"+"+st.avg18:st.avg18):"-",color:"#4ade80"},
              {label:"Beste score 9H",val:st.best9??"-",color:"#f472b6"},
              {label:"Beste baan (gem.)",val:st.bestCourse?`${st.bestCourse.name} (${st.bestCourse.avg})`:"-",color:"#60a5fa",small:true},
            ].map(item=>(
              <div key={item.label} className="card" style={{padding:"12px 14px",textAlign:"center"}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#6b7563",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{item.label}</div>
                <div style={{fontSize:item.small?14:22,fontWeight:800,color:item.color}}>{item.val}</div>
              </div>
            ))}
          </div>
          {courseAvgRows.length>0&&(
            <div className="card">
              <div style={{fontSize:12,color:PC[viewPlayer],fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>⛳ Gemiddelde per baan — {viewPlayer} (18H)</div>
              <table><thead><tr><th>Baan</th><th>Gem.</th><th>Beste</th><th>Rondjes</th></tr></thead>
              <tbody>{courseAvgRows.map(r=>(
                <tr key={r.course}>
                  <td style={{fontFamily:"'DM Sans',sans-serif",color:"#e8e4d8"}}>{r.course}</td>
                  <td style={{fontWeight:700,color:PC[viewPlayer]}}>{r.avg===0?"E":r.avg>0?"+"+r.avg:r.avg}</td>
                  <td style={{color:"#e8a838",fontWeight:600}}>{r.best===0?"E":r.best>0?"+"+r.best:r.best}</td>
                  <td className="fade">{r.rounds}x</td>
                </tr>
              ))}</tbody></table>
            </div>
          )}
          </>
        );})()}

        {viewPlayer==="all"&&(()=>{
          // Build cross-player course averages (18H only)
          const totalRoundsOnCourse=(course)=>scores.filter(s=>s.holes===18&&s.course===course).length;
          const allCourses=[...new Set(scores.filter(s=>s.holes===18).map(s=>s.course))].filter(c=>totalRoundsOnCourse(c)>1).sort();
          if(allCourses.length===0) return null;
          const cellAvg=(course,player)=>{
            const vals=scores.filter(s=>s.holes===18&&s.course===course&&s.player===player).map(s=>s.score);
            return vals.length?avg(vals):null;
          };
          return(
            <div className="card">
              <div style={{fontSize:12,color:"#a78bfa",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>⛳ Gemiddelde per baan (18H)</div>
              <div style={{overflowX:"auto"}}>
                <table style={{minWidth:320}}>
                  <thead><tr>
                    <th>Baan</th>
                    {PLAYERS.map(p=><th key={p} style={{color:PC[p],textAlign:"center"}}>{p}</th>)}
                  </tr></thead>
                  <tbody>{allCourses.map(course=>(
                    <tr key={course}>
                      <td style={{fontFamily:"'DM Sans',sans-serif",color:"#e8e4d8",fontSize:13}}>{course}</td>
                      {PLAYERS.map(p=>{
                        const v=cellAvg(course,p);
                        return <td key={p} style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontWeight:v!==null?700:400,color:v!==null?PC[p]:"#2a3a2a",fontSize:13}}>{v!==null?(v===0?"E":v>0?"+"+v:v):"—"}</td>;
                      })}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          );
        })()}

        <div className="card">
          {viewPlayer==="all"&&(()=>{
            const allCourses=[...new Set(scores.map(s=>s.course))].sort();
            const toggleSort=(col)=>{ if(sortCol===col){setSortDir(d=>d==="asc"?"desc":"asc");}else{setSortCol(col);setSortDir("desc");} };
            const arrow=(col)=>sortCol===col?(sortDir==="desc"?"↓":"↑"):"↕";
            const filtered=scores
              .filter(s=>filterPlayer==="all"||s.player===filterPlayer)
              .filter(s=>filterCourse==="all"||s.course===filterCourse)
              .sort((a,b)=>{
                let av,bv;
                if(sortCol==="date"){av=parseDate(a.date);bv=parseDate(b.date);}
                else if(sortCol==="score"){av=a.score;bv=b.score;}
                else if(sortCol==="holes"){av=a.holes;bv=b.holes;}
                else if(sortCol==="player"){av=a.player;bv=b.player;}
                else if(sortCol==="course"){av=a.course;bv=b.course;}
                else{av=0;bv=0;}
                if(av<bv)return sortDir==="asc"?-1:1;
                if(av>bv)return sortDir==="asc"?1:-1;
                return 0;
              });
            return(
              <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                <div style={{fontSize:12,color:"#e8e4d8",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase"}}>
                  📋 Alle Rondes <span style={{fontSize:11,color:"#4b5563",letterSpacing:0,textTransform:"none"}}>({filtered.length})</span>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <select value={filterPlayer} onChange={e=>setFilterPlayer(e.target.value)} className="input" style={{width:"auto",fontSize:12,padding:"5px 8px"}}>
                    <option value="all">Alle spelers</option>
                    {PLAYERS.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)} className="input" style={{width:"auto",fontSize:12,padding:"5px 8px"}}>
                    <option value="all">Alle banen</option>
                    {allCourses.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {filtered.length===0
                ?<div style={{color:"#4b5563",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Geen rondes gevonden.</div>
                :<div style={{overflowX:"auto",maxHeight:480,overflowY:"auto"}}>
                  <table style={{minWidth:380}}>
                    <thead><tr>
                      {[["date","Datum"],["player","Speler"],["course","Baan"],["holes","H"],["score","Score"]].map(([col,lbl])=>(
                        <th key={col} onClick={()=>toggleSort(col)} style={{cursor:"pointer",userSelect:"none",color:sortCol===col?"#e8e4d8":"#6b7563",whiteSpace:"nowrap"}}>
                          {lbl} <span style={{fontSize:10,opacity:0.7}}>{arrow(col)}</span>
                        </th>
                      ))}
                      <th></th>
                    </tr></thead>
                    <tbody>{filtered.map((s,i)=>(
                      <tr key={s.id||i}>
                        <td className="fade" style={{fontSize:12,whiteSpace:"nowrap"}}>{s.date}</td>
                        <td style={{fontWeight:600,color:PC[s.player]||"#e8e4d8",fontFamily:"'DM Sans',sans-serif"}}>{s.player}</td>
                        <td style={{color:"#8a9a88",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>{s.course}</td>
                        <td><span className="tag" style={{background:"#0a1a2e",color:"#60a5fa"}}>{s.holes}H</span></td>
                        <td style={{fontWeight:700,color:PC[s.player]||"#e8e4d8",fontSize:15,textAlign:"right"}}>{s.score===0?"E":s.score>0?"+"+s.score:s.score}</td>
                        <td><button onClick={()=>removeScore(s.id)} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:17,padding:"0 4px",lineHeight:1}}>×</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              }
              </>
            );
          })()}
          {viewPlayer!=="all"&&(
            <>
            <div style={{fontSize:12,color:PC[viewPlayer],fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>
              📋 Rondes van {viewPlayer}
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#4b5563",marginLeft:8,letterSpacing:0,textTransform:"none"}}>({playerSc.length})</span>
            </div>
            {playerSc.length===0
              ?<div style={{color:"#4b5563",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Nog geen rondes ingevoerd.</div>
              :<div style={{maxHeight:420,overflowY:"auto"}}>
                {playerSc.map((s,i)=>(
                  <div key={s.id||i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #131a14",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
                    <span className="fade" style={{width:82,flexShrink:0,fontSize:12}}>{s.date}</span>
                    <span style={{flex:1,color:"#8a9a88",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.course}</span>
                    <span className="tag" style={{background:"#0a1a2e",color:"#60a5fa",flexShrink:0}}>{s.holes}H</span>
                    <span style={{fontWeight:700,color:PC[viewPlayer],fontSize:15,minWidth:30,textAlign:"right"}}>{s.score===0?"E":s.score>0?"+"+s.score:s.score}</span>
                    <button onClick={()=>removeScore(s.id)} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:17,padding:"0 4px",lineHeight:1}}>×</button>
                  </div>
                ))}
              </div>
            }
            </>
          )}
        </div>
        </>
      )}
      {scores.length===0&&(
        <div className="card" style={{textAlign:"center",color:"#4b5563",fontFamily:"'DM Sans',sans-serif",padding:32}}>
          Nog geen scores. Voeg je eerste ronde toe! ⛳
        </div>
      )}
    </div>
  );
}

// ─── Tornooien Tab (combined Masters + US Open + Ryder Cup) ───────────────────
const RYDER_DEFAULT = [
  {year:2023,team1:["Joris","Joost"],team2:["Rob","Thomas"],winner:"team1",notes:""},
  {year:2024,team1:["Rob","Thomas"],team2:["Joris","Joost"],winner:"team1",notes:""},
  {year:2025,team1:["Joost","Thomas"],team2:["Rob","Joris"],winner:"team1",notes:""},
];

function TornooienTab({data,save}){
  const [view,setView] = useState("overview"); // overview | masters | usopen | ryder
  const mastersStats = calcAllTimeTourney(data.masters||[],false);
  const usopenStats  = calcAllTimeTourney(data.usOpen||[],true);
  const allTimeSorted=[...PLAYERS].sort((a,b)=>{
    const apts=(mastersStats[a]?.pts||0)+(usopenStats[a]?.pts||0);
    const bpts=(mastersStats[b]?.pts||0)+(usopenStats[b]?.pts||0);
    return bpts-apts;
  });
  const me=["🥇","🥈","🥉","4️⃣"];
  const ryderData = data.ryderCup||RYDER_DEFAULT;
  const ryderWins = Object.fromEntries(PLAYERS.map(p=>[p,ryderData.filter(r=>{const wt=r.winner==="team1"?r.team1:r.team2;return wt.includes(p);}).length]));
  const ryderSorted=[...PLAYERS].sort((a,b)=>ryderWins[b]-ryderWins[a]);

  if(view!=="overview") return(
    <div>
      <button onClick={()=>setView("overview")} style={{background:"#131a14",border:"1px solid #2a3a2a",color:"#a0b898",padding:"8px 14px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",marginBottom:14}}>
        ← Terug naar overzicht
      </button>
      {view==="masters"&&<SingleTourneyTab data={data} save={save} tourney="masters"/>}
      {view==="usopen"&&<SingleTourneyTab data={data} save={save} tourney="usopen"/>}
      {view==="ryder"&&<RyderCupTab data={data} save={save}/>}
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Overall all-time */}
      <div className="card">
        <div style={{fontSize:12,color:"#e8a838",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🏆 All-Time Tornooi Klassement</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:10}}>
          {allTimeSorted.map((p,i)=>{
            const mS=mastersStats[p]||{};const uS=usopenStats[p]||{};
            const total=(mS.pts||0)+(uS.pts||0);
            return(
              <div key={p} style={{textAlign:"center",background:"#131a14",borderRadius:10,padding:"10px 6px",border:`1px solid ${i===0?"#e8a838":"#1e2a1e"}`}}>
                <div style={{fontSize:10,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>{me[i]} {p}</div>
                <div style={{fontSize:24,fontWeight:900,color:PC[p]}}>{total}</div>
                <div style={{fontSize:10,color:"#4b5563",fontFamily:"'DM Sans',sans-serif",marginTop:3}}>
                  M: 🥇{mS.p1||0} 🥈{mS.p2||0} 🥉{mS.p3||0} 💀{mS.p4||0}
                </div>
                <div style={{fontSize:10,color:"#4b5563",fontFamily:"'DM Sans',sans-serif"}}>
                  US: 🥇{uS.p1||0} 🥈{uS.p2||0} 🥉{uS.p3||0} 💀{uS.p4||0}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Medals breakdown */}
      <div className="card">
        <div style={{fontSize:12,color:"#a78bfa",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🏅 Medailles Overzicht (Masters + US Open)</div>
        <div style={{overflowX:"auto"}}>
          <table style={{minWidth:300}}><thead><tr>
            <th>Speler</th>
            <th style={{textAlign:"center"}}>🥇</th>
            <th style={{textAlign:"center"}}>🥈</th>
            <th style={{textAlign:"center"}}>🥉</th>
            <th style={{textAlign:"center"}}>💀</th>
          </tr></thead>
          <tbody>{allTimeSorted.map(p=>{
            const mS=mastersStats[p]||{};const uS=usopenStats[p]||{};
            return(
              <tr key={p}>
                <td style={{fontWeight:700,color:PC[p],fontFamily:"'DM Sans',sans-serif"}}>{p}</td>
                <td style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontWeight:700,color:"#e8a838"}}>{(mS.p1||0)+(uS.p1||0)}</td>
                <td style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",color:"#b0b8c8"}}>{(mS.p2||0)+(uS.p2||0)}</td>
                <td style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",color:"#cd7f32"}}>{(mS.p3||0)+(uS.p3||0)}</td>
                <td style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",color:"#4b5563"}}>{(mS.p4||0)+(uS.p4||0)}</td>
              </tr>
            );
          })}</tbody></table>
        </div>
      </div>

      {/* Navigate buttons */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
        {[
          {id:"masters",label:"🏆 The Masters",color:"#e8a838",wins:data.masters?.length||0},
          {id:"usopen",label:"🌊 US Open",color:"#60a5fa",wins:data.usOpen?.length||0},
          {id:"ryder",label:"⛳ Ryder Cup",color:"#4ade80",wins:ryderData.length},
        ].map(t=>(
          <button key={t.id} onClick={()=>setView(t.id)}
            style={{background:"#111620",border:`1px solid ${t.color}44`,borderRadius:12,padding:"16px 10px",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:4}}>{t.label.split(" ")[0]}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,color:t.color}}>{t.label.split(" ").slice(1).join(" ")}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#4b5563",marginTop:4}}>{t.wins} edities</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Ryder Cup Tab ────────────────────────────────────────────────────────────
function RyderCupTab({data,save}){
  const ryderData = data.ryderCup||RYDER_DEFAULT;
  const [showAdd,setShowAdd] = useState(false);
  const [form,setForm] = useState({year:new Date().getFullYear(),team1:["Rob","Thomas"],team2:["Joris","Joost"],winner:"team1",notes:""});

  const ryderWins = Object.fromEntries(PLAYERS.map(p=>[p,ryderData.filter(r=>{const wt=r.winner==="team1"?r.team1:r.team2;return wt.includes(p);}).length]));
  const me=["🥇","🥈","🥉","4️⃣"];
  const sorted=[...PLAYERS].sort((a,b)=>ryderWins[b]-ryderWins[a]);

  const addEdition=()=>{
    const newData=[...ryderData,{...form,year:parseInt(form.year)}].sort((a,b)=>b.year-a.year);
    save({...data,ryderCup:newData});
    setShowAdd(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div className="card">
        <div style={{fontSize:12,color:"#60a5fa",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>All-Time Ryder Cup Wins</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:10}}>
          {sorted.map((p,i)=>(
            <div key={p} style={{textAlign:"center",background:"#131a14",borderRadius:10,padding:"10px 6px",border:`1px solid ${i===0?"#60a5fa":"#1e2a1e"}`}}>
              <div style={{fontSize:10,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>{me[i]} {p}</div>
              <div style={{fontSize:22,fontWeight:900,color:PC[p]}}>{ryderWins[p]}</div>
              <div style={{fontSize:10,color:"#4b5563",fontFamily:"'DM Sans',sans-serif",marginTop:3}}>{ryderData.filter(r=>r.team1.includes(p)||r.team2.includes(p)).length} edities</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <button onClick={()=>setShowAdd(v=>!v)} style={{background:"#60a5fa",color:"#00040a",padding:"9px 16px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,border:"none",cursor:"pointer"}}>
          {showAdd?"✕ Annuleer":"+ Editie"}
        </button>
      </div>

      {showAdd&&(
        <div className="card" style={{borderColor:"#60a5fa"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10}}>
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",display:"block",marginBottom:4}}>JAAR</label>
              <input type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} className="input"/>
            </div>
            {["team1","team2"].map((team,ti)=>(
              <div key={team}>
                <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",display:"block",marginBottom:4}}>TEAM {ti+1}</label>
                <div style={{display:"flex",gap:8}}>
                  {[0,1].map(pi=>(
                    <select key={pi} value={form[team][pi]||""} onChange={e=>{const t=[...form[team]];t[pi]=e.target.value;setForm(f=>({...f,[team]:t}))}} className="input">
                      {PLAYERS.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <label style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",display:"block",marginBottom:4}}>WINNAAR</label>
              <select value={form.winner} onChange={e=>setForm(f=>({...f,winner:e.target.value}))} className="input">
                <option value="team1">Team 1 ({form.team1.join(" & ")})</option>
                <option value="team2">Team 2 ({form.team2.join(" & ")})</option>
              </select>
            </div>
            <button onClick={addEdition} style={{background:"#60a5fa",color:"#00040a",padding:"11px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontWeight:700,border:"none",cursor:"pointer"}}>Opslaan</button>
          </div>
        </div>
      )}

      {ryderData.map(ed=>{
        const winTeam=ed.winner==="team1"?ed.team1:ed.team2;
        const loseTeam=ed.winner==="team1"?ed.team2:ed.team1;
        return(
          <div key={ed.year} className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:20,fontWeight:900,color:"#60a5fa"}}>{ed.year}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14}}>
                <span style={{color:"#4ade80",fontWeight:700}}>🏆 {winTeam.join(" & ")}</span>
                <span style={{color:"#4b5563",margin:"0 8px"}}>vs</span>
                <span style={{color:"#4b5563"}}>{loseTeam.join(" & ")}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Notes/Feedback Button ────────────────────────────────────────────────────
function NotesButton({data,save}){
  const [open,setOpen] = useState(false);
  const notes = data.appNotes||[];
  const [input,setInput] = useState("");

  const addNote=()=>{
    if(!input.trim())return;
    save({...data,appNotes:[...notes,{id:Date.now(),text:input.trim(),status:"open"}]});
    setInput("");
  };
  const setStatus=(id,status)=>save({...data,appNotes:notes.map(n=>n.id===id?{...n,status}:n)});
  const remove=(id)=>save({...data,appNotes:notes.filter(n=>n.id!==id)});

  const statusColor={open:"#60a5fa",done:"#4ade80","wont-do":"#6b7563",cancel:"#f87171"};
  const statusLabel={open:"Open",done:"Done","wont-do":"Won't Do",cancel:"Cancel"};
  const openCount=notes.filter(n=>n.status==="open").length;

  return(
    <>
      <button onClick={()=>setOpen(true)} style={{position:"relative",background:"#131a14",border:"1px solid #2a3a2a",borderRadius:8,color:"#8a9a88",width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
        📝
        {openCount>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#60a5fa",color:"#00040a",borderRadius:"50%",width:16,height:16,fontSize:10,fontFamily:"'DM Sans',sans-serif",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{openCount}</span>}
      </button>
      {open&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:400,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",padding:"60px 16px 16px"}}>
          <div className="card" style={{width:"min(380px,100%)",maxHeight:"80vh",overflowY:"auto",borderColor:"#2a3a2a"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:15}}>📝 App Notities</div>
              <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"#6b7563",cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input className="input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNote()} placeholder="Nieuwe notitie..." style={{flex:1}}/>
              <button onClick={addNote} disabled={!input.trim()} style={{background:input.trim()?"#60a5fa":"#131a14",color:input.trim()?"#00040a":"#4b5563",border:"none",borderRadius:8,padding:"0 14px",fontFamily:"'DM Sans',sans-serif",fontWeight:700,cursor:input.trim()?"pointer":"default",flexShrink:0}}>+</button>
            </div>
            {notes.length===0&&<div style={{color:"#4b5563",fontFamily:"'DM Sans',sans-serif",fontSize:13,textAlign:"center",padding:16}}>Geen notities.</div>}
            {[...notes].reverse().map(n=>(
              <div key={n.id} style={{padding:"10px 0",borderBottom:"1px solid #131a14"}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:n.status==="open"?"#e8e4d8":"#4b5563",textDecoration:n.status==="done"?"line-through":"none",marginBottom:6,lineHeight:1.4}}>{n.text}</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {["done","wont-do","cancel"].map(s=>(
                    <button key={s} onClick={()=>setStatus(n.id,n.status===s?"open":s)}
                      style={{padding:"3px 9px",borderRadius:5,border:`1px solid ${n.status===s?statusColor[s]:"#2a3a2a"}`,background:n.status===s?`${statusColor[s]}22`:"transparent",color:n.status===s?statusColor[s]:"#4b5563",fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer"}}>
                      {statusLabel[s]}
                    </button>
                  ))}
                  <button onClick={()=>remove(n.id)} style={{marginLeft:"auto",background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:15,padding:"0 4px",lineHeight:1}}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Handicap Tab ─────────────────────────────────────────────────────────────
function HandicapTab({data}){
  const scores = data.scores||[];
  const parseDate = str=>{ if(!str)return 0; const p=str.split('/'); return p.length===3?new Date(+p[2],+p[1]-1,+p[0]).getTime():0; };

  const calcHandicap = (player) => {
    const rounds = scores
      .filter(s=>s.player===player && s.holes===18)
      .sort((a,b)=>parseDate(b.date)-parseDate(a.date))
      .slice(0,20);
    if(rounds.length<1) return null;
    const sorted = [...rounds].sort((a,b)=>a.score-b.score);
    const best8 = sorted.slice(0,Math.min(8,sorted.length));
    const avg = Math.round(best8.reduce((a,b)=>a+b.score,0)/best8.length*10)/10;
    return { handicap:avg, rounds:rounds.length, best8, usedRounds:best8.length };
  };

  const fmtScore = s => s===0?"E":s>0?"+"+s:s;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="card">
        <div style={{fontSize:12,color:"#e8a838",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🎯 Definitieve Handicap</div>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#6b7563",marginBottom:14,lineHeight:1.5}}>
          Gemiddelde van de beste 8 dagresultaten uit de laatste 20 rondjes van 18 holes per speler.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:6}}>
          {PLAYERS.map(p=>{
            const r=calcHandicap(p);
            return(
              <div key={p} style={{textAlign:"center",background:"#131a14",borderRadius:10,padding:"14px 8px",border:`1px solid ${PC[p]}33`}}>
                <div style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginBottom:4}}>{p}</div>
                <div style={{fontSize:28,fontWeight:900,color:r?PC[p]:"#2a3a2a"}}>{r?fmtScore(r.handicap):"—"}</div>
                {r&&<div style={{fontSize:10,color:"#4b5563",fontFamily:"'DM Sans',sans-serif",marginTop:4}}>{r.usedRounds} van {r.rounds} rondjes</div>}
              </div>
            );
          })}
        </div>
      </div>

      {PLAYERS.map(p=>{
        const r=calcHandicap(p);
        if(!r) return null;
        const last20 = scores.filter(s=>s.player===p&&s.holes===18).sort((a,b)=>parseDate(b.date)-parseDate(a.date)).slice(0,20);
        const best8ids = new Set(r.best8.map((_,i)=>i));
        const best8scores = new Set(r.best8.map(s=>s.score+s.date));
        return(
          <div key={p} className="card">
            <div style={{fontSize:12,color:PC[p],fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>
              {p} — laatste {last20.length} rondjes (18H)
            </div>
            <div style={{maxHeight:320,overflowY:"auto"}}>
              {last20.map((s,i)=>{
                const isBest=best8scores.has(s.score+s.date);
                return(
                  <div key={s.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #131a14",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
                    <span style={{width:24,height:24,borderRadius:"50%",background:isBest?"#e8a83822":"transparent",border:`1px solid ${isBest?"#e8a838":"#2a3a2a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:isBest?"#e8a838":"#4b5563",flexShrink:0}}>{isBest?"★":i+1}</span>
                    <span className="fade" style={{width:80,flexShrink:0,fontSize:12}}>{s.date}</span>
                    <span style={{flex:1,color:"#8a9a88",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.course}</span>
                    <span style={{fontWeight:700,color:isBest?PC[p]:"#6b7563",fontSize:15}}>{fmtScore(s.score)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
