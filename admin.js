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
  const signOut=document.getElementById("signOut");

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
    rows.forEach(row=>{
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
      list.appendChild(item);
    });
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
  signOut.addEventListener("click",()=>{
    sessionStorage.removeItem(authKey);
    rsvpPanel.hidden=true;
    loginPanel.hidden=false;
    setStatus("");
  });

  if(token())showDashboard();
})();
