(function(){
  const site="https://eyal-bar-mitzvah.vercel.app/";
  const title="בר המצווה של אייל";
  const text="נשמח לראותכם בבר המצווה של אייל, 10/8/2026";
  const startUtc="20260810T063000Z";
  const endUtc="20260810T120000Z";
  const details="עלייה לתורה בבית הכנסת בהר אדר בשעה 9:30, ולאחר מכן ארוחת צהריים במסעדת עלאש גריל, שד׳ הרכס 13, מודיעין בשעה 12:30.";
  const locationText="בית הכנסת, הר אדר; מסעדת עלאש גריל, שד׳ הרכס 13, מודיעין";
  const enc=encodeURIComponent;

  function setOpeningQuoteMotion(){
    const overlay=document.querySelector(".opening-quote");
    const moving=document.querySelector(".opening-quote-inner");
    const target=document.querySelector(".hero blockquote");
    if(!overlay||!moving||!target)return;
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){
      document.body.classList.remove("intro-active");
      overlay.hidden=true;
      return;
    }

    const placeQuote=()=>{
      const from=moving.getBoundingClientRect();
      const to=target.getBoundingClientRect();
      const x=to.left+to.width/2-(from.left+from.width/2);
      const y=to.top+to.height/2-(from.top+from.height/2);
      const scale=Math.max(.46,Math.min(.72,to.width/from.width));
      moving.style.setProperty("--quote-x",`${x}px`);
      moving.style.setProperty("--quote-y",`${y}px`);
      moving.style.setProperty("--quote-scale",scale.toFixed(3));
    };

    requestAnimationFrame(placeQuote);
    window.addEventListener("resize",placeQuote,{passive:true});
    const finish=()=>{
      document.body.classList.remove("intro-active");
      overlay.hidden=true;
    };
    moving.addEventListener("animationend",finish,{once:true});
    setTimeout(()=>document.body.classList.remove("intro-active"),2880);
    setTimeout(finish,3450);
  }

  function setCountdown(){
    const el=document.getElementById("countdown");
    if(!el)return;
    const now=new Date();
    const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const days=Math.ceil((new Date(2026,7,10)-today)/86400000);
    if(days===0){
      el.innerHTML=`היום זה היום!<strong>נתראה עוד מעט</strong>`;
    }else if(days>0){
      el.innerHTML=`ממשיכים לספור את הימים...<strong>אגב, זה בעוד ${days} יום</strong>`;
    }else{
      el.textContent="תודה שבאתם";
    }
  }

  function ics(){
    return [
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Eyal Bar Mitzvah//Invitation//HE",
      "CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
      "UID:eyal-bar-mitzvah-20260810@vercel.app","DTSTAMP:20260703T000000Z",
      `DTSTART:${startUtc}`,`DTEND:${endUtc}`,`SUMMARY:${title}`,
      `DESCRIPTION:${details} ${site}`,`LOCATION:${locationText}`,
      "END:VEVENT","END:VCALENDAR"
    ].join("\r\n");
  }

  function setCalendars(){
    const blobUrl=URL.createObjectURL(new Blob([ics()],{type:"text/calendar;charset=utf-8"}));
    const apple=document.getElementById("appleCalendar");
    if(apple)apple.href=blobUrl;

    const googleUrl=`https://calendar.google.com/calendar/u/0/r/eventedit?text=${enc(title)}&dates=${startUtc}/${endUtc}&details=${enc(details+" "+site)}&location=${enc(locationText)}&ctz=Asia/Jerusalem`;
    const google=document.getElementById("googleCalendar");
    if(google){
      let lastTap=0;
      const openGoogle=e=>{
        e.preventDefault();
        e.stopPropagation();
        const now=Date.now();
        if(now-lastTap<700)return;
        lastTap=now;
        const opened=window.open(googleUrl,"_blank","noopener");
        if(!opened)location.href=googleUrl;
      };
      google.addEventListener("click",openGoogle);
      google.addEventListener("touchend",openGoogle,{passive:false});
    }
  }

  function setShare(){
    const btn=document.getElementById("shareButton");
    if(!btn)return;
    btn.addEventListener("click",async()=>{
      if(navigator.share){
        try{await navigator.share({title,text,url:site});return}
        catch(e){if(e.name==="AbortError")return}
      }
      location.href=`https://wa.me/?text=${enc(text+" "+site)}`;
    });
  }

  async function submitRsvp(form,status,submit){
    const config=window.EYAL_SUPABASE;
    if(!config){
      status.textContent="אישור ההגעה לא זמין כרגע.";
      status.classList.add("is-error");
      return;
    }
    const name=form.guest_name.value.trim();
    const count=Number(form.guest_count.value);
    const note=form.note.value.trim();
    const group=form.rsvp_group.value;
    const atSynagogue=form.at_synagogue.checked;
    const atRestaurant=form.at_restaurant.checked;
    const allowedGroups=["משפחה","חברים של המשפחה","חברים של אייל"];
    status.classList.remove("is-error");
    if(!name||name.length>120||!Number.isInteger(count)||count<1||count>20||note.length>500||!allowedGroups.includes(group)){
      status.textContent="כדאי לבדוק את השם וכמות האורחים.";
      status.classList.add("is-error");
      return;
    }
    if(!atSynagogue&&!atRestaurant){
      status.textContent="בחרו לפחות מתחם אחד להגעה.";
      status.classList.add("is-error");
      return;
    }
    submit.disabled=true;
    status.textContent="שולחים...";
    try{
      const res=await fetch(`${config.url}/rest/v1/eyal_rsvps`,{
        method:"POST",
        headers:{
          apikey:config.anonKey,
          Authorization:`Bearer ${config.anonKey}`,
          "Content-Type":"application/json",
          Prefer:"return=minimal"
        },
        body:JSON.stringify({guest_name:name,guest_count:count,note:note||null,rsvp_group:group,at_synagogue:atSynagogue,at_restaurant:atRestaurant})
      });
      if(!res.ok)throw new Error("insert failed");
      form.reset();
      form.guest_count.value="1";
      status.textContent="תודה, אישור ההגעה נרשם.";
    }catch(error){
      status.textContent="לא הצלחנו לשמור כרגע. נסו שוב עוד רגע.";
      status.classList.add("is-error");
    }finally{
      submit.disabled=false;
    }
  }

  function setRsvp(){
    const open=document.getElementById("rsvpOpen");
    const dialog=document.getElementById("rsvpDialog");
    const form=document.getElementById("rsvpForm");
    const close=document.querySelector("[data-close-rsvp]");
    const status=document.getElementById("rsvpStatus");
    const submit=document.getElementById("rsvpSubmit");
    if(!open||!dialog||!form||!close||!status||!submit)return;
    open.addEventListener("click",()=>{
      status.textContent="";
      status.classList.remove("is-error");
      if(typeof dialog.showModal==="function")dialog.showModal();
      else dialog.setAttribute("open","");
      form.guest_name.focus();
    });
    close.addEventListener("click",()=>dialog.close());
    form.addEventListener("submit",event=>{
      event.preventDefault();
      submitRsvp(form,status,submit);
    });
  }

  function openWaze(appUrl,webUrl){
    const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if(!isMobile){location.href=webUrl;return}
    let opened=false;
    const markOpened=()=>{opened=true};
    document.addEventListener("visibilitychange",markOpened,{once:true});
    window.addEventListener("pagehide",markOpened,{once:true});
    location.href=appUrl;
    setTimeout(()=>{if(!opened)location.href=webUrl},1400);
  }

  function setNavigation(){
    const dialog=document.getElementById("navDialog");
    const place=document.getElementById("navDialogPlace");
    const waze=document.getElementById("navWaze");
    const google=document.getElementById("navGoogle");
    const apple=document.getElementById("navApple");
    if(!dialog||!place||!waze||!google||!apple)return;
    if(!/iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent))apple.hidden=true;

    document.querySelectorAll("[data-nav-query]").forEach(button=>{
      button.addEventListener("click",()=>{
        const query=button.dataset.navQuery;
        const label=button.dataset.navLabel||query;
        const ll=button.dataset.navLl;
        const encoded=enc(query);
        const wazeApp=ll?`waze://?ll=${ll}&navigate=yes`:`waze://?q=${encoded}&navigate=yes`;
        const wazeWeb=ll?`https://waze.com/ul?ll=${ll}&navigate=yes&utm_source=eyal_bar_mitzvah`:`https://waze.com/ul?q=${encoded}&navigate=yes&utm_source=eyal_bar_mitzvah`;
        place.textContent=label;
        waze.href=wazeWeb;
        google.href=ll?`https://www.google.com/maps/search/?api=1&query=${ll}`:`https://www.google.com/maps/search/?api=1&query=${encoded}`;
        apple.href=ll?`https://maps.apple.com/?ll=${ll}&q=${enc(label)}`:`https://maps.apple.com/?q=${encoded}`;
        waze.onclick=e=>{e.preventDefault();dialog.close();openWaze(wazeApp,wazeWeb)};
        if(typeof dialog.showModal==="function")dialog.showModal();
        else dialog.setAttribute("open","");
      });
    });
  }

  function setQr(){
    const img=document.getElementById("qrCode");
    if(img)img.src=`https://api.qrserver.com/v1/create-qr-code/?size=164x164&margin=8&color=0A2A5E&bgcolor=FAF8F2&data=${enc(site)}`;
  }

  setOpeningQuoteMotion();
  setCountdown();
  setCalendars();
  setShare();
  setRsvp();
  setNavigation();
  setQr();
})();
