import React, { useState, useCallback, useEffect, useRef } from "react";
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
  if(typeof document === "undefined") return null;
  return createPortal(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",boxSizing:"border-box"}}>
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
      { course:"Millenium", sub:null,  Rob:"+2",  Joost:"+1", Thomas:"+4", Joris:"+8" },
      { course:"Millenium", sub:"Front",Rob:"-1",  Joost:"E",  Thomas:"E",  Joris:"+2" },
      { course:"Millenium", sub:"Back", Rob:"-2",  Joost:"-1", Thomas:"-1", Joris:""   },
      { course:"Haverleij", sub:null,   Rob:"+6",  Joost:"+4", Thomas:"+8", Joris:"+8" },
      { course:"Haverleij", sub:"Front",Rob:"+3",  Joost:"+1", Thomas:"+4", Joris:""   },
      { course:"Haverleij", sub:"Back", Rob:"+3",  Joost:"",   Thomas:"+1", Joris:""   },
      { course:"Gendersteyn",sub:null, Rob:"+2",  Joost:"+9", Thomas:"",   Joris:"+9" },
      { course:"Gendersteyn",sub:"Geel",Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
      { course:"Gendersteyn",sub:"Rood",Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
      { course:"Ternesse",     sub:null,  Rob:"+9",  Joost:"",   Thomas:"",   Joris:""   },
      { course:"Ternesse",     sub:"Front",Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
      { course:"Ternesse",     sub:"Back", Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
      { course:"Rigenee",      sub:null,   Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
      { course:"Rigenee",      sub:"Front",Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
      { course:"Rigenee",      sub:"Back", Rob:"",   Joost:"",   Thomas:"",   Joris:""   },
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

function getTiedRank(items, getVal){
  const medals=["🥇","🥈","🥉","4️⃣"];
  return items.map(item=>{
    const val=getVal(item);
    const rank=items.filter(x=>getVal(x)>val).length;
    return {item, medal: medals[rank]||String(rank+1)};
  });
}

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
        // Migrate: remove old course names and add any missing new ones
        const OLD_NAMES=["Millenium 18","Haverleij 18","Ternesse 18","Rigenee 18","Gendersteyn G/R"];
        const VALID_NAMES=["Millenium","Rigenee","Ternesse","Haverleij","Gendersteyn"];
        let filteredCourses=(loaded.records?.courses||[]).filter(r=>!OLD_NAMES.includes(r.course));
        const existingKeys=new Set(filteredCourses.map(r=>r.course+"||"+(r.sub||"")));
        const missing=defaultData.records.courses.filter(r=>!existingKeys.has(r.course+"||"+(r.sub||"")));
        const changed=missing.length>0||(loaded.records?.courses||[]).some(r=>OLD_NAMES.includes(r.course));
        if(changed){
          loaded.records={...loaded.records,courses:[...filteredCourses,...missing]};
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

  // These hooks MUST be before any conditional return (Rules of Hooks)
  const [voteModal,setVoteModal] = useState(null);
  const [voteName,setVoteName] = useState("");
  const dataRef = useRef(data);
  useEffect(()=>{ dataRef.current=data; },[data]);

  if(loading) return (
    <div style={{minHeight:"100vh",background:"#0a0e1a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:32}}>⛳</div>
      <div style={{fontFamily:"'DM Sans',sans-serif",color:"#4ade80",fontSize:14,letterSpacing:2}}>LADEN...</div>
    </div>
  );

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
          <div style={{display:"flex",alignItems:"center",gap:10}}><img src="data:image/jpeg;base64,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zxzzFXS1SCT4sx9T7j4ni48+ec29/R11jl5OKFmA9PskY8nq/Q+GESESEQZttW1aCUpS1S0RBq23V1q3VtpRJJnOc4xjGMZhCQFurbq60tKIkRV80CqAtat1da1boqJELda3rprfTWrRIRVurrVqyTOcc8c8c8Y54xFW2lDN9vT815r9L7vL5nn8vl585d679/VPF5cZXWs4zG3X03N7X0JEQhCIhFXTRaIUKq0q0hBdW26urdW20CZmc5znGcYxJCJCVdW3TdtqgJIF80CqAt1WtXV1dKDLJa1re973vWtBCC3Vt1bUTOcY58+eMc8Yzkq20CPf5PH48fS+54/F8zw9r5mLvp6/W8vl5MJve+eb19/pxx8OO/r6duGUIEhGSFq26UEoNC1RVkQt01dW6turVKSSZzM4zjOcZkEkRVumtNaWqKiJKXyAVVC6W3V1dWrRJJFtut73vpvWqsQCtXWtKRMzPPnzxzxjlnMiratQj0fI7efH1vr+H53zO+ePDKa7+zrrh5efK+nzefpfZ6O3o9PSfP8Ak+X0v0P3c/lcAhERIDSrbQShdSlqVakQat1dW6q6rRQkmczOcTGcTKCRBbpq6uqqlJEgryJVWqC2tXTWrqqEkiLda3ve971rSCAumtatomZnGMc8c+eMYzkaVaVI383t5p973+P5mtePlzxma9fbeePKc8758+k5/W9vXvefzvkcN/b+vc/DwEBkZQW2qtAlKtooKjI01dW3Vtt0qlSSTOZnOc5zMwRIhbbrV1bVlVESCvHFtLVKWtW26uloSTKVq73vet71q2CQaab1q2kZziY588Y54xjMhVtUEcc8L+h6+PzuHn58uTr6tus5cc8c71rr2cPoers4fL+Zw9vv+jN/GzCiDJCDS1aBYLVqwKRBbbbdW6aaWmgmWZnMznMmZkSEkXV1bq6Wi1ESJTxi1VVqlNNW26pSSSQurvet63rWtCIGrdaurqjOc5zjnjnjHPOMxKW0oRrz8H6Dfl5583n453269dc+mueMTjhv0d+x6+jy/I+fP0ffpwz8iACJCEVbVooBWggAFttrWrbbaWrUkkzMzEkkzEiEZW6urdW2xVIiQt8IttW1VLbdVbVVEkkLda3ret61dIgLq3WrrVomc5xjGOeMc8YyhVWlEN/O9H2Onmzz5Yzu67OWdb254nPD09+t6aueHyPB9H2e5y8nzoKQhIQFtVSgKpUECVVttrV1VttLVJJmZmZMyZiEiElutNXVqlohJFPAtrVWraVWtUtVSJmQaut61vWt2oSlaurrWroJM5xjnjGOeMZxBSqqiOvy/qe2comNHk79/PXT0XmzmY36OvTWMc+Pzrvy+72a+R500BCQiCrVoUCiqhEsFtrVtaul1SltJmSZmcySSRCQSW3Wrq21QERFPn1q22rbbRV0tUoiZki263rWt6uqgVbdW6utapJmZxjGMc+eMZzCgtWiOvl7fQ5MQ28Pl+r14Z3vtnj09ETXTpNcccud+p5vhdfby+XChLCERFNLRRYFopIghbpdNVq26Kq2kSZkzJJJESIkC3WtNWqoQhBfn6Lbpbq6At0VVVEmZkW7ut61dXQFtrV1q6ttSZznGcc888c8ZyiqWqUR9Lj14YFeXx+j7PLhvffDx+L6ns1nn1ms88Zx290+Ny93yeKKAhCQKtWy0CUpSIRAum7a1bboppakSRiSSMoiRJA1brVttKBEA8Ni26XerQWtFFCSZmRbrW9autW1RaW3WtXVVMzMzjnnnjnjOIhSrVUh9LePLmaznn5vN6vZeOO/Xpvh87t9P06kzMSR09fP509XwZKCahCXKC1apQRRQIREVq61bbbbbRbQymUzEkkpJGYBtrVttFIRFRfBRbdXd1U0LaLFEZmZBbd61rWrbVGpat1datozM5zjOOeOeM5yCltqosev18fNnKZ5eXHXl6Lj2Y8fb3cvF9D29GmeGy59mPf5vg+JBQEIiFVpRRBVACJELq61qrdLbSlEiSSRIgMpJCy3VuraoCEA8UVbbrWyraqgBJmTMFuta1rdtoq2q1bq3VpGZnGcc8YxjEkBVaWoJ6fZx8+I5uPm6b0xy9l116X51+l0m7GbZn6Xfj8P50gUAysSFaVQUlCgBMgt1q3VrVW0oIiSISQCJJkLdW3VqwpCQWPFKXVu7o0tWgEsMzMySta1d61dUC3StW61baSSYxnGMYxjMzFC1poEmu3XhjKTj5+vW8/Nnp7fR21fH4/d6Ftjcy9Xs8n53mQUAiEC2lFEqUqoCJA1dW6tttWqUIkZQEgIkkg1bbppbFiwkQrwwurdattrSigRZJM5ZFt3rV1poFq3S6a1qrWWZnGM884xiTMC1VtVCTfp44yZ48PT3xx88vr9vqTj4de6TbGrc793T53zvLlKlAIQCrRZQCioRBA1dXVulW2qogkJAIIiSSStW6taUBAkivDkurdat1bVKoIImcySLbda1rVqoW22226uraSSYzjOMYmM5kFLVqkEd5zhnjy9XTnizXb19tZx5OHt1ilJy9V8HLhkSgAhBaUqUFALDIQW3Wrq2rVqlDJCBYhEJJlLbbpdUCwgiF8GVtt1dW3VKpQkEmZmQVu61dXVAtq6W3WrpUZznOc4xnExMoGvoevWcb7dd1y4/P8AD2vJWfM7cfPjXW77+n02+U6xmNufw/o9/PjMgAAlQUooUSihEIAurq6tulKstEQQlECIZmSXTVtrQCEGQ8MVdW26t0qi0RISZkkhbq61dXVsUtLautXTQkznOcZzjOczMDX3/V16XUjKl+F8vvw0PJXgzrp1xfN293vrp5fRmZmrfL8L6u8YIAFQCVKtFACipAkA01q6tuhoUpESwFgEJMyRa3atpZRJCQPCFuqurq20LQmSSTMjKtW61q60oWhqrq26tiZmZnOcTGJmSK9/1L6e1tzAXh+U9PDSa4Tzcfqen1uXq+Rn5P0fTvrz7cmF3fneX28UgFAsAgqigChRECEW261bpotUKSIKigIhmSRbbpVtASJCDwirWtXW1KFWJIkZkkitW6urq6KBWlurdVUmZMzOc5znOEhfp9PR6/V0cZIsOf5xiaXny+X5vofQ+ju+ny+b4nm+t29M64zzt3ePHlmEAoKlQRVKoACgkqIC3Wm2raVUqwiKKKCRJlJC222rRURIiDwCqu7rWrSiljMiRlmM1bbrV1q1QDS26tttSSZmc5mM5zJIr6c9f0fS3Imc2r5PgcZuOXPx/HwokX6/0fcsxk63z+bJBCgqiCC0UFQWVKIIAa1bq220oAkWUVSwSMpJCrbbVFEiSEPAFa1brWqLVCJIkkkki1dat1bpQiq1dXS2iJmZznOc5zJIs+vv6HXdtXSlufH4/ibOPLp8v5YB3+1v6ROUa3PFzEAFFAgCqFEKSiAQFXV1bpbSiFJLFBoBIkjJLbatoURIiE8MFt1d23S1QRJEiZZZFturdW2gUrV1dW2iSTOc5zM5yzIa+331n03pvOd63Rn5Hr+H59uHDV+JwoT0fd3y9+suWbrefBkIAoUBALSkpBQQRYKpbrTS22hAECi0oiSSRA1VtUUREhDwQq6utW26VaiJIiJMyQNNrq22gUttutW2kTOZnMmZnLMR2+3fI9vp6dNZxdXGXP4Pr8/k6uHDXTzfK560ej7Pq48vXvOOca0+fkhYLKUKQAWgCUAECFqtW6tq1RAJYFVS2JDMkhS22lLKREQj59KurdNatKoSJIjMkZSrWru1pYUGrbdatoyzmTMzmSZZR7vo5+fPb7O836OrGcc+fh+D7Od3eXHWt8vFz1r0+7rrHLtucsRvOvnEEBRQoQCqASgFQIWKtt1pbbSkgEBVpbBIkzJS1VpbFDJCD51VbrVtttLVgkZhJMxlCrdXWraALbdW6tpGZMyZmcySSH1vTw+dy9noa9ft9IsY8Xyfj++6xx3eHXpu7jfTnjWpzktw8CBALQoAlFAAlKKSAFrVurbaWWBCBLWlKJEkmSlVVpRAkIPny2261pbbS0GWUiMySSBV1rVttsAW6urqlhmSTOZmZSSL9q+Xw8e/bM+j6vT3utFnk/H/AEcnHTj59dtZvf1WZ1c4mmK+aQgKKLUAKCkAC0BBC2tW6ttVYQSEKW20VEkkkBS1pQsQkQTwLWrrVtugtBlJEkkkkgNW3WrbSAq6t1qgmZEzmSZkkXf2vN5PNs56+v27+vU6bsT8pUcZMcOda7ezsrRIxz6/ovy/hgQKFLQRUFLYICqUCRDStauqtqiJEIUW6VREkkklFGmqKIkREPn23VutLq0LQSMxJJJIyC6urq2gCy3VurSEykmZlnMSXv8AW8fk59HOdff6+/q65dN5x5vze9s45YmOeddevo6TW+gzOfLr7/t/iOCARSlLKSgFVIFi1VgJAq3WrbbVBEkgKttaAkkTMBS23QBJIiE8FttutaulRbQSMpJJGUhC261q2gILdattESIxJMzMSX2+7xeWbZ3evft7PX3cHLPl+J1vXE58cSN7303vp03bjnnGL4v1Po/EgQSiqoAmhYIBVqiBmw0turbdFBGUQKtulthJJJJAVbWlASRGSPDat1rVtUWlEiSJJJlISmmtW2qCJbdW6oiEM5kzJJE+l18nlu2u25L6vperdY4eT4V4+yM8MG3Xpertq7zy5sTh836v6v4/54gQUUqwFCgISqWgJEq2tW6tVQiJBCrbdWwiMySIKWraKlSMoRPGVq3WrVKsWpCSQmUykBbq6tqiWQt1boqCEzJmSRk+zx83Ca31311jOvd7e27F+N8LF9txymZevTrrpeiTPLPTm8PzPd+i+/8Ah/OhEKlVRYFKKEAUWwIRTV1bbVUMkSFDVttqJCTLKClaqlCREiQ8hWrbbbQqhESCYkiIKt1bbaIQt1baIqEmZMxJJ3+t4+PPE69dd9Yxr6HTp33Tn+Ox5/Z7M8OaN9fR0rqzy556WXh8x9L9Tr4HxrEAFoFCqAEBVAWQlW6ttpoCQiC1bdWhESSJIC1VoVIMpCPJbbbQtpaLEIiJnMEAurbbSwhbbdFJZUuWZMzKR7/Z4uXKXeta6sZ9H0O2unRjz/nPHy5/U7+fjJd9euuu9uPHUutT4f0vmer736Lp4PyXnQILRQoUKEAKUJZEpq2tWrQJCILat00CGYmUgLVLQIhJA8t1SgVVUVEIiZkgQLq22qAVV0oAiSSTMR9Hp4sY1vK667jXp9fqXHm8/i+Vz4vsY4Yyu+nXtveOW+nJrT53zfteD3/qPoTr+Z+AiBQWygpQAEVZQIhattt0UCIiC2rbpVSJJEZAKqlEQSQPNrRLAC20oQRJmQgRbbboFFFWqqoIkjMj6Pp9L5fkxnXVnOt3Wtd+3u7/ADfB3xn5vj58unvzyyzd9euzfW85104/m/03x/X9X9Pu9/P+Y+Jm0FFCiigAgUARKXVaq1QhCEVa0ulVIyiJIBRSgQSIOGgQsBbaKQkRmICC22tSqtihVpaIRJGen6v1Y83y/m8ZzvTrmVB39Xbl8zXo1eXyeGeet62pd73vp0vPPo2nwevv83r/AEn0512c/F8T4NsFoBaKJUKQAQsqLbbatoREqEWrVttVIkiQyVBQ0IISpDjaIIlKtKEIiSARC220rQUpZaoBCSer9JU8Hy/FmZm+u5lk6et2+f31ma15PjsxC26326dOnQut6nx/nfr/AM59P6f6Hbuuo8v5/wCJwuqUI0oWFQKgQABbpa0UiBCC21V1aiSQSJFJYWWgEQQ5aVEhJSqtikRJUgIihq2lVZSlUUKQl+37vBv6/wAr5/g82U3nr1zM5a9Xq63hnOMXd+f81ImbrTW+3o73Lpdanyfj/vvxP3PT9/6fw/gfpvq70Jjh8D4SoKUUAAIIBZRatqgBAgaaVbVJJCESiECgWEEMVYkhCWlqhlAJFiAVbaU0KFUpQGfd9pwx9nP43v5eGOett9WcN+7tvfPlmc851rXzPARhve8zt6vVrGOvRp8n5P8AQf5x+l7/AEvvdvxH53+qb3qkXHwvh+SgpQoCAQgKKVaWgAQQW20tokgRAIlhYWFQCIIkIhRaUkhKQIEKq1VqlpLQopYfZ+hreHux+R8+eBi610mW/R6ejhrUxjnma1fnfPFjrvGOnr9u+M300fJ9/v8AwH6f2+j73tfguv7Dr00C1n5f5XiKWwKEJYCCgotKqgIIQq1aNEQgIEEAigAikmSXIUUojIWIEqBaWqtUqgKFE/Qe/Wuee3flx/GOU2jW7XTr0vP8z9H7rOOfPLW9fM+bqrrXbPHfo9vbljfa74ef9x+O/I/R/Q7+x9PWPxfx/tfb+z1gLXy/xtKKBRECAKAtClUEQJYpVtFhAiUIgEAsKBNRGSJJVqgIgEgBC0rRVUqhZQUfV/QcjF9TGPk/leu6kVb06bnxPl/o/s5zjHPObd9Pn/I6a0u98nf2dcze72fqvH+b/O/N/a36P1+q/kPyGvR+k/V+iCq/Pfm7QCgCCJRYsUotiqBBAClLbCIsJQhCLAABSkkSSFWqioghBKAilVapSrQFA6/r9TMzvW3n1+S8nZJzwVvfTPD9HrHmmcc8ZlvTv4Pi9Ouy88d/V2rXXp7fvc/P8b5/439X7/X9jvpx/BfNxn2/vfpopX4vwKAAAIAUAUqgECAKoWoQCKgiCwSgBU2iSTILaAQEkCggpS1RaqgChP1Hvx593XbDv5ePT8hplz5M3Tf0fo60nDhJzxzwt6+zw/A7dt65+bPf1dtb16ftfQy8/wAzxfivV+o7/X9WzWOWsfL+n6rKL5vwwsAKSwABSBRRQEBKgVQAIAIQAQoAOiSSZhS2iFIRCBSAoWilW0AqVH0P0/H4v4TP2/3+sTrfHm/msYJnjnfT3/V3Kk82M4xzzmNd/fx8fh5ds+Ph29fp7ez6X1Grnj4/jfkvD+w+h9P29SuU6dMtAX8/+eLAFgsWWQUAAUoAgSgKJQCEsqCCUgFSgOkkmUlpaBLRJAyUCKULQq2rAVYi/q5+T+P+69fm+ryzjPr4+XT85yud5znXs+t3zETPDOOfPOMLr0e/fT0azzx07daXpUx4fh/nvi+39l9P3daXONb1loDH4TKikAKgJYKCVKFIAIoCgAIgWCCAJQFDrJmRAWrYASBlFsAKFKVVqwKBf0vzPyX2f0/aejfFy5X18PL06/nMclz9b6Ll23MsnPlnHPlnGTp6veu91penTerTn8bxfC/P8/q/vPf10Vzu1jQH5L5lVQiCgICKARRYpAIoKAEBAWICAQUAO8mZlCW20lBEQRFIKpBVFpaohVi/V9HzP0xnpucGOWb6uHl39H5vxud9P6nnw82PVvEy1OGc45c+eJL19fv3veitdLq6Z8Hi8vxvgeKfe/om9VWLqVaB8j8vS0hAWACCiAFAQCUAUikCACCASwUAO8TOWQulKSkREAIUApSGltACx+p77kze+MYxOKc/fy8F+l7OPP1b8vPy8e3qmc51rlzmccufLnGu3r93Xe7S71qsefh5vJ8rn8D539G+5u2iag1QY/EYFqWECAJQAIhaAQlApKAIRYsCIIAFJQOxnMkLVWlgEZFgSKoAqwVooCj1/qKmXfnjlnExz3jn9Dp4fJ09vo25ufDn7s2Yu+WJnOOfLjnLXb1e3fp6VbqmccvF5fL8/P2/i/e93a3QWIbUZ/P/ABFqywgIgCkAIlLFAQAUWAgIAggEWBYKDtJmJKtKqgJECLCFWKKgVS1YKF/Q/QxLrrrhOOOeOmOfXPm9vt1m9Hl2Y8Xq3z7c518+sM5xy48s5u+vXx/H/T/e2ZXTPHy+TxeDy/puvR37y2LYZXVVjh+Mq0EAiICkLKiIKoFiChYAQEAIQRUAAspPRmZSFqlVQgiIBBSgUiiqUBX6Z5y/Q9PLlOOMTh6mdPNPV22uN2a8k9nk7b59PNbJnOOXHnmTl8z8vp6v6X75d63Zy8/HyfO8v2vo3zvobMTppEk1bbzv5bwKoICSIBUAIhQoUiKAWAgQAhEACCgDvJJBaVS0JAkIKhRSwlKlUqgj6n0Pnum+/wBfHHGOeEz5PX2u9Zw6ZdFnTn5Pdw4e3Lj5/VlnOccuXD4/D1+n8j9WfH+//TM8+XNWOXPj5OPp93bbr3nzunp9BCZz01XN8781RRFhCRmhULAiWKKUgAUgIJYAQSAAIpKDuzEFUo0CJUkAAoFiUopSgZ/S8Z6K+lOfLGMY5r18U922cdO+scPRl2vk69Pnej1c8/O9fXMznn4Pn+Lz8PV9H4vz/f4vJ+1/e5xz5c+fDlnHBv0e16M3fh5+31aSE5dmmD8ZktIQIiQoAQQAFqLCxYUgQiwQBIAJYCiK9EkQVVSqsAZyFAAogKUVZQZ/Wce6evXLlic888rz7PLv09O/yvX62OW3Tpz5+nw8PfufL5+rw3y4/P8A1fRxnm83fv8Ak8nT+sfWZ5cuPm488ct8/T9Dvp4vZ5vP6fb0JDnnuZX8x4FCogiJAoQBmkoooCWLABIAgsEgAlgApPVJmFqgqhAkiKVAFAhQWqAT9Zdzvrny54zywjpma6dN74+Xz/W3jz9a7a4d+Xze/vfP8Pt4Y4Xj8X9HnzvnZnw/CX9T/Q9pz4+bhz58uk6+zvrfPtPDPX6SQxz7aZT814FCkiIQAAESKFUAEABAgAISAlIBZSK9CSFtAUAkSBQQKBAoLSgP17XZz588ZxzwSzM1vvvy9fn+z3583bLr35XfzeH0fT5vkdPqY4+fv+ffb4+fHzOvyPhren9e77Zx5+HLljtt27tdLrhw6evcZMctejOZn4/xxQRESAAAEgUoABFgIEAJUERAAFAPTJEtUgtAMkJQBBQQoKUsUev9JvtOfPHOY5SWQzrp16cOXL0+L6m/H3znp6dc+vj8Hf6N+R5vo+vn5LPge/6Xm4ePlw/JRp++/VxM8OfLljet9uue/S3HCejvJhccXpcOmfF+boLBEgQAUgQCgABAsCCAAgkAEUAD1ZQVYhVASCAVCAoIKUUUN/qfR0zjnzzjGJmVma1vWmGN+Xr7vD0uL6fVzvP5uPoevwfO6fU35uHf5vzvsd/HPl9PxnH0+z5/v/rfPGOfLPPlLrfbrr00zy5dfTc5jPGd98Nzn+RpbCxEglQAFQBFpKCACCAQAXIhAsAqUVPTBCiBRSSEFlIEKBChVBQ+z93XPOeWcc8zMSl26dcfL9/bz9vD9Dp4+nHPf2dcTweT0fS5/N4e3348bp8S/ax5Ofi/LfP+37OP5/8AqX2+fHjy5553Hrx236elqc+L1bYyzwx6OnDrm/jVAERACVFABAoFIgiwIAAEIQLACpSrn0EAgKFGYQUQIFAgooUK+79rnMYxjnnMuTQ6Xp5J3+X9ffLPP6PDljjv1+xnyeGfR9Hg8W/pduHm6eX5f0fo+bn5fy/wvZ9vP5r739Rzx8/LlxW+nG/R33VzOWO3Y5s+fn368tzf4/mpKhCAlSgVBYIFS0QQgEABQQiEUCxKLVTuhFRJQpRMosLAIFBFigpQ19T9BjMxznPExKW6XW+2PyX6Pz8vtfO9/i9ffwzzvR7u+OHg4ej6fH5/L0+/Xl46+TPsdfJn89+SkNf1L67hx4cHLr23279dLY58t9rZjPn49/Rx3nf5Tz0RLLCAlAoBYhZFACEACAKLAiICgQWqO8QWJAoBIgAILKAhQKor6n6HnmYzjGc5xKt3Wtde18v5X9T8b6Dr2x7PLy48unt9rl4vHr6Xf5/k37fVPJy8vj9f1+HP5f4LEi/o/wBv6XPhwy7a36OnSrqM8r1z1Tn5vP39nCzX5nxglRASgoKgVCCULAQRUBKChAIgFIBbQ7QipElUAiCACAUAAFKfS/ScsJjHOYyznTW+uGunXofG8X0PJ9b4328+l4ufB6fodseTw8/X9LzeDHo9nbn5eHhfT9fm4fzvxyHo/oPp7bxwmt79G+nUaXPJ0l6MeTy9/dxh+f8ABAgQBQFAAQgUEIIsWKixQAESAoihaD0SIRIiqSiIEAEAFSgChfT+r55jGOeczKLpdTeuuuHq1n8l+h+R9b4/r9nq9Hj83Ln193tefw+bp9Pp4PNv1erXHy+Pz9vs4x+E+FmQ/e+p21Omr6erp1Rsc871jrZ5PF19+MHxPmxCAiqARQACAWUIiBKAAKEIJBQKC0l7yEhAQWUQhACAVFhQKlGv1usROeMZyQqXe9b7b8efa+F6PH6eXj9X0/fw8fHlfV9Dty8Xiz7/AKHl8Oe3q9E4eLxT6Pv4/A/CMQ/V/f4Tfp6716956dZLoZxrfPe3l+d1+jnlXx/koIBVKEiUAAkUqUCIQAAFASWJKFAC0ruzJBCogKJAEAAAAAp9z6vOGOeMRFEXrvfTqnzvT6PleLvz9Px31PtvD5+We3u9ryeDh6PqXwcb6PT25+TwcN/Z15v5djEPqfvvLw36um77e0u4VZcN5nS+b5fX6WMHy/jwkClKLBIigBAUUCSBAWFSikEEgCgC2q6pJAgqQUEQEAAEUCyhen6zlmpjljJZas1ret9ekef531PlfN+n4/pfnnu+96fJ5OONev39uPg8j6Pt8nmx09Ho1y8Hh5+36uf518iLy3/UePm6deqe72CS2XOdTVx0vm+Xv6fzvaeD4aREpVUAiQAAgstFQRkJYClBZBCCWkBUWra6yMkQqxJSwQCEAARYoKqPtfTwszz54zZqm13dXp13lj4v0Pl+L6/zvr/B5ej6/wBfh4vPzdvoeueP5/L2fTx5OV6d/Q8vzvJfsen8p+N3+z934f5v9E9vm9GO/Ke36G0kVylxeu8beb5e/d5vUz5vgEQitKFhEkClJCCrS2QhEkogUqkIQCLYACrqtokEKEgtkQIIoIAALKqP1mZWeeOeYta1bbvWunZmT4+fDj63zfreD5nT3/fePz8ZfZ9Dr5/n+Tf1fT5OBfR6M+H53D0/a838u936r1fmPzn7D9Bw9GevF3+h6NSZjl37cuvm594ef5e/RrtzvL86EIq0qAkiVVJUmULpVoiQkQCUoogsrIgVACtWukhEAEigiBAAgCKApXt/QcqmOOMRVXdtvTW+vTNzn5Pztc/peD6b4U7ff9/k83ny9Hu9U8Hg5+/6nDyxL6PTz+b8/P1fo/zX5/67f4zy/Z/YcvT6Jzm/b7OiTPLw/R9Pj9n5H7/bcnD5XbXpsPzSAhVUBIkVVBmZitVVWBlEQQVRQEqIIAAhpqujMBAEKhAliAVICAUUrX2/ZDPHniC2tW63vXTr05MvgeH2cPf4Ppen4nk39P7/AB8nDlnr6/f083zvL2+t18nHV5319/N8rx9/ufnPxWeeZ6P2Xv7+vlzxr0ez0bmefn/D/sPZzfmuH7PSef5ffXo1Jv8AMCBKqlQhENAsSSKtKoREiEBRVlFgghIKBEq23pJFRBREWIJUIKISogKFK3+ozGefLniW1dLrWt71166xPPv8l09XD2+D2/T8HxXo/SdvL5uONej3+nHg8OfofT83mdc+e+zv4Plcfqe7+VTnjN/a/X9/Xjx5zr7PV0Tj8T4/6f2ce35vw/s0zw+Z29HVHT8zIEFFoiCS0UBIKUoiJEQKEWlKCCSQUBkW1ejMUgWIgCASFBAiApRV+39HnJjly55tW1q3e976dOky8nm/MfT5X0+P1/T3+e83T6v3vL5uHOdfZ7t+X5vn7/Y6+Ln068uF9mvmfM6fd/C/CnLPX9/9H36zw4c3p9vXU5/E+L939B5/R+C936Vh5/nej06mZ2/P8YEFKoSERbZVFiJaBURISBQhaVVEgkiKoIiWrdsFAERABBBUsIEgUNRbv9bxzM8uXLMW2tautb3vp035THwvmfW+N7vV4/V7ff8AI+U7/pd+XhyzfT9D0c/neKfS+nw8r0a8/Dp6+XxvL9LP86Yx9j9n9bW9c+Pnxv2ejbHyfg/S/Vce386+/wDZ1x35vB6vTMzPT5HkkBCrVRERGrS0EgUUSJIIKCFW0WpCJCFsFkJWluUKCkyBAIQKIESCilV9r6vLOefPjiSltut9LrfTpt5L4ff+G9P0Pjez2+XX0focfh+fp9T73i4cuc7e33a8XzuHp+x28XDr6s+Xl37+L4vX738z8eMfsv1Hpmulx5/PO/s6s+L8p9j9Py1+G+n97PHt5PH6u+cZdPm+GMhBbRYkgt0o0RCFRQkiAABVaFESWJAUIRVWQFIqM2CFIgRQQRIUKpX61jOOfLnmQLdbu97306aeXp+Z+1+P9+vFjtrPu+r7Ph/Ovb9PnzcMZ16vf6OHz/Hfp/S4+Pl6vTy8efRr4/i+x8T8fjX9H+ozrru483Dfr9F83P8AE/a/W8H5P9NvHn9Pm8vfdmJrw/PkQBVBEC3VKUkRFARBKJAotmlqhIhEAKiClzAKgSAIIIFECCApbK9/6LnjGOfLEyiGt73vW99Olvl6fjvpfI+hw8vnvTr6fofU8XxeHT6f3vFw5Yd/b7Hj+dy9f1u/l8uPb283lejyfJ7/AFP5jy+x+9dOc7d93Hm5ej19PJ7/AC+S3w+r63k5ef2cfPu2ZjzfMkIAUBA1dKLSRJQCEEAhSi3VKpEzCBQJEUrEAIBAIQQAAgQotD7f1cYxjlz5ss5LenTe96306Ncef5bV9Ph8XJ6Nej1/W6fE8Dr+lebjidPV7e/D53k39P6GfL4+nu15fNb8zz/b/DfG/o3p9XTnx3363XPyPb383t+dw6+Hn7vpcPPw9nPz9KxbefxIiAoEKFXVUqpJAoQhAABVt1aURJmAoCRAt5CBAEBBEFgABAoWk/R+3GMY5csSZmRvXTp03ve93Xk5/m59Lh87hzl9ufX9L6PzfkcNfR/Q+Dlyxrv7PZPF8/n7fp+jj5fL6PbnycXl8Ht+B8b+mzvvPlm++64ce/rm4vDh7PD6/n+brO1mXTc6fl9IgoBFULbapRlBKokQChFCrq2qBJmQLRYkRKrlECAgASQAAUIJQVU/S+vHPPLnyxmYyta3vrve9718r4Hyf2HxPsvF4eWDfve76mfj/PnT9F08vLE6+r29vN87zdvo+9x8XP1+nl5efHyvi9f1U+i1x8uevXbHC+n0eR+We7l9rp2+d4719UzNdOjv+SqAUAUC2tUUkISqJApKAoNVqhQmZIVaCSQDlIIBAAkCWAFLAEWKpP0Xtzzxy4884zhNVveum+mul8H8+fYdvq58vn4YrXq69fq+35nyeGvX+k8PLnjfp9fqx4fFPZ9H0Z83kezt5/NwxPzX6H7uufTPp5ebG+m88M9vV0x8389P0Pu5683z56euYb676/l8IBaQoBVq0VCAAhVEUDRFW22UpJJJLVoJGUF45AggBBJQgFKAggpT7/vxjly4c84zimtb1ve99Jv5n4Lp9rxev2deXn5ZN9+/L6P2eXx/nt/a93j44vb1evr5vn8O/wBD175+fzb9l8njz0/G/wBA9VTxer08OON9pw579Pa8/j+b7mubn83l9FmR06b1+c5wFVUCgKq0LBLKARRYooAqtUKSTIVaCRlBfMIWFhAJACEpVFIghQPu/Rzjhw4885xJtrWt66a6b32/O/jvvTwen1ejj5+SXXrur931fM+V59d/0fk5c509Pr7TxeK+729GOHHt38/g5en8d+89Gs68L6WuPJ13x4PV2szz68sZvxen0ObMa6dN/neQKUAUQtqgAAAVSKKSiLWqCoykLSqQmYhrygAIiKiAQRVVQhCFA+59LHPh5uPOZzK1db3rpve+nf8AnT73L5fb19PNwxDXr9Pl39P7Hm+T8/PT6P2Pn8867er064eLz+v39jPDHpz8zl6Pw32/N5OXr/b+T3+7HHF6vPy9HpuZvHPLl8L6Pokg6dOn5dQoApVgW0gAAAq1AUKArRUEkQtVRLmSQa8oLLBCBBAQhS0KQyCg+39Pny83m588JFut71vet9PV8L8B+t9vj+b6PXfNxkmterp5PR2+/wBvmfM816/fx5cunp9Wnn8Wvo+hLnjrXzvP3/L/AHfT6u3Xn5NfU68sZ105ebr6t88avOX4/m+p0wucO3Tf5jQLYomiiBbZYJAUopSgUACloBmQWlKEzlBfOQoRCCCJUCBbaEDJKFPr/X5cPN5sc8JV3da3rXTfp7/yrl+1eLwej158uMS716+njz7Pr/U8ny/n416/0Py8Y36PZqTycPf7JjUxi+LzV9u5zXm8/v8Afnnl0z5p7OvPGnJPyX0vp6yZzddb+coUoFUAKCJAqqVQUoAKBaohmQVaoJM5C3zEoIRAQgSBFrQpCJBVI+p9nh5vPy5ZzmLq9NXprXTr9T8R+M+5+mvj+Z39fDhnK636dcOXs9P37835vma+z6fDh19fr5Th5e/0rxXMz5fJv1elL23x8PT6m8Zmr5ufq9OMacdfn/D9f26zZmXXTp+ZtiqAVRFAggKWhVKUKkoTQGhRJEi0tFjMzBbfKAQEQixBEEpqioRIFRqPd9vzebz885zJNN9Na6a30+h5/wCU8/131OXk8Xp7+blnK76+jPJv1fZ9/j+b8/nvr+j+dyl9PrZx5n0e/LF1nn5fH6/TrV3z9E8PD6Hs5I3y83o9mJZxx+S9f1u3TNmct9Ov5nQKALaiFhCFFWVRoUWKIUlUSqoGZC1VKTMzkta8yACEEEIJBKaLUEiAA7fd8vDjiZYS3fTW9b6ejr/MPD9H9V6fBjy+np5cZi67erHnzff7/s5+d83yN/Q+x8rM6+rqnm5+32XOdOPh8nf7uOa5z18vj7/Rzi248nb3zGscfl/K9/0uusHPnd9t/naALFVQIJIFLQWqKoFhQAFoCJBS1VkkzIq680BYCCCCQQQW0sIkgoFn3fP4+UpMl123rpvt5f59536z61+b08vpz5sSauu/pz5cPT6/v9/L8zw8nT7/AC8+Xbtpjj193Tcl5/O8Pf7nPk6uXo5/Oz9TOa3PI+mzrlx/O5+n6euppzw314/GCKFFUSwkSKUoo0FUUUCoAACEoWmiM5SLWvKFECAhBCIIq0EiQBUV9Dv4fPi2UV079d9L/O/Gv7j38fLrx9uPHMl3r0d8+fnNe37P08fO+f5M31fofl5mumtTnPT16dSeH53b7LhOu+PXp4/B9JDTyZ+pvG+Hl/Pej39u/RpjCdPm+USBSihZBIRVKUFotVQACFBBYABbokzEC68lFCAQIJCIAqjKIAKF+z4vPzmMzVul7d+vf8H8tr6H6v3+bz+bh34c85XW/V0nHji+v6X3Onk+d4eDX1ff4MtbrnN9L3015vB0+x18ud6xn1+b5/s3jU1fLx+l3z183yvmej3du2rpJnHT4hCAUqgJEEKVQKql0VUqFESkAsAgVbayzJCmvMoAlIIQSJACqSIgKSivZ28mMYxita1vff1fk/j/AEPp+rv29XD53l1vhzkW9PX1xz5c3b2fd93Pw/N8mHX9D4uUrWbNJvrMzhv6vq8vJrPP18vF17cehrz+f3ezl15/n+HX0+rv1Xes8XP5MIIKUoCEQBVCqWltVQssEQQqkVEgtWtMySQpfPQUlggQGURLApTKIVKCi/S8ebnnjK6u+3r7/M/Nfa9nF6/T8/wcu2OeMjXT3dsc+PCa9P2vrb83zvD5pfb9z461mTVl21rjfp+3yefG5j1cvL07cmjj5vX7vP7OH5ne/T7PZrOtTixn5RAQUKUJCIAVVopattooEJEBQCSC6W1EykFXgoAhAAkklgAKzCCgVR1zz66xz5pddfTw+18X8d+k9+Ofv9PzPJx6c+eIL09/r58ufm5On1vt+zn4vm+Pm19jr4LamdKvTpOM+h9DzeXmZ9PLy9N4ts5+ft9Hze75Pyd3t9D6Dm3ww6+b58BABSgkgRFUUtFW21VoKISIJagJIq22iZZSjTgUAiKAiRIRYAREKKFlKcefXfPEa30T9F8P8h+l9Ex9H0/H8ZzxnKr09vtcefHzZ36/t/V35/n/AD/Nl3/QfKxveslXe2OT2/R4+PEzn1+Xzdri9GOXPp9Dh7vznON9/b6meeL26/K4CBIUWlgkSAUKFpbbWltLKoZJJBQIRKXSiSRCreKKBAUIiJkABERKqUClCZtlA+58j8v+g6uf0vV+e5azzxMrWvV7uvLlz4cXb632fZjx/O8PPN9/2Ph9enSml1cc+b1/Sx4+Web2ePz9dcp368eHLr7+d+FvTW/R1Sdum58ghBAqyqJIIRbRRQVbppVpVCJMsoqhBEprQSEkWreKKRYWKVISJAJYIMhYUFUFBEG/q/N+B9Xon0/R+bzrGMZLbe3v7Tny4cM36P1/q78/i+f5ec6fani69d6Wkxz5vV9F4uWeb2+Dz61Off0cvNz6+58Dw+7rZ06bde3Te/mcCQlgFVYISELVFoEpq22ltWgkZkkiqCIKtokCRa1eEKRYqLRISIEBEJZAoWLSqIEIdPoeH571n0nwDOMQ0uuns9Nzy4+fk9P0/t+vHl8Pg82b6fv/ACHfprTUznGMPR9Hfh5Y5a93h8W5M9vTy8+e3u5fzri13/Q+zr17b3vfh88IggClBCRFVSqCJpbq20qrQkkzJAoQA1aZIIF1rgAIoUSEQSAQgyFBRaoAkIb+h4p8b62d/U+X8/TGMRq22+z0auPP5+Lfu+79LXDyeDx8G/ofV+H6OvXZJjGcO/v9Hh8/Pnv3cPBJznX0Z82e/wBH8X8CU6fqvpdl69/q/k4CSwACgiQLSgqIW6trRSraJJJmSKUllgLqmSEQtuuIWAFBJAQiVCEQSilKUURCBr6Hi6fmP0vm6/S+Fy3nnjE3q2r379NTlw88no+x9v0Y83i8Xl5uv2+fh7dem1nPPPF7e70+Ty8uevfnwc88c9+2eGO+/wCe5C7/AGXs36Pd9Lf43ACBAoAhlFqqAgNaWqtq00RJJlmC0BELaBCRLbrkFgBQiJABEEQgolqqFBCILfo+LfxPs+bp6fkdJz54zbvYdfT02zw8nHfT3fe+jePl8Xh4Zvr+78WdunbVYxjE6e72eXyceb6HTxcOfn59+2eE7+v5PzfB5eM6e/732/X6e96fkuEFiBBRFBEhaVUCA1aq1dKtpGYykyNKEIFoCJJS6whQACIhAIIhBKFKUoUkIhZv6fg35N8vV5/H35c8Zzd9NXKdO3Xrpy8nyPe9H2/tdsefyePx8Wvp/S+D07de1TGcZ37Pbw8fHm9vo8/Dn4+PTtjlPR7fDd61rvvp37r6NflvEAAgABCCqoQgVpVq20tokiSSC1RCRKoUkgW3AKQLAMogCBIQRaUUoUlQiBfqePXX5evb8nnpjGF6a6axlrp27arzflvvTX0P0HtcvN4/H5ubv9rj83fbrvpMZxjr6vfx8vn5vX6ufn5+TzT0c+b0e3xXeum+vbq16OutfnPmAAsCAAgBaEEFtKXVo1VSSEiCqsIkCigkLWuQtQgWAkIgEJCAKFUUUEIgPq+a+z4Hb0/OnNyxG97umJenXet68/5D7/Tp2+39frjj5PF5eGNez7fw+W+nTqkzjfr9+PLw4z0+xy5+bxcu2Od9Ps8d10303vp3661038L4wAUQgAABQQiy1SNW2qWiQsSFBURIpQCUq3lCrCAAyRACREAKC0KoCEBPrcL7fzfq6fPvHOMy76aOeNb6dNanLj+d+36Ob3fq/U5+fx+Pzcp0+l9D8+vTe9GNen6DzcePP0ereM8PFwZw9fr8Wt73vfXe+vXrvfyfzwAUIAlIlClIJAWhbbS1aEBAACQUAVC04ihACpIhAESQShQFKqgQID63Lfq/MfT8vlcGMN71qZ54dO3XVzjh8P6Pt83H6X6n6Wpw8/j8nDm9H1+Hy1vTernXo+hvzcuXLr36XPLyefnjL1+zx61d9NdeuuvftvPg/L6AKIAAQClCIgpVLdFWqoCAAlRBbCAFo4gBApIiIJSIkBSUBVUoJZYA+s6T879n4+ccZiN9NpjGZrr21an57t9Hlfo/X+v3Y8/l8nm4Z37fsfB4m9bt129/bhz58Omts58/DlyX1e3yNb6du/Xp16Xk7cvx2hFCwAARQCiEhZVtVbRatFBKgCUQoQEFLONgIAsJCIAiRAWKAKWrKQARr7k1835v1PjOXOYa103mZzhvfXbbPwsfV58/qfR+v7d55efyeXz8nX6Xs/PzN101ddfd6uE58NRmufn48pfb7+GrrWi669fR00/EoBSwCoBFAlBCWUq22rQW0tUQIpAAsgIKDilhAAQhIBCRAWUWAWlFQAHX9FifmXu+Q48kb10uZJzvTW961M/J8f1OvD3fQ+t9Dqzw83l83DF9P1/L8vnLretdfb7vPjGLzzdznw4cpfb7vNpW99OvXp0671n8XgCgAoIAACIUpbboqg0tW0JAABAQEAOMWEqBKRCEIQhAFAApaWCKB7vvcMfj/frwZ48y63tmTm3udNKz4fkfa59Of2fr/S9Opy4eXzebnnfs+v8AE8vM3rfT2+/xc46ZxquXHjwl9vs8rt179d9N70mHb8dyBVAChALKAIilK1WgWzRattUkQACEEFJAOCyxAAIhEJAkIooCBRVogUH1/pc+P4n7nk4580tXpvKYxOumrJHD4P6HPn6+/wCt9T3dGOPn8vn4c3b6Pr+DxzLvXT1/U8fLDtpz058vLxy+h7k44Na306du/bq/H+YFCgKIUSiiohKWlttitJS0tttSwkQAEgAEF8wBCCoESIIgSCgEKBaoCgff9GfD+N/Q/Ozjheuc66XMmcO8aZxm4+F97t5Hv931vp9rOfDzebz8s31fV8XzOUXe/V9Xn5ud79px05c/Jxw+j6O/Tm1re99LJddfynjgUpQKRQBVAkVSrbVoVC0ttttiREIUWQkChA8wEIWLASJAhGbIKoICxVVSoUJ+p5z5n5L9N8qcuE62b6MRzzrtLZnEzn431vX4t+z0/T+t6+jPHz+fzceTp7fpfn+GJbv0fV7+Pi9HW4OPPycOb6XXHbErW99evfvtPynhFAtFARYoWlIAW221QAKt1V0EkiIVQiMgog8wQEspAhmC5CIgKCBFpVKBYrp+j54+X8n1eTHDljW99dSZnOb6ymMpn5Xs9HPfo7fQ+v7+2pz4+bz8OPO9/pPh88NXt9L6Pm4Z7ddyTny8nm5X6fovr1zNb6atXXT8x8xQKtFARClWggKW21bQCCrbq21CZSAoERlKqBfKQgUqESEhZBCIEtEsEqlUUiyl9n1tcfnZ+Vnjy5zW+u7JnOJ06S2Tr6MeP5Pb28uHr7+v6/0vV0Z5cPNw4cpr1fU+N4ucXr7vscuWNdelY5Y8nk4b+nvHfvjOnTpvfXpT818wClqihCQqrVIEC21q2gsJKq3VulJGZAtgRYygAPNAgoCIhIlQEkhQKiCqKUCyl9/0dcfn6+LOHPOu26Zkxh21Lo6+m+T4d+hw6O3o+n9T297McvNx83Hm6+/2fnOWJenp+3rHJ06bZ4vH4/L1+l2mu2d73Nau9dNX818sCi0oCIiqtoIJSquq0AILdLq0EkRFogGZECoXzQQqkEJBEARIkBSoEqhSgKX2+ztwz8jyc+OJv11JnDni97ndrfo68fz2frcfH29XX3fU+h6t3GPPx8/Hli+n6Xj+Pzw16PsezHOb1rWcc+Pg8ff6XfXT065521q61dvznygClqoFkEKqglhSquq0pAJWrbaUyQkqoIGYiFBfKEqgREgiACIkhRQQFUCwpV9W+2Pf+TceWW/V0jHPLnnXY3WevftPzvH68xNb9P0/p+zrqY48eHDjya930PzvlxnXT6X2MZlnPprXl38zw+r6Wk9Oud3rXTW9at/PfJgFLVAIEBQqCxVW6rSkCCtW21LEIhSLEhEIqBrygqiEREIgASSIUFgBVAClr0Y19TwfGnDEOvp3jlJjE6dDdZ6d+r87y+4+J7O+u3v+n7vR0s5cePDhxy7+7f53nib9n3TM4cPT315u/wArw+v6Ok6dfPrW9b101da/PfLgKFqgEQAKELFW2220BlRWqtBEAsESM0QpBfOgtohJEIkJQEkQACoUKAUU9PPv9j8x5ufGbSdumMpnm6dDpcOnbq/Pc/u35+t3r6/o/Q9fbUzx48ePDGN+r3/N+Xxze/2/Xnl5uOPT6umdfM8Pt9hfR6/Li61rXTWtX4HypAoWlAEIAASwturbVUSKKW1SLBFEESRKRQK8yVbRYyiIkJAoSIQBSBQoAVTt1+pw/NXz569ueMXZZjnetl7XlevTpPz1+tv5+u936fd9H1+jpZz5cOHDnh19nr+F4+Lf0fr+Xz4559Ht7anzvH7OxL7uWLre9b1vWvhfHIKKpQBCIBZYgpdXVLbRIWKtVQAISCJEUUS08yWragyRIyJFARIQABQKCULTp9mfJ+Zjjrt3zz55tqc8a6o6a59Om9Z/PdPq78U9LXb2fQ93q6bc+fHjw5Zxe/ufK8PB6vseWTlO3r775ePl6dh9DHFvWtdNb1r4fx4gopaARBABEClt1VXVpIFWUpSgIkSERFLKKPMU1QJERlCAAkgSwFAAALVO/wBTP5zPDG/T35znjNRzzvTLep262z836fpa8c9F119Pt+h6++7nnz5eflz556+j6Hk8HzMdPtYxjk6+j0Zeedwn0r5prWt73rWvi/EglFWWqEEIAhIClt0rTVogUUC0UQkkIiAKtQ85S2gSIkSIACRCAsCgAAWq+xwx8Sea9vX043PPmSYmtTK3p6as/MfQ9fHWO3S77+z3+z1b258ufDlyzzvX1+r4vg4a+j7uHHlN+rvx7ebtpDHs78Gt63rW9a+N8OIi0qlAIQEshkFWW6rTTVBKFKAtVAkkksiVEapUOAtVaRIJIkgRQkhLAAoAgFVb6/Q+T5ePPfs6zz66Y45JhTJr1d8y4/MfT9PDhr29brr6Pf7PX26XHPjx5884zrv7vF8nyvT9vy+fnN+jt5q9mUtno78LrWta3re/j/BkQK0FoCECCJAqi3TS1aIqhQKqiVIkySRYFpbDgWi1SQRGUiRUpIiQoAKEAlUtfY+f6/gzyu/qnPld645hBI139VxHH8x9v1cM9N7rr39vs9fp66cefLlyxnLfq9f5zy46fc5ebk323xx79ZVq+z0+bLWta1rWvk/n4gi2qFAICIiBSi6XRathFoUSrWiIEkZREoWlDgLVVokCZSMyCiMiQFQoAsCUqvo4xj5nLhv2b48GrEQ1E1rt36c8ScPzH6Ltx74u7N9/V7PX6u29OPDjz55zb09vk+Fi/U9Ph5Tfbt4u30sZis9vfyxda1ret6+V+dkQLVBQAIhJAqlW2rVqohVFiqW1ZAkiRkIUWqOAtpbbATMkZkhSEhElAFABCirv6vzPofD5+WdvZzxwzbULdLrfTrqcox4/z36aeTy+z19LNdu3u9Hq9Pa6xw8+OecK9Xs/MeZ6vr/P4Z16cef6/XnmLZr2Ym9a3rWta+X+aRAq0UUAIkIgVVXS2lFZKUlULWqQiRJEipBVtU4C1atoEmcpmSUQkIRABRQIWKV9jwc/b8PHne+5zw53Qum9W9N71Mc7jPg+H+meP53u+luS9evs9fo9Po3XLz454xm57evh+enb7Hk8udezwe76vHnmLb093HOt29LrWvmfmERRVpQoBDIgAq220tCAqBapbaCJmRASILbVrhDVW1aWmZmZkzJREJEEAChYCgPR9H5Xs8ng8+Ovv55nLkt1db1qrd1MZs5fN+b+k14fne76GmXXr6fZ6e/fvdZ8/HnjOIvo9n5vzb+pv52Nezyev6nDnka1r6XLnd6uru6+V+agBVKooCCQQRZottqqKgWEUXRbaCRlmJRJBLbVrjDVLbbVWTMzmJIJJBIIJQirKAAr6Xn4/S+Dz8z6N5yY571db3vaZznOtJLnj8nl9i9mbUu+3X1er0ejvs5efnjObl09WfzWvX9P5XPXr8evv+bGYtX6d5XWrdauvj/nZFilUqgsWWEQEAtq21QABEpa1bbSRJlmRakhAttriNKautFqSZymZESMoiIIAFAWKC36Xg69fj8OfX6HHMjWt9N63dzOefPnhury5/G6/YubUG+3b0en0+jv0Lx48sQzrr7PgePt9X53Dfr+R6f0nl5yLXP37xverq63fh/BgUUqqApYiQCBaW21QEoESWrbtqhMsyZRRIQFarjVpWtb0BJmSZkhJJIyggAKKgsoO3L08vofK8fCfSmMr079NdN6JjETnx5Xdzy4fF+n7vTrnzyW3p37+r0dvR2tZ4cuWUmevo1+Z6/V8Xn30+bv9Z5MZyuq+jvz61u261r898aBRVUoC2kSRBEVaq1QKKBIDS61bSMzMyRSQiWUq3mVVu96tREkzJmSEkkkkEgBQoAspPv/AIb7vb2/A4Y7/Q8zN319PXe6TOc62zy8vJrlz4/B+/6t7zzkLd9/R6PT6O3bojn5+Wckd/X8Ly+zr4d58D9h5OcyurPf28+tbab1r818oIoqtAF0IJJBIqrVVSKqUBISrdXVtqSZmWQsIkoKXAtt3dauiSSSTOZEiSSZghAKBQBR3+x/PP0Pt38Xlj7PDKa6dffuEYjd3qTh5OLhz5fA/UZvXecFNde/r7+j09elZnLhhlJv0a/Nej3/ADevDx5/W8uWYurPX6uF1u261r8n4QBaVSwtogTMQhbatKAAoiIW26tuhlmSSAIkFBcKtutaurokSJM5mZJIkkkhABQUAFfa8n439D9b4/kz6fZ5odevXv3mOLdb6aaM+f5/Dlrx/K/UuDesCr07+n0ejv367TOePFMk6ez4fD6Xzu3z/O/SdOWJWtPZ7eGbq261r8Z5xQWlUDVsQEmUAq2loACksglrWrbokiTKILlIACC3e7q22olSTOc5mUkZmZCAAoCgDf3fifmP0/v+Bifa8WI3379NXOMN9OnXVsmOfj8WN7+Tz+30nG6zkN3t6vV6O/btrUznHDEmLb3fA9lfHw+76+OIutzf0sZurdXb8RkFULaKLqAQzJBFqrVWUVCygQF1WrSIkkSUZCIBcFutbutLVKTMznMzMxJmZkQACgKBT6fP5/wP1HP589nbyzOvR36dJjGdNd+vSpz4+fyc89emvzn0vrXHPEkgt36vZ6e/brvVznHLlGc119fwce3h8aPp/X8+Yt3cfQ1nW61u8fxdApVVVDVIBJMogtWrVDQShYIi222gJIkgQISiXmW61vWtKtokzMyZmJlmTMkIACkpQA+/8by/L/SfLxj7/wAzOb6+1pMuu99dmePm8vCXt23j8h+o6bMTOZmW3ff1+z0dem9mZnlkjLvw+T7/AC/HO/6by4kut7fQ1x1q2618/wDLSgUtNArVEFjOYRFLa0toAUAiKtpVCSJEFlISwORdXpvV1atXKM5kmc5zMySZkQCkKBSoL6PpfC4enr8/P0Onkze/tuZ572de+tbueXm8vDnd9/Rt5PyH77nxXGZjOZF109vs9fbbe0THNbM8uvo/Odr8aR+t82JLd7vs9nHOrbq/E+AJRS00CtUQWJiCSi22rVAUUCCNVRQjMIBSBA4lvTetXVttJIzlnMznOcyJmQgUFgUogfZ8Pzc/X+TyfoPk5d+/rSZ8+u/fe9XHn8nl53XX0dd6x8Pw/rtcuGuUxMZkzN9PR7PZ6OutbpHKGZz13+b4u/wh+i6c8xremvpZLdav535EClFrRRWgCMzIgLattoAtoCEq0UCSQQLUADzLdb3u3VurSZTMmczOJnMiZSAAolFAS/o/geT0Z8T7fl87t27+li3hz9nXWmfL4uGNdfR6d6uef5H6v3cuWWcY582WW/R7Pd6ulu90mMoxydNfB9vwcx9j6PHJd71Pdqatun5PwhQqqtKLaShM5hALVq2lBVUCBVKCEkhZFqglDyVu73vTVutWJJmTMznOM5hJJCAAoKVBPV9L4nn93zc/S+h8h6ez0d88nXjv0aax5PFynTv6eutGPP8Agv33fOebMmefLliLrr7Pf6+rW+iwznEzidO3xJ5/nR7P0HnzLd76PdvnqrX4rnBQq1VKKtSiTMQiKpbapSlKoIKFAIZEBQoWXxru9NbtutathJnOWM4znMJIyRAFApRBPX6PlWeL6X3PjcuvuuPT1xwh6N6ufN5OLt6O3SpE+R+X/oPOJjMwnPhzmV36vo+3s101SRnGMya35/m9PiGv1nmzGtdOk9Pq5XVOP4soC1aooKqkkkREi0tW0WiilLChBQWEhBQoA8pret7t1rVtEzM5zMc85kSJIIgFAVRCPfy8Dy+79B4fn9J7PRnv1x4ueuvXe9cPLzb9HbVyyY/Len9I1MZxiZmccs5znXb6X0O2b03VmWcyYutdPg+z83U/WcsRrfTpenqxdWvm/lrApVWqFIUVIRIkC2qpS0Uoq0oiBKtSEQUABfKutb1u3V1dUSTOc4xjGYSEyRCUFFFCGfp+P4uu/wCm5fKz1vb2PR1xw8t6tdb5sTfbpc5Ru8fwf7j6GszHPnmZkzjljGW/o/U7c3TY2xMTec6en475XlP0e8S6306b6+mY1T4XwQKVbVCkAARISSlotU0FKrS1aiSBC1EQhQoQt8pre93TWtatEZmM88YzMoiJIQBQC0RE9mfyX0vr/Z+Fza6d/Xv0dczGJxdJwnfVxGc29t/K/K/0RUznGJEmMY5c832/W9GctjvcZyom/N4OPzT7Pu5ya6dN3Pu3La/L/LhSlqrQWBCgRJIiLVFqqtlLWrbVqMyAlUkiEVLQsS3zGt71rV1q6qmTOMc8ZkzGSREQBQKKJDu/I/a/S+Dhbe/edvTszM8c1vHTPn5qujf5b3fpNXEWZhYZx5+HP0fX9OZN7TesZbsjnnr8m/Ij6P1+UXp06b5e3c1a/G+WFKVatAAlAkRMkFWUtWqUrV00q1MwElBJCQLSkF4Rre9a21q3QSTOefPBmTMQkJICqBVSoZ9Hv/C/o/vfN6993pnj17XpMTGOcvuxz5cuWadNTn+G/dezKmdRdtknLy+Xf1/RJlvWW86asZ559fx+35+z1/ovPlenTr0eneLpPw2BQq2qUpAAJEkZIqii0tKXVtttVJCFkWpJIkBaohr/xAAZAQEBAQEBAQAAAAAAAAAAAAAAAQIDBAX/2gAIAQIQAAAA52iJECoQFggEApQBQQAGtLoSQFUJJMoFEoARQpSkSK3QSQRRIFEBBAFUKFCIALbboSIFtETMkigAKgBSlpIhdqIkQBIKLCAiCVooCqhAgLdLoSALQkmZAUCpSEKKFokStqEhECQLRAgggtUFFCBCC226EgFoEzJkqWgqVCRRRVpJBdUVJBBMoVoCCEILVKBaNaM4yQatugkCrUEmZAUUARAUtKJIXS0SECTMlLaASEIVaoCrverrlx7XPPGRq26CILVESTMBVFASIULaCSLdKEgIkzItWgEhCKqqBV7aOnTxfO+h6+KcMFurpUhC1QkkygWi0lIkAVaBIrVBIBJMwLaSgkRBatAq9dK6Xjx79/NTjxtutVYRC0ojMkQpVUBIgKqgINUEiwMySC1QERIKWqFOuw1vmTOicedurpURKUoiZkRSi0BEQKtAIW0ECDMkilCiESClqhWuwLrOenNSPMurpYQS0WDMSAUoAIEW0AlKAEDMkCgUhEgVaUW9NiCoA5c7q6WEIWgJlICgoASkVQCUUELBJGRQFIRESrVUW9wVCAJ57dWiIFoCZSAsKCkVKCgEFVAASRIUAqEREWrVLddQmYXdyBwl1aRBLVAmUQLCooFAKAgUAAiRAALBIiC1bS3fSVzQVrcgcud1aIQqlCSERSAKFAKEWBQIoIkQAFliIkBbapem7MQhVu5Fc+VuqQIUpUSEhUAFFAKQAUQFISEEoBYiIgWrVO9vOQBbrUhjjdWggKKIhIAAClRSoLCyoIUCIgAAISIirbVXqzCQaLdakY426WAihRYgkBACi2BQAARFoIiACFCIkQW21V1BZMtaFdLmcsW2iAKKBCIIgFUUCgACIVUIQBAUIkRBWqtaEtMY1sI1GJbahAKLQQiEgQpSigoACIFCEAQBUJEQLbasaWwzhvSYwdnDerQgAVaEIiRACloLFAEqxEKAgAgFgkRAttUW1KzzmtM5HXz47btBAULRUREiEBVUKCwAUkIqyoAEAWERESrbVDWiM8822QOLvq0IRQVaCQiJEFFoKUCBSpIhSgAQACRERpqiqWprGIEkSa6W0hAFKpYhISQAtUBQQKoSSUUoAgBYJCRLV0KqVLcZWZQLdVSBFAtUQkRIEoLRKUCFLRJIFqgEACwkIktXQUDbGYZgNLaBAUFoCSJEsALRCqCC1aZiBVoAgCkIkIVdChF2xMmYDpFoJAVRVCEkhBFgtCKKAWrZEQVaAIAVCJCFbuRVRakkkg7TMWqiQUUqgREiQBFUsilAK0pEgVVAIABCQSnXEzKutQ1cwxIXpmFohAKVQCJJAEQtLApSUW2iRBVUIqAAJEAdnElto3sOGIWgtREKCrQEiMopCQtolBQUt0JEFVRFlQAEQiUvXHm2FnY1qnPGA0CiEBRaLBESIAkKqopKKKrZEQVSkUQACQhKvXHDqklvSNUzzkLNAWCQUopREJIhSEKoAClU6ESAq0AIAIQgN7xjXFV11zRM4sXLaKBIBSihBJIigQosVBFqlroSICqWKQACEIDpc5cbpm95akzGTJsoJEKCigRJEKBBQCAq0rqSECqVLCoAIQQOt5sZ1mtdDTMkmUm+PVaCRAUCgRIgUEFEAgWrTsiASqUhSABCCF6zMxLzau9zSTLJmd+OehRIiBQoFhlAFELAiwBVpepKIClEUgAQQLdzMzmYmr06IjJJJ115p01ZUiIAKUCSIUKQBIoAtVegoQFUAIAIIurqTOJJjPXVukIkzGvR5sTfSVJCQCxVUiQgoBLBAUFKt6ChBRSUIABAX1cczOczOL3RdAzmS308eL0+XdtuJEAClIgiwoICAUFKroqggpUUiwAIKz6OvnkxjMy75qLpFmEu/Tjy5314i7vJIqCqBEAFCAgFFKF6KogUVAAAIaR67x5zliSdt8bpk3FZy36N3xc2/U4cpejnAAoEAAWAIBRVBd2qQFAAACBu579sXzcOZLozdJL0y1l06tXz+apjpLnXTGUoipQAAAEoIoVQXdtIAKJQAQDWsb9WsZx5eU1Gok1TPbuBdSeTnZi6GriAAAKBYAJQApQXdoIUAAAAWyezacuecTfHnRGqTt3JTecZ8qSS1dYQFABQlAAAAqgrdoQAAFAEVpy9Pps58sYmpxkWDQnq6pTWPNylTMl0rMLFUShQFCAAApQs6VRIFBBQADUnX07Y58+eWMEEq1c+u6DePNylYSTVEAtEoUAAAAoCg6UCAWABRKQ216d3PPnjEnC1EsprNejptJWOHPNxz6sybZ3CUqgKAAAqBQCg6KQAAAVADe+/SzHLGM3hjQRc2ai9vSoc+GMMZ1rMztnYitACrAAoAABRY6ABBUoAAF7d92Z58sRz4WisbxqNRr3Z1VnHhiSSdcZxdZ6AWhQAAKABYChTSgEAKAAHo76snPliS+XOiNM1nUo9vHp2XPn4yGcdLzw3ndFFFBYChCgBQBSqKEAKAAJe/ptkzyxnLPHFtzNazLnSVPX2prHk5yKw3OM68+mgUKKAAAAVUEqlKFIIUFQWAd/XUmcYzzXzs41qZbZsaiXt6xefkzlTMdOPPty6bKCgoApAAUogLQooiCgWAA37tGc5zjGNY4nO3Wc71hY1M3fuqvNwwKYpw6899KCqIoCqQQFFCBVChSIKAAEX2dyZznHPLXHOWE3M3bG8rc537U7Z8fPn1Za7csZcd432BVBKAtBCCigAUKUIgsoigBr36M5znnjN1wmZm51czdy1lbi+mz08vLwnXeb7cdvHwzy3jfcilAUQtBAAoAoFKSxAKQUAd/XUzM8+eZt52EsmszWpncis9PdXl82Jro9Xu+N778zONZ36ERVFigKqEAooEUChSEAWAoC+7ZJMcc5u8cLzsrOpm3WWoD29M+LkzOuvR7vL6PJ4c51nXpkQtKFAoJBQVSEUBbFIIAAoDv6xJnlzyu+XG4qJLlrUmoDt6+HiWZvT0e/zdfP4JEvoRCqotAAgFFKiBQLFQQAAKD29RM8+eI1vzZzNMkZN3LUJXv8AFxVJ19fe3y+Csr3RCqpaAAJQVQIUBZAJYAAKD37Exyxk3MccNJmyXLWpNM2L6vFWal9Xq568XBct9soWVVWiwKQClCkAAQQAAAUPd0JnHPEXW8eXCkJIuktks114IzY339ni86Mt9YAqloAoShQKQAKkEAAACj29WWeeMRvV8/PDSEkubbGmTXfLy7kZ3d4kSTfaAKUoAKBUoFgAFkCAAAAX29ZmTnjJvfLljFqSxImqlM3W8Zw1EtmpLmTfaFBQoApKUSgAKQXIQJQAALPb1zmTnmNb15s4xoi5szc2iwuSTUJuWZ1mN9YKKABSgUhQAUIWQgAAAFPR6M5mcZXe8+ec5bJNRMrm1NIsiRZc7rM1k30gooIUoUAFAApBZBKgAACjXtzjOcm+jlynMsy0jE1CyoIJYa1MKN7kKpUIq1KKAFAApAQCABUApHp688SNHKXPO0wtjOWs0QtzFga1MNSuiBSiClKKKJUsUApAICABUAUXsyjF1ya55tMLWWS5pBrMWCbsgt0QUoRSiqUUEFCKWAQIAAVAKhYS61zrnLTMauLMzUlSxWVIXrMiXciC1URaqhSrKEigFBKQIABRAKIIt3zucNCZXWTCazRFZURfd1nm4TXbnIgtLEWqoKWgRCoVUpKIlgCUCwBSEGunNzzdCZNsaxJbmkNYahHX2as82u2fIIFBFqrBaVQSFAFEUiFgAFIBSCGtMc5qhmO/PJhNZUjWJuCdPRbq3WfHBBQC0BVUogABQCQpLABSCUWBGreeFqxmPRiZZkmsKNZlsHTvq3Vs8UAFIpQFUpULAsFAEQLKgAqCUARu3hnVLEk7NcLMyLmjWSode9ura8UECgFWBSqUAlAoCSAAACwACV01jgtBJOnRwXMy1hTUlIdfRaurfFkQBQUCqoVRAKADKACKAKgAE10vLjqlzbmNdsZ56mZGsWrlSHb0LbbfFgIoCqqKpQpVRBQAMoAIUAWABDe7w56ommZb35zlUklSiaRHfvVtt8fMgqoK0ClUBVQhQAMoAIUAAlBDpqedoJpmNd+TnNSZTWVXN0kd/QW2vJygqgFoUqgFUSFAAyQCFAABADescdURWVejlrlm2Zkayalpl6uylry8oKqAqhSqAUqEUADJAIUAAQALrPO1ZLZmp6eHTllpmZVGgsz7tqWvLyAoQqiiqAUBKBCpZEARQAEABW+MtrK2Qz6uHXjJbJlN811DUvuFWvLzgFIUUFqghVJUsABZEAigAEAJTbiuki2Syenh14sXTMktw0jc9HohVXzcQABQFqqIFFgAARAQoAsEAJV1zzVI0i5z6+O+UzNWTKbxncl1r2ailXzcQIqFALaWkCgBLFAREBRFACABucqVDSVh6eNwyaZkl1y0zrp37wpV83GAgoAq2lWAKWCAoERAURQAgA0mBYWhi98+jxJlqySNYzrN7e6QVa83CBAtAotqgIUogAUSEQWkoAEAXeMy4uoqiZ6bx186SXTMhrlrOvR7Mwq08vAICgtC2qCAWkQUFEiIllpZQACB1w52ZulFkme85iItkyWZnTt65BbTycYEUBbQtqghFLUQKilRJIFoUAAQvbixrndWopMz0c8BItTJN8rvftkGlPHyggLBbaW0UQQq1ICwoskSCW0KABFNb54TOtpLSTL0+cEkukkSydL7ULVPBgIllgt0paqwARbYQLCiySQgq0oAIDdzz1z1tJbZM5b7+ZREWpEa59L6tpVpPBIhAC6tFWlCVAUIUAsmYgKtKACBrNzcN1GrOeVu98AEWkhefV37JVpjwxCAFrVC2qAIFACgSZkIpaqhYBBrFlxvSNJyzbp25YFhFUiDXT1QWnLxwiBYq20LaKBAUAFBMyQhWlKACEby3y1azquMbL380AJVQjWN32oqnn80QiUVbaQtpQAAoBSxJJEC2igAiG95xnWrlWOerZddOCCwlhYW429tloeTgRCUVpQlqqoAAKRVBJIiFVSgBBG+mMrbhXPNpe3LnSrDIFE09eyynhxEiBS2qgWlUUCUAFo//8QAGQEBAQEBAQEAAAAAAAAAAAAAAAECAwQF/9oACAEDEAAAAKIAWhVKWiiqiRnJVAQARSJIkFoAA1aAVRUlIJFlhAAkABVFoVSqFsJEzKUQAAlIkiQWgEKLbQFFCKhAIgSrCQAClqgotWVQkTIqAQKgUiSEktoBItLbQBSUigiAghQyAAVbbAFs0KokZQCFgAKIZiQUoJClttBBQIpSICElUMgAFttCIqqVVJEkAgIJmauqIZiQUoJBVXVBAALFpIEIlUsyAAW20IilFq0kSEBCWTEmd9MLrVRJJAtAhC1dKElBKSlEBEItDIACrbQiClWrSRIIEE5oxO3p4cdnTUSRkLQIQtXRUIqACrAIRCqiAhQW22wkClVaCM1CEJjNZxrXTGNjekkkC0BBLVtAioCFUAiIKpIBFBbbQhKCrVCJUQySYlSTVSh0skZCqBAVbQIEAKoIIgVUgAFLbRCKFLVCFRIkjmBLrG5BdkkgtAQKW0CBAhVVFgiAtSAAWqtEhSVVKoCpJJGMUKBA1uSSC0AEpaUQIEClARAWkQAKqqqIoFKqhVJJMxyISi1LC9JJILShAFVRAgQKCpSQFtiQFhVKqwAqKqlUtJJmZzzqN2kxKsHRIgpVEQDRREAgCioELFthAAUpSKBQqlVbTLMznGWb01FhnKwuyQCtCEgVbAQIAKKCBFtIAgqikFilCqWl1SZzMznM3ooEzhpLdyQUWiCBVQQBACgUSBpRFEiiqELKFS1VFa1YkmJOWW7VIRnFprSQFKCCKUhAIAoApAWgLCBVAIosotKq26SSZzORuNXUTMMZtutSIUKAgoJYiiEUUBKBLSkUgCgAFBVVVaUkkznFC3esZzCZlu7EChQRCkoQVAgUAssBSkKIFFRChQWqVVtJlmTMtkXfXHOEakVAAqhIRQABBFUIoQFUsFEChEKUCqUtW1JJM7nO1F11Y54101uefXr83EBYtVEQABQkApYAQoqkUWIUEQpVlSlVVWkSTN3zLWenVMLbrPn9ffxecFFKEiABQsQhSiABRRKaIgBEKFoKUq2wjMjpmBO/XAFzfU+ZgUWU0REgBQohEVVgSpYooC6EhARBSqFKKtEMyLVzbj09cSKtm+/l8JSgVSRICiihIiihABQLDWgkQhEFKoLLSzSkSRJrRcu3RmXVRu+LjQoFoiSBQpVRECioCFBS5XVKkSIhFlKVKUotpJESbpcN9tTGtVF83KBQKoiSKBVKsSAUVBAUC5XVUkSQhBSlBSi1UZSJdKl3vcxq1LfDAoC0IkAotFIkKUBASgW5lttJIkIgVSwVSi1ZOjK3PLQ01d3GqThzQUAtCRAULVCIFKECBQLmW21EiQhFFAUqlUT0RS8Odaxz1Z06bss82AoUCiQEpRVCIUUBASgLktqxIkiBRQFKoWmL6IRmc288rD0dQ8ualBQUGQSqsqggC1ACCUFZltWplIiBRQFKFVZz7+vkYt6+Kaucp31SXx0AVQBkAtFVCAVSKgQAVlapZIyggVQFCiqznr6eesVccVu7OmsyxfGFAtAEgC0tBEClAgQAplbQRMkIFKBQoUk6dJ6ZjDPGy63q2Sy58oKKUASAqlVSIgVQBAgokW0CSRBBSpRQFDOt9cenOYeXUau9UTpz8sqFKUAQAqrQSIFoAIBKXMW0ISQhChQUAVF66u5rExw6Za67ZlXfHPCwVVAqAQKtUERBaqFgBArIpYEZIQUKFigEb3rWrtznnsmt9GS7157x5XQLZVlBBAq2hLESlUBAECoCKEiIQKLKAUTLe7vWtbYz87t0wuqutbvLk5ZWi0pUqEEUtoIJFVQAgQKEQAiJYigKAKzznTpddLrWr5fJz16qyXe9aTy3EzFttKUIESlWgSEqqWAECFBEAQgSUCygLHPC99Ndd6rl82V27pDe908edYzvMLrVKFiCCqoIJFqgFhARSmUEpCBACgA5Ys16TfXek8XDJe3cS9bbz8LpMzUEvVQBEFFUIQlpQKiEAqmUAIgIBQShz5ri+neum9V5fLZlb271G9XHjxnskw1Sa6goiCUVRBApQAgEKqRCwIQEBQAnC65zpPV6dF83mLnC669ds6cuKY6ahrAjrqgEQFKEsAFACEsFKkAlhEAQoEo45iTpd+vux5uJNM5N2JVhjWxqZE12KgEJQoQhQFAIICqkAIQEBKAGOS5k303d75YRNJM1pFM2LdFRB2tEBAWFIgUCksqEUEtSAqIQEsAAJyzvGTp01tiZoEmV0gXLay2KydN6EQBAAgKlAKglBFIWUhBAEWADnzMmum91jMoCZNZXQw1oaytkXroEQIVAECgAsEFELCoWCCFgIBU88JNdOmrcZAAskDUzWq1rmrfO3eqEQioARQCCgQFQLBYsCAlgECk88Q6b3qzEAFZpMrUlaums5rphdaoSIAILFBKhQQAAAAIAgABz4wb300YQogJTC1JWrWnPV3JW1EiAEAFgAWAAAKgAlQCAAefEW9Omrc4qABYrnRF1al3zm93FaUIRFIAAAAAAJaIAIsAgATlylavXWjnLYKk1FY1cRbi26qNzF6a57mlgIQAAAAAlACNCABASoFhZy4xdXW9auMlQBYsXOTWLdaE1c53059M6AQQACCooAgoBDQiUEAAiorHmhrWrvWpzBNQFiyVgZ1rYRqS9M7lJUIABAFigliwoIDSEKEAACDz4lXet60xhRKCUE1gk1reVSaLuagLCBYBACyhFhYUICiApAAEBPLFt1verMZmpUqKLFhDM11TNuLjprWs6gssIAiwAlFIACwCNEBSCxUAgcuFLdb6aZwRUakpNSys3A66TLPP1cs9tFkosIAQCUAAEUAE1AFICoBAeWEuunTRnJFJSVKKjMa6iZznWOnWiFLCAQAAqAEFAEKAUIACA5+ew1rp0qZgiaipSalGbi9aGJz1N9Qi1UEEIoAAAgKSwCgKEAAQPNmF1ve6mEXJpnVglKRje6LjGTfVKi1SEEIKQUBBAKAE0FihKgAlizyxF103dTOVSS2yaBNRTM6VQ5Z3npoGehUEEJYqCoAIApADQKJUqAAizywXe90zzWpGqzaEpbI1SjOM9NotzOgBBECkACAAWAWNKAlSoqWAg82Kt3vVTGZdMqty1KFlJK3LSSaRajYioEJUpAEAAABU1QACCkEDzZW3e6ZzldSKaRYqWiNWxRKZWo0ACWAEAQVAAALNgAIAqEF82LpdbrOZlrUimiWNQomjUUSslrN0ACUgIARRAAADYCUEBSEqOXHWprWrnKZbsipqosoqsbWwWDNUl1YAEpAQlELCwAALNgJUqAVBKiea6taSSRtDTN1Zm0FrOlAIFJq0IAEAiWCwohSAA2BFCAASwcufQEzC7Qty2JUKqaUlESlRtQgAIsIQAVCoqAWNggUgAIA5W5avKQ1qDRluyLFpZVgBJbYdFCEKIgCQALAogFjSkqFEACBUCnmRdWC1lqpKq1FWIWXKg3pQhKBIAiAFABAWNKCWFQACFQoeZGrYTVSXRFUsUIDEbo6lCEoIgCIAVUARQTRQlikBCxUAoeYasEujLayNFRSWJTmXSXsKERQiAEQClQFQhS0JSCwAAgoHmLpILay1SLVhQRFyojuKSwBCAEECxQFgik0oSoKgEUEsoJ5y6SC1ZLoRqUKCQiiTvRUACCAIgLCgWIA0oABLEFEssUJ5y6SBbZGquVUFlRCKiT0UBBRBFgQiwBSAANUAASyFJQQUzwNWSUNJLqrItgoIgqJPRQABEFghAAKQEoNVUAAghQCKMcK2klsmqkXYBFohCWok76CoSgkAggAiqQCUNiwACCBQAOXK3USWyasJdUJULYpmyUJO+iiBFSASAAQUACU2BYWAQQUADhi6ILJoJbosioaBEgI76KiUQICEABFAAA1SwABCBQAOGLoktRSyVqgmsmgJmUE7bAQAgIgACUAADVLABFQQUSgPPnVIqRpNSGtFQRaQmVUk7bAQAgIgAAAAA1VQAgqIFAA440SWpLU3Il3YAlsFmFUZ7aKCCwQEgAAACoDVVAEAIFAA5YpJaktjUI3QFkoM5q0TpsKIVABIhKAAAqA1SghAEBQATz2kKko1CN0lFkoTC1ROmwoBABEgAAsKCA00KhCWBAUAHHGiFJBqyyNWgAGM20qOm6FBAgESABUFAEDZSiQQEsCgDPn1ZZNCQaskq6osEakc1tUZ69CyggICEgFBBbKQENloqSEBLCgA4Y1RAQukZq3QsBYcbbSxO21ABLECEgFWCKLABNlqhIhBCygBjhaUhLDVghq0LANcFrUsTvsWBSpJARICqElFEUizSrQJCEQsKAnDNWiELNWCF1QAXXCWqE9GlEKtIxAiJYKURFKAhatqgkSEIsUlDnylaSFSlqWJK1oAF355aqw9FUBbSTECIIoKQlFAgtttFRJEQCKlE4QtSLC1SVINWgBrXHC2g9FKKLUTORBECotgirKgC26qgiZRAAlGfPS2RYW1ZGsiLpQBrXPktKX0ClC2JMwQQgC2WAAQW3VqrBMyEShFBy5WaIslugTSIhrQCVrWeC1Yb7lFli0mZAgiALSCUCLDV1aqokkiAIoHHCaQDdRDREJdgJZek86rSdepVlIssZQEIARSwAslQ01aqiSZIAlAedlYusxuoF1EIjagE6Xzy1Sd9qKEIgiwQgCUqKEsENNWqCSQgSgBxxBLpl0sgWklli6IsWOmuGGlh6NKKCIgECCAKAARD/8QAJxAAAgICAQQDAQEBAQEBAAAAAQIAAxARBAUSIDBAUGAGE3AUFRb/2gAIAQEAAQIA+/GB8I+B8D7teGpr9iIPkmH7U/G39GPDXuODg4Pr0AM61NY1NTWv14Hhry1gjRGCMHB+7Pwj9APfrzOD4H2awM6+6I+4Ho18E4Po39mfo9Z1qamsDA8taHsPgYYfiamtTWvqh+DHs14615ahwcH5B9mvwwwIPefI+seWsamsaxqEY1r8wPg61nUAwBrWsEGa8TDDDD57+UPjH5Ovga8R4CCCAe4+Jxr0iDAGtTWdY16SMn6s/cgYA1rWta1rWdQjRGsmGGGHw34b35b/AAgmta+CIIMDI9h8D4nyGRAANa8NerX0o+lP0Osa1rWgM61k+ByYYcHz357/AAevTr2DAg9WvHRhhyYYYfMZHxT+cHwB568dGEeJwYYYYfxmvXrQGta1rWta1rWtAaAAEA1Namta1rWCMnwMMPkIMCDA+Gcny3N7B/07wSPywgwIJqa8NZ15aIMMMMMMPhvx39cfgn4OvVrwAAA8B6NZIhyYYYYfIQQeA+GfHTWNebg5drzf/uLUtS4Wg+sfiRgYHiPHWtaIhGtQwwwxoYYfw+s61qamvHQGda1rWta1rWtAaHjr0a1rJhycGHzGB8kl+Q3Mbkl1wH4/Q6v5Sr+eHRX6Byv5Pk8IOHW8WA/kxgeY9R8TDDDDDDD+I16NYAzrWta1rWta1rWgNAa8wPI5ODNQw4PoEEHwzky3k28gmaizg9BU/wD21ALOsEsq6l/MmMoKutm/xo8RgeGoPQcnBwYYYYYYfw+teWpr1amta1rWta1rwGNeww5MMIIPoEEAwPafEyy+7kM8Am9/z/G6tz+PT0+uOu++thON1TqXSbK2UHvWxLwfxYyMCDA+Do4MMMMMMMPr39Hv0792s61NAa14a8ta1rWta1rQGtAe0jRwYcmHJ8RBkTXwDOXeXZ4FLbhP86nKHPv6EAQ1kFQWycROFzep9OhXUBrtVvtx4j2jA8BgQe85ODDDDDGhwc7+nPwhgerWtampr0awBrWprWpoDWta1jU1rQ8SMEGHBhB8D5CCCD4XIvZ3aAE5adCnPXXSqxADBjqt1Y6iK5dNwiCIyv8ADOT9qIMiD2awcGHBhhhjQwww/R6H0Wpqa1rWvHWhgeAGsa1rWtTWQMa16iIcHJHhrwEGBgfAtsusZoATnh1V/wA9xONyekf/ABOL0/8A1MFQE596rWvOtDTcOAVauz7Q+I+EMCCDA9phwYYYYYY0aNGhhxv5w+QPSPDU15a8BkevWta1rWta1jWoPDWDNHxMMOT4iDAg+AZzbtmAE+FdnFeE8Y8qtUqsW1nHJtos6J03gf0LjzBJRvHf3Y9QgwIIPacGHBhhjQxoY0Phv7/Wsa1rGvHWR4agGprWta1qa1r3awcHJhwfMQYEHwOTa7QAny6CTBOTzR1lecvI/wADwRwL6qCCU/pKT5KTK7Fb7UegegeIwIIIPAeO/A4OTDDDDDDDD94PAYHo17RgYAA1rWta17teJwYYQYYcmHB9A95nKt1GbeNZr5J5fH6hwOd1DptVi2cc0lOucTlBhLn6xzPPaypx9wPhCCCDA8d+g42cGGGNDGjQw/Vb948hkfEEGRB8TXqMMMMMMMMMMPiPAe/l2vAWJgmsb3ve5Td07r3J6Hd06rhJwK+LzP6ROu8b+q6h10egRsVMPXv6wfBEEGR7zDDDDDDDGhhhh/AjAGsaxr2CDAgg+gMMMMMMIMPiPEee/IzlWtCSQNEk73ve5sNvh9aX+tt/qLut2PrI9AhglTfC3v6ge4YHgPTvJhhwYYY0MYGH6ceG/jjy17R4jI+aYYYYYYYYYYfEQfB5VjEkkCE+GtdutTeyQd+8RSp9W/tt52MiDAyPcTDDDDDGjQw/cjI8h4j4IwMCADAHhrXxjDDDgww4PiID7zOXYSx1DnWRBUON/wCT/wAf/j/8h4/Z3Bt+oYWDFR+4GR6RkYEEEHwTDDDDDGhhjQw/gRkfBGBBBgYEHt17jkwwwwwww+gQe7kPY2z4kkqg460aaw8k8z/2DmDlC2Mjcc0736BkYqPs3g/Uj4AggwPAQekw5ODDDDGhLQw/gRBB8UQYEEHzjDDDDDDDDD6h7efYxhmgNsVSuhUZ7OW15fu3vfcHW9OQrEMjVTfmPBSv3A9g8BBB5D2HJhhhhJLRoYfqR8cYHxBgQQQQfPODDGhhhhhhPkDgezlOBoiM+6qFQtbymcn07Wyu8HTIyb8xkSo/QD6cYEGR6t+RJhjQxoYYYfvx4D4ggggwPnGHBhhhhhhh9I9O5uE3NfwTGZ7FWugLbdZcT7Q1dyPCHrMB8xBKj+CHoHnvc3vzMMMMMMMMMMMP2w9QwPiCDAggwPg69JwcGGGGGGGGH4rHjcbrkssd6qUrAvvd/gbS1LIQysgbzBSD179W/oNe4YGB7d+JhhhhjQwwww/G1r549Q+MIIIIIIPmnBhhhhhhhhh8xkGb8N7w06JT1Dmu1VdaS+9m+Gjo8MIsrDg+GosT8KIMjA958DDDDDDDDD7x568dZ19CPWPYIIIIIIPmmGGGGGGGGGHyHu3eeUtr1U1oJdczfFSxHhBD1hgwgzpYn2WvgDAgyMD4JyYYYYYYYYfgjIHiPLXt1NY1rXmDkZEHwRgQQQQQfOODDDDDDDDD7t78eLX1zmVoiyyyx/PWs61nXjVYGwQ9cVsAbWV/E38zXxR5j0bm/Ewwwwww4MMP1etfAGRgeI94gggggg+MPI4ODgwxoYcH179PBXmPxIIz3W+Wta1rWta1rWtayJTZjRD1kI4KnilRX+FEGBkY2PVveTDDDDDDgw/CHwdfQD3b8xBBBBgfKODDDDDDDDDg+key3kXTjVlr7auO6EeIgXt7Svb29naV0RkjCmp4cGMrKjg8KrmcKv5Q+qHgMDA9x8Dgwwwwww+jWtekfHA+QPiiCCCCD1nyGB6zDDDDDDDDDD6R698tqkvI41XSTTyq28QAANa7ddujNEGHzrdX1NGMjJW5nLup/CDwHxTgwwwwww/Q6+kHwxBgQYEHp36B6jDDDDDDDDDDD6gfPcM6geHL24UUWjkh1I1qCAggidoUggnZJPopsBODDGXdRW6sfhxkfDMMMMMMMMPhrXoHoA8NejXyR4iD4ogggggg8z8cwwwwwwwww/F6lOJHnCiC83B6jSajWVwIsXAVkaOS295141PvBhVkoav8vvyOTDgwwzWvDWdfcD4wgggggwPmmGGGGHBwfhb4XCtq6tXxAw4USchiHju9xcvvYgKukWOLAQV129gr/wA+wp26A7SiOGmxOwInzB9ePhnJhhhhh/Aj5AwIIIIPhj1HBhhhhhhhhhh+FU733B1ccILOVi+x2qpsVgq6E2kRVV1ZXGCZ3i4WaKdgRKauIOGemGi+KyvW6svFcek/fj4pwYcGHy0RrOsa8RAPrR7D6RBBBBBB84wwwwwwwww/Eqn+xDwngKZyBcWT/wAurA6KgBXsqQKsZmjqayAv+ZBLIrpFpFNdKp2mWjk4plfC4vErHKZvjAfVjA8t/AOTDgwwjWdeGvEZ16da19IPiCCCCCCCD6Awwwwwwwww/CrNyWwhBw0MuNqJS8dSpXRGgqqBoqQZ3MAsKir/ACNAHHYIoUENLZfNVzjXVu9/H5Fp/Bj4m/A4PgfLXgfPQg+p18wQQQQQYHzDgwwwww4MMPwgeaq4pFEYvO0x40JZtgCtKOzQBDIUZGUAQAIqLU9CV1MAoYPLjYBKqK6K1sXix/td737B4byPIeZPifEjXp16R9Rr2b9owMiDAxve9734b95hhhhhhhwfbvz7VWI1JaPgx40I/wA1oWpaVQqVEKlP8+1kNRq7FVUVFRqkqChTLBfDKq6eOeOq3y39Kca8NewfQaxrXzhgYGBne973N43kfAMMMMMMMMMPxSrSjjpCTCGn+bV/4irsFYHaZoAAIUavs7GrKBUCqECivt2xacuAcWunnHkKbBzGzr7Xf3us69pHp15azrx18cQQQEEETeN7m9+wekwwwwwwwwww/FrjzgkRmhgBOtdpFl1M2xgKxQQT2FO01msIqLGqEMJJZraquJy6EFbITL38R+b3kzXvHp18zWta1kD5AwMDG9g7xveR5jz34GGGGGGGGGGE/EqN9fBjQknZIwIWtsWLUQw7OxAGLWtU4BTt7e1VKqzRmjYConOr7VNM5r7+1HsHzT5axr2j5QHp1rAHiMD4u4MAiCb+EMDw3knBhhhhhhhh+KYDx6hW0abJGNk22M/BUsz7DISvYU5IrtqtE0ygQMW2YS0E1XLRbWqIL3/O79OvcMj6AQTXhqazr2b9Y9G/aDjfoODDDDDDDg/FE4BMeNDnZZncmcdv9Whf/Stu8Wf6WmxKbarFODgwnuhgAiM73Micssfwg+Jvx3561NTXpHwz69eAwPPWtfC35AjI9G9+geOwfDcOTCTDDDDD8fhG4NG8CTGjkCNXTdaylJZyT1CrlS1BKHVu7u3snWskiuuj/Jn5XI/L738LWNfVDA8R8Q+oZEH0BwYYYYYfA/F4puZi0J3smOWiDQBJZYkFJ4qVgMl6VPW2+4MTubGNk0Wd1s5V+4fzm/LXhr26+hHmPiGH1CDA+IPLfkYSYYYYfko1rmND4GNDFijTBsI1bKAmjLkEpYGb3NjJKiutD1Gxj8wfRj6/WiPqNj5Ozg+sYGR4b9WxjfoOCcGHB+WCsaHwMeCINGNGwsrlYAI1YtiUNgY3BN7JrgdTy41Z/Cj5GvLU1rXwNfQj2b+MMD3jw3nY9ZwYYYYcn37gJm9+FbGHxsNYWGEmCs1CpEUDBjCMqE4B8draLG5H/oe4n9eRjX0Os6+TvZ9gg9O/TvcB9RhhhhwcmH0KtXTh0n/5J6P/APIHSF6YOCOL/wCY8Y8B+l38KVxsDIFsUAvc13+wvHJ/9K8heSnJWwtuwPXQTljvLs1vG5LO00fHXwNfWjI+WPRrWT9bvA+kHv347B3ve95OTgw4OD6EWjjBlwDs+WoV5/DVnHgI+GLlKn4ycV+GvFbiRLKr0cs0rlUM3D48tpQu2m/wg+sPoH04+iGR8DcHp3N5ODDDDk+fARrFKkTQm8733bJ5BMJyYIwMtbjrRVZVRXfVw63rq4vL4YHGtYq1bEGHBIyJz5VQSTv8IIPqz9ePnj4e/bvyODDDCYfRxIXRkZQAVJLbz29ssXkUoWgw0EMc8l6eVxurL1ermNyKX/1rv5XPuvp5AtRq4SYScg4ItO/w4+2H0AwIIPkH2DI9O/bvG/E5MPkfGrFK11ghg29dpBUqF12hOTxjQ4EEIEMaX0uud77sicc1mqMdw5GDHYn8KPsNY19KMD5R9uwfHfnvI89+gww4PqRa0Rf9Adib7g28awJYofl8LG0DzYHK42ta1rt1rVNBoSUxgQYciCGOf+Va+ePPfmM7Hr3v3ABag1iOHDAwjYOwZve2Zra7eYgggjwyuWLfUVA129uu2jjcfjXKBVDDg5GNt+JH5gee8b8deo+wfAHqHtMPp44eFrLEsrYQQYZNQHuL/wCn+llr2128siDFgIQEX0PWAB29nZVxqaVli9tcMMIM1BGwfudfAH5QY0Mj6QfHE36j7uEhhNrVujrYLTerqQChTsNLcY08tg6ul2hi0RQQsspbp/8A414n/kr41dBgDjtWaMJImlhjfJP2Oh+VGdTXtPrPp3v4QwMD2nwPq4SmObSHrsFn+621WI6sW34MlnA59fSYQMPNAMCy2dysGLdxsQGGEGCNDjWjALfxg/KD4Z+KPsdcdWaxrJpG7+7voYWJaG2G3kjlcfpiEYYDLgkWizv/ANQ6RYScAQ41ANgcmofZa+IPMfkh4D6cfC3sZ35bhwfUIoEdrGB7QNl65TCKwsMBEA1gMUEIwRssSw1vYiBME7gxojWmIhnCHUuD+HHwz9br4w+nHiPDfp34jy38KmOXLwAQwwBRUwKFTCgitswm2zv3lgZsww4UAKFm4JoDWtahBiTicp6uTxvwog9g9O/in4GvnD6gQe3eR8A+ziy1nLEGGaA7UIdLUsRgTHq215uveNK2OCGDCEdvYE7QBgQBRrt02DDCO6q3g8jqPD1/xXXiB+AHnvyOT6OIrlzBlQB29sBrepgRNxkbj3U8kGF1YjTxhrUAAUBdABVEGCWJMM1c6txL+Nb1zhD5g9Wvuh9yIPzIFAaPCNCAACAFSNLKoHDbyR1HiI7yi4kR4TDkFcAYGS3czr4c9abK24VyjmcbwP3w/L6mvqR9VrNK6eGGGCCAxCSYZWa2MUg7zcHDwmi0RoZve4IhUhjEEJJLFovg3I53ERuLbxbedwOR0IfgR+U1rXmD+HPgfLXFW1mYknQEB2rAk926nVxhSIYXus5amEBqLWjZ2CCsVu5SDsl2JVTAc9Rbh2CtTwr62D87pfK4f/EdAeoY3v7YfG0R38dbSWOBNawIDNaUKyOCQXNxe17kYGNEdLWhhxsMHDqwbuDtYYojQeHPq4d3Pqqemzh3mAleb0Fsa/4br3b3v8SFr6OOjV8W2XEgmLjRyCGDbDgoazOVbXeH205FcbFdi3NCc7DBw4s/0BEU7JBzyEtXpVnYJw76XIEE5HE5fQmJcN+oP0Y+71r5tNHD4BjGy257HztDudusb74hVhaefc1dYm5YtqEkEA/6C7v7t7EDdwwCpm2gi5ecyvpNv9BRU1bcO3YKk4KMl3TOT0Fvia/da9OvxBNHB41dlyhkue5zNscA70TN9xYRYqaEehazjYJl9RGjNYByDsFWBEAGe0QGGcscd+uV8VxOLZU7KpBgM1OTw+T/AD9tBcPjX/BNfSa8teA+krTj9OZrOTxVtlvKtexiRGIhgC4ONGdyKtaLogwww42CZyeMsIzrAmu2BliQCGCCaAEM5QM6knCdDUeLaJ1YUf0PTurQN4lLeByugOomtfB18rWv+Ca+iJ43T1Qw0GmivkSq5mcHBUTcUY3uJXXWFA250Rog4EBI5XGB1gQgQQTRwhrizRgAi4EacqdnWZxGqgnFsradc6JRfRbAfLdlN/QL+AxB19Tr6Tfhvf1Ovoj9lxeAXSgwqgx1Pi/6EsBjWBgnQVa0UEEm69WmiDCMCAmcnjA41CoCzTCLKymGwIJqE8pv53pv9NdOK4FJ47CEdd6R0fqtN8Delk5HRuRx/oNfpz+J3weB2gGE7qQwzlcco0MECkYHisEE7rLedy+k83BhBB8Bjl8MNgCaUgMullcQxhBBgC88HpgXqh5CdJtEWcZwZZXd/Nf68fr9HW639XVOB5a+Hr/jo+T0riNCohMVdxordY4QsA0BrWpvu2ICG7i3P5dNHG6AVhBwRkEETmcAEQDt1AYwWJEwZoDSLOJwgtzclObx+O+xOOyHP9VxWgt43M4f9FxuX6esdOB1+7HmfXr4+vpdSihEmsoGKFw0Q9W4aTWtEHO97DAhr6aP56mohlIhBBBGsAgo3P6eCsA7SgUxoIkQg4EAnG6eAZYLk5XHdenXapNZGeTRyP5w9PPC/wAOLzuB1H09T4f32vvR7x8nXlr6HfTeKZ3X8tXIUYBjzbpZx8HDCagIMA41AQDBDocEEEEZ2rVv1DpwimCFSGgKRIIJoJVXxenEwhxYvKnMXpV8qlLDxaFgz8e7pHG5Po5fHZP+AnGvHQ9etfW68+l8dn31PrFrJbxev1QwmVtYrRX5nFZDkztKsBAFTjcZU1rGmDKQQQQRojAKNXZd0x+gP08EWM9sDq9Th1SvgVdKRe4CGMGXmnnKp4V6SkjwEMIEGCsHo61xPh61ry1+fPv19+lfHqtt6j/Q8PhcPjMlfSNsTN96PajSu3mcR1MAOTOxUq41MZda1qaZSCCpBBBBGAa2rd5XzByu88c9O/8Akr05eOJ/t/rAAMkXtcOfXODyqWqikeJEEGDN+diOno1+y18o519eq8Xjc7rll3D/AJ2njEAKsJjQxXDOjLVfyOJfxhNYI4vSk4brFfWNY0y6IKlSuiMqa2rdqwoTWsgAAAeLm57ZywwM6d1Pj2JB4nAxvA9HV6vPX7Y/cb+F0urkcfi/y6JjtrXbHDQzS2BrEY1XBuR0m3jidlHGpS0MHilGI0QRqMGXRUhlKlSNQRDWyOFCga1rWhB5Mb3KWrevKqOOhcjt8jB7es0bwP8AgOoPXr1617te8evVdNaEzuLpHgjkEkwmMFdHtpZUvq5W34a9OWrdplq6rIxoiLCGGiCCGUqVI1BFNbo8GNa1rQAGhhmYuWNhvnHr5vT50HgFoPEweO9+TrdT+bPz9wnf4ngVnxCqrmMdsQzDuDWItlVzV28M1JyU568v/UkwQraiFTuEELDhhoggqylSutQRWrsSxnrYDWu0LnZhDSxmNjWnjM1PH6Gqo3t35Gdapzr6E/lz79fG156+WB07hly/+gbSoxJMaEkkqWTQjJKuUr9ppFIRnsOXVhSzhWhAwc6IIIKlSCIIIpF1/wDQ1/0fG/p67Zvu/wBO/WoY0dXSxLQTSVAgVD7QfFpyatevWhjX/NAvE4tnIN4tLi2gEsYSxhjIrqxXUKNQpW8Wiz/SWQYMEtWokNEYghZZELDJBBVlIIEZzf1ICa3xuZ0vmFdAiwWizvLMWLSwWoEpdGeXJVya3gJJsDAeYIwMGCdTo/Sb+gHrPxCPn9KpvtLKAuuPRpixhJMMU2V91d+tAaIncoepLDBNwSxRENyoylgsvCNnUMIIIey7qY5FLlXqWvk8d1/neqiFGrNZWd/+jOXLMXlapKXYqX4yDZFqIUPmYCYCIc9VoB/c78QPwTHhpaEpFfYKa0JJOGMJYq3eRZxa+Sj77jOxQDHr71jFYCQ61F1eVPCLQWpc+BDmzmW8si2hIjU29Wor5NXJ5jb/AJzrUIKlSpUx2LFizlAChECobmDg8m2pkKnyOFOGyVsr9WvE/B1+w19e8SBFQjVaEkk7JYxsKGXa2vSeKtwuEVORbx7MPFYCKRLFXFyq1TkatCPy+SOr/wD036l/tcOObON2BL+OAAY65Rujc8GFSpVg4IIMaESuV4AsVSgtqArZCfMhTATkTqv2I/I69GvDWd/XNhFwlZJYkkwkt3E7DdxwCtn+ocM1/KqodGjSqAmAqSNLLVaU2A65KbqjcQ8duPXX1Hh0NSz0tX2301wjnp4fy/N2G2YQyuCCCNECpVrwCSFEdXRYhHmcIdHLHqie3fwdf8j7dgKhJYkkwwkzRE1rRmu0IiO/JShnTj2R5RDN7VhHClhcoal5yFcVOIUdCqTl8XjWLHQi2vtdeoVeFVvGvBB2S0cMDDFC40sE2DoYddIUPkcKRGxtp1hPbv8ABH6c/i+Jx2KoASSSSTCSfEEzQAAAnIrpcTlIjUs8pO8KUZgMXK0qdC4tQTj2EMrhJyKrK+NcVsScmmucuojw/k+YRNkkuTDGgGAFgm600BpgwEQ5MGDDAULnBnUkU/T6+0Pzda/C1V00KkJJJJJ2TD5DAAEUW2Vcm6pk472px3MYIzTYKMIQstFgU0vL0YVNWxFixDy6VnHsdHQo6GXoZx+K/TLKukcuEGGEkkmHGxFiwFU8DGEUrk5MaCIX8L1T4uv0WvxHRkA2Tskkkwnez4HGhkBRajii7seWIJUwRlEabVkY4aWiVMhtW1BKXjKyqbFurpetrE1fUB1JJwq0fmcafz/PIIMaGEk4KKgAixYPAwhgsXJGDGgiRvDWvp9ffamvVrX4vpFRJM2SYYTgHyMEE0o6jyuHzORSjU2X1cey1KmSXKI0MU1sIRLQwU0u0uVghqeOpiHk1zjWkWII9fV65xOWp53Mn87z9kMGDBo2AVKmLEAg8SGEQ4MODGgiR4MrLR6z/wAEP2HA6fN7JJJJJJJJB3kZ1AFHI49lfD5PNoptrckx1pa1TDGAKNW0MslglTKbVsAlbIzB0EaXJWePYy6tXq9PiD0jnhzGDBg0MDqRhFEHmwi4BhEMebrMEOFnLH7LXy9/X9P4GycEkkmEwwweIGQFAE5XFosRmXjW9RTjW2JVK5ascRDUwJDiwMENLMLVMU1sCwdZcmqHU2IJzqWHgJ/P8uu8WEtGhhCVhIoEEGR4EGCCAjBDB4ZXBFhws6gPw+vpdfj+n8EkncJJJ2SZvwAgGQBFG8dX4PSeXz662ZeLajmUm1WBjQStq2jCwOAaWBtVliFGjqyurqs41jKRyK+dX48W5XS4Xd7MTBAVCrBB5mECLGCnDCyGVERcidUHwdeGvpB++GeHxgCd4JJJJJ2fPYM0IoeC0NDOXSYDw3vSm0vSTLVMabRqmUsLBYpiNS7rYsUoykx1dbFlTo1ia67R5dLsJFi2FxANarXUEHmYcLDBBm2GVFYfDqw+Fqa/Zb+j17wvHoY7wSSTs+WsiCAaAUFbKq3BM6/X06yxeI/VERltosEtVg0IErato4tVwpoeWqwEQowJDrYrgHi2nHX+LNHIn81a6a7lYQYUJCNL6SCBgxTi0Maisbw6uPbrGtfKPu19Nr8xvpfGZt5JJJm/DWdAAAAAARhYKbJ1gdLfmCo9RXYfjWVmwOGBwjVMCwtV1lLVNYti6EUqYwsSxZW9LsvJqsSHw6NdarKwpUQQQNVNdoHpaCCMBBi2WSiCPZnq/wAfX5gfT68tfMoq0TkwxoZub8tBQBgRQM3pXYD1pumnniouGKihuO5lgaHCmtkaOtqvEahzLFYRYrKY62o6zjXQTrfH1oI1MrcO4ZVCQRmU0ma15swsJghwMWy2Uzfh1Qe7XxR+Q18jX1nSKWPgSSSTN+WtAa0AIoyw5E41nXn4E5sQ8aclFlbcV44cMNStq2BYWq6yl6zYrLoQFWBYWpahiNxbWH9Tx9118HgWJ1ThmdHueGFViRiJUykeh7BWaTFMEMGLTbKZa9IEJ31IewfI1qa/M6+3IrTwMJJJh8NweAwIIAPAzqI6fZ1p+IeUROGeoVxTRZSzxwQcKamraWLYpFbUOwcEYVksBdbUsSce1G53G10wctq+d/RPP5i1ysZlDZqNbA4Pg711wmPUhEbNseUTmGoQmcsD6bXw9H5mvna/BcCmxvAkknfjoeAggggABm8GdSPDfrC8ccrHFnORwDW3EtcOGBzW1bCMLVcA0OpcNN4BrcSxLkcKeJdOs8VH43W+Rz+XyZ0K93V1iAw4U1spHi7c7n8K8kNvq3PovTwtlk44uKzeLov0Wsah+u1r42vxQHTKj4EsSd79Qggggixs7M6lZROsDjzllTSzryE2p4lqlwwIM2pqZGMsW1ZW1DuriCFSFat5alySp6n/AKjixgRjiujrVWpVgRBEKMDlzZbdd0Y2OSi9fnQ+YoJm7ZZOPFAwZvQ+n1rWta+ePZrWs6/MoqJkwkknfrEA0IAsaanc7W20DqrcacsrEZJzanANL8Sxw4aHCmtqmji1XAPHcSxSBAHRlV67WF1dqb4t3JpauHKzpyrKkIZWBEUoVIzbOvHp9fRpaXagdXvsGCRLo8qlfjXCPp9a1qa18TXv1rU1rGtfm+kcdzgwliYfYIMCACCE7nJnMsrPETqNnGPKKmsq3KW9Ip4dzRwwOUNTITLVtEqahnVxFOnXStW7rfWwqfjWf0XEhhxQlFdFYgVkZCpAKMhBxYOtRud/NuQ2P6NqIuGKy8tEiCHAiHkL9Prw1NfYaxrU15a/E01BTkwloT6hgQQQRYIsqe0q/MHU7lXhEvxZyYspKMk5dbQGt+HZYGDAiKa2qaOLlaKaHEsQhSsZWUxGU2pyKweLZ1/igmHHRaakrWDDKyMulKEZadTW7mfzBmp1EdOesmNEnJOkABmyYk5w+frOteOviamvVrOvDXhrWNY1jU1rx1NZ0PwXSKSTDgxiT5byIMiCCKBgzkyu5S9tQvInHex9pbW9TctLUgPCucPGhhgiGtlLC1bFlTVOwdYjgurLEYG+uwUvUedxocdJo49YwsGGV0YCIVObE6f1Do3GglhROixAYSk5EESEwibU9R+TrI9uvcfl61nWdY1nXhr8OPEiqowwwww+kYEGBBBBBBnkRlS3i2FeOnJcrFdiBS1LuvIQgGtuHZYrAg4WVtW0sFqtFNDg2Ky7reOrBSj2Dkop4lv9TxGhlKcKjfd3BgwMZXUhYhGLL6Ht4PSRBOVV/wDmONwiGm0l8CrBk4E6l9NrWvha1468teGprWs61rWtY1Na1rGtY1rWsa1+E6bSxODDGh9IIIgwIIIIPDkyo3jgWIiq8csyMSpSVNUeTXakE4V1kYMDgRDUylhatiyp6nIdXVSjkWIyqQ16uvHfk0FTOhcUAEFmDKymbZXSIVMbHK5FnOPJs5V/N4FsBcgpLRqDy6mPwuvVrWprWtEa1nWNa1rWta9evv8AfR0hyY0PgfDeBBBBBBBB4Xik9Theip5YWmpW2lNTUG5b0IERuFdYjQg4WVtW0sW1SENLqXDq4rdGYWIQGeXIp4dnXKTOg8H/AEUdrJ2rFIOHDBCjCckKeqF35FlHM4dvTza9QtINbWlTgnc0Bzl+oPy9eGvg6I1nWdTWtamta146+/I6YIYcGNCTknxEEEEEEGBkTlW0Naaa+2wuxhwCoUIaGEvrtWCcS540MOFKmplLC1XAlT1tGWxCKnVmDoRu0OOI/wDTjp3GsdgF0wbCspy4iMpuFJtoroMe89Wa6zmy5u9bXdBNkiAAS1FPzB9Vqa+DrXp1jWvxJnT8GGGGNDDNkk73kYEEEEEEGOR1zl/0fGXqHJoFdLG1mB8K3dVlTVNelyMAVPA5FqEGGCKUNbSxbVMRqnUsHWxFatwXVgQwdKp/Tz+Xo5a1LsxZZUyaVg240MUo0ES/+hHTuI9D8S3i1oDeDFiTe9wQEYQAfiNfE1+VM6YYYYY0Yk7J2TveRgQQQQTat1fmd4PQqOZyeKwuZ2jQ+PHd1qelyL67VgnGt2wMOFKGsqWFqsolT1ttg6sqMjmOrBpoJ/SP/PUGv/IppXjoyaBGCGwhU7deXxv/AHn+g40KxTyAQxpU+G1gxU1o+31nX7jpJJMMYsSSdmHG8DIgIgggjimv+hRIqbERkeMWJ8Fiqh3x7KmuS9GAIPA5PIrIbAiFCjS1HWVmtlMYOhCMrNLA5DA9VHGAYt3lrDVYYylSFIhDCLFgw68/pXTegpHJgPJDFIg8VgMSX/gta+dr16+cPqOjwwwxoxYwne8b8RBBBBBFTrl9Y4vHur0i1iPGJ8BKZatkofju4uS1IDW/Hd1aHClCpUsLFcI1bKdkkOhFbSwPFiSuKVhHbq2VOjkMpEXDAxSpGNlNGNDi8WtSphmsiDCTk519zr36/T9GhhhjlmJJ3snIwMCCCCCCCFuscvp9IW4MEiwxyTkYqLGpyvEsWXJcjAY4d/JQw4BUoynbrYolbIckMqxS8uiGcPmn+pf+mbr/AP8Ab4fPdZS8YMDAQSGEQjBgbuJOeZYk448NbBXCRm+UPyR/EdGJhjRySYTvfiMDAIgggi1/0HP7uDUZyHJSLGLnyrhjxHpeh3W1LUwjcK+6s5UoVOzHVlrNZhO9kMFYm+Ib36N0sfzidBXpw4YXVgqetzCDgGODEK4bG4cCdVurFawwYOBFgjFfqd+G/PXnr9t0djGLMxMJOd7wJoZEEEWUry7+o8zh10qZyhquCOTDkYErBDypyOJZLUtRxBONa0MOAUKEzZliqamEab3s43dFnUT0NA/cX7wxFgBocEw5EaOFKGNgQwkS2x7OOMGAQ5WCPE+k3/xDo5YuWZmYk+W9jAwIIIgqX+p55nSaq4w5MMrw5MJwMCIWZoyo3HepnW1LUIEB4PJ5dRypraHDwypkLQkHeCbYp5w4lQhbuBqJjq4qatmhOATLIDW0bAhhgnVOQg44HiciCEL8/e/yQ+9Pj01mZmdidk+YgwMCCKONT1bqdtqjiV1x3vaVgxyfAYQaMJ3SxXiuRalquuKn472JgFCrNhgwSVExl0JohhZhUCCkcT/xDhhQzS0A0OSTub3ZisrDgRpuywGoVKIcmGb2IIYv0W/xR/EUOxZmckncPhsEEYEEEAQc3nc7mzpvHZK53ONIGhJPjXBGjYMZ+K6l1uSxSBjiX8lIRFZGJhjgSpgYV1rTiyGcY9xtLhwbIhIsVpS4ZpvewXhNTIWwIxJ6pYooUBQcmEmCLFl7L+V3ub+UPwW6XeOe7v3g+IKmCCCIOp9Q5HKx/PVXKCoIIQOT4DACQBg2aDS1LEWpajjCtweRyaYcKQ242KyjbBIwwuBlJQtCQVZsLLFtFRQsd7BEaPENRbAjkHlWIKB3KxOCCCAFCnnPr8Rv1bxv89wLblcHAPd3d25ubUiCCIOTyebzMCdJFoWKmmIjE+IgiARi2NownFcFxclikYosWEYEBB2SYGRw6vveybwZVKY4IEXDCtmlqiUljjYLSyKeOSdiWS1xEFcAUTYhhztZy3/Sj0H55+qUhnDAggwwEHYOBFZSsZ+p9RmlSnpPCrMdTHdYYSYcjCxMGMGGBOK9ZItS1HUwQThX8yuEQTcJOFPcrizv7u64sKpQXjYBjlGMeWDjmyKdwEmyA8VoYssnUbBEiEFcDJHaRASf+b8S21TNEEEEZGAAFgnUL7eNx+jp0gVVMkM5Bd3KByfNIk0YwIMEqeh6HEdbUsVlxW3Euvqm+7v7+/u2CT3Kwfv72JiSmNHxvbEFS5slBcgg73uwTisxZqzYeVZFKMsAwIMGNDXefpdze97wP2GvlA97YAKlSNeAihRxmQ9Qt4jR4hXHOZyAoaGHySVgqVYNDhDUeM6MwsW1HUiCca908deIgMCkNElJjxiCGYxC5eVxjN7m3O+MzkmmcpwYsQ1wKRoYLNaYJzfs9/V7/DH4lb2wOHjAw43sRYptt4qKWHHALwRAs5YcAGEnyESVERgQwYE7VuLbS8dbUtRlwp4V/Po3vOta1rQAUBoYoqIlgbJIKR2JQu3dsHZLkyg2kGs9Vt0CCrUOrFiwJd3ggnPb27+Fv27+9P4PXq26ixbv9S29zSgHZjxo61gRpuqKOS7FYxMPkIsqKlgQQwZdA0PRZWxFi2pYhGKn41t9MEA7e0qBrQAGoYYJVFlobJgiy0koWmwRCDCSajeVim62EQGt0tVjDa0LqBFnJf5O9/cb+QfuD8gr2BdduteCjklzzUUqWglUrlzYMMMPjoSsoTDDCGBglRoeh4wtS1GU54111Ygggnb29vb26AhhwJVK5ZGwYYsUWklGJaAqY0bFc5EQc21SJrUAUi5n/wBIAIJc589/S6+Nr5G/IfpKZyS46xXWywwCmGPBgk+mso0IIIYGCA1Px7EZo62JajLhTw7+oUKVggmsEAYMOa5WbI0JMaLFl0MEDMdqYxYyuciVjrvUauejhSogAAcRVAEAJut+039pv1D8pROTBOpVdMfAlA6haxGDD6UiQERgQwYQyluPZUwjB1sR1YYpeiy+lSIMa8CIThJUXlkMMMWJL1MGCYsBeNiuXyy++/Aerk8blaWtUAGFAN133I/c6+NTORCbU6KzARZxV6hZBDDD5aA0IhB3GjRoY8rap6XQkOHW1HUiA8a7kVKVYQeJhMOUlUaWAwwxIkuVl1GwpBYNiqWL1zn+KWcHmBQSQe6qurjn16/An5e/aD88/M18eqcqGVS2ckRYrWsBDCTkY1rAlZ2DhlZWAihGospaMHWxLEZcVtxb+o0KQQynGiCCNGCJK4ZYCDDENcsVxDGilYIxbFc6zcw8q7ODyhNV8anhqI4/6TXOUBKz/Q0gxZz3B7TDD4ia1lCGEGCHDiphAaLOM6wxhYtiupEBpsoe6lXDKQcsIYRENZlkaNGiSqOLFKtHwp2xxVOZLOPZ0azo54Bp/wA041XRen9GXjpWqCdwHKH7Yfk0nJwJ1uvpZacRebYsJMMMOQBNETcWCLjUYWqrvAa5xLK2jB1dbFdSIp41vIpWKVIIO4cHKysrHjQwgSox1KtHETDYEqnKmgAIFCCABVRQbFCrOoj/AKSs5EYLL6ugF5wy8IBhhyIAIIQRqLAVIIMK3i13YATjPQ4JjB1sV1YGCVvxbuo8cEMrBgwJO9mbEqiR40bAlUEcFStisFw0MEqnJyIIIIIoBN4CJ3Azq4/J6mv2Yl8IQCdAloaCMFJJ8BAIJsnAgggOwe69r5SRAEfiW1mEOHV1YMIJRZS3IoB2GDBicHCys1l40YHFcBMIIdXEBOBKZyZrQgAAgYEVrA2xAJ1lfux6d/Wa1jX5S6AKFXoE5C9QKxosODgQAZ2SWVgQQwMLF3fkTiFYWW7o1tLYYOrq6suoh49vJpmwQwYNvcMBrlceNGjARCh2QQ6upAJwJROVNCaAAAAB2IGVhBjrC/hh7tTXydfba+itmlVm/nIE5riNBCYcDAwcGGAhlYQTZhV15i9PINyJOmDjuphjB1dXUgwStuLb1Lj42CCDvcErNUeNGjYSLAcNHhhyJROTgQEEQTawL/mta1hYW6mqn8nr261rOv0LTtA5h/mjx5YYx8BBB4nIiwY3NMvPHTik5rIlc471tDCGDqyspEU0vU3IoxsQEGbEQ0l4YwIIEDb7ixLQw5EpnIGtCAKoVVCBQoBf/wBPctfKCffge/Wvdry14a/OqDX2het2/wA8CSY0EOdCDJwcCaEXAAwT1BenFG5pt5dT0tSymGMGV1dWUwRDRZyKdETYIbewUNJfBjQgDZbLQxsiUSwdgr7Aonf/ALf+r/2DkLWvGVe6MpX7gfB1jWdeGvPU1rWv0tC9hAH9JZ0gc1hCWIyMCCbyYYogKne4cdRXgERXPNplTUshwQwdXVlI0JU/Ht6hxyDgEEHYKmkvCSxckRsAaMaGPDgSiXwWCwuJ2CgccUqiwQKEAha1vttfE1Na1Na18PXjr8bv2dNRiY5/pbOmDqDwxjkYEEOTlRgY3395bmTjmXip6HpelqmGDCHDqwYEaU02Vm+lhjewQVNRMY7J2sYaUQxoQ/hROQGrDC5bFYQQQQHu/wBDeeQHVOQv2WprGtfJ1r8tv5vSEJM5bf0J6QL2jRoJrUEHiYTFhwMGb3LwpI0Uq49RoellOCGDBlcEQFGos5NTgg5BEBpZDYphMWdrqJrTQiyEY4wsArak0/4f+f8AxFYVVFYoHFXirVN8xvpde3U1561rxHwNezXwdfkjOnoxE5B623DBwS0SaIgA8DDhQMDGydzdksiSpUq4yCUvQ9bAwxgysGDAiKa3ot59LA+AINRolqthYs040BpxpwRjjS5ksL/6f6B1dSkA3/oeR/6hdoJ1BZv7QCamtfUa16dfSn7JoF2xd+sjmiEsWikPuDG8GHC+R8GnJFDK5XjcgGo0PSykYIYMHVlYERDU+rEMPhus8drAwYCLgjt1p5pw2BOLL0Rew1isVCr/AB/8/wD5U4q8ZaAuN9S+31rGtfZ7+y19JQtrCWlRyeNzrY0MbAYMIPEw4XIwYcdpXXMXh4Ki8FGpelkIwQwZXDKysIJW1NnOohyDtDx2aMGAi4E0RqwEOGhizjRwsUGk0/4Cj/D/AAWsL3m7/YHt11c+rX/Ej9V09cXSuIjMYxMM0FCgDByYcKMDOlrWpq3XnDp508e6sqamoetlOCCHVgwYERTW9L8zjEHIimhlhBXtEEAAI1bCLAwaVjjhx313G03G4WBgBUtAoCAb3Orj7Ef8W4EUzlRJzXjRicAKgXWtYMOBF8daWKSLU586ZjkQPU4lZoep0IyQwZWVlIwppe2ogg5BqNBIIIEEXJFgAtDhpWKIZ2rV/kU7jYLRd/qHB0KwmOsj/o/GKup5rcanm2xic1wHWsHJwIuRAMArixeoDpkAvrJ4zRTQ1TVkQQgxgwZWUqwgNTUv1PjtDkGs8Z3GiMLNiGOKjaLI0rlOBEgjgp26E2GDhtwY6z+KEHzz+eqiutrS1iY0JwsQ4MOTDhfAYOBFgjTqU6ZCNQAQStqWrZSMkMCGDBhqIa3Q8qgg4EU8dsEamy6tik2LcJWEm9ixLXv/ANBAvb2AAaAz1k/kt537tzf3J+mpmw/Fr6paI0J8EZTGO8HK5HisWCNOpzpYAev/AMyUiCIamqZGUjLBgwYMCCIhqfmUGEYE471NDgln7kYEFw4uAlQWahrSo0gCBg4sDhwwO8dYH43f0O/xO/bxYw4tJblXRiZoLoiK3cTNGHK4MWAQwQRcb6oelxSzWWVUwRTWamrZSDhgQwMYMDhSjVP1DjspwJWeI5EZ3tZgaypEsQm8KKBjfcjku3d3dwIgg8esQ/ZA/X7347/O0S1EXlWQxiAoAKkECbyYcCDIghhgggwx6ielBS6jp6cbCxDW1ZQiDBwwYNGEMEVq3ZbaWTAPFscvaxjkSsoRhpbNUjJiFXs8BBBBB4dZ+539Vvf6Ksom+oXRzBEGmBBHhuHA8BASYsAGGnPnSsM++HVgSuIamQqRkxgwZWBBBAimpuVTZU9cEqZjDhsLEKkks8UKMDFYrV11BgQQQYGOs/ag+I+y38AfiuLXyLAbHjGLEGmnawI8CThfEHYiiDDTnnpawGzicWwkYQoa2rZSMkMDGhDKYxEUo1b21WrYIp4bEEMSYpSIbXAcIvippZocDAgggwMda+1H/EieOhPPtjEkRFURjsgg+JwPDc2oUQYZuaenjfJs/wB2t2MCKa2RkIIwYY0YNGhhBAiytrUslggnDstUhocAoVLkuxrHi0qdm3BBAAABBnrI+939Pv8AQcKnkW8ecy2WEARFhYkHZB9J8FFagHG3PKPCmr62rrCwYESIa2RlYHDBoxYEEEEYRqn5tNgMEpZo0Y4EWAhi9Y8mVEIImtAaC6EGOs/8L19iPU0JsJJJIlawsX3tWLsfWFRFWHLm+cVVXnxectngpU1lShEBhDKUYENg5U1sVtVhEnFZo0OBFjkTdSnO80Dsavs7QoAAEB3Osw/B3jeN/jN/gx83p9V9tKdRtEsOKkJaGA73vyA1rQUIqKsOd3NYaIH5QLdsGVgNbIyFSpghBDwwzRGUNbdSoOFnCsvV4ZsFTZC1KEHyaU2V2McDAAggAx1cfe789439Fv5mvM/aV18lt8aWtGMqUwkhvHeNZ0AFChQsMJwZyDAJybBzKL18AREKFShUiDDBwQQQYRhSjKeRQQJQbg4OBKhyLFlFRh8tUoqMIIMDIwJ1eA+nf325v0D17m/dv4uvuhjfCrtdJzXjnFStgxx6NAa7QoUKBNknBJPKZBoDmgnhqo1gRSsrKlCpU5ZSCCCCMaQoepcfFZoNobAlE3w6Xhh86oBYBgYEGBBjq31R+bvc37z4H7A5P2QnFo5dxPEr59sdpSjQ5YawJrQUKFC61gTeyTk45h4ggHOrI4KjxEWIyFYpUjJDgloYc7Uo9bc2iLOI/JRsLK5WvBssh9FYSWDUHiIMdY+0H3u9/D15nw1NfB383gG15XGLEmUIxOTAAAvaFCBAgQoVKwzuDBtk4MJ5rdOXYsFhYL4giLEZGUqVOwe5wQQc60IsQ87jiCUtfHEE1Y/TDZDD5bR6rLMjxGetE/8AAR6tY19nylvJKJ1GyOZSjljvGhWKggQIE7e0KV0QVKlSNg4MJac09MVQU7AvkIsWLEixSsEJ1HUgjWprQiGo9RoErKx4YstcngG2GHz1SbAsHkM9bJ/Ij0nxP0YE1r7vjUdX5FzgcReVYSccesk5EUIO0IF7Qvb2kQia0yMuhjRJjnlN01QFhDDzUrEKERCpHgQwaHwM2rVtyqFiziNapiDnmcdroYfRXHAg8hnrR+Tr8CfohjQgH3xPT667u5YxYsZx67TkCKFQIABrOyIAF7CjVuhAwxJacg8VQQdmHzUqVCRCoWLB4MGBHhoRTW3UaBKX5giTqJxbDD5CGVs3oGesN+SE39WPAek5PpP1HFo5VvElZrHU3MMMoqY40IoAWa1N72TBNBdahDo9eiWJlh0EKqQ0M14grEKMpRlYEGHLBhqahmlKNyaVlZtErHPMaIzeQwZUScCDwEEE6m37XfpHgPRqaIIh+uJ6dXbbxZSvEXk2Ga4dNz+ChV0jBiSzMGBwIBrWSLEYsRNcs8NIyFRBN+alYsWLFCwQYMMMYHJm8Kam59KzjlloHKMM6czQw+AwZxyIy61rWtAQTlt9Gfrx7tfMHs1rUOD6z9LXXzHU0SqchjNGV1McgIqhVncWLYUiABQM7LtdbyCdKvZ1M9IQoEZCoxrWvARShWLFKkQZOCGGCMbBRuXUppflrx45x0ZmhzsEYM49ldjNsHwBhJb96PgHBwZog+Z+k6XXyXV+UvDTnXwzgU8iw5UKijQJhJwAQoVQoztna17XtmlQKR1RujVKxJjDt1D5rEKFYsEHgYSYykahGoIsrPKqQ2hTno7uDncEE0qVo66HgIMcp1/Jj5mtY1NeIyPVrXifI+Z+jJVLXJ6snGDGMSjY2FqQgYLdxhgUKECBdYLNY9rWFoFWsJ2vOW3Dq1uEahBGj4bESJEiwQQQHBEIK67e3t7SBEPUageO14zxbLgfIQQxQ6gAZGequB9iPxQwIPTrxPicHB+o4dXMtdyaOJz+QST0vj8m04ColasoDBipmlVR2gYJZ3ta1ngiotap265TVJ/i1RQDRBGiIR4Aqa2rKwQHY8iNQDWmEE0y1N1M5JLnyEEMpeETXb26AnWmP0p+o18A/OEEEHvPmfQfod9Or5TnAjElUvhMAVVWoONBXqKgooXQGCXsstZ52hFqWsIF0w6vZ0OggF5rRGmEImsbBUoamWLBgEZ1NEawcGLEbqFYnIQHGumu0PgIIIZRZW5M1qDPWX/PH4+vIQQYHgPgn6kJdL2acKnk3EgdPovsgARVVVUwxIQ6KtaaAwzPa9jGBVrStUC9utNOr29ArJjDWtFSpUg50QIIhrNZXwHkRrWDCRBORWJx2srz0d3h8RBNKiIw8+pP9Ifi736N/cCCCDyHtODCfqOEL2tLQklRxuJzrDAqU9nbWuiHgIjytANajGx3bXYtSVLWE7dTRljcl+JT2EGahwYQVZTDN4BQ1muLkQQeZhwYcA1nkV1HqSZ6c9oORgQQAxIw8t3v8rfw9+nfs38EfSDA9A8deRhwSfqeKGew0V8q7XH46rc/agUEarGmDY7hFGSXdmICqioEAwTvZnVLeBRYe6EaKmaODGDKRrWFlTVFMggjAON4ODNainqCLOagzW1sPgIIII0qcny5DA/M383Y9m/PXjv6UQQYHgMD1HBhh+rpgNh4ljNxaKa+TfsTdTQisRo5DgiBgww7MSO1UVAuN7yx65b/ADnH/wAwnaQQYQZrBBUqVIIxW1JTGwwIO973vuJJhm8COolMUYaVsfAQQQQhFA8uqvr5u973v6rU19aIPEYHsMMMMP1JlkU9QuqNKcWjlclnBUyoiGJggo1SgAlSCWY67FUIBDO7uLBhDHPNu6dQrYIIIMImtaMIIPgspNeDhTvvLq8IhhgMONg1nmJQ3Mrz0528BBBBBKSIR49bf5w/PCDA8B7DDDDDD9W79vLZRwar7XbAIiBDEw00yFNEQFi4WAiFjZ/p/oX7+4MjFup8jgccjU2TDCJqa0QVKFCpGhKDUYYWD712gDBO4BrRGFbqCqeqqc9HLeAgiwYR63J34dZf7TfoE36h6j568j8Q+Yggg+AYYYYfoB7K5VK5UvDS6ztCf5/410dkSACCHGjCIMGsIA0MJD7wBAe7rXI/nqNh9k73uETWu0r2FCjVNUyaplM3DhTvZKtsnA8WKtYFnPGekswORBFggDKqmDx5zfc7m8b35j6jfsEGBBB6B4nBhhh+s40WqmcVeYO1UVAgUAghBgQ5MMOEgjCGNDB4LBGDHkv06GGbwfETU1rREYOHFMo8DAdiGA7gwMHLQSqEPBDjgS3wEEWCCOFh8THP4ceA+lHp/8QAQRAAAQMCBAQEBAQGAAUDBQEAAQACEQMhBBASMSAwQVETImFwBTJAcSNSYnIUJEKAgZEzQ1BUYCVToQZEY4KSsP/aAAgBAQADPwD/APx4x3yZ1cqfRyZ3U7f2ReiY3cpnRE7WTj1QC3RXq1A9kWhSmIHb+xyFTaiflCqJ7t0cnOMU2lxPQBfEsUQSzQ1Ut61cuXwxm9KV8M/7Zq+EvkeBCZvha5b6FYzAuitSIHRw2KDgnNyaVP8AYvFymsmE95RKJzkgBpJOwG5VfFQ+u4sZ+VfC/hgAbpLlWrVGMp0wAXQEQ0BxkpsfMEB1TVAVOswse0EFETVwf/8ACc17mPGl7TBGV91FpQQ7/wBijGzeSESpU5RlC8Wqax+zU+gW0KJg9SqL3l+JquY3q6FTqfEfIZYwWyjYEq2xCI6qo9u4TtLtXZPp1qlOpemDAKw/xGkKlO1To4Krh6hpVmw4K8hXnJw6qd1It/YiWCGxJUBSpyjOx+y0YRiNf4pUEizk8vbS1h1Mdgv5iscipqwmdggtNGp+0qhVNbxH6eyfhaulxmnKw+Pw5d1iWFFpc07tcQp4C0oEf+WD2jbSb3Kc92o75StIHDYr+Up/sC04+vIm6GOq06dJjaYAuvAx1WkXTLN8rhTVJzFHCP7uRlpgE2MIjwSaTWFwuGlacLR/apxGIPTxXcUXQd/YaKbC5OqPkqFK0jhp18SylUJDXL4aRs5MwgDW7BUcVWfVL3NJWA/7x6weErB4xZJVHVHiglTYPaE+ZDwZRG6i6p4zGtouq6KbVhaFd+t2toFinYvFsp3LQZTaFCo78rEXEuJ+Yk8ZCDrdf7C4QdUgbDKVp4jTq03jdrgUH0mOHUZBrHnrBVVgfNMQ515Cb/F4V3hwwbqk/GPqaQWBqbrxZ8MkAnSq7cNSAeNdR1j2VfC+Frq6tZjZVDWfSNMENbJXwuuQXshxVJ18PXVTDOe+rGoqt/CubSY4lxvAQsOo6cgh0hah/YUKdPfdFxOQbdTxvrfD6T4R/K5O7JmFANWmSO4CwD9ysIRNwP2rAGYqMusCflc3uIcmOcHGq90GQvxqlR7idXYwn061EUqUsbO9wtTtRaA70yaeiwLMKHtpNFcvAaRySEHNn+wkveb2yDeTiqTdNLEPY3sCsYd8VV/2sZhqgeyu8wbtJkFYb4rQINn9QqmDc57BLFQp4UPGI1u/ImaGuY2m4H5gRcKi92IGhsCTKcGlxNRjRs6ViGOIID2yn12a309A9Uw7EZBjF/FYwgfJSsEeOQocoKkf2D+HSIG7so3UnmVcPUFWk8hzVhMYzwcTDHrD1vPQIYV8QoOgUX1B3avijj5MO5k918RfSDK9dgZ2WA+HtLnPBIO7k0Esw7dS+Jtfq1sP6VT2xFMsWEfhX+DXD3kWCgX3NyeTdQpb/YP4j/sp4I5BRRUrH4G1OrqZ+VyGjz4d4esU+zKML4lVBBexqqVXaqtRzz6ng9Bypyurf2CinT9SpJUDOOcVf6KCpHteP/Ftb46DOVHGE47BVT0VQ7p35kfzI/mT/wAwVYKqN2lR9Bc/2DaKZOU8hztgj1KYOiaOypjqmBN7L0GTDuEw9UHJrtxKadk9qjfnwf7BNmqeEZOfsgN00DZMZuUOgTndUUUciiiiOqHUIOFjkCj0Ub826lv9geqs7ghQiTCO7kAgzcrcNRdueWUW9UDugcgURtzbf2BWP2K8zym4b4bh6zz+PWNm+ihAZOqO2smsUJtPc3ReTfnkKEHDOUWmCFP9hnld9kcXjGUehJJTNeGpjdgUSiUXGUGjIM2N0XGZ+iLUHAZgosNlPIsoP9gXlcmjx8a5xGiUcVWdVcidkXEEqBkGbbouv9IWoOGYKLbt5Vv7AYpOA3Nh9yv4D4Wyj/W8XRdZFxUDJrG+qLjJ+mLTZahnKO4RCnj8v9gPi4qgOztSfXrEfkMI1HKMtDZTnuJ+ohykcEos34NlGVv7AQH1ap2psK1Fzj1cSgW5Btyi8/U34pRYeCm3xNdMODmEAnoVBIXl/sBo0fhrqTTNao7zegUn0ThJIgINCmyfUBdFlp+pIKlvCD0RYcpVWqKhEaWMlxKOFo0K/iam1l5f7AYla3iRuUdIb0CNeAHwqYhz6hcUACAAEAZ4h9IQUHDhkIt2yd4btLjcEFU6/wAEo04IfShW9r7f+JXavM556bKX5w2QOiJJ+rLSp4QocYUsRHwus3wnQ8wHLSwD3Mn/AKpKhzV5DCJeTmQ1SUChmeIKconIo8uLEqRwa7KLwuij4UwA7PMhW9/2YkOfUcQ1qwbQQKZA7ymhzSySAtLb9V5jmIUklAIBSbIpyOZGYVlPAeE8JUGCg7K6h0hNfdAGzVAI/sADcM3TMynEwUKliFoAAy8wzsrkIkobpvZNBWvVp6cEnO2V8ynJwyaVKORTnIqk4Q5qoiSHOTGGyh8I914d0yq2WOAI6FE9Fiql2UHFOY7S9pa7sff4uo1GTtJCdMFFu6kq+UIlyACL3IAXC0oytSLRkSjmQhClXVs2hiiVJTRGkkojdBwUpvZNHRAKFZXV0U14LXKsXy0EBbTdeHHmKZiqTmFvnAkGFD3Dt7+w5aKxBUhp9FKl0KFZStRQahpQ4AgpKDRnK3y6EJuRykoown0yEHjKFKsoC3ylQVIAQAtCaLklGs50Aiy/Fqff39gytQD1qw4PUZedQFbK6hDhLsgWzkQVZFEqFKIRGQzCkJ9Nym3BZbqVeEUWFGFZBlOo5S9x7n3+D2lpRbRLT0OWl68jeAu9AMiiUUSgEStPInMhFHOVByjLfKUXVNuqkNgItN1CstGDI7n/AMqPssDSeY6ZeMwumAFpaB2VkDlIjpnKAyHVNi3AeGFKK9FClDOFHBDl6JrKZcVDtrLWApUuC2Z/YBIcOkIiUP4WO7uEdUFfMNy8s98r5zm1ByjKcoWsDuos5AgEKQozMGE97phPqVWsDbd0+idGUDKLko1KhPT+wCCEA5x7o6tBUEjkNajKL3hqIjMlQoz0lvqgUDkUEEAg4ItOkobhTwgNbC8RoPooOUhaQGf2AwqdYO1DYItxIt5c78hpqFxTQmkFNKagSmd0OmVkWuhSBKBysjKtlPDfKzZUtUOlXWlkovqE/wBgWoPZ1IVzlfgjgkrQgeqsoyKMqMtS0mcpyCHAUc4yhkqdiiD5gi4hBlBoU/2BEYmmBsd1FVwB6qyvyJKgJxuHEFPENeoKuhCZTG6nZhRfaFKkLS6FZFW4Xat+G6e+jLU6VS0edoKwtMHQ1Go8joP7A4rNX4h5kIdkHBQVI3THG6pprBYDOHKFI5gDYRKIbcoCGtCn+wMtcCpIJKtyJKtwlHKTlCBUrSVIU8qUWIIsaAE5xJP9grTZy8vIvkBw34rWy6K3K86B3QTqlUybRZNaCSff2yHdBDhCtxSVYqUBkEE0poyEqMhlZeYhaHWUtHJ3UPKlNptuUSSZRIiAVPvqXEBoJKqv+cwqfV6p/nXZ5VT85TuryqQ3JVAf0BUB/QqP5FR/KsOeipO2KqUQTuFfj3U2UAKAjK9V6o90YRPXId0CgVOUOBWqmSFLeTDXFPFQlrlrlB26b2Xb31LnBo3KZRa3VcoHOM44w4QV4c1GiyuM75+VS7KGokovdCcyLJz4sU5gT3bKsAnAwo3ylQg4KRCh7x68nTTN91dQ0EqDkffUGrqKk8wIZA0nz2UOWpivweVXVlAK1kyFBJhBzU1rBZMdSf3iyAY2RdNI26FB1R8jqmCnLTdOYpUKQrqK7uO2RcWgIkiQobHvxpplyvxEdF6I9kUcpTgiEajS0J1JxkKWxwWXlysiBZOoundaHE1Kcg9lg3C+sFYdzARVaqRafxGf7TdIIcI+6pkQXtH+VhZeTXYIKwbWWrA/ZYd9OWvug1yBAzmoeK+YL0OitHvx+EEZRKhAZhN7IcYTarYVSk8giyjOy8meobItcRHAUe6Pc8J0jLZQ82U8dlCn34gqKTVJQYJUnnAiU02ITXtL2AIh0HL0UhyjJpCmSOU6o4WXhNhXC2UvPIuVLvfnUQPVeRo9FGV+dZRUP3QO+0INrE5wSrnK6notFQ8g1XbWTW9FJV1YLzHjgKx+yv786qrRCAsoaoUqeEHZEccBTVP3y1EcF+DWEW2PCeic432WgKylQrcjZAMP29+pfKuoGV1ccBOUoIIIFeqeNiqjGFHVdFrC5eMCR04rq+TH7hOMljgq46BVT0VXaEG77qLlDO/IhSV+G736hs5Wyg8F1J5LXCHCVh3O1aVoZAai5+JB4LZyiCgUEE3smkbJrVO2c5RlfgvnFL35JstNNDKcoz8yMKFIU8gVqRRp43GNPRp4JHCQjlGU8N+OFJV1V/hhVDZZ1QNxsffiSFFNozk8BRlWU8oIN+J4iOrFPBfgnIolFX5t1ZU3YQUnAEEEFPwNfvRf8p9+LhGBnfKMpQChBBDLqEQhnZaQUTj6ju7VBU/U3WyAOlUsZQdSqCQQqmDrOov2B8h99wXgK/IKhFXynKU43aYVRoui3cFA9VLSoxInrlJjK+UK/CMiijzIY49gi2pKkC6ZjsOY+dvylOaXMcIc0wR77W1K/KKPG124TeicAUWuBPfItdKDhI4J4TORGU8wMpPk5FkKQFti6Q/egffSSFppq6nKMr8ZR4w4QVLC4IluTmkg5WU8qEOXUdh3BjZQIEoghWCbVpuY4SHCCE7BYp9L+g3YffTU6y0sjkjgumxyGupOB7Lw6rx0lWRWohpPLCngjkCnWa0ixFwv4eoK1L/huWoAgrSQpAVH4gxoe4tINisZSbNKo2qEZIc0tcLEHf3yugFMoKeCMo4CipyOcIKAVeVIyLXSEHsHdRyZyjgJRG/DsnMxLXdITK7DSqXDgnYas6i77tUGVYIOARBhYbHjV8lQbPWKwLorMlvR7fe8poNyETfK/CUeGcoRGUqLrSE1zVdSVqC02OZpu1BCo0HK/KCHRTlbi1NRY8NJRxOFbXYPPTQe1pRa7dBwCkSEQmVWFj2ggp7SX4R33plGm4sqNLHdne9bnuDWNLnHoFjagl8U2rCsJNWrVevh9P5MKCe7k2LNA54QyBVlpBR6lAjKQuoVsoRplMd9BHDqajTqSm1JYdnthHC4mrQd0fbLSQEHNygqQsPiWltWmHKvRBdhna2/kKcwlr6b2kbghAdHf6TDs8e8pVbEVPDpNk9T0CpYRoDQDU6vKfPzglVAJhSLgK5Uq3IGcIolEZECy3BCfWdKIUZyix22cZPCB6Jqb3TUEEMrcZnglqutFZoJ2K8PFYfEt2qBBwC0kFbXVp4WG5aD/hA/8tn+QsHXEPw7B6tVWnJw1TWPyORpuLKoLH9iI94oWJxEEeRnVxVHB0RTpi/Up4EA7p7hLVVAu6yibolHrlbOIU5RtwzkCE5qsnuqk7BBvDK1BFpIO8/SxlKsVdaK49bKfgtE9WlpUhuUOAUsCi4RUqOHDYoRWpNci0l2Eq2/I9YmgYrYeo31A1BNG+ofdpTHbO93alV4ZTaS5UqJDqp11EG3edIT3mKTbdyq9V8OiFopgKTplTkYV8pVuI5BF3BAV+OVqbI3Rkg7jlRzroiow9dQXj/ASeoYDlIUPUtGXxDDsNfC1joG7IlYsEF+Lb9ixUsbDCWh6I4iqbt6bVg64h9BhT2Avwryf0FVKLi2tSdTPr1U7H3YjdVsTc+SmqGFZpZDR/8AJVR4/IO/VU9zLj6qdk2lTEImm+F+K8O3BIU8Dio5MlQOCRyZC3cwXUhRwGeGEeK/DZeYovr0WASXPAXgfBnt/SAtNQDurZRCloVkaJfisMPLu9i8CrTrs3aQm4ihTqt2c1RyadYRUY1wVB0uoPdTKx2GMPol46PYiz52vb+5pTTsR7qHoJJ2Co0oq4jzP6MVapZrQweqYLm7u5UoIF7R6q0IdV/DYkVR8rhdSMzHLjgZRbLig9uoHlSF/WwKdxBHAMoUzwFbK3IshLka9c4yq3yM+RaqLKIRpvnshUpg5QVLRkCIIBBX8G44qg0miT52o4RgY4zSVDEAGm8H06qDy2PEOaD9wsDXBilod3YquErmlVH7X9x7pQtDRVeLlNHTKM/6s6eLoOY4XhPo1HUn7t2yKJ5wa0ko1nFo2UtNF55YVjUYDPHHRTzLLQ0lVviVSXjTQBVPDUgym0Na0QEa1ZaXuXmcw5XC2zZWY6m9oLXCCFjab3/w1Vhp9GlYrC1n06ocyo3e91XZYkVR2dZywFYw9xov7PTXiWvDh3HLGMo2tUbdpRuHAhwMEH3R8Y+PVEtHyIlFEZyVAhTkWleIzx6XzBakTzbKyJljVWxNQMosL3FOpllSvXh24a1RzNQL6Viuh3CnOOO3EVAJ6BOx9UOeCKLTP3TKTA1jQAOiJBU1HFQxz0adVjgeoWoNPQgZRCkDgtRxTBsYcpTgAPnA6FOouJp1n0CT/TdqrsgV2trM/PT3WHxTNdGoHDlax/EUhD27jugR7nuxNZtNu3UplJjabBAAzCGVpzjIGWHYo4Wv4rB5H7qdtudjHsijS1Kq868XWA/Q1UcPTDKNMMaO2+VlHMDwatKzkQSCDOYzA4IyB4A3dOxBDq0in+VNptDWiAOinKXFA4dy0vcOxXi4Zs7jLZSOBuJoVKLtnBfE6HyBlZi+JM3wNZY7/s63+li6bpOGrNP7ShSewkvo1WbOa2NX71SxjYkCoNxyjhK5cBNKofc7/fQIYehMedyAV1h6LgypWY1x6EptQSx4cPQohSoGULUMoTMVRcx4TsHUdTO3TlDOd1HDbm+I3xaXzogkGx6jiI45T6hDabSSmUjrqeZ3DLioaQFprk914VbQTZ2VwrcRixT/AMyJ6rD1hD6LHf4QoubWwR8N7TOnoV4zIe0sqD5mnksxVB1N3VPpVHUniHNJHuKOQK9fxCJY1Qi4qjgmljHTWVXE1HVHsfUcVVw5llSrSP8AkL4i2pSYXtqgmE7w2lwgnhm+RabJmMp7eZOpuLH2cOKUe2ROReQYWiBx35uDxLi52pjj1asSL0MSyoOzl8Ro/NhXH9t09hh9Ko37tVM/1Kn+YJnRzf8AaZPzt/2mfnb/ALTDs9v+0z8ye/5abz/grGviKOn1cULGtUn0Cp0gAwABTwWUSoEDdXBRaQRuEK9Bjp80QVtzBMwJ5QLBiGDzN3QO3b3LfWeKdMS4puFoNps/yqNBhqVqga1PeDSwtm/mVbGVTuQTclU8KxrWsCo1RFSix3+F8ObXFZlANeFKvnBWoIqFpKZimamga05ji1wgjKVdDMHoibASU8kFwWgQuv0ZnKowBzP8qp1KDrOaCsO7ekz/AEsA7fD018LfvhmL4R/2dNfDGbYSmsEzbD0/9BUG7UmhDsiUeMNui+5XlJyNCqJ+VxWoAi4OVvpBUY5hEghGnVq0z/S73Kc5zWNEuOwTcJR6azu7ssPhZaw63rH/ABSpZrnyf8BPs7EOVKi0BrRAyJNlAVlfgIK1DI9E5huqOMZOzlVw7vO23QoRwFeMwPqOIVOhYNGUKfpZshuAghkUUUeVC1u9FARLXqCQpRwrwyoSaZTKrGvYZadiFb6Xw8aHdH+xs/8AXWsDsRU3NmBPxbS19RzAf6WrDiprrPJb0aqVFobSY1oGZKiSpVuGUWoORG2RYVTrthwC1Ami6FiKBh9I/cJp6q+4VSs6A2w3K0sAQnKFpQPIjmXQO6E88BF1hscrLdFjtUGDnjGYttGiNbD8zVHT6U1cNraLsUgH3INgNyQF4LGDrpEKAXOU5BAI1Co5EosMJrwp2TmrSg6LpjxeCsNU3ptWGaZDAmMEAAIKTldRlbjnmQtkDwTxjMAIuQCCCuqdfxKT22hVsI692E2OTcHhg83e/dSfpQ4Fp6ghGhXq0j0NvcjxsWwHZokqXTmEECg0cNlOUKVKLCmvTHo9FXp7KtTgFpQ6tKB6FPd0RG5zkqFClqhTwWyjmRkCns84EtTKg1MdIRR5ZzJWmuPUJlZha5oMhUv4/U//AIar0nFjYNPoUI+lugNFcfY+47i4NaCSeidhmmpVjW4bIZBAqVGV+GDKDxkQctQT6RQO6a7YoFMPQKkOiYOiA2RkHOFIUHOCrZ2UFSObCazcgALB4cwHGo7sEaeONdlAikRdkr4XWID3mkf1BU6zQ+m5r2nqDORQ7od0T0RPXklrg4bhTSaepCe2zQpFxCI2P0wr4eoyJkWTmy1wu0wfcUuIa35ibKnhGB7gDUIUk53UIu8x47qWosddBwyjIOXZVmJ/VORRPVSrFbZWUjKCpCgqRnIUHKOW1m5U/Kn1cOSHGQb5O7FSIKxGEfroVXMVXH4JlXXfZyqdXJ3VAKEEORL2/dRA7BSFKrEh1J1xu3ug4n+lwNwVOYG5TO8rUbWRG/IlXji8HF6h8tT3FDnvrubZtgroklOKKMI1H3+UIAQNuSHhPom+ya8IHgYmjOTLXQ5TZ1ndQpatvtlJzgqRlBUjO+Wps8gKnTBLjCEwxVH7uWqxQLSC2xBQp4h7HWAemt+yovaNLAD3CcxxBX8BidDzFKqg4AgyDwFOCPDOVyUcrqeqp1HB5B1LTbLUImFUpu1F2piBjK3IvlI4fFwxcPmZdSJ9w4Dl4eCZ3ddSVNygAgtRgIU2wOVCbUF09hmmURaoCCmuFiiipRJQZupGQf6Hun0zpqf4PQqWtPSOCQoOUhQcpCgqWyocgbKOAoM+cwqTdpKqP2GkJztySpEjdQUdwg8Qd0Q8VU9ohxkKg4+eoQqRfDHBw75Oa8YOu+QfkdyTwQDldakWm2WkAoOEjJzzoFmqMrci6lQcrZhzS07EQvCq1af5Xe4flP3UYaiP0LU5RlJhaG8q6lObsu6pVVXYSaZlVWWewoHoi7Zqi5R8WOikQc5a4EAhaWhSo4ZGUFSMpBCgogo4djKoplzYumH/AJD1O1ArE7CmAFiawvUI+yr0658WpUdfqU2oBsiM+oUGERcJmKoOpO+YCxRY5zT04HNc1zDDgZBQx+CY/wDrFn8zyhXytnqaQn0nX2Rc2VCjlwVI4qf8YNH5Jd7h+X/IX4NL9gUCcwLnlhBBBQoKad2hU/yhSbBBrw0lW1AIhwWps5y0nsTwyFBVlIUFXCkZQVDk2qw03bFAE2UIINKbVpeI0eZoTqbgm1WqFCBbBC0mVIRY6Qg2sXAWdwihi3UDtVRFuVdTlB4LIE3C6KQoKjKRzrLRimH8zPcOS0eoUNYOwGRKDeZPAUe+UIMbK1NbWYdkK9NzSeiNN6i2Vl5P88MjOQoUEKRlIUOUFB7AUEFBQIIOxC0OKLHASmvblBQe1aXwtQU0g7twuo1WVGmC0goYnDUazTIe3lXQQ4ZMcMc6N8/Jh6nYx7hur1WdGNIJUlSg0fRgKU4gLSdLtijhsSPyuQcNQCLXLU1eVEN4rKFOUFQVIUtV1ByngD2GyLHEqICkTl0XVSLrVQeOLXQqYV27DLczzoE/RECyM3OevBO9CCpaD7gurVGU2CSSmUKQptGQH0Qykrw2rVZ2y/qahWpEf1NuF4lJzTuEQZWkqWpzALdSp4ZCg5WV1BytlBRBUtzgqQplaHBahBVlBQewhFjlqa4HqForVG9jk+uYFgnMFnJ1MwQjg/iFCpNi6HIOAI68oN3Knbgkg/RXVlcZ68NWb+kryD3BBdVqnfYKVH0Zyi6FRqNM+ikQ7ZaHyEKNcOHyvUoscpCaaZHUFFrlIUHikLfK6kKQoKgrZSMoUIPatLkQ4LxGqQtLlqEwiFpxJOU0NQN15CSUTSDxtC3QxmAYCZfTs7lajdAMsrqykqPob5WV85a4d2kKC9vZxHuBAlVNDyRDSo2+m/haIMFNqNEndBwMBFjiCUHgArxKRbFxcLxGQdwuqg5X4pHDBykZQoU5wcpEotci1Aq6lsZfKcjh3/pKw9YS1wg7hMbQNIHI4PHBpMMqIcibq6t9P5eC6ivXHZ59wDXIqVR5BsEGgACAOeeQzEMIcFU+G1xv4ZKbWYBO6LPMAocFqgrwMWR0cg4LSVZBzQQrqeCeGFBUtVlGcjMgqQoKgoObHVS1EFTcKaBOcbKd8iCCNwZCGKwNN5PmAgoFA8F1AVo+nvlLTwXUYvEfu9vzWIqVLUxcBBogWA+htyGYmmWOan4HEuo1Nh8qbiKUFGlVc0qHQUQylUCDmhAhaSpYQoPBfKeIQpHDIUhQcpUFaXBBzcpstdF7Vpc5vYmeI06z6JNnKUChndSggFCnm2UHkW4LrTjqvqPb0I4lwe+RTCDRAAAH0IVuIZ+PQNRg87FIhxgjdXZUA3UOC8fCvb1haSB2MIOaoK8qkKDwXU8UKQt1BztlKhWUHIGylQVLZXh4l44vBxFOp0aVZrgbESMpQOV8oRUqBzo47qyieD+d+7Pb12KqgD5Gkaim02hrRAH1EBXQIyFwUMD8SlvyVV42FPcDKbLwcXVb03ChSFZSOOcp4JCkK/BbhhaXhahlqaQjTrtfx+Pgab+rbFQo47c+Qr8V1ZRwRiaZ7s9vHVHNY0GSmYWiGDc7n6kORaZCIcpy1YdlXqxy1047haaj/uoeFFam/uFCNpKkKRlfO/JkLdQeCRwQVddCVIUFa8PrHTjBOIoE73C3RChajwyPoL8G+V1bh89B3t2BcrSDXfv0V/qpCLHKcgfh9VeWktNYjvdQ4fdaqDHjcZ3CloyvwRxQrqQpV8o4LcGly1NV0K+HewjcFeHUqMI+VxHF4PxGgZ3MLzO++fXOVeFb6SxV1dWCYCATc8HkoH27dXrMpjbcprGta3YD6zU1Fr4UhAYB6LWsXnpuy8TB1W/pUDLSQpapHCJV8p4IykciVuoy0mCg4LcLwMe60B4nN7/laT9hKrMEupPA7lpjLw6jH9WuBQrUqNUbPaDldQM9IULblgL0I+4QOdlfPdXVwoanVMRqOw4JwzT2crex8f8AS4D67vrZC8OpK1sX4FOn3ctlLKeWtjm9wtL3DscoIykDivlPBCiFLeOeGCpEFXU0qOIA2OTqtRrB1Ko0QAAwEi7nKhVD6JDKsC4DUMLXhnyO2Vl4/wAMo92WyuhoH2y6nZScohSOTFhcqq+5Ib/iSqkQKxJ9QFUZ87YHdtwp6gjO+e+Vwg1i68E4NysPt7clxa0dTCFGgxg7fU24dj6rzQpxTGdmo2U0mKFEKKmcELUwcUZSBwQoUqeGMpU5RlpcFram4vCVqRCLSWkXaSCh/GU0aIa7wtcEWVXxoGGYAW3cml9IBSppYilOXmXlytAyvyiSGt3K0C9zl+IMoJcyx6jur8NirrzD7r5WKyjOcJWVh7c+LiB2YpP1NuGwRbVCjE0n/maohfhNV1ZaoKg5QVIHJnOMoIUt4oylTlCgroUAfQr+F+JVmgWfcJ9N7XsMFpWBxAAxB8GrserSvhtBhc3FNe7o1qfiqxqO/wADIUccL2c0q2UqBzDMN3VH4bTHWs7ojiMLSqEQXCVARFTUQVZYnBfEqbqZ8obLgqWLoMr0iCDuEevBZXXnatdc+igKc5w9Yei8o9uJK0UnVPzK/wBXbOXhqhwU/wAKrheVqkqGrW1aXHOCFrZPJnOCoIUjhlQoOU5RkWlamha6FLEDdmQQHTM069Nw6ORrOsVp3UuVuXpaSm4XDVMRUT8Q+pWf8zkXfDKEOKiznO/wED1K8Y/MQ0KMbh4G7FUoY3wIIZU6FRUeOG6hwKl5PrlGc06g7hWjtI9uHPe1jRcoUaLGDt9bDyEAxxJ2Eo1ajnLzhRUw7ezV5wtldfKpDVDlByhwWppvzYyDm8MohEIoOGUFFXTcVhatMjdqNN72HdpI4YMo+E1x6hSg0XHM8jkf4CgOhcFhKtSoMRpiLOKafh1NrdgSAnAxH+VH9ElOIIIAaqeH+L4R9USxrVWf8cwtciG1XSxfjVPsM75XUBxU3UcHRaX1B2efbizq7hvspP1ulwK04GsfRQ1q1VGrxMYezRC8wVgrqXNWwQfSB6hEE5wd0HNB5Eq2UZyApV1fKc4UhAjKCiCpaLo4fHmp0q8Ouqxu5JQYxrR0Ckg8m3BLHfYqfhTD2eFhXfCxQ0OZVH6dypwBb1a/Imq0QMv/AFJsdGLG4jHfDX16TGMDSWBq89Q+vDdeRQ3M5eYLTiaw9fbc16zKQG5um0mNps2A+qui7V6FQ4KVNCRuF+BTog3cZORZL/yglGpUe/8AMVLlbKCIV7rU0g9lcqCci0rWwA8mVbKCoK2UjglSFGUKQpREnIiLr+KwDnj56dwpE8GvEeIRZq1uWkKMp5ev4RVEbFNr/DKdGlQqFzSJcGyEPCxI7VMvxcnYv4y+k3c+ULGfxxoYrR/L0hpLVIJ7knitCtw3CjFv9QD7b/PXRP1ULRWI6OX4Qcphaqbx6Ep9Su9zuhIClGjhTG7lFlpcg5qChyDsuqglXy0uAlBzQ4duROd1BWykBSoUHKRnGQKsi1yghCowscJDgQjhcbXokR5pGe6LMM3u5aRyIyjh14XF0z2K/g6FWkWTrT8FiHUnmfFph+R1lFtN7uzSUKWHxHxBlRvitqlPq4XEY2q6X1nKGj7Z2Uq6vx/zDPVntsXEMG7iAhQoMpjoL/WXpOWui9qj/ZWpp+ymvXPTxCpcD0CL3egUKCieqBFirqFK1sW6g5aSEKjNKgkcyFspyKgqUDkVGWoZQVsv+Hi2D0dmalVje5QDWSLAIDkweFlL5l4rqsMcA5vUQsaypUYMLVcdRggL4m/HMfiaTw1tItBOVTxNrJ9ai+m1wBcN1XdIOMAYTsmYbC06DTZiipp6AKykq2V1HH5qB9tvFxc9GKXO+s/Cnsp/yEaWMr0z0dIUUap7BSXHuSVpbkApUWRaVOchFQcy14EoPaHjkyt1fK4UqRnBUqcioUhWUOUOCGNwNej+ZqLS5jt2kg5ePiyejFoEZEDYFHiBUKDwaazHeuTsPTLxSL7gQCsYxrT/AAJu6LuXxAF38qwAHq5YgDwwxvjHYTZYyloPisnYshYmuS+rXYf0NGyhanuKhXVso4yobQd7baaVR/5j9aPDctlPxKtC8Oj4Q3O62JQAyJzDm6Ci052Wpquc4MoVG6SUWk8c5bo8EhTkQVBUqc4UhXKgqSLoUfidYDZ11YpuEwes/M4SnueSdjkCFZRxSo4CGgjoVLQfRRhKlwFowNIOrB7mubLgmOo13B8NMAFYejo8RxJbu4DdUK2LfUfSfAkgkJni1yKb9TnSXbBBrHH0XkyvnN+KVC1YJx6tIPtrY/YqMEz6wlUabHB1UBx2CgEk7NQ8erXduT5QnVHaitIVlfgg6kKzJHzBEFBRCBat1B2z0PF0KlMOG/XkTnBUHORlKgoqVPBKgqCgMXRPdiOKxtCkBaQSmsaymLSqepoa6Y3yhGF6ci+c03fZTTaqVdumowOCoUmFrKQDT0VEN0kMjsVgmiXPpAf4Xw4ENGJYTtAVJjQ5zw0FYas9tKnVa5xNwMrq6hFwUN4oyD8LWHovK3208p+y/lGcw87vsFgMM5zXPJcOgWLrktoM8Jncp+Jx9HW9ziXSSSm4SiWj5nWTq777hBjVKiQL8TqT2lMcGvad1BykKQt1GVwg6WuK0uPbkTndX4iDlKnhLXBTXoH9Kl9eutJolEuQVlLVPRQoUcV8pBCqskCk5w/dCe2oA+i5gOxmVjKeLYRXqii8dCsFicI81aLzUYbue83Xw5lE1KWBYXKli/jFCGgaKTXVYCoYkl9ZmtrbNaqNMRTosZ9hlcq6hancc5Sx47hRqb2cR7aWU4QfUzsv4PBOd1Ngi+XncmSrrXiamIdZlNqdicQ939Is1FhlF6iwR4pWh2h3ylFjlBWylq3UHPQ8IV6QINwo47KcrqFtwwoUq2UZSrqa9EdmLwvhzO7zKZVgO6KB5bKqDujCgwp4I5Ie0tKOOwdSg61RmyweFo0qLsK91ZnzBFj5GBsdmJzqXjvpCnVrj5VpaG5XV1dHYBQJ5MOWnEYgf/k9tf5U/u+oc5ukGF4bYm6ZU+EVDuWOXlaU97gxm5Rw+EFFhi/mK2uSoXZHka2wjUBY7527FFrvVbKWqcoOUXRDoKhwcPlPIkZweMjKc4y2Xj/FGUlTpUKbGtgNaAhmYMKHKRzjIe35h/8AKo/ER41N2iuAhh3ePiyH1BsEajzVOws0Z3Wx9EACUXEkrSxvHOXnb91/M1/3+2v8u+/9Z+pLmOPYIM+FOZN3vRMLwmTHmKN0QcoVuSQQ9tiE2rTFVu/9S0uUgKQt1BzLDKbiKWk7wi1xaenFbKRlHFOUZTlfIWleN8ccT0chaEeyd+Up/wCUp8fKVuoUjk34ZOptnKrUOl4LQgBA2HB5QgTpCkgKOT52/dfzVf0d7anwatuv0J5GjD1HLx6jKYNmrWdRysvNlZW5EXQIQZUc0/I5aHx/pTCkZwcyx4QewVWf55EqcoPIgqysVfLyOPYEqphsfVrsoioS42KxYMDB0wvijtvCYvip3xgC+J9Me9fFcVXptOLqlk3TCLE7LScpHDOcHlilhyevRSFcFb8I4IcT2C1vqO7uPtrNGr9/pr5fhly/hcI2kz56iL6gJPVaKQGUKTnbk+qgmV4lLe7UWkXWpqkZxlDpTXs0O6rw6hHTpyJUqCr8mQt1dFmFrO7MWGx1N764qfNbSvhf5MSvhTNsJq/e5YJu2CoBYcf/AG+H/wD4Ca1sBjGjsGwgoKIUj6OX0aQO11Kho5MqGVD2aVLR7ayao+n1FUsNRL37NCdjMQ+qT+0LxK7AgC0egXnKJPNtlof6FaXeikBSM4zLHIYmgSPmHFbORlB5W6uo+HVz+leF8PpL1zagTEZwcpHFbKDyDKbRpue4wAE+vXfUd12RJCgDlTQrfsKlrft7a/i1R9NcLS1a6jMMw2G6lS4vIVwUJKCvlCvyIVlOXiUh3atLlIHFCLS0FBrvEb8ruIEcUjkWV053w2uAhTwlBpBBDUEO6CCEv9UMiFCkcVuC2R4TUreC35W7qYQty5p1B+kryj2104hw7hRkco+hJlypfDcOXH5zZoT6tR9R5lzjKko0qNMEK2Uq+d+Oc4QTW1rnyuRp1CFICkcRa4JuIpGmf8JzHOaRccNuGDlKKPFdGvh6lMEKwHiiwA2umu2dU/w1T/Q//JQ/9pw//dBuzf8A5RpvyGRDspHECFfK3F4VCpUJ2CLnOed3GTlDeXDKh7NKsPbXRWY5Siuh+joYCgXueJjZVcbXNWoft6DI4jFMbCDXQF+HUPYKQpCuojlW4dbGvUFSFI4gx4uvFp+K0XG/Itldbcm601AjFoT+6ef6k78yqH+rOcoOVhxmVdW4oaykOt8pjmacLVPovI37e2sI1KDXZnKeez4fQneq75Qq2JeXVXknMNbVqqHFfy9UowFZQ5W5l8yWvYoP+VLQrK3CWkFA+UmyNKofynbk3UFTkDwWW6uvMCpaOGVBU5QrqQr8NsoKtwyV4uJqHo3yjKBkOVGH0fmVvbbS80j/AFbKCfQ8BHOpYKga1Q/YKrjK5qPP24A3BMHcqWr+WqKEApeoCvzoeE1r7KQFKtxaXIYmhpPzC4RBIIuM44oPAODdbrZSOAIK+cyoercVsrqRnbLw6NR6/wDkk5W5muqW9G+25a4OBuEKtJrx13V+aUVdU6FI1ahgBPx1YnZg2GZcQGglYyqJDICNGmGHoF0UUyB1IUZSVH0Esa7qrhSFZTw3Rad1IFZgsRdA8mMo4r8m6ls5Q5W4rZQVeMghCuoaymOpk5iMhyYa4nsUXOce59uNJ0HYqDz2Um63rHfEKkMouFObBVaLiKggqrWAcXhrSsLR3l5VKmIYxo+wRMiVDl1QbpynlX5HkLeyiFZTnvwaXApr26HbFGhUc07bjI8M8gonK+VuK68uV1HEIUq684QkoKUNS8Su70yhFTHJ0XcbnYKKDz7cwQV4jAVBynlSgxupxXjYas8jrZeb7EqjUeQGnXNzK/CYPRTlDlscj4tP9uU5TyL8V8gHX2KgqwUjPfh0lNxlD9Q2XTqLHmyjw2zPBbgHI8wUOcFJjIU6NR89LJxucwpPAMoy0tDpv2RJkrThx3JVvbnRboV1GQ5QYJK1z2WjAAdwSiZ/aVNZ371DBndS1WU1/tldR9EQVNlICkccKC26AP8AEM2dZysOWeG+Xl4rryq6uo5MOCgyd4V1ZSWUh134WwhCGRlAKTATGm93okycgRSZPt30Tt2og5SiiiiiioystGGYz9KId95CLcSR+taWt+2d1ZdF+O9X5w4rKCtlKtnHBpKZVY6m/Yo4eqWHbofoL5W4rryq6vnHHcfdXp/ZXUNd6BGtWe8944IUFFSoQ2XVxgKbN24NdYnoPb1p3Cb2TU3JvES9g7uCgAdgAoetGLd6uC8rT6BWz8q3PYIl7j6n6WVBW2UjkaSEMXQt87dkeu88++VuPyq/DfK3BBH3Vqf7cvBwbz1Kt68AQygp7j6IN+UainOIkqM9FM9z7k/jUh3cvM5DSSocx/cLXh8O79Gd15Vpw9R3cwFcn1PNjkXV1stsp44KIhaYrsHld869fp/KvNwFCUFZDPb7ry0fUKSAvCxdOi0am0xLlham79B7FMcJZUaf8p57J4EoonqAmN3qT3hNHytTnb8EoNEleI70HuT+PS/cvM/7qUH4Zx6tXi/D2jrTcRndeUIMosphSeeI4Qrq63UEKY5JbCbVYWPgtITsPWdTO3T6G3F5Vcozyrhfh0EzCUKld+zQnYitUqv+ZxzqDZ7h/lVabw4PcY6SmYlogw7qEVKjhvA3WqwPuV+PT/cvxHqCg+k8by1RWxGHOxEhRnYei1vb9+dfkXlWChDUFsp4BwQoLUMXQt/xG3CIsdxY5X51uK2V+K3BcKWUUK9XwKTppMPE+m9rmOggpuMEOgVeoRCBzDRdVKp8gt1JTKTD1MXK89QdnH3K/GpfuX4ripQNl/B/E2P2AeENUt2dcZ+FhS7qVqN+/wBJOUBS1QoIWykcmFcINPjsFjuMzy75W4bq2Ucq4WIZgGCgJc4pzTDpB6zxvpPD2EghNxVAO/qG6gonYKs7s1U2kEy4qFMqKtYfq9yoq0/3BS85FrpCDX0qo6rxcFhqndmVwvDayl2H0QQ4R4jmemcEK3KIITajCx1wQnYat4ZMg7HKeXfK3DfKRyrq4U4al91TqiHsaVTdem8tPZYxuwDljG70HqsN6T/9Kp/7b/8ASxLzDaFQn9q+J1dsPA7uVXB1Nb64/YE0IDYZQpNstOLxA9fcr8Rh7OCmo71V8vFwAPVi8X4RTP5XK6116fpcrxKzldCPoBwSoC049iIccgCpHLhNxdD9bNl0O43HMvlbhvlIyb1Q6DkXC/lqf7uD1ybMwnd4+yJ3JzATRsZKe/5rBAZRjan7fcrzM+4XnV5yFXB4hpH9Cn4dXp9WvV0GUq9XsIWtzj3KIKJH0c5Q1acWH9ig+HRvldEEKeVBygiuwWPzcu+duG/JtwXX8tT/AHckNQ2AVR+9gmM2HBGKpnu33K8zfuF5h9gpByilV9WryfER+tQSvDwFMdXmcrK3LHAEOAIFhX4z0DhaHeEVC0lBzQQVI5UFNqMcx1w4I4eqWdOnNtw3ynivxfy9P93AUUO6ATjsgdymN6DI8F6D/cq7fuFcftGV1NN/oCvxviAXnjuVAp0/ytGVlY/QDOMjpKiq5ThKd9itl/6hT7Fi8ani27Fkhfy7ASpHKuoKGLw5j523aiLO3G/DPFfijkxwXX4FP7o5FOR75DI5N4ZwhPY+5W33Ckt/aMroMov/AGlTWxrl4mJYP1LXXqH1z35xzHAYUVVOGI7OyreKypSbqc3osbTNY/w8+JvdOp0w1zNJnZWHLgqOq0nx2bHf666/ApffgOZU5TkcwEX4KopaD7k3aO5CM/4GejCVn9mFfhY1/wCpRUrVDsGKXk/UCFDwvwqg9VsnMYwNcRqcASE7DYptHxS5rmzdGblbKeXCbUpljrgp2HrOpnbdv0Ec26mjS+6KOR4JQTUE1u7gFT6GSqtSIbAUXNytWGqj9K8g9yZez9wR1FQtlowNVBvw7EP/ADPWjCOd+YqST9Sd1eq3uFEIGhTd2esNUxdB4q2Dbpj7seHXUcyDkMVQP527LfuDB4Dx+XijL14bcF1NOmEEEEEAmhMCarWErEP2phYl+7oCaLvfKpN2aM5YQRutD6tPs/3J14im31W+V0W4Rg7vWj4W0dXOlaKVOn6T9V+HKjEAd2ooMBJAMd1gnnzYZv3hUQAaTQGnnQQrqHCswWdvyrryocd+G2d1cINbTE3KjInoU8qqU87uXcpg6IDYI9k4onghaq9dwG7/AHJ1YxvoEJy0sJX/AAGKcNhqYWqs76rVSK0V2FXRdScAmmiGgAiF4VZ1PobqVbmRk2rTLHbFOpPcw/ccm6ln0FwvMFJpx0aj0RbuJVPtCYdoTfRD0TO4TPzBU+4VP0TAmBMCb0KqP2FlG5WnE129ne5JmvVzhtNvconG0h2YgKRf0YxEuJ7nO/08sK01R6OVwe4ClUw8huJ8N/aLFPY4vqPD3FRzoXRePS1N+Ycm6lh44CPBvwbK68wHpl2Q/Kh+VepCqdKjlW/9wn7hYifmH+liI+YLEfnCxB3qQnWmo5MG8lMbs3IKcZXj/pA9oLFaME3u5Quql7VPxO/RoXg/Cy7q8q/BdDmW5PlUVD91qYw+gVwqNQY172yWmyxDtDn1PKBYKM5HO8M+IB5Xci6meO3BZWV87rZRWE9kEIQTfyphJsmT/gqnLVTABPdU4dEJkza4VIAXVEdUzoCVUd8tIqq7cwgPUoNx9WOrQfci0d14dKkzs1SVDXegQfB9Vq+Jho6hoQpUKFAH5Wjhg/TSoqFTRp5YmmKuinqY8kkpga2k4Oa4dx9BGTa9J1NyNN7mO3B49uC6vnI4fLw7IuenAp5Tu6dch6ef+YnkAa1U/OqkEGonXmodkyRL3KjHVUhszqmjpwH+OfP5fcjxMTRb3cvMYyim5SAF43/1Dh2dgHFeJXd2Bysc4+kKOUPapofYoqrqllYt9OirNMVtJ/UBlC2VuTbghEELxWCq35hup47qW8VuHy8ElXXmKCaTCah+dCfn6I2869eqHml6aDv0TPIqQBuN0wLs0qqf6QETuUB0QOLZ+wz7kTi56NapOX4LipKDMdicURYUQ1qlxP1EoIKF8imk8ZPHyMDiiWFr6TgUSxhPbOysrcNuQCINwjQrEj5XX44UsHL8vBfI63+pRC2CKKdeyqTsVVIb5TuqztX3VQm56I+SXFNg/dME2QCGf85T9We5EGs7LZRQa3uoBKDKFNo3dvxTzLci2dmqfEGTm09QJB1K7GXlzZEovaZ3BjPbn7JuIoFh3iyLTpO4seK4Ut5VlLeKSVPRNPRAKDshvCjp0R1NT9IhvVVJcdPRVJZZVdKfe/QI9SgM4xNL9h9yNNNx7uy2XyNHTda99hcrxa7+wMBW4fMp5duTZWVgvxHj0Q6pzqbmtElYhjqTn0bMESEHeLH5s9s7cVuMiECBXYL7OWx4bytlBPJ8pUtOVsiMgghqUptkxMTJcU2GhNEpoKBARM8P49H9p9yIoH9+RCNV4G5Kbh8K4dQFJJ78UHl35dlZfjn9uVkOhH+CgLwBOcQtlbmxk1zS07EI0KpYdunFcLU1p4rqcrFRVc3LdSVsrZw5WIgAryidwiU4p0XO6urBQZjotrLfhBrUO8H3IBpVwoULQDVcLkeVEAM6ndWVuOfpLZTXd+xWWpjx3Cp0XFtUug7PBT6f/NL2/SjEULfO1TwwVrpcEZSeDTXa/LdXUkKyGUpqiRHRQvVFHMoooo5RiKX7PcgeK8d2q68aoJ+Rtyg5xOzQEalZx6K2Uo5Xyj6f8Z37cgBc2VTEa6VBmoHd3RGiwNJJPDb6EMqeI35XIjgghdMwFOV+DUApC3yk8EIEBbK5EDdDsE3sm9kOR+NRP6T7kfzFL7o+IWgXJIQw9EUxv1K8HCuPVyurKfo78mXD7rz1DHTIPYWnYhNbZmIqAJ1OpfFl/wCnOM7c6Dk2tTLHdUWOLeyPBBC0wehGRPDbMQt1BUcPRS0eiGr78zz0D7kRVYf1IB76zh1MBGo7/K1PLBsMoHNn6Dzj7q9bLw6RqHYLG4qkarNNOl3VPwvFkmpqInitzYyjLW0PAv1UhEKMoj7rXh2nqM4HBbKApByvxedTqHopYPTmf8D7+5BrYhjegMlS6G7BeFRfURe4nKcp+qsvOvJWOTbg3CLdT8PVLe7TcIsAouaQ4GfQ8gcNuMjK6kR3WglCFfK6Dg5p6hRxWygI6cr8RDwvMvIfQq/L8lD93uPHSUMLhy4/PURcQvDY2kOylQFP1kBTVKAw7u5dkWUZaYMoMNJhmXgJ5xWjoGfUeJStuETPBpe1Q89jxWy1PjoEAFKgTxQQVDm3XzjueIIL14PwaR7P9x/Fq6z8jFqd6Ilxcdmo1azncF1YZycrZX+jsprFfyw/dkXMIkD1Kxeqm6GnRsqrq5qVGaZHDZQforhaXa27Fb5wQtdJjuKyhrj2R3UIuNwrRxy0K6vxevD/AC7P3j29vySSGjcoYei2kN9ytRXg4U93KSoCk5SVCgIFXyjKeZOUDhgFfivUYankG4aT3WEhgLi0gDoqNT5Kgd9SKtNzD/hOa5zXbgq+V1rpOafuFfihn3QbupKgTyAWIK7l65+q9UEOD+VH7x7jfNiH7CzU57iTui97QpqBg6Dg2UNzj6KOKGOUuP3WmhR+2TqtNjWiSHglMIA8Nn+lTBlrGjvHNtxb8MIolorM6b8Gl7ZUOdwlAKSiXIADkWyvmeROEP7wre4jq1RtNu7k2lTbSZs0QpKDGVKp6CAi6o4k9VCvlqcoH1cMcpcoZTHZoyfTaNO8qsN4XjAiLjkT9BfIPBadiEcPWdTOxu3Mhy102O9OGXBS4xsEStLZ5ErfKOX/ACTvuFt7hgboUKTq7x532C1OcpKFHD06Y3Ikq5UZhrQYv9EOVDHLU9g7uCItkB4adMLzP+31F8tl41AVG/OxTlda6bmqOC5PYFFxPqV4lQBQY5PmVlfl/wAm77hbe4fj1mg/K27lfSLAK6DnidhcrxKxPTYZXy1vjsrADhv9P5CpxFMKTlUeWaWkgBVhuw/6R0vJ3+gnlXQdY7Qv4auWj5XXGcPaoLgr5xSqH0WyDseGjYBXPJ/ElWV+X/J/dwW3uFAKLcF4p3qkkLU4qSvBwr39Tsi4kqBnpZq6nivzY5MIwga/2aiiET1hSgLgRyTyCcjyIKGJw5j5m3GZBCBY13cK+f4DkGNDQbkKMdTVzyYqId0Dy4wrf3j3DNL4a55s+u8U6aFNlOm2wYwBSVqIHcrQGUh0HBreAug4ZzK9F6cw53zsvMFeq/sEJ+sHD4GI1AeSpnrw7h1CvldCnhwepMBFxk7qMbRXmdyTrCcJRIR7ooooo8P4VFvd/uEcTXZS6buXi/GMHhWkeHQRe9xPU5CS4/0o1KrjweHSDzueK6EcI5Ucdl+ItOHdI+Zyg5D6SeQRmMThnM6i7VNjuLFQunQhQ5w7HK6ilQGWjE0XfqXmPJEhAwhHLmph2/c+4MBDD0TUdAe4SV4vxSpW7uKkrZeDgz3eeDxXgKPKNhx25g4L8Uqar0GYWkEOccj9CV4OI1geSplpIKGtrhs4ZXCvSb2GUOYezwpDT3aOTcLZWPLnF0vSmfcE4jEMb0aQXICliY6MML8VWWrSOpKhzaY2YODwKAJ+Zyk8WyHAEOXKvwSoYStb993KGNb2ACIPCeWefGYxGHLeouEYvv1V0H4b1blLgpxAHZuXlKD8NRcPy8owFbl6se/0aPcCF4OFfWdZ1RB2DxBndpX4isFDi87NEovqvdO+YrVQSLNupNuUOcCt1GU5aaLkH4mk0jqml57KURmPrYy8HE6h8rxlqDmnqFpcW9QVLmqcRUykLXgKfdpKvyLIFiBAUHMoo8OvGV3fq9wDWq06Q/qN0GNLBs1qLmPYBu0rTiS0qy/h8K1v9VRXORi26/hsM0H5nCSp5GnityAgEApsCiic4pNb1KBxBeejUd0YyjlR9P8AxGGdHzNuFIUOCioHdHIBx9FL6h7uzJoYhk7HlaZahpQnhKOcNJ7BanVHd3k+4F6lc9LBanOUPXgYyekyvFcD/SACV4lTKEK1cvPyU1qfPATlGVo4iijxQhkTkSc7L8cN7BaaD3wCXIEbBBTmeEcc8meGcvTMI0K729HXCiF4mHnq0oNo1X9mq2YGKez87VvyYf8AdFtr8rRhqrvReQe35iy8DCU2dTcqSV5lalU7hHC/CqRfarUapORloaJJIAQwuFbS/qN3qTnJ4QpzKPLJynggLViKhRp4Oi3R0lEHgj6eeVrosqDdi2QMtOxXhYWsPUBbZmli6Dv1Qoc7k3CHlKtydGCqKGtHt+a2KY0/K3zFXKvkMbWw+v8A4VElz141W3yiwGYfVfXf8lMWXiVC7kunlRlbKeQGU3u7BGviKbdy960QyIIACKI51+I86MhUY5h6ghGm97DuCocEBQYfzFXzIhwN2kFCrSpvBmWjk2QLboFqCCHdeq9eCKDGd3e4HhYd9U7vUuOUIYPCBn9b9yrk5OqPFNu7im4XDsw7egv9854pOUHKeKFGRKnkWWigUK2N1dKYRmZP0MIqfo4Wmo2oNnWy8bCPHVtwpAv0zm3deLgGD8iueRZFriJgKQVOZTuCa1Bnt+aj2Uxu9wCDGtYNmiFJyZUry/5GCSvFqOOUptJrsS/7NXiPcTvlPBGVlAzuoHCAgpU5E5gcQdWYydlow9eqR87oHFP/AELxqDm9RcKbofKdiCF4VWpT7HgM16SvyYeFBV+Rrxz/AEEe3/8AMh3RoUtJV1ujhsIWx56uUlGq5renVNYwUWbNV0TlHCdPJjKVKJRRHTIcQaHOPQI1K1R07myp0cJRotf/AEAlR15hTuG/03hV3t6G4UFaajKosHjg8PG0+zrKHO5MEFbHkR/gLxK9Z/d3t+RSxLx0YpoMvchXXi1mt6blGo8noLBFymE3D0v1Fa3uyAKEcVwEAoU8MZTzRTw7yjXxlGmPzSVLthA2hFH/AKPLGVRl4uD1bmmVN89FWm7s5TDu45NkYbyNFCq7s1Tfv7f6fh9Z3VzoX8s0dQVAJnZRhqteb1HljfsESi8ptJocQtRKurIgqc7Zw6USpyhTwzwRySSymi41q6f1+k2+l8Sk9h6iyIMdRYoPp1GHq0rTLT0JGflMdF4mFoO/TyZClmysOMswT/Uwo9vrIMwFAdyvwiOyLKYYN3Isw1GmOglF7gEGtAKuWjYIkq+cZ2ysVK0yjw2V0DKIyjMo8UAlOrYqo/1gL+FwVGmWQ4iSVZD6K4RlSrcMZTyBw6MQ7s66hzSvDxdUdzOditeB9WlXPJFwrcfkos7n2/sV+BRB2FlDHwvExUdAtgpIKFGmGDcoknOM7KVbgBQyvwOCcjlCKcijwDI0cK89XCAjicZQpfqkoetrIj6SSrcBROYnmyxjxl56FTu2OCW12ckoip1W4g8c4um38rPcAVKTmdRdQXtd+UwteIqE/mV5Qp0fFKNV5cr5FFRugFGdlPInKEMiiCieKFZa6rKQNmoRWruYezCjxA8oZEcFuIc81MPUb2BK2WvBtcN2OU5xjC38zOVD2n1UG3Hrx1Y9jHuBFVvqmaXmOhX8zU/eUC+mCNytDGsbZqATeybGyb2TeyCCCAGVlbkXUhDmbpz61Yk9StGCw7G7aAfoAhkEMrq30l18wUPd+4qcLXH6VZv2zjG4f1K8zvueSNJVm/bjmtWJ/Of/ADr/xAAuEQACAgEEAgIBAwQCAwEAAAAAAQIREAMgITEwYBJBMhMicARAUFEzQ1JhcYD/2gAIAQIBAT8A9mf8LP3xf/h+mKDFpo+CPghw/wBDi1/gH7coCisqE5dLgbS+x60HP4qWOGOCHAaf8EpWxRS2aSXybf0hOUoSm32ujV0lOLVmn/TS/UlT6ZFNUmyUE21FU0i8NJkotfwOhJJbdOSi3fTQ5KmldV1Q3SNJNfK12yCuV/S5JOUtRTqkkdtvZOH2v4GhH72p4ub5UT5HyiKr4Y5zqr4E9s4VzsXrL/w6Vvf8iE5QfHR+lp6jv9SnZLSUX+3UJ/B1Sr/2UJVtasap/wABwXh4/wBFl+Ca+/4CSti38HBwV4Zcr+AoLnb0ORbzbExS8MlTwvf4H0XhsbvwJ4rdPC9/gPkSG68aeHt1Osr36PQhsb8ie2yfX8A3URSok78yeWdk+sL/ACK9OfWy8vFi3WJ3hsTJv3J71vTG72VsYxPbZ8j9Sj9VF3h9/wAAMW28sYmJ4ssllCJOkfPki7Qv4BWHsY8Jl4eyJdIlNt40+I/wEtjwx7Lw8rskxlC4S/gBDFiyzvDwh5vD2wXvS3oebwtlFj8FC/wd/wBpZfpT2rD8lf5y/S0IeHse5e+RVjLLLPkWWLw0PfBcDr3xcIaZTOcUymckdqVnxGmUymUytydIb98XQz5HyLLxYmJrZF7WyX8BLE+jkRTOcWfIt2LrK2yY3t+/fY4mVTIobxSKR8UKFsarN5sbL3Lyv3COHhE3yJl4TEx8re9zE699ihjxdD5YkcMawuRdb2VuZGXvkcSEPCOmXhCH43j48WPgi7XvSFseLGJ4RF7b8MeicaE6E0yq92ooSw9zzyLgWOi/FB/RNWhlEZHfuvCEm8sY9jZ9iiysJ5rxQ7ETXOOUy2hSv3KsacbdsfER4Yx5bGR72p1ve2PYjVVMYnVHxjOPA7ixSssstHxT6Kft2mqRJcDy9vZ+m4xssvYnW57YRbIrk1Y8DEQm4slCOp0x6c45sTFIfI/aENYhG5FUjtE44bG9umorlj1W+uBiexilXe17IxcmJJEOySJKnmEqZaf2hqLJxrNikSXtKQ9N/TNOFLCdMkrJcDeLyltT2Mi/o+DHFiTGmfFihIjpf7zAfZqx+x5ZZGWxMTJKvZkjhDdmmm2LEkKRJWSg0MojBsapi2PF7YT+n4UMatE4OLFliL2IfK9lQnRYuWQjSFhjLGxxiz9JCjRPvF7r26c/p+BEhTV0zVklHY1iy8osfszuzThSFhjYxtDORNkpVh+BbF2afy+1urEjUG26vwJ4TLHyvY/os5NOH2yKzJ8D5Gx5ci78tCbUkxzojNMrNiZY6NTvKGz5WMeGJ4ZF+yxjZFZZJjGxvEnSLvY9jxZY+CxSGrNPmNP6FBJ2t8h8seZN0I7WxOnhnTH7Go2KOWxsY2N5lK2LcyI9ifGUzTfO5DJDJYYyqIlDwyLtD7G/YoojCxREsPEmNjGJGo64Fm9yGLkYtkXyIc4pid5QybJZeGJ0xjwyDJd4XXsMICW1sb2y/cLCHtYhiyjpjxpu4o1IuzSunexk2N7XiL4GsMiSGQ69g09P7Eq2tjeHhE2Ma+y7Qti3LCwuVjRdqt0iWG9rIkWSRIQ+hkOn6/pQvkSrY3hseG+cdKxu3hkRcPDGJ4YxMYhDWOhmi6lu1HSHlbGIfDO0TQh9Ikafr0I/JkVW5jGN4RqPisv6H+Qyz6HhYYh7WJkXTQsrGo8Xb3/ZJcEWT6Fhmn69oxpbWMY2PKJcvCH0hj6wuh4Qh4W1503cEyc1EhqKQibpMbsnIXe2MW2LR4JaclhE+hD7QzT/AC9diraEqWx5Y9j4RYx9jGfWIseVhiY83hoTNF9o1INuzTg7sRrSpUN0N28ReYx+TI6XwinRqTUaRGPz4Rq6bgz7JdC7H2xmn2vXdGPN7mMbHlE/xy+x9jw1jtZWHj62IaxCVNMWdR3Ik7HhMTx/SxUpo/qJJpwS6NWMvm+z+l+UUn90f1LUop/7WH0LMO/XErZCNLcxktiRqdbH3tTHlYYmPfpSuOJOkycstYTx/SupjX7J/wC/kTV1/wDTSpNv/SNZ/sw+iI8R79c0Y273sY8oRqPkY+hYoaw1tWxD3aMqf/3GtKluTxoJp2aij3GXfZL6I1XLNaKaJD6Ijwu/XNJUt7Yx5R9EuWPoe5jEPch5eU6YnaTNaXyk9tYRo/iJcIS4uiVVVGq6jRJ87Uj6XrcPxW1jGPYiV1wfp8Nse/6y+crYsdPDFj5fHRv/ANDxWFhiZpSSNP8Ae6TJ6kYTcSc4ximak/mxrnDyhfj63p/itrGMexC6NR8UPc9iH3uWHt1ONOCymNZeEzSm4yR8dBr5NWzWlbpYfYh5Qn+31vS/Haxj2obqI3ZLCy93aFhbFunpuVV9I/QY9Gk22j7E7Q9iwtVqNDeJi6HlC69b0vxWHljHsQjUf1h4WWLCwxD8a5kiWrL5Om6HOX/kz5N/YxDyxDFhEuXtifXrei/24eWxseUJYk7eHtex5W5bEdFNspnWV1sXeEM6QtsT69b0ZfWHixvakdEnSPvD2sWK2v8AsFt+hDH3uifXrcX8WJ2h4bG9iRwsajWX3tYtjymPjzPd9C8ER+uaU/okPaj50Sk0kOTeX4nh5XK8S8SEPfHxX6mnTFqWNl5+SHJs/wBGp9YWHuexiHlD8KH4YkR9716/Zb2IZP8AGLwhj3PxJjVeBD8KNOLl0PTkn0fFlFZXsqGLmDwib5GLa8rD7EPZ2vAh+GJpQ+Mee3ikzU0q5WYwk2PT+K9lWIDVCG+cLa8oQ8tZRJXzvQ/DpfkhTQmsy0rlx0R0kJJGt+PszIumifbH0PwPOkrsYxbUxqvEt2n3mhbNT8X7OifZLwvOiS7Z8B8NrD2drK2fWVu0+/BNXF+zxJ/kS78Lzovkn+TIuoknbb3Ikvvd9ZW7T7ytr6H2/ZEUR7RLtj7F4HnS/JGp+RHrlMkuRYexDVbfrw6Xfhn+T9kXeI9knw/LHho1PoXPBNLY8o7W1eHSKzeLzqfk/ZI4jy2TflRqfjFkCd3z4Exr7WxD8GkX4NT837IsRdWN2xeRD/40KyaKFvW1+DR8Or+b9kWHwvP/ANQuyS4ysPDWEPleTRXBRW/V/L2Vck351/x4lFJcPDFseUSWFvYjTVR8Or+XslC4RJ2/Ov8Ajw6ceHh4WHsR2srLFhkFbQlS8Oqv3eyIk6XhW1n2f9R9jacePGh7lhmjD78Wt37GsTe5+Bi7JcQRHspKx4Yhb0NU8LralZFUvFrd+x9I687F2an4oj2huP8Ap5fhQ+UMQ9mlG+fHrd+C/WkrHyS6yxeJ4j2jV6RpJOaRqwioNpblvRNYfWIkVbQlS8et2vYukJDd46WFmihbXjTVtGr2Qm4StE9f5xqty8HarH1iJp/kPx635L2GC+xnSwhvC8TxpLk1H+5/2CZNfYhkCH5D2rdrfl5b9TQuIyxJ4fCyl4njS+yXL8j21aoXBIgR7Prat2r+b9gQncGIfYhvCyy91jeI8abfge57ETXNnaI9YjzHxzdyfsD6NPuiXGHwsJZeay2Nl4RN1ppeB+GsNXEQusaTuPifTH3/AGC9PRIg65GxIbsW1ZbGy8ogrZqvlL+zRJVI+ljRfim6i/YF0PsfQlZJ1wJCW9sb3aSJu5PwvxImrVkHaxpupD8Oq6j5H6qlds7OkPliw8rDG8UVsX7YN/2vaI8PC7R2l4dd9L2DsaqKQkN3hCHtk98VbNV0kv7VD4lmHMV4dZ/u9gRPsZRRXBW6Xe/TXJN3KXjffjn0j6WNL8fDqO5v/O//xAAsEQEAAQQBAwQCAgICAwAAAAABAAIQESAxITBgAxJAQVBwEzIEUSJhcZDB/9oACAEDAQE/AP8A1L5jVie+e6e6FUz+jsxZm2ccsKVh6aGUuVMKv0VmZ0/+sqwVFOJRWjKvUxSZikFx14uOIOfHT553F0WOcGOczq8nWU8yrDjDHidKacZyzGlL+hqnVMzDEOMwpqmGZ/3CkznEw6jn9GVUlUPUqp6NEPUyf1lPu+7Op+hKn4dL+g3XM6zDMM6zMz2D9BVcaLAzCmY0xGnsnHnzevQpgdhIm55461WYHbbmlPnzdjDupY0p8/bPVntgbYmN01PMzvHN8TF8wmI7pYmIHmZ3SnMacaLM3LVF+kxMT2w9NZ/EzGPODss9P7lWmJ7Z7ZiUkCJGmNMwwGUmZ7YEqjzKKcvWHpmJ6tJS+WHw6XDHrA3pmLJMTBAmLErmFZRQYIHUn+Q/8/0BRMdd6DpMXxMTi4SuelQZmAihK6vdWv6AHGmJiPECUmjC2IF6ejCf5NeAD9AsNW1NfQnuyTpGCTG1OJ/JPVq91X6KpxjXOr0lfqfXhT+EPijotgmGU9LsIaUosrQI9VfO2Hpz+Oeyfxz+OfxkfTmMaMJ7oVz34hWZjjf1KsPSZXl88p5nvJmdGZJkmSdGetyQ0qZmFsymuDtX/bz3MpGphRPbGmYumWVem06NGSY0DMo2XL5429GYI4gzoxJ7J7Ig0xMLYgyqmYmIU5lNGJxq9KXz1tR0ZnpOWe1SYczLMs97K/WqIOdKZie2Um33K+lD56whMzOJQ9JUExm7TkgY6aZnvnuIMzG7KSesvth4Y/kSUzgmMynoRY5J0YU/9ypKBzBzqDCmBizC3NvUlRjz6mMpJm2MxLVjUSno4uQhCOmZSWqq/wCWJUTjwzEx+NYQuWDMOkesTFvUQSEbEGDMmhC1ZnrBySomEmfCcfjcxrhVmELkIWqh1lTTSMrqaqllFWTTMKp7pmZgQv6hjrM+2qVRiTMz5m1BFVtSXIWCFsmJX69JxK/UqqtTkYObYmJiYgXL1/1lfEHpG+LDM+X1V3pMwsQhC2LerV7aI6UVYulsWNXiVsps25mNCpnuIeVNV2UPXQhdt61fucZmNaKsc3xMRIQ09SspIucrKbpBxMjsOPKa3XhlFVimBC2Zmer6v0XTQlNUNCF6/UKTrFa3LK+JTnRLZdqXydcEbdIsOYmSUuJ6fWBbF/V9THQ1TQZTXiHqUwrpfsin+5mn/ZCqn/c/loPuVevniZXq2rhB1wR2p6nky5j0st6WNMpUlHqDzC1VZSSr1amOzoOnTXMYQhoR2o58lrcWxMYjemExMQ9Sun/sh/kSqtq2L40HbNglUJiGdCNsaj5JU5utyBAh0tmOO26DG/WY0IdlLkofI6mZtnQICXxZe4zExDbB2Ce3VMWJw+R1c7BAsF6u5iE6RLOmbNixcs86JksRlPGz42x1xCFizHr2i7o3LuhYvUaEqMMIEp8hrdS1JMXY9bPd4uly7c0zCNi1MqMkp4tT9+Q1PXXECBovdLsPgDZvTGU2OXyCuv6mdMWNMxhd3Nm7c2NSVRIMptT9wh/bx+uqZ0LBq3O+l6tc3NGxGclqGxywn2ePVuDQhAsFgsx7p2HsBg0b/UOYyjm33Z+vHq3LqQsQu7PwWETSk3yQSMZRzclXjq4I7lizH4uLVEI2JjLdsWXMoM5mcQclqbFquPHa3cgaOzZ+A9dMSkxolq3BKBOrKOOJ6mKnEpE6WNGHja4IvXYlJDR2bPZNmEb0mrao6Trk/wDEp+4wsaMPG/UemNyENG7dbvwGwZYGN6uJS9IfdqW7dh43W5dyENGzd0bG5swtSY3ZVpSbnjdXLqQhq2yXdnvMOZ99hjHpChSYcwMTOxz43Vy7FjRjCEz2R3Llmxy6GqRJ7q84lJqXOfG6+dSFjResbGpGGhsasIM9091nVt7YbsPG6+b4mIQhouhqR1O2wgGJgmDsHaPG6+bFyxds3NSxCzY7TC2e470+N+oWNS7ZuakbGg9ph8WnxuoyRMMNczOi3NnVsfPPHPUphAmNVSK6HaLp54mY0YhfDClhTiVcx0O0XbD8vNjx/EwTBdjzPrtHaPmU+SPGn32Kbti78ZbmlPV8leJ9wjDsGpM/FzZ4mL9bso58lY8wjA3NzsHx6efJWPNmHaLNz5xz5Kxh2y7c2O63eOyeSPGh2S72vrv/AF2TjySvi51h3WE65+M7YvTx5J6jYh2Hcsdw7LCZ3p48krsd5NB+K9mn+vklfNj4Yw7D23s0ceSV82O+6HcOw9mjjySuEO0WYbHae4b0ceSVsNM2N2G52nsL2qOPI1wTOXc7BsQ+E8wt970ceR11fUD4x8Bi2OzRx5FU4Jyw+GPw3uen5FU5hD4DfHw8dO56fHkNbqdw0x8Mjx3PT47oTExMTHh64i5j8A+ORjz26P6/BY+HVtvvV7WPkUxlXPbp4O4bPbfA6nLDZ3DY7J3C1Z17X3Dj4T+XfjVOCPadsaE+tzulqzp2qefw5+Efi1uhbOjchf67p3C1XHaoOv54h3H4tfMLkWMLcXL5+WWY89n0zv5mZn8afgqv7XbMYaEOwds4h2y1fPZo48grOse3Tu9th3KbV86mlPH53//Z" alt="logo" style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",objectPosition:"center top",border:"2px solid #4ade80",flexShrink:0}}/><div style={{fontSize:16,fontWeight:900,letterSpacing:0.5}}>Road 2 Jefke Peine</div></div>

          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {toast && <div style={{background:"#1e3a1e",color:"#4ade80",padding:"7px 13px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,border:"1px solid #2a4a2a"}}>{toast}</div>}
          <NotesButton data={data} save={save}/>
        </div>
      </div>
      {/* Reigning champs — subtle strip below main header, above tabs */}
      {(()=>{
        const mastersSorted=[...(data.masters||[])].sort((a,b)=>b.year-a.year);
        const usopenSorted=[...(data.usOpen||[])].sort((a,b)=>b.year-a.year);
        const ryderData=data.ryderCup||RYDER_DEFAULT;
        const ryderSortedByYear=[...ryderData].sort((a,b)=>b.year-a.year);
        const champs=[
          {label:"Masters",icon:"🏆",name:mastersSorted[0]?.results?.[0],year:mastersSorted[0]?.year,color:"#e8a838"},
          {label:"US Open",icon:"🌊",name:usopenSorted[0]?.results?.[0],year:usopenSorted[0]?.year,color:"#60a5fa"},
          {label:"Ryder",icon:"⛳",name:(()=>{const r=ryderSortedByYear[0];if(!r)return null;return(r.winner==="team1"?r.team1:r.team2).join(" & ");})(),year:ryderSortedByYear[0]?.year,color:"#4ade80"},
        ].filter(c=>c.name);
        if(!champs.length) return null;
        return(
          <div style={{display:"flex",borderBottom:"1px solid #131a14",background:"#060c10",position:"sticky",top:52,zIndex:48}}>
            {champs.map((c,i)=>(
              <button key={c.label} onClick={()=>setTab("tornooien")}
                style={{flex:"1 1 0",display:"flex",alignItems:"center",gap:6,padding:"4px 10px",background:"transparent",border:"none",borderRight:i<champs.length-1?"1px solid #111820":"none",cursor:"pointer",minWidth:0}}>
                <span style={{fontSize:10}}>{c.icon}</span>
                <div style={{minWidth:0,flex:1,overflow:"hidden"}}>
                  <div style={{fontSize:9,color:"#4b5563",fontFamily:"'DM Sans',sans-serif",letterSpacing:0.5,textTransform:"uppercase",lineHeight:1.2}}>{c.label} {c.year}</div>
                  <div style={{fontSize:11,fontWeight:700,color:PC[c.name]||"#e8e4d8",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.3}}>{c.name}</div>
                </div>
              </button>
            ))}
          </div>
        );
      })()}

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
        {tab==="tornooien" && <TornooienTab data={data} save={save} setTab={setTab}/>}
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
              <tbody>{getTiedRank(zsStandings,r=>r.pts).map(({item:row,medal})=>(
                <tr key={row.player}>
                  <td style={{fontWeight:700,color:PC[row.player]}}>{medal} {row.player}</td>
                  <td style={{fontWeight:700,fontSize:17,color:row.pts>0?"#4ade80":row.pts<0?"#f87171":"#6b7563"}}>{row.pts>0?"+":""}{row.pts}</td>
                  <td className="fade">{row.won}/{row.played}</td>
                </tr>
              ))}</tbody></table>
          }
        </div>

        <div className="card">
          <div style={{fontSize:12,color:"#60a5fa",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🐦 R2B {latestR2B}</div>
          <table><thead><tr><th>Speler</th><th>Ptn</th><th>Birdies</th><th>B2B</th></tr></thead>
          <tbody>{getTiedRank(r2bRanked,p=>r2bTotals[p]).map(({item:p,medal})=>(
            <tr key={p}>
              <td style={{fontWeight:700,color:PC[p]}}>{medal} {p}</td>
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
        <tbody>{getTiedRank(allTime,r=>r.pts).map(({item:row,medal})=>(
          <tr key={row.player}>
            <td style={{fontWeight:700,color:PC[row.player]}}>{medal} {row.player}</td>
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
            <tbody>{getTiedRank(standings,r=>r.pts).map(({item:row,medal})=>(
              <tr key={row.player}>
                <td style={{fontFamily:"'DM Sans',sans-serif",fontSize:13}}>{medal}</td>
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
            {getTiedRank(ranked,p=>totals[p]).map(({item:p,medal})=>(
              <div key={p} className="card" style={{textAlign:"center",padding:"11px 6px",borderColor:medal==="🥇"?"#e8a838":"#1e2a1e"}}>
                <div style={{fontSize:10,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>{medal} {p}</div>
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
          {getTiedRank(allTimeSorted,p=>stats[p]?.pts||0).map(({item:p,medal})=>(
            <div key={p} style={{textAlign:"center",background:"#131a14",borderRadius:10,padding:"10px 6px",border:`1px solid ${medal==="🥇"?"#e8a838":"#1e2a1e"}`}}>
              <div style={{fontSize:10,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>{medal} {p}</div>
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
  const [expandedCourses,setExpandedCourses]=useState({});

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

  const valColor=(val)=>{
    if(!val||val==="")return "#8a9a88";
    if(val.startsWith("-"))return "#4ade80";
    if(val==="E")return "#e8e4d8";
    return "#e8e4d8";
  };
  const boldRed=(val)=>val&&(val.startsWith("-")||val.endsWith("up"));

  // Parse score value for comparison (lower = better)
  const parseScore=(val)=>{
    if(!val||val==="")return null;
    if(val==="E")return 0;
    return parseFloat(val);
  };

  // Course order
  const COURSE_ORDER=["Millenium","Rigenee","Ternesse","Haverleij","Gendersteyn"];
  const AUTO_EXPAND=["Millenium"]; // always show front/back

  // Group courses
  const courses=(editMode?localRec:rec).courses;
  const grouped=COURSE_ORDER.map(name=>({
    name,
    main:courses.find(r=>r.course===name&&!r.sub),
    subs:courses.filter(r=>r.course===name&&r.sub),
  })).filter(g=>g.main||g.subs.length>0);
  // Any courses not in COURSE_ORDER go at end
  const otherNames=[...new Set(courses.map(r=>r.course))].filter(n=>!COURSE_ORDER.includes(n));
  otherNames.forEach(name=>grouped.push({name,main:courses.find(r=>r.course===name&&!r.sub),subs:courses.filter(r=>r.course===name&&r.sub)}));

  const toggleCourse=(name)=>setExpandedCourses(e=>({...e,[name]:!e[name]}));
  const isExpanded=(name)=>AUTO_EXPAND.includes(name)||!!expandedCourses[name];

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
              {grouped.map(({name,main,subs})=>{
                // Find best score across players for the main row
                const allRows=[...(main?[main]:[]),...subs];
                const mainScores=main?PLAYERS.map(p=>parseScore(main[p])).filter(v=>v!==null):[];
                const bestMain=mainScores.length?Math.min(...mainScores):null;
                const expanded=isExpanded(name);
                const autoExp=AUTO_EXPAND.includes(name);
                const mainRow=main||subs[0];
                const mainIdx=courses.indexOf(mainRow);

                return(
                  <React.Fragment key={name}>
                    {/* Main course row */}
                    <tr style={{background:"#0f1820",cursor:subs.length&&!autoExp?"pointer":"default"}}
                        onClick={subs.length&&!autoExp?()=>toggleCourse(name):undefined}>
                      <td style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,paddingLeft:10,color:"#e8e4d8",display:"flex",alignItems:"center",gap:6,paddingTop:8,paddingBottom:8}}>
                        {subs.length>0&&!autoExp&&<span style={{fontSize:10,color:"#4b5563"}}>{expanded?"▼":"▶"}</span>}
                        {name}
                      </td>
                      {PLAYERS.map(p=>{
                        const val=main?main[p]:"";
                        const score=parseScore(val);
                        const isBest=score!==null&&score===bestMain&&mainScores.filter(s=>s===bestMain).length<PLAYERS.length;
                        return(
                          <td key={p} style={{textAlign:"center",background:isBest?`${PC[p]}15`:"transparent",borderRadius:4}}>
                            {editMode&&main
                              ?<input value={localRec.courses[mainIdx]?.[p]||""} onChange={e=>updateCourse(mainIdx,p,e.target.value)} style={{background:"#131a14",border:"1px solid #2a3a2a",borderRadius:4,color:"#e8e4d8",padding:"3px 5px",width:56,fontFamily:"'DM Sans',sans-serif",fontSize:12,textAlign:"center"}}/>
                              :<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:isBest?700:boldRed(val)?700:400,color:isBest?PC[p]:valColor(val)}}>
                                {val||""}
                                {isBest&&<span style={{fontSize:9,marginLeft:2}}>★</span>}
                              </span>
                            }
                          </td>
                        );
                      })}
                    </tr>
                    {/* Sub rows (Front/Back) */}
                    {expanded&&subs.map(sub=>{
                      const subIdx=courses.indexOf(sub);
                      const subScores=PLAYERS.map(p=>parseScore(sub[p])).filter(v=>v!==null);
                      const bestSub=subScores.length?Math.min(...subScores):null;
                      return(
                        <tr key={sub.sub} style={{background:"transparent"}}>
                          <td style={{fontFamily:"'DM Sans',sans-serif",fontWeight:400,fontSize:12,paddingLeft:28,color:"#6b7563"}}>{sub.sub}</td>
                          {PLAYERS.map(p=>{
                            const val=sub[p];
                            const score=parseScore(val);
                            const isBest=score!==null&&score===bestSub&&subScores.filter(s=>s===bestSub).length<PLAYERS.length;
                            return(
                              <td key={p} style={{textAlign:"center",background:isBest?`${PC[p]}15`:"transparent",borderRadius:4}}>
                                {editMode
                                  ?<input value={localRec.courses[subIdx]?.[p]||""} onChange={e=>updateCourse(subIdx,p,e.target.value)} style={{background:"#131a14",border:"1px solid #2a3a2a",borderRadius:4,color:"#e8e4d8",padding:"3px 5px",width:56,fontFamily:"'DM Sans',sans-serif",fontSize:12,textAlign:"center"}}/>
                                  :<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:isBest?700:boldRed(val)?700:400,color:isBest?PC[p]:valColor(val)}}>
                                    {val||""}
                                    {isBest&&<span style={{fontSize:9,marginLeft:2}}>★</span>}
                                  </span>
                                }
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
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
              {editMode&&<th></th>}
            </tr></thead>
            <tbody>
              {(editMode?localRec:rec).stats.map((row,i)=>{
                const vals=PLAYERS.map(p=>parseFloat(row[p])).filter(v=>!isNaN(v));
                const best=vals.length?Math.max(...vals):null;
                return(
                  <tr key={i}>
                    <td style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#e8e4d8"}}>
                      {editMode
                        ?<input value={localRec.stats[i].label||""} onChange={e=>updateStat(i,"label",e.target.value)} style={{background:"#131a14",border:"1px solid #2a3a2a",borderRadius:4,color:"#e8e4d8",padding:"3px 5px",width:"100%",fontFamily:"'DM Sans',sans-serif",fontSize:12}}/>
                        :row.label
                      }
                    </td>
                    {PLAYERS.map(p=>{
                      const v=parseFloat(row[p]);
                      const isBest=!isNaN(v)&&v===best;
                      return(
                        <td key={p} style={{textAlign:"center"}}>
                          {editMode
                            ?<input value={localRec.stats[i][p]||""} onChange={e=>updateStat(i,p,e.target.value)} style={{background:"#131a14",border:"1px solid #2a3a2a",borderRadius:4,color:"#e8e4d8",padding:"3px 5px",width:50,fontFamily:"'DM Sans',sans-serif",fontSize:12,textAlign:"center"}}/>
                            :<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:isBest?PC[p]:"#8a9a88",fontWeight:isBest?700:400}}>{row[p]||""}</span>
                          }
                        </td>
                      );
                    })}
                    {editMode&&(
                      <td>
                        <button onClick={()=>{const ns=[...localRec.stats];ns.splice(i,1);setLocalRec({...localRec,stats:ns});}} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:16,padding:"0 6px"}}>×</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {editMode&&(
          <button onClick={()=>setLocalRec({...localRec,stats:[...localRec.stats,{label:"Nieuwe stat",Rob:"",Joost:"",Thomas:"",Joris:""}]})}
            style={{marginTop:10,background:"#1e3a1e",border:"1px solid #2a4a2a",color:"#4ade80",padding:"7px 14px",borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer"}}>
            + Rij toevoegen
          </button>
        )}
        {!editMode&&<div style={{marginTop:10,fontSize:11,color:"#4b5563",fontFamily:"'DM Sans',sans-serif"}}>Beste waarde per rij is gekleurd weergegeven.</div>}
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
          <tbody>{getTiedRank(ranked,p=>totals[p]).map(({item:p,medal})=>{
            const pct=total>0?Math.round(totals[p]/total*100):0;
            const allDone=totals[p]===total&&total>0;
            return(
              <tr key={p}>
                <td style={{fontWeight:700,color:PC[p]}}>{medal} {p} {allDone&&"🎉"}</td>
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
    setForm(f=>({...f,score:"",customCourse:""}));
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
              {getTiedRank(rankBestScore,p=>-(best(playerScores(p).filter(s=>s.holes===18).map(s=>s.score))||999)).map(({item:p,medal})=><div key={p} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontFamily:"'DM Sans',sans-serif",fontSize:13,borderBottom:"1px solid #131a14"}}>
                <span style={{color:PC[p],fontWeight:600}}>{medal} {p}</span>
                <span style={{color:"#e8a838",fontWeight:700}}>{(v=>v===0?"E":v>0?"+"+v:v)(best(playerScores(p).filter(s=>s.holes===18).map(s=>s.score)))}</span>
              </div>)}
            </div>
          )}
          {rankAvgScore.length>0&&(
            <div className="card">
              <div style={{fontSize:11,color:"#4ade80",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>📈 Gemiddelde Score (18H)</div>
              {getTiedRank(rankAvgScore,p=>-(avg(playerScores(p).filter(s=>s.holes===18).map(s=>s.score))||999)).map(({item:p,medal})=><div key={p} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontFamily:"'DM Sans',sans-serif",fontSize:13,borderBottom:"1px solid #131a14"}}>
                <span style={{color:PC[p],fontWeight:600}}>{medal} {p}</span>
                <span style={{color:"#4ade80",fontWeight:700}}>{(v=>v===0?"E":v>0?"+"+v:v)(avg(playerScores(p).filter(s=>s.holes===18).map(s=>s.score)))}</span>
              </div>)}
            </div>
          )}
          <div className="card">
            <div style={{fontSize:11,color:"#60a5fa",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🔁 Meeste Rondjes</div>
            {getTiedRank(rankMostRounds,p=>playerScores(p).length).map(({item:p,medal})=><div key={p} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontFamily:"'DM Sans',sans-serif",fontSize:13,borderBottom:"1px solid #131a14"}}>
              <span style={{color:PC[p],fontWeight:600}}>{medal} {p}</span>
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
const MASTERS_CHAMP_PHOTO = "data:image/jpeg;base64,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";

const RYDER_DEFAULT = [
  {year:2023,team1:["Joris","Joost"],team2:["Rob","Thomas"],winner:"team1",notes:""},
  {year:2024,team1:["Rob","Thomas"],team2:["Joris","Joost"],winner:"team1",notes:""},
  {year:2025,team1:["Joost","Thomas"],team2:["Rob","Joris"],winner:"team1",notes:""},
];

function TornooienTab({data,save,setTab}){
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

  // Current champions
  const mastersSorted=[...(data.masters||[])].sort((a,b)=>b.year-a.year);
  const usopenSorted=[...(data.usOpen||[])].sort((a,b)=>b.year-a.year);
  const ryderSortedByYear=[...(ryderData)].sort((a,b)=>b.year-a.year);
  const currentMasters=mastersSorted[0]?.results?.[0];
  const currentUsOpen=usopenSorted[0]?.results?.[0];
  const currentRyder=ryderSortedByYear[0]?(ryderSortedByYear[0].winner==="team1"?ryderSortedByYear[0].team1:ryderSortedByYear[0].team2):null;

  // Champ banner component
  const ChampBanner=({champ,label,color,photo,year,subtitle})=>(
    <div style={{background:`linear-gradient(135deg,${color}18,#0d1218)`,border:`1px solid ${color}44`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
      {photo&&<img src={photo} alt="champ" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",objectPosition:"center top",border:`2px solid ${color}`,flexShrink:0}}/>}
      {!photo&&<div style={{width:64,height:64,borderRadius:"50%",background:`${color}22`,border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🏆</div>}
      <div>
        <div style={{fontSize:11,color:color,fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>{label}</div>
        <div style={{fontSize:20,fontWeight:900,color:typeof champ==="string"?PC[champ]||"#e8e4d8":"#e8e4d8"}}>
          {typeof champ==="string"?champ:(champ||[]).join(" & ")}
        </div>
        {(year||subtitle)&&<div style={{fontSize:11,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginTop:2}}>{year&&`Winnaar ${year}`}{subtitle&&` · ${subtitle}`}</div>}
      </div>
    </div>
  );

  if(view!=="overview") return(
    <div>
      {view==="masters"&&currentMasters&&<ChampBanner champ={currentMasters} label="🏆 Reigning Masters Champion" color="#e8a838" photo={MASTERS_CHAMP_PHOTO} year={mastersSorted[0]?.year}/>}
      {view==="usopen"&&currentUsOpen&&<ChampBanner champ={currentUsOpen} label="🌊 Reigning US Open Champion" color="#60a5fa" year={usopenSorted[0]?.year} subtitle={usopenSorted[0]?.venue}/>}
      {view==="ryder"&&currentRyder&&<ChampBanner champ={currentRyder} label="⛳ Reigning Ryder Cup Champions" color="#4ade80" year={ryderSortedByYear[0]?.year}/>}
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
      {/* Reigning Champions */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}}>
        {[
          {label:"🏆 Masters Champion",color:"#e8a838",name:currentMasters,year:mastersSorted[0]?.year,photo:MASTERS_CHAMP_PHOTO,goView:"masters"},
          {label:"🌊 US Open Champion",color:"#60a5fa",name:currentUsOpen,year:usopenSorted[0]?.year,goView:"usopen"},
          {label:"⛳ Ryder Cup Champions",color:"#4ade80",name:currentRyder?.join(" & "),year:ryderSortedByYear[0]?.year,goView:"ryder"},
        ].filter(c=>c.name).map(c=>(
          <button key={c.label} onClick={()=>setView(c.goView)} style={{background:`linear-gradient(135deg,${c.color}12,#0d1218)`,border:`1px solid ${c.color}33`,borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
            {c.photo&&<img src={c.photo} alt="" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",objectPosition:"center top",border:`2px solid ${c.color}`,flexShrink:0}}/>}
            {!c.photo&&<div style={{width:44,height:44,borderRadius:"50%",background:`${c.color}22`,border:`2px solid ${c.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏆</div>}
            <div style={{minWidth:0}}>
              <div style={{fontSize:10,color:c.color,fontFamily:"'DM Sans',sans-serif",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>{c.label}</div>
              <div style={{fontSize:14,fontWeight:700,color:PC[c.name]||"#e8e4d8",fontFamily:"'DM Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
              {c.year&&<div style={{fontSize:10,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginTop:1}}>{c.year}</div>}
            </div>
          </button>
        ))}
      </div>

      {/* Overall all-time */}
      <div className="card">
        <div style={{fontSize:12,color:"#e8a838",fontFamily:"'DM Sans',sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🏆 All-Time Tornooi Klassement</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:10}}>
          {getTiedRank(allTimeSorted,p=>(mastersStats[p]?.pts||0)+(usopenStats[p]?.pts||0)).map(({item:p,medal})=>{
            const mS=mastersStats[p]||{};const uS=usopenStats[p]||{};
            const total=(mS.pts||0)+(uS.pts||0);
            return(
              <div key={p} style={{textAlign:"center",background:"#131a14",borderRadius:10,padding:"10px 6px",border:`1px solid ${medal==="🥇"?"#e8a838":"#1e2a1e"}`}}>
                <div style={{fontSize:10,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>{medal} {p}</div>
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
          {id:"masters",label:"🏆 The Masters",color:"#e8a838",wins:data.masters?.length||0,champ:currentMasters,champYear:mastersSorted[0]?.year},
          {id:"usopen",label:"🌊 US Open",color:"#60a5fa",wins:data.usOpen?.length||0,champ:currentUsOpen,champYear:usopenSorted[0]?.year},
          {id:"ryder",label:"⛳ Ryder Cup",color:"#4ade80",wins:ryderData.length,champ:currentRyder?.join(" & "),champYear:ryderSortedByYear[0]?.year},
        ].map(t=>(
          <button key={t.id} onClick={()=>setView(t.id)}
            style={{background:"#111620",border:`1px solid ${t.color}44`,borderRadius:12,padding:"16px 10px",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:4}}>{t.label.split(" ")[0]}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,color:t.color}}>{t.label.split(" ").slice(1).join(" ")}</div>
            {t.champ&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:PC[t.champ]||"#e8e4d8",fontWeight:600,marginTop:6}}>🏆 {t.champ}</div>}
            {t.champYear&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#4b5563",marginTop:2}}>{t.champYear}</div>}
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
          {getTiedRank(sorted,p=>ryderWins[p]).map(({item:p,medal})=>(
            <div key={p} style={{textAlign:"center",background:"#131a14",borderRadius:10,padding:"10px 6px",border:`1px solid ${medal==="🥇"?"#60a5fa":"#1e2a1e"}`}}>
              <div style={{fontSize:10,color:"#6b7563",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>{medal} {p}</div>
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
