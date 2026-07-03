(function(){
  const config=window.EYAL_SUPABASE||{};
  const authKey="eyalAdminAccessToken";
  const email=config.adminEmail;
  const apiBase=config.url;
  const anonKey=config.anonKey;
  const headers={"apikey":anonKey,"Content-Type":"application/json"};

  const loginPanel=document.getElementById("loginPanel");
  const rsvpPanel=document.getElementById("rsvpPanel");
  const passwordForm=document.getElementById("passwordForm");
  const authStatus=document.getElementById("authStatus");
  const adminPassword=document.getElementById("adminPassword");
  const list=document.getElementById("rsvpList");
  const responseCount=document.getElementById("responseCount");
  const guestTotal=document.getElementById("guestTotal");
  const refresh=document.getElementById("refreshRsvps");
  const exportButton=document.getElementById("exportRsvps");
  const signOut=document.getElementById("signOut");
  let currentRows=[];

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

  function showDashboard(){
    loginPanel.hidden=true;
    rsvpPanel.hidden=false;
    loadRsvps();
  }

  function renderRows(rows){
    currentRows=rows;
    responseCount.textContent=String(rows.length);
    guestTotal.textContent=String(rows.reduce((sum,row)=>sum+Number(row.guest_count||0),0));
    list.textContent="";
    if(!rows.length){
      const empty=document.createElement("p");
      empty.className="empty-list";
      empty.textContent="עדיין אין אישורי הגעה.";
      list.appendChild(empty);
      return;
    }
    rows.forEach(row=>list.appendChild(renderItem(row)));
  }

  function renderItem(row){
    const item=document.createElement("article");
    item.className="rsvp-item";
    const top=document.createElement("div");
    const name=document.createElement("strong");
    const count=document.createElement("span");
    const date=document.createElement("time");
    name.textContent=row.guest_name;
    count.textContent=`${row.guest_count} אורחים`;
    date.dateTime=row.created_at;
    date.textContent=new Intl.DateTimeFormat("he-IL",{dateStyle:"short",timeStyle:"short"}).format(new Date(row.created_at));
    top.append(name,count);
    item.append(top,date);
    if(row.note){
      const note=document.createElement("p");
      note.textContent=row.note;
      item.appendChild(note);
    }
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
          headers:{...headers,Authorization:`Bearer ${token()}`}
        });
        loadRsvps();
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
    const nameLabel=document.createElement("label");
    nameLabel.append("שם");
    const nameInput=document.createElement("input");
    nameInput.type="text";
    nameInput.maxLength=120;
    nameInput.required=true;
    nameInput.value=row.guest_name;
    nameLabel.appendChild(nameInput);
    const countLabel=document.createElement("label");
    countLabel.append("אורחים");
    const countInput=document.createElement("input");
    countInput.type="number";
    countInput.min="1";
    countInput.max="20";
    countInput.required=true;
    countInput.value=row.guest_count;
    countLabel.appendChild(countInput);
    const noteLabel=document.createElement("label");
    noteLabel.append("הערה");
    const noteInput=document.createElement("input");
    noteInput.type="text";
    noteInput.maxLength=500;
    noteInput.value=row.note||"";
    noteLabel.appendChild(noteInput);
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
    form.append(nameLabel,countLabel,noteLabel,buttons);
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      try{
        await api(`/rest/v1/eyal_rsvps?id=eq.${row.id}`,{
          method:"PATCH",
          headers:{...headers,Authorization:`Bearer ${token()}`,Prefer:"return=minimal"},
          body:JSON.stringify({
            guest_name:nameInput.value.trim(),
            guest_count:Number(countInput.value),
            note:noteInput.value.trim()||null
          })
        });
        loadRsvps();
      }catch(error){
        alert("השמירה נכשלה. נסו שוב.");
      }
    });
    item.appendChild(form);
    return item;
  }

  function exportCsv(){
    const header=["שם","אורחים","הערה","נשלח"];
    const lines=currentRows.map(row=>[
      row.guest_name,
      row.guest_count,
      row.note||"",
      new Date(row.created_at).toLocaleString("he-IL")
    ].map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(","));
    const csv="﻿"+[header.join(","),...lines].join("\r\n"); // ﻿ BOM keeps Hebrew readable in Excel
    const link=document.createElement("a");
    link.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    link.download="eyal-rsvps.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function loadRsvps(){
    const accessToken=token();
    if(!accessToken)return;
    list.textContent="טוען...";
    try{
      const res=await api("/rest/v1/eyal_rsvps?select=id,guest_name,guest_count,note,created_at&order=created_at.desc",{
        headers:{...headers,Authorization:`Bearer ${accessToken}`}
      });
      renderRows(await res.json());
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

  refresh.addEventListener("click",loadRsvps);
  exportButton.addEventListener("click",exportCsv);
  signOut.addEventListener("click",()=>{
    sessionStorage.removeItem(authKey);
    rsvpPanel.hidden=true;
    loginPanel.hidden=false;
    setStatus("");
  });

  if(token())showDashboard();
})();
