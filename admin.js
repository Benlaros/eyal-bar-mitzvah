(function(){
  const config=window.EYAL_SUPABASE||{};
  const authKey="eyalAdminAccessToken";
  const email=config.adminEmail;
  const apiBase=config.url;
  const anonKey=config.anonKey;
  const headers={"apikey":anonKey,"Content-Type":"application/json"};
  const siteUrl="https://eyal-bar-mitzvah.vercel.app";

  const loginPanel=document.getElementById("loginPanel");
  const rsvpPanel=document.getElementById("rsvpPanel");
  const passwordForm=document.getElementById("passwordForm");
  const authStatus=document.getElementById("authStatus");
  const adminPassword=document.getElementById("adminPassword");
  const list=document.getElementById("rsvpList");
  const guestList=document.getElementById("guestList");
  const guestControls=document.getElementById("guestControls");
  const groupFilter=document.getElementById("groupFilter");
  const statusFilter=document.getElementById("statusFilter");
  const rsvpControls=document.getElementById("rsvpControls");
  const rsvpGroupFilter=document.getElementById("rsvpGroupFilter");
  const invitedTotal=document.getElementById("invitedTotal");
  const guestTotal=document.getElementById("guestTotal");
  const pendingTotal=document.getElementById("pendingTotal");
  const tabRsvps=document.getElementById("tabRsvps");
  const tabGuests=document.getElementById("tabGuests");
  const refresh=document.getElementById("refreshRsvps");
  const exportButton=document.getElementById("exportRsvps");
  const addGuestButton=document.getElementById("addGuest");
  const signOut=document.getElementById("signOut");
  let currentRows=[];
  let guests=[];
  let activeTab="rsvps";

  function setStatus(message,isError){
    authStatus.textContent=message||"";
    authStatus.classList.toggle("is-error",Boolean(isError));
  }

  async function api(path,options){
    const res=await fetch(`${apiBase}${path}`,options);
    if(!res.ok){
      let message="הפעולה לא הצליחה. נסו שוב.";
      try{
        const body=await res.json();
        message=body.msg||body.message||message;
      }catch(e){}
      throw new Error(message);
    }
    return res;
  }

  function token(){
    return sessionStorage.getItem(authKey);
  }

  function authHeaders(extra){
    return {...headers,Authorization:`Bearer ${token()}`,...(extra||{})};
  }

  function showDashboard(){
    loginPanel.hidden=true;
    rsvpPanel.hidden=false;
    loadAll();
  }

  function showTab(tab){
    activeTab=tab;
    const isGuests=tab==="guests";
    list.hidden=isGuests;
    rsvpControls.hidden=isGuests;
    guestList.hidden=!isGuests;
    guestControls.hidden=!isGuests;
    addGuestButton.hidden=!isGuests;
    exportButton.hidden=isGuests;
    tabRsvps.classList.toggle("is-active",!isGuests);
    tabGuests.classList.toggle("is-active",isGuests);
  }

  function renderSummary(){
    invitedTotal.textContent=String(guests.reduce((s,g)=>s+Number(g.invited_count||0),0));
    guestTotal.textContent=String(currentRows.reduce((s,r)=>s+Number(r.guest_count||0),0));
    const linked=new Set(currentRows.map(r=>r.guest_id).filter(Boolean));
    pendingTotal.textContent=String(guests.filter(g=>!linked.has(g.id)).length);
  }

  // ---------- RSVP tab ----------

  function renderRsvpGroupFilter(){
    const groups=[...new Set(guests.map(g=>g.group_name).filter(Boolean))];
    const current=rsvpGroupFilter.value;
    rsvpGroupFilter.textContent="";
    [["","כל הקבוצות"],...groups.map(name=>[name,name]),["__none__","ללא שיוך"]].forEach(([value,text])=>{
      const opt=document.createElement("option");
      opt.value=value;
      opt.textContent=text;
      rsvpGroupFilter.appendChild(opt);
    });
    if([...rsvpGroupFilter.options].some(o=>o.value===current))rsvpGroupFilter.value=current;
  }

  function renderRows(){
    renderRsvpGroupFilter();
    list.textContent="";
    const filter=rsvpGroupFilter.value;
    const guestById=Object.fromEntries(guests.map(g=>[g.id,g]));
    const shown=currentRows.filter(row=>{
      if(!filter)return true;
      const group=row.guest_id&&guestById[row.guest_id]?guestById[row.guest_id].group_name:null;
      return filter==="__none__"?!row.guest_id:group===filter;
    });
    if(!shown.length){
      const empty=document.createElement("p");
      empty.className="empty-list";
      empty.textContent=currentRows.length?"אין אישורים בקבוצה הזו.":"עדיין אין אישורי הגעה.";
      list.appendChild(empty);
      return;
    }
    shown.forEach(row=>list.appendChild(renderItem(row)));
  }

  function guestSelect(row){
    const select=document.createElement("select");
    select.className="guest-link";
    const none=document.createElement("option");
    none.value="";
    none.textContent="— שיוך למוזמן —";
    select.appendChild(none);
    guests.forEach(g=>{
      const opt=document.createElement("option");
      opt.value=g.id;
      opt.textContent=g.group_name?`${g.guest_name} (${g.group_name})`:g.guest_name;
      if(row.guest_id===g.id)opt.selected=true;
      select.appendChild(opt);
    });
    select.addEventListener("change",async()=>{
      try{
        await api(`/rest/v1/eyal_rsvps?id=eq.${row.id}`,{
          method:"PATCH",
          headers:authHeaders({Prefer:"return=minimal"}),
          body:JSON.stringify({guest_id:select.value||null})
        });
        row.guest_id=select.value||null;
        renderSummary();
      }catch(error){
        alert("השיוך נכשל. נסו שוב.");
      }
    });
    return select;
  }

  function renderItem(row){
    const item=document.createElement("article");
    item.className="rsvp-item";
    const top=document.createElement("div");
    const name=document.createElement("strong");
    const count=document.createElement("span");
    const date=document.createElement("time");
    name.textContent=row.guest_name;
    count.textContent=`${row.guest_count} אורחים${row.rsvp_group?` · ${row.rsvp_group}`:""}`;
    date.dateTime=row.created_at;
    date.textContent=new Intl.DateTimeFormat("he-IL",{dateStyle:"short",timeStyle:"short"}).format(new Date(row.created_at));
    top.append(name,count);
    item.append(top,date);
    if(row.note){
      const note=document.createElement("p");
      note.textContent=row.note;
      item.appendChild(note);
    }
    const linkRow=document.createElement("div");
    linkRow.className="rsvp-item-actions";
    linkRow.appendChild(guestSelect(row));
    item.appendChild(linkRow);
    const rowActions=document.createElement("div");
    rowActions.className="rsvp-item-actions";
    const editButton=document.createElement("button");
    editButton.type="button";
    editButton.className="row-action";
    editButton.textContent="עריכה";
    editButton.addEventListener("click",()=>item.replaceWith(renderEditor(row)));
    const deleteButton=document.createElement("button");
    deleteButton.type="button";
    deleteButton.className="row-action row-action-danger";
    deleteButton.textContent="מחיקה";
    deleteButton.addEventListener("click",async()=>{
      if(!confirm(`למחוק את האישור של ${row.guest_name}?`))return;
      try{
        await api(`/rest/v1/eyal_rsvps?id=eq.${row.id}`,{
          method:"DELETE",
          headers:authHeaders()
        });
        loadAll();
      }catch(error){
        alert("המחיקה נכשלה. נסו שוב.");
      }
    });
    rowActions.append(editButton,deleteButton);
    item.appendChild(rowActions);
    return item;
  }

  function renderEditor(row){
    const item=document.createElement("article");
    item.className="rsvp-item";
    const form=document.createElement("form");
    form.className="admin-form rsvp-edit-form";
    const fields=[
      ["שם","text",row.guest_name,{maxLength:120,required:true}],
      ["אורחים","number",row.guest_count,{min:"1",max:"20",required:true}],
      ["הערה","text",row.note||"",{maxLength:500}]
    ];
    const inputs=fields.map(([labelText,type,value,attrs])=>{
      const label=document.createElement("label");
      label.append(labelText);
      const input=document.createElement("input");
      input.type=type;
      Object.assign(input,attrs);
      input.value=value;
      label.appendChild(input);
      form.appendChild(label);
      return input;
    });
    const buttons=document.createElement("div");
    buttons.className="rsvp-item-actions";
    const save=document.createElement("button");
    save.type="submit";
    save.className="row-action";
    save.textContent="שמירה";
    const cancel=document.createElement("button");
    cancel.type="button";
    cancel.className="row-action";
    cancel.textContent="ביטול";
    cancel.addEventListener("click",()=>item.replaceWith(renderItem(row)));
    buttons.append(save,cancel);
    form.appendChild(buttons);
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      try{
        await api(`/rest/v1/eyal_rsvps?id=eq.${row.id}`,{
          method:"PATCH",
          headers:authHeaders({Prefer:"return=minimal"}),
          body:JSON.stringify({
            guest_name:inputs[0].value.trim(),
            guest_count:Number(inputs[1].value),
            note:inputs[2].value.trim()||null
          })
        });
        loadAll();
      }catch(error){
        alert("השמירה נכשלה. נסו שוב.");
      }
    });
    item.appendChild(form);
    return item;
  }

  function exportCsv(){
    const guestById=Object.fromEntries(guests.map(g=>[g.id,g]));
    const header=["שם","אורחים","הערה","מוזמן משויך","נשלח"];
    const lines=currentRows.map(row=>[
      row.guest_name,
      row.guest_count,
      row.note||"",
      row.guest_id&&guestById[row.guest_id]?guestById[row.guest_id].guest_name:"",
      new Date(row.created_at).toLocaleString("he-IL")
    ].map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(","));
    const csv="﻿"+[header.join(","),...lines].join("\r\n"); // ﻿ BOM keeps Hebrew readable in Excel
    const link=document.createElement("a");
    link.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    link.download="eyal-rsvps.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ---------- Guests tab ----------

  function reminderMessage(g){
    return `היי ${g.guest_name}, מזכירים באהבה 🙂 בר המצווה של אייל ב-10.8.2026 — נשמח שתאשרו הגעה: ${siteUrl}`;
  }

  function waPhone(phone){
    const digits=(phone||"").replace(/\D/g,"");
    if(digits.startsWith("0"))return "972"+digits.slice(1);
    return digits;
  }

  function renderGroupFilter(){
    const groups=[...new Set(guests.map(g=>g.group_name).filter(Boolean))];
    const current=groupFilter.value;
    groupFilter.textContent="";
    const all=document.createElement("option");
    all.value="";
    all.textContent="כל הקבוצות";
    groupFilter.appendChild(all);
    groups.forEach(name=>{
      const opt=document.createElement("option");
      opt.value=name;
      opt.textContent=name;
      groupFilter.appendChild(opt);
    });
    if([...groupFilter.options].some(o=>o.value===current))groupFilter.value=current;
  }

  function renderGuests(){
    renderGroupFilter();
    guestList.textContent="";
    const filter=groupFilter.value;
    const linkedCounts={};
    currentRows.forEach(r=>{
      if(r.guest_id)linkedCounts[r.guest_id]=(linkedCounts[r.guest_id]||0)+Number(r.guest_count||0);
    });
    const status=statusFilter.value;
    const shown=guests.filter(g=>
      (!filter||g.group_name===filter)&&
      (!status||(status==="confirmed"?linkedCounts[g.id]!=null:linkedCounts[g.id]==null))
    );
    if(!shown.length){
      const empty=document.createElement("p");
      empty.className="empty-list";
      empty.textContent="אין מוזמנים להצגה.";
      guestList.appendChild(empty);
      return;
    }
    shown.forEach(g=>guestList.appendChild(renderGuestItem(g,linkedCounts[g.id])));
  }

  function renderGuestItem(g,confirmedCount){
    const item=document.createElement("article");
    item.className="rsvp-item";
    const top=document.createElement("div");
    const name=document.createElement("strong");
    const meta=document.createElement("span");
    name.textContent=g.guest_name;
    meta.textContent=`${g.group_name||""} · ${g.invited_count??"?"} מוזמנים`;
    top.append(name,meta);
    item.appendChild(top);
    const status=document.createElement("p");
    if(confirmedCount!=null){
      status.textContent=`✓ אישרו ${confirmedCount}`;
      status.className="guest-status guest-status-ok";
    }else{
      status.textContent="לא ענו";
      status.className="guest-status";
    }
    item.appendChild(status);
    if(g.note){
      const note=document.createElement("p");
      note.textContent=g.note;
      item.appendChild(note);
    }
    const rowActions=document.createElement("div");
    rowActions.className="rsvp-item-actions";
    const remind=document.createElement("button");
    remind.type="button";
    remind.className="row-action";
    remind.textContent=g.phone?"תזכורת WhatsApp":"העתק תזכורת";
    remind.addEventListener("click",async()=>{
      const msg=reminderMessage(g);
      if(g.phone){
        window.open(`https://wa.me/${waPhone(g.phone)}?text=${encodeURIComponent(msg)}`,"_blank");
      }else{
        try{
          await navigator.clipboard.writeText(msg);
          remind.textContent="הועתק ✓";
          setTimeout(()=>{remind.textContent="העתק תזכורת"},1600);
        }catch(e){
          prompt("העתק ידנית:",msg);
        }
      }
    });
    const editButton=document.createElement("button");
    editButton.type="button";
    editButton.className="row-action";
    editButton.textContent="עריכה";
    editButton.addEventListener("click",()=>item.replaceWith(renderGuestEditor(g,item)));
    const deleteButton=document.createElement("button");
    deleteButton.type="button";
    deleteButton.className="row-action row-action-danger";
    deleteButton.textContent="מחיקה";
    deleteButton.addEventListener("click",async()=>{
      if(!confirm(`למחוק את ${g.guest_name} מרשימת המוזמנים?`))return;
      try{
        await api(`/rest/v1/eyal_guests?id=eq.${g.id}`,{
          method:"DELETE",
          headers:authHeaders()
        });
        loadAll();
      }catch(error){
        alert("המחיקה נכשלה. נסו שוב.");
      }
    });
    rowActions.append(remind,editButton,deleteButton);
    item.appendChild(rowActions);
    return item;
  }

  function renderGuestEditor(g,previousItem){
    const isNew=!g.id;
    const item=document.createElement("article");
    item.className="rsvp-item";
    const form=document.createElement("form");
    form.className="admin-form rsvp-edit-form";
    const fields=[
      ["שם","text",g.guest_name||"",{maxLength:120,required:true}],
      ["טלפון","tel",g.phone||"",{maxLength:20}],
      ["קבוצה","text",g.group_name||"",{maxLength:80}],
      ["מוזמנים","number",g.invited_count??"",{min:"0",max:"30"}],
      ["הערה","text",g.note||"",{maxLength:500}]
    ];
    const inputs=fields.map(([labelText,type,value,attrs])=>{
      const label=document.createElement("label");
      label.append(labelText);
      const input=document.createElement("input");
      input.type=type;
      Object.assign(input,attrs);
      input.value=value;
      label.appendChild(input);
      form.appendChild(label);
      return input;
    });
    const buttons=document.createElement("div");
    buttons.className="rsvp-item-actions";
    const save=document.createElement("button");
    save.type="submit";
    save.className="row-action";
    save.textContent="שמירה";
    const cancel=document.createElement("button");
    cancel.type="button";
    cancel.className="row-action";
    cancel.textContent="ביטול";
    cancel.addEventListener("click",()=>{
      if(isNew)item.remove();
      else item.replaceWith(previousItem);
    });
    buttons.append(save,cancel);
    form.appendChild(buttons);
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      const payload={
        guest_name:inputs[0].value.trim(),
        phone:inputs[1].value.trim()||null,
        group_name:inputs[2].value.trim()||null,
        invited_count:inputs[3].value===""?null:Number(inputs[3].value),
        note:inputs[4].value.trim()||null
      };
      try{
        if(isNew){
          await api("/rest/v1/eyal_guests",{
            method:"POST",
            headers:authHeaders({Prefer:"return=minimal"}),
            body:JSON.stringify(payload)
          });
        }else{
          await api(`/rest/v1/eyal_guests?id=eq.${g.id}`,{
            method:"PATCH",
            headers:authHeaders({Prefer:"return=minimal"}),
            body:JSON.stringify(payload)
          });
        }
        loadAll();
      }catch(error){
        alert("השמירה נכשלה. נסו שוב.");
      }
    });
    item.appendChild(form);
    return item;
  }

  // ---------- data ----------

  async function loadAll(){
    if(!token())return;
    try{
      const [rsvpRes,guestRes]=await Promise.all([
        api("/rest/v1/eyal_rsvps?select=id,guest_name,guest_count,note,created_at,guest_id,rsvp_group&order=created_at.desc",{headers:authHeaders()}),
        api("/rest/v1/eyal_guests?select=id,guest_name,phone,group_name,invited_count,note&order=group_name.asc,guest_name.asc",{headers:authHeaders()})
      ]);
      currentRows=await rsvpRes.json();
      guests=await guestRes.json();
      renderSummary();
      renderRows();
      renderGuests();
      showTab(activeTab);
    }catch(error){
      sessionStorage.removeItem(authKey);
      rsvpPanel.hidden=true;
      loginPanel.hidden=false;
      setStatus("פג תוקף הכניסה. הזן סיסמה שוב.",true);
    }
  }

  passwordForm.addEventListener("submit",async event=>{
    event.preventDefault();
    setStatus("מתחבר...");
    try{
      const res=await api("/auth/v1/token?grant_type=password",{
        method:"POST",
        headers,
        body:JSON.stringify({email,password:adminPassword.value})
      });
      const data=await res.json();
      sessionStorage.setItem(authKey,data.access_token);
      adminPassword.value="";
      setStatus("");
      showDashboard();
    }catch(error){
      setStatus("הסיסמה לא נכונה.",true);
    }
  });

  tabRsvps.addEventListener("click",()=>showTab("rsvps"));
  tabGuests.addEventListener("click",()=>showTab("guests"));
  refresh.addEventListener("click",loadAll);
  exportButton.addEventListener("click",exportCsv);
  addGuestButton.addEventListener("click",()=>{
    guestList.prepend(renderGuestEditor({},null));
  });
  groupFilter.addEventListener("change",renderGuests);
  statusFilter.addEventListener("change",renderGuests);
  rsvpGroupFilter.addEventListener("change",renderRows);
  signOut.addEventListener("click",()=>{
    sessionStorage.removeItem(authKey);
    rsvpPanel.hidden=true;
    loginPanel.hidden=false;
    setStatus("");
  });

  if(token())showDashboard();
})();
