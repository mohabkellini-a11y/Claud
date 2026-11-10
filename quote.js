/* EverSafe Fire Protection: instant quote tool (PE review, sign and seal) and drawing upload. */
(function(){
  /* ===================== SETTINGS — EDIT HERE ===================== */
  var CONFIG = {
    // Where quote requests go. Free option: create a form at formspree.io
    // and paste its URL here, e.g. "https://formspree.io/f/abcdwxyz".
    // Leave empty to open the client's email app instead.
    FORM_ENDPOINT: "https://formsubmit.co/info@eversafe-fire.com",  // same inbox as the contact form
    THANK_YOU_URL: "https://eversafe-fire.com/thank-you",
    LEAD_ENDPOINT: "https://formsubmit.co/ajax/info@eversafe-fire.com",  // copy of every quote, sent before the price shows
    LEAD_WAIT_MS: 4000,           // longest the visitor waits for that copy before the price shows anyway
    CONTACT_EMAIL: "info@eversafe-fire.com",
    CONTACT_URL: "#contact",              // e.g. "/contact" — leave empty to use email
    VALID_DAYS: 7,
    MIN_FEE: 850,
    MAX_AUTO: 2000,               // above this count, ask client to contact us
    ROUND_TO: 50,
    FA_TIERS: [ [50,850], [150,1150], [300,1550], [500,2050], [1000,2700] ],
    FA_OVER: 2.12,                // $ per device above 1,000
    SP_TIERS: [ [100,850], [300,1300], [600,1800], [1000,2400] ],
    SP_OVER: 1.49,                // $ per head above 1,000
    MULT: { std:[1.00,"Standard occupancy"], hc:[1.20,"Healthcare"], hr:[1.25,"High-rise / ELSS"], st:[1.30,"Storage / ESFR / in-rack"] },
    ADDONS: { voice:[250,"Voice evacuation / mass notification"], intf:[200,"Smoke control / elevator / HVAC interfaces"],
              dry:[250,"Dry or preaction system"], pump:[450,"Fire pump"], stand:[350,"Standpipe system"] },
    RUSH: { std:[0,"Standard: 5 business days"], r48:[0.50,"Rush: 48 hours (+50%)"], r24:[1.00,"Rush: 24 hours (+100%)"] }
  };
  /* ================================================================= */

  // Upload and request endpoints (PHP on the same site). If they are not set up yet,
  // the upload area stays hidden and the tool works as before through FORM_ENDPOINT.
  var API = { TOKEN: "/api/token.php", UPLOAD: "/api/upload.php", REQUEST: "/api/request.php" };
  var LIMITS = { file: 100 * 1024 * 1024, quote: 500 * 1024 * 1024, files: 20, chunk: 5 * 1024 * 1024,
                 types: ["pdf", "dwg", "dxf", "rvt", "zip", "jpg", "jpeg", "png"] };

  var root = document.getElementById("evs-quote");
  var $ = function(id){ return document.getElementById(id); };
  var form = $("evs-form"), lastQuote = null, customQuote = null;
  var money = function(n){ n = Math.round(n); return (n < 0 ? "−$" : "$") + Math.abs(n).toLocaleString("en-US"); };
  var esc = function(s){ return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); };

  // Contact links
  var contactHref = CONFIG.CONTACT_URL || ("mailto:" + CONFIG.CONTACT_EMAIL + "?subject=" + encodeURIComponent("Custom proposal request"));
  root.querySelectorAll(".evs-contact-link").forEach(function(a){ a.href = contactHref; });

  function service(){ return form.querySelector('input[name="service"]:checked').value; }

  function syncService(){
    var sp = service() === "sp";
    $("evs-count-label").textContent = sp ? "Number of sprinkler heads" : "Number of devices";
    $("evs-count-hint").textContent = sp ? "Count all heads in the scope of work." : "Count all initiating devices and notification appliances.";
    $("evs-addons-fa").hidden = sp; $("evs-addons-sp").hidden = !sp;
    var st = $("evs-occ").querySelector('[data-sp-only]');
    st.hidden = !sp; st.disabled = !sp;
    if (!sp && $("evs-occ").value === "st") $("evs-occ").value = "std";
  }
  form.querySelectorAll('input[name="service"]').forEach(function(r){ r.addEventListener("change", syncService); });
  syncService();

  function tierPrice(tiers, over, n){
    for (var i=0;i<tiers.length;i++){ if (n <= tiers[i][0]) return tiers[i][1]; }
    var top = tiers[tiers.length-1];
    return top[1] + (n - top[0]) * over;
  }

  function calc(d){
    var sp = d.service === "sp";
    var base = sp ? tierPrice(CONFIG.SP_TIERS, CONFIG.SP_OVER, d.count) : tierPrice(CONFIG.FA_TIERS, CONFIG.FA_OVER, d.count);
    var m = CONFIG.MULT[d.occ], lines = [], sub = 0;
    var add = function(label, amt){ amt = Math.round(amt); lines.push([label, amt]); sub += amt; };
    add((sp ? "Sprinkler" : "Fire alarm") + " review, sign & seal: " + d.count.toLocaleString("en-US") + (sp ? " heads" : " devices"), base);
    if (m[0] !== 1) add(m[1] + " (×" + m[0].toFixed(2) + ")", base * (m[0]-1));
    d.addons.forEach(function(k){ var a = CONFIG.ADDONS[k]; add(a[1], a[0]); });
    var r = CONFIG.RUSH[d.speed];
    if (r[0] > 0) add(r[1], sub * r[0]);
    var raw = sub;
    var total = Math.max(CONFIG.MIN_FEE, Math.round(raw / CONFIG.ROUND_TO) * CONFIG.ROUND_TO);
    if (total !== raw) lines.push([raw < CONFIG.MIN_FEE ? "Minimum fee adjustment" : "Rounding", total - raw]);
    return { total: total, lines: lines };
  }

  function quoteId(){
    var t = new Date(), p = function(n){ return ("0"+n).slice(-2); };
    return "EVS-Q" + String(t.getFullYear()).slice(-2) + p(t.getMonth()+1) + p(t.getDate()) + "-" + Math.random().toString(36).slice(2,6).toUpperCase();
  }

  function show(card){
    ["evs-form-card","evs-result","evs-custom"].forEach(function(id){ $(id).hidden = (id !== card); });
    $(card).scrollIntoView({ behavior:"smooth", block:"start" });
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    var err = [], bad = [];
    form.querySelectorAll(".evs-bad").forEach(function(el){ el.classList.remove("evs-bad"); el.removeAttribute("aria-invalid"); });
    var rawCount = $("evs-count").value.replace(/[,\s]/g, "");
    var count = /^\d+$/.test(rawCount) ? parseInt(rawCount, 10) : NaN;
    if (!(count >= 1)) { err.push("Enter the number of " + (service()==="sp" ? "sprinkler heads" : "devices") + " as a whole number."); bad.push("evs-count"); }
    var missing = ["evs-name","evs-company","evs-email","evs-city"].filter(function(id){ return !$(id).value.trim(); });
    if (missing.length) { err.push("Please fill in your name, company, email and project city."); bad = bad.concat(missing); }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("evs-email").value.trim())) { err.push("Enter a valid email address."); bad.push("evs-email"); }
    bad.forEach(function(id){ $(id).classList.add("evs-bad"); $(id).setAttribute("aria-invalid","true"); });
    $("evs-error").textContent = err.join(" ");
    if (err.length) { $(bad[0]).focus(); return; }

    var d = {
      service: service(), count: count, occ: $("evs-occ").value, speed: $("evs-speed").value,
      addons: Array.prototype.map.call(root.querySelectorAll("#evs-addons-" + service() + " input:checked"), function(c){ return c.value; }),
      name: $("evs-name").value.trim(), company: $("evs-company").value.trim(),
      email: $("evs-email").value.trim(), city: $("evs-city").value.trim()
    };

    if (count > CONFIG.MAX_AUTO) {
      $("evs-custom-msg").textContent = "Projects over " + CONFIG.MAX_AUTO.toLocaleString("en-US") + (d.service==="sp" ? " heads" : " devices") + " need a quick look at the drawings first. Send them to us and we will reply with a fixed price within 24 hours.";
      sendLead("Custom quote needed — " + count.toLocaleString("en-US") + (d.service==="sp" ? " heads" : " devices") + " — " + d.company,
        { name: d.name, company: d.company, email: d.email, project_city: d.city + ", FL", service: d.service==="sp" ? "Fire sprinkler" : "Fire alarm", count: count, note: "Over the instant-quote limit. Client was asked to send drawings for a fixed price." });
      customQuote = { id: quoteId(), data: d };
      $("evs-done2").hidden = true; $("evs-custom-send").disabled = false; $("evs-custom-send").textContent = "Send my drawings";
      show("evs-custom"); startUpload("custom", customQuote.id); return;
    }

    var q = calc(d), valid = new Date(); valid.setDate(valid.getDate() + CONFIG.VALID_DAYS);
    lastQuote = { id: quoteId(), date: new Date().toLocaleDateString("en-US"), valid: valid.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}), total: q.total, lines: q.lines, data: d };

    $("evs-qid").textContent = lastQuote.id;
    $("evs-qvalid").textContent = lastQuote.valid;
    $("evs-qprice").textContent = money(q.total);
    $("evs-qsub").textContent = "Prepared for " + d.name + ", " + d.company + " · " + d.city + ", FL · " + lastQuote.date;
    $("evs-qtable").innerHTML = q.lines.map(function(l){ return "<tr><td>" + esc(l[0]) + "</td><td>" + (l[1] < 0 ? "−" : "") + money(Math.abs(l[1])) + "</td></tr>"; }).join("")
      + '<tr class="evs-total"><td>Total</td><td>' + money(q.total) + "</td></tr>";
    $("evs-done").hidden = true; $("evs-done").classList.remove("evs-fail");
    root.querySelector("#evs-result .evs-actions").hidden = false;
    var acc = $("evs-accept"); acc.disabled = false; acc.textContent = "Request this job"; acc.classList.remove("evs-sent");

    // Send us a copy of the quote first, then show the price.
    var get = $("evs-get"), lq = lastQuote;
    get.disabled = true; get.textContent = "Preparing your quote…";
    var sent = sendLead("Quote viewed " + lq.id + " — " + money(lq.total) + " — " + d.company + " (not yet requested)",
      { quote_id: lq.id, total: money(lq.total), valid_until: lq.valid, name: d.name, company: d.company, email: d.email, project_city: d.city + ", FL", quote: summary(lq) });
    var wait = new Promise(function(res){ setTimeout(res, CONFIG.LEAD_WAIT_MS); });
    Promise.race([sent, wait]).then(function(){
      get.disabled = false; get.textContent = "Get my price";
      if (lastQuote === lq) { show("evs-result"); startUpload("quote", lq.id); }
    });
  });

  // Emails us a copy (AJAX, no page change). Resolves when done or failed, never rejects,
  // so the visitor always gets their price. keepalive lets it finish if they leave the page.
  var lastLeadKey = null;
  function sendLead(subject, fields){
    var key = JSON.stringify(fields, function(k, v){ return (k === "quote_id" || k === "valid_until") ? undefined : v; })
      .replace(/EVS-Q[0-9A-Z-]+/g, "");
    if (key === lastLeadKey) return Promise.resolve();   // same details as the last copy: don't email twice
    lastLeadKey = key;
    var body = new URLSearchParams();
    body.append("_subject", subject); body.append("_template", "table"); body.append("_captcha", "false");
    Object.keys(fields).forEach(function(k){ body.append(k, fields[k]); });
    try {
      return fetch(CONFIG.LEAD_ENDPOINT, { method: "POST", headers: { "Accept": "application/json" }, body: body, keepalive: true })
        .then(function(){}, function(){});
    } catch (e) { return Promise.resolve(); }
  }

  function summary(q){
    var d = q.data;
    return "Quote " + q.id + " (valid until " + q.valid + ")\n"
      + "Total: " + money(q.total) + "\n\n"
      + q.lines.map(function(l){ return "- " + l[0] + ": " + money(l[1]); }).join("\n") + "\n\n"
      + "Name: " + d.name + "\nCompany: " + d.company + "\nEmail: " + d.email + "\nProject city: " + d.city + ", FL";
  }

  $("evs-accept").addEventListener("click", function(){
    if (!lastQuote) return;
    var btn = this, done = $("evs-done");
    if (btn.disabled) return;
    if (!CONFIG.FORM_ENDPOINT && !uploaders.quote.token) {
      window.location.href = "mailto:" + CONFIG.CONTACT_EMAIL + "?subject=" + encodeURIComponent("Sign & seal request — " + lastQuote.id)
        + "&body=" + encodeURIComponent(summary(lastQuote) + "\n\nI will attach the drawings and calcs to this email.");
      done.textContent = "Your email app should open with the quote filled in. Attach your drawings and send.";
      done.hidden = false; return;
    }
    btn.disabled = true; btn.textContent = "Sending…";
    var q = lastQuote, d = q.data, up = uploaders.quote;
    if (!up.token) { legacyPost(btn); return; }
    sendRequest(up, { kind: "quote", name: d.name, company: d.company, email: d.email, city: d.city,
                      total: money(q.total), valid_until: q.valid, summary: summary(q) })
      .then(function(res){
        var n = res.files || 0;
        done.classList.remove("evs-fail");
        done.innerHTML = "<strong>Request received. Quote " + esc(q.id) + ".</strong><br>"
          + (n ? "We received " + n + (n === 1 ? " file" : " files") + ". We check the drawings against the quote and confirm the price by email, usually within one business day."
               : "We did not receive any files. Reply to our confirmation email with your drawings and calcs. We confirm the price when we receive them.")
          + "<br>A confirmation is on its way to " + esc(d.email) + ".";
        done.hidden = false; btn.textContent = "Request sent"; btn.classList.add("evs-sent");
        up.lock(); done.focus();
      }, function(){ legacyPost(btn); });      // API failed: fall back so the lead is not lost
  });

  function legacyPost(btn){
    // Submit as a normal form post (like the contact form). FormSubmit only
    // sends the client's confirmation email (_autoresponse) for normal posts,
    // not for AJAX requests.
    var q = lastQuote, d = q.data;
    var fields = {
      _subject: "Instant quote " + q.id + " — " + money(q.total),
      _template: "table",
      _captcha: "true",
      _next: CONFIG.THANK_YOU_URL,
      _autoresponse: "Thanks for requesting a PE review, sign & seal from EverSafe Fire Protection. "
        + "Your quote " + q.id + " is " + money(q.total) + " and is valid until " + q.valid + ". "
        + "Next step: reply to this email with your drawings and calcs. We confirm the price when we receive them. "
        + "Need us sooner? Call 386-837-4057. EverSafe Fire Protection",
      quote_id: q.id, total: money(q.total), valid_until: q.valid,
      name: d.name, company: d.company, email: d.email, project_city: d.city + ", FL",
      quote: summary(q) + fileNote("quote"),
      _honey: ""
    };
    var f = document.createElement("form");
    f.method = "POST"; f.action = CONFIG.FORM_ENDPOINT; f.hidden = true;
    Object.keys(fields).forEach(function(k){
      var i = document.createElement(k === "quote" ? "textarea" : "input");
      if (k !== "quote") i.type = "hidden";
      i.name = k; i.value = fields[k]; f.appendChild(i);
    });
    document.body.appendChild(f);
    f.submit();
  }

  // Custom quote card (over the instant quote limit): send the drawings for a fixed price.
  $("evs-custom-send").addEventListener("click", function(){
    var btn = this, done = $("evs-done2"), up = uploaders.custom;
    if (!customQuote || btn.disabled || !up.token) return;
    if (!up.doneCount()) { done.classList.add("evs-fail"); done.textContent = "Add at least one file first, or use Contact us."; done.hidden = false; return; }
    btn.disabled = true; btn.textContent = "Sending…";
    var d = customQuote.data;
    sendRequest(up, { kind: "custom", name: d.name, company: d.company, email: d.email, city: d.city, total: "", valid_until: "",
                      summary: (d.service === "sp" ? "Fire sprinkler" : "Fire alarm") + " review, sign & seal. Count: " + d.count + ". Over the instant quote limit." })
      .then(function(res){
        done.classList.remove("evs-fail");
        done.innerHTML = "<strong>Drawings received. Reference " + esc(customQuote.id) + ".</strong><br>We received " + (res.files || 0) + " file(s). We will reply with a fixed price within 24 hours.";
        done.hidden = false; btn.textContent = "Sent"; btn.classList.add("evs-sent"); up.lock(); done.focus();
      }, function(){
        btn.disabled = false; btn.textContent = "Send my drawings";
        done.classList.add("evs-fail"); done.textContent = "We could not send your request. Please try again, or use Contact us."; done.hidden = false;
      });
  });

  function sendRequest(up, fields){
    fields.token = up.token; fields.website = $("evs-website").value;
    return fetch(API.REQUEST, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(fields) })
      .then(function(r){ return r.json().then(function(j){ if (!r.ok || !j.ok) throw new Error(j.error || "failed"); return j; }); });
  }

  function fileNote(key){
    var names = uploaders[key].names();
    return names.length ? "\n\nFiles uploaded on the site (" + names.length + "): " + names.join(", ") : "";
  }

  /* ===================== Upload ===================== */
  var uploaders = { quote: makeUploader("quote", $("evs-accept")), custom: makeUploader("custom", $("evs-custom-send")) };

  // Ask the server for an upload session. If the server is not set up, the upload area stays hidden.
  function startUpload(key, quoteId){
    var up = uploaders[key];
    if (up.quoteId === quoteId && up.token) return;
    up.reset(quoteId);
    var body = new URLSearchParams(); body.append("quote_id", quoteId);
    fetch(API.TOKEN, { method: "POST", headers: { "Accept": "application/json" }, body: body })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if (j && j.ok && up.quoteId === quoteId) up.open(j.token); })
      .catch(function(){});
  }

  function makeUploader(key, sendBtn){
    var box = root.querySelector('[data-evs-upload="' + key + '"]');
    var drop = box.querySelector(".evs-drop"), input = box.querySelector(".evs-file"), list = box.querySelector(".evs-files"),
        status = box.querySelector(".evs-upstatus"), pick = box.querySelector(".evs-pick");
    var up = { quoteId: null, token: null, items: [], running: false, locked: false };
    var fmt = function(b){ return b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; };
    var say = function(t){ status.textContent = t; };
    var rid = function(){ var a = new Uint8Array(12); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function(x){ return ("0" + x.toString(16)).slice(-2); }).join(""); };

    up.reset = function(quoteId){
      up.items.forEach(function(it){ if (it.xhr) it.xhr.abort(); });
      up.quoteId = quoteId; up.token = null; up.items = []; up.running = false; up.locked = false;
      list.innerHTML = ""; say(""); box.hidden = true; pick.disabled = false;
      if (key === "custom") sendBtn.hidden = true;
      sync();
    };
    up.open = function(token){ up.token = token; box.hidden = false; if (key === "custom") sendBtn.hidden = false; };
    up.lock = function(){ up.locked = true; pick.disabled = true; list.querySelectorAll(".evs-fbtn").forEach(function(b){ b.hidden = true; }); };
    up.names = function(){ return up.items.filter(function(i){ return i.state === "done"; }).map(function(i){ return i.file.name; }); };
    up.doneCount = function(){ return up.names().length; };
    up.busy = function(){ return up.items.some(function(i){ return i.state === "queued" || i.state === "uploading"; }); };

    // "Request this job" is disabled while a file is uploading.
    function sync(){
      if (sendBtn.classList.contains("evs-sent")) return;
      var busy = up.busy();
      sendBtn.disabled = busy;
      if (busy) sendBtn.setAttribute("aria-describedby", status.id || (status.id = "evs-upstatus-" + key)); else sendBtn.removeAttribute("aria-describedby");
    }

    function render(it){
      if (!it.li) {
        it.li = document.createElement("li");
        it.li.innerHTML = '<span class="evs-fname"></span><span class="evs-fbtns"><button type="button" class="evs-fbtn evs-retry" hidden>Retry</button><button type="button" class="evs-fbtn evs-remove">Remove</button></span><span class="evs-fmeta"></span><span class="evs-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"><span></span></span>';
        it.li.querySelector(".evs-fname").textContent = it.file.name;
        it.li.querySelector(".evs-remove").setAttribute("aria-label", "Remove " + it.file.name);
        it.li.querySelector(".evs-retry").setAttribute("aria-label", "Retry " + it.file.name);
        it.li.querySelector(".evs-remove").addEventListener("click", function(){ remove(it); });
        it.li.querySelector(".evs-retry").addEventListener("click", function(){ it.state = "queued"; it.msg = ""; render(it); pump(); });
        list.appendChild(it.li);
      }
      var pct = it.state === "done" ? 100 : Math.floor(100 * it.sent / it.file.size);
      it.li.className = it.state === "done" ? "evs-ok" : it.state === "error" ? "evs-err" : "";
      it.li.querySelector(".evs-fmeta").textContent = fmt(it.file.size) + " · " +
        (it.state === "done" ? "Uploaded" : it.state === "error" ? it.msg : it.state === "uploading" ? "Uploading " + pct + "%" : "Waiting");
      var bar = it.li.querySelector(".evs-bar"); bar.setAttribute("aria-valuenow", pct); bar.setAttribute("aria-label", "Upload progress for " + it.file.name);
      bar.firstChild.style.width = pct + "%"; bar.hidden = it.state === "error" && !it.canRetry;
      it.li.querySelector(".evs-retry").hidden = !(it.state === "error" && it.canRetry) || up.locked;
      sync();
    }

    function add(files){
      if (up.locked || !up.token) return;
      Array.prototype.forEach.call(files, function(file){
        var it = { id: rid(), file: file, sent: 0, index: 0, state: "queued", msg: "", canRetry: false };
        var ext = (file.name.split(".").pop() || "").toLowerCase();
        var live = up.items.filter(function(i){ return i.state !== "error"; });
        var total = live.reduce(function(s, i){ return s + i.file.size; }, 0);
        var problem = LIMITS.types.indexOf(ext) < 0 || file.name.indexOf(".") < 0 ? "This file type is not allowed."
          : file.size === 0 ? "The file is empty."
          : file.size > LIMITS.file ? "The file is larger than 100 MB."
          : live.length >= LIMITS.files ? "You can upload up to " + LIMITS.files + " files per quote."
          : total + file.size > LIMITS.quote ? "The files for this quote are larger than 500 MB in total."
          : live.some(function(i){ return i.file.name === file.name && i.file.size === file.size; }) ? "This file is already in the list." : "";
        if (problem) { it.state = "error"; it.msg = problem; }
        up.items.push(it); render(it);
      });
      var bad = up.items.filter(function(i){ return i.state === "error"; }).length;
      say(files.length + (files.length === 1 ? " file added." : " files added.") + (bad ? " " + bad + " cannot be uploaded. See the list." : ""));
      pump();
    }

    function remove(it){
      if (up.locked) return;
      if (it.xhr) it.xhr.abort();
      var started = it.sent > 0 || it.state === "done" || it.state === "uploading";
      up.items.splice(up.items.indexOf(it), 1); list.removeChild(it.li);
      if (started) { var fd = new FormData(); fd.append("token", up.token); fd.append("action", "delete"); fd.append("file_id", it.id); fetch(API.UPLOAD, { method: "POST", body: fd }).catch(function(){}); }
      say(it.file.name + " removed."); if (up.running === it) up.running = false; sync(); pump(); pick.focus();
    }

    // One file at a time, one chunk at a time.
    function pump(){
      if (up.running) return;
      var it = up.items.filter(function(i){ return i.state === "queued"; })[0];
      if (!it) { sync(); if (up.items.length && !up.busy()) say(up.doneCount() + " of " + up.items.length + " files uploaded."); return; }
      up.running = it; it.state = "uploading"; render(it); say("Uploading " + it.file.name + ".");
      sendChunk(it, 0);
    }

    function sendChunk(it, attempt){
      var total = Math.ceil(it.file.size / LIMITS.chunk), start = it.index * LIMITS.chunk;
      var fd = new FormData();
      fd.append("token", up.token); fd.append("action", "chunk"); fd.append("file_id", it.id); fd.append("name", it.file.name);
      fd.append("size", it.file.size); fd.append("index", it.index); fd.append("total", total);
      fd.append("chunk", it.file.slice(start, Math.min(start + LIMITS.chunk, it.file.size)), "chunk");
      var xhr = it.xhr = new XMLHttpRequest();
      xhr.open("POST", API.UPLOAD); xhr.responseType = "text"; xhr.timeout = 120000;
      xhr.upload.onprogress = function(e){ if (e.lengthComputable) { it.sent = Math.min(it.file.size, start + e.loaded); render(it); } };
      var fail = function(msg, retry){ it.xhr = null; it.state = "error"; it.msg = msg; it.canRetry = retry; up.running = false; render(it); say(it.file.name + ": " + msg); pump(); };
      xhr.onerror = xhr.ontimeout = function(){
        if (attempt < 2) { setTimeout(function(){ if (it.state === "uploading") sendChunk(it, attempt + 1); }, 1500 * (attempt + 1)); return; }
        fail("The connection dropped. Press Retry to continue.", true);
      };
      xhr.onabort = function(){ it.xhr = null; };
      xhr.onload = function(){
        var j = null; try { j = JSON.parse(xhr.responseText); } catch (e) {}
        if (xhr.status === 200 && j && j.ok) {
          it.xhr = null;
          if (j.done) { it.state = "done"; it.sent = it.file.size; up.running = false; render(it); say(it.file.name + " uploaded."); pump(); return; }
          it.index = j.next; it.sent = it.index * LIMITS.chunk; render(it); sendChunk(it, 0); return;
        }
        if (xhr.status === 409 && j && j.error === "order") { it.index = j.next; sendChunk(it, 0); return; }
        if (xhr.status >= 500 || xhr.status === 0) { xhr.onerror(); return; }
        fail((j && j.message) || (xhr.status === 429 ? "Too many uploads. Please wait a few minutes." : "This file could not be uploaded."), xhr.status === 429);
      };
      xhr.send(fd);
    }

    pick.addEventListener("click", function(){ input.click(); });
    input.addEventListener("change", function(){ add(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); if (!up.locked) drop.classList.add("evs-over"); }); });
    ["dragleave", "drop"].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove("evs-over"); }); });
    drop.addEventListener("drop", function(e){ if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files); });
    return up;
  }

  // Leaving the page while a file is uploading would lose it.
  window.addEventListener("beforeunload", function(e){
    if (uploaders.quote.busy() || uploaders.custom.busy()) { e.preventDefault(); e.returnValue = ""; }
  });

  // If the visitor comes back with the browser's Back button, re-enable the request button
  window.addEventListener("pageshow", function(e){
    if (!e.persisted) return;
    var b = $("evs-accept"); if (b.classList.contains("evs-sent")) return; b.disabled = false; b.textContent = "Request this job";
  });

  $("evs-print").addEventListener("click", function(){ window.print(); });
  $("evs-back").addEventListener("click", function(){ if ($("evs-accept").classList.contains("evs-sent")) lastQuote = null; show("evs-form-card"); });
  $("evs-back2").addEventListener("click", function(){ show("evs-form-card"); });
})();
