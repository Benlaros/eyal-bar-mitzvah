(function(){
  const site="https://eyal-bar-mitzvah.vercel.app/";
  const title="בר המצווה של אייל";
  const text="נשמח לראותכם בבר המצווה של אייל, 10/8/2026";
  const startUtc="20260810T063000Z";
  const endUtc="20260810T120000Z";
  const details="עלייה לתורה בבית הכנסת בהר אדר בשעה 9:30, ולאחר מכן ארוחת צהריים במסעדת עלאש גריל, שד׳ הרכס 13, מודיעין בשעה 12:30.";
  const locationText="בית הכנסת, הר אדר; מסעדת עלאש גריל, שד׳ הרכס 13, מודיעין";
  const enc=encodeURIComponent;

  function setCountdown(){
    const el=document.getElementById("countdown");
    if(!el)return;
    const now=new Date();
    const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const days=Math.ceil((new Date(2026,7,10)-today)/86400000);
    el.textContent=days>=0?`נותרו ${days} ימים`:"תודה שבאתם ❤️";
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
    if(google){google.href=googleUrl;google.removeAttribute("target");google.addEventListener("click",e=>{e.preventDefault();location.href=googleUrl;});}
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

    document.querySelectorAll("[data-nav-query]").forEach(button=>{
      button.addEventListener("click",()=>{
        const query=button.dataset.navQuery;
        const label=button.dataset.navLabel||query;
        const encoded=enc(query);
        const wazeApp=`waze://?q=${encoded}&navigate=yes`;
        const wazeWeb=`https://waze.com/ul?q=${encoded}&navigate=yes&utm_source=eyal_bar_mitzvah`;
        place.textContent=label;
        waze.href=wazeWeb;
        google.href=`https://www.google.com/maps/search/?api=1&query=${encoded}`;
        apple.href=`https://maps.apple.com/?q=${encoded}`;
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

  setCountdown();
  setCalendars();
  setShare();
  setNavigation();
  setQr();
})();
