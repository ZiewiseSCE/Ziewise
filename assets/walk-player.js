"use strict";

(() => {
  const data = JSON.parse(document.getElementById("film-data").textContent);
  if (location.protocol === "file:") {
    for (const a of document.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href");
      if (/^(?:\.\.\/)?ai-briefing\/(?:[?#]|$)/.test(href)) {
        a.setAttribute("href", href.replace("ai-briefing/", "ai-briefing/index.html"));
      }
    }
  }
  const legacySections = {factory:"factory",systems:"process",llm:"llm",solutions:"industries",office:"office",roi:"roi",company:"company",contact:"contact"};
  const legacyTarget = data.page === "index" && legacySections[location.hash.slice(1)];
  if (typeof legacyTarget === "string") {
    location.replace(legacyTarget + ".html");
    return;
  }
  const video = document.getElementById("film");
  const viewer = document.getElementById("viewer");
  const play = document.getElementById("play");
  const seek = document.getElementById("seek");
  const clock = document.getElementById("now");
  const caption = document.getElementById("film-caption");
  const captions = document.getElementById("captions");
  const expand = document.getElementById("expand");
  const audioGuide = document.getElementById("audio-guide");
  const stops = [...document.querySelectorAll("[data-stop]")];
  const scenes = [...document.querySelectorAll("[data-scene]")];
  const signLinks = [...document.querySelectorAll("[data-sign]")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentCue = -1;
  let resumeAfterPanel = false;
  let resumeAfterVisibility = false;
  let scheduledStart = null;
  let autoplayCancelled = false;
  let guideStarted = false;
  const sourceURL = video.querySelector("source").src;
  let localMedia = "";
  let preparingMedia = false;
  let fetchFailed = false;
  const length = () => Number.isFinite(video.duration) ? video.duration : data.duration;
  const timeLabel = seconds => [Math.floor(seconds / 60), Math.floor(seconds % 60)].map(n => String(n).padStart(2, "0")).join(":");

  function setPlaybackUI() {
    const ended = video.ended;
    const running = !video.paused && !ended;
    play.classList.toggle("playing", running);
    play.classList.toggle("ended", ended);
    play.setAttribute("aria-label", ended ? "처음부터 다시 재생" : running ? "일시정지" : "재생");
    play.title = play.getAttribute("aria-label");
  }
  function positionSigns(t) {
    signLinks.forEach((link, i) => {
      const {quads} = data.signs[i];
      const last = quads.length - 1;
      const visible = t >= quads[0][0] && t <= quads[last][0];
      link.toggleAttribute("hidden", !visible);
      if (!visible) return;
      let j = 1;
      while (j < last && quads[j][0] < t) j++;
      const a = quads[j-1], b = quads[j];
      const mix = Math.min(1, Math.max(0, (t-a[0]) / (b[0]-a[0])));
      const points = [];
      for (let n = 1; n < a.length; n += 2) {
        const x = (a[n] + (b[n]-a[n])*mix) * 12.8;
        const y = (a[n+1] + (b[n+1]-a[n+1])*mix) * 7.2;
        points.push(x.toFixed(2) + "," + y.toFixed(2));
      }
      link.querySelector("polygon").setAttribute("points", points.join(" "));
    });
  }
  if (signLinks.length && video.requestVideoFrameCallback) {
    function trackFrame(_, frame) {
      positionSigns(frame.mediaTime);
      video.requestVideoFrameCallback(trackFrame);
    }
    video.requestVideoFrameCallback(trackFrame);
  }
  function setPosition() {
    const t = Math.max(0, video.currentTime || 0);
    if (signLinks.length) positionSigns(t);
    const duration = length();
    seek.value = Math.min(t, duration);
    seek.style.setProperty("--played", Math.min(100, 100*t/duration) + "%");
    clock.textContent = timeLabel(t);
    seek.setAttribute("aria-valuetext", timeLabel(t) + " / " + timeLabel(duration));
    let active = 0;
    data.cues.forEach((cue, i) => { if (t + 0.002 >= cue.start) active = i; });
    if (active === currentCue) return;
    currentCue = active;
    const cue = data.cues[active];
    document.getElementById("cap-line").textContent = cue.line;
    stops.forEach((stop,i) => stop.classList.toggle("active", i <= active));
    viewer.dataset.cue = String(active);
    scenes.forEach((button, i) => {
      button.classList.toggle("current", i === active);
      if (i === active) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current");
    });
  }
  function start() {
    if (video.ended) video.currentTime = 0;
    const promise = video.play();
    if (promise) promise.catch(() => { setPlaybackUI(); });
  }
  function nativeJump(t, run) {
    video.currentTime = Math.max(0, Math.min(t, length()));
    setPosition();
    if (run && !document.hidden && !document.querySelector("dialog[open]")) start();
  }
  async function prepareSeekableMedia() {
    if (preparingMedia) return;
    preparingMedia = true;
    try {
      // A static host may serve the complete MP4 but omit HTTP byte ranges.
      // Buffer only the selected film, and only when a user requests a seek.
      const response = await fetch(sourceURL);
      if (!response.ok) throw new Error("Film unavailable");
      localMedia = URL.createObjectURL(await response.blob());
      video.src = localMedia;
      video.load();
    } catch {
      fetchFailed = true;
      const pending = scheduledStart;
      scheduledStart = null;
      if (pending) nativeJump(pending.t, pending.run);
    } finally {
      preparingMedia = false;
    }
  }
  function jump(t, run) {
    autoplayCancelled = true;
    const shouldRun = run || (!video.paused && !video.ended);
    if (preparingMedia) {
      scheduledStart = {t, run:shouldRun};
      return;
    }
    if (video.readyState === 0) {
      scheduledStart = {t, run:shouldRun};
      video.load();
      return;
    }
    const ranges = video.seekable;
    const lastReachable = ranges.length ? ranges.end(ranges.length-1) : 0;
    if (!localMedia && !fetchFailed && /^https?:$/.test(location.protocol) && t > lastReachable + .1) {
      scheduledStart = {t, run:shouldRun};
      prepareSeekableMedia();
      return;
    }
    nativeJump(t, run);
  }
  video.controls = false;
  video.muted = true;
  video.defaultMuted = true;
  video.addEventListener("loadedmetadata", () => {
    seek.max = length();
    if (scheduledStart) {
      const pending = scheduledStart;
      scheduledStart = null;
      jump(pending.t, pending.run);
    }
    setPosition();
  });
  ["timeupdate", "seeking", "seeked", "durationchange"].forEach(event => video.addEventListener(event, setPosition));
  ["play", "pause", "playing", "ended"].forEach(event => video.addEventListener(event, setPlaybackUI));
  video.addEventListener("error", () => {
    document.getElementById("media-error").hidden = false;
    setPlaybackUI();
  });
  play.addEventListener("click", () => {
    autoplayCancelled = true;
    if (video.paused || video.ended) start(); else video.pause();
  });
  function showAudioState() {
    audioGuide.setAttribute("aria-pressed", String(!video.muted));
    audioGuide.querySelector("span").textContent = video.muted ? (guideStarted ? "해설 켜기" : "해설 듣기") : "해설 끄기";
    audioGuide.title = video.muted && !guideStarted ? "한국어 해설과 함께 처음부터 재생" : audioGuide.querySelector("span").textContent;
  }
  audioGuide.addEventListener("click", () => {
    autoplayCancelled = true;
    if (video.muted) {
      video.muted = false;
      if (!guideStarted || video.ended) {
        video.currentTime = 0;
        guideStarted = true;
      }
      start();
    } else {
      video.muted = true;
    }
    showAudioState();
  });
  video.addEventListener("volumechange", showAudioState);
  seek.addEventListener("input", () => jump(Number(seek.value), false));
  scenes.forEach((button, index) => button.addEventListener("click", () => jump(data.cues[index].start, true)));
  captions.addEventListener("click", () => {
    caption.hidden = !caption.hidden;
    captions.setAttribute("aria-pressed", String(!caption.hidden));
  });

  function setExpandedText() {
    const active = Boolean(document.fullscreenElement) || viewer.classList.contains("is-expanded");
    expand.setAttribute("aria-label", active ? "큰 화면 닫기" : "영상 크게 보기");
    expand.title = expand.getAttribute("aria-label");
  }
  async function toggleExpanded() {
    if (viewer.classList.contains("is-expanded")) {
      viewer.classList.remove("is-expanded");
      document.body.style.overflow = "";
    } else if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else {
      try {
        if (!viewer.requestFullscreen) throw new Error();
        await viewer.requestFullscreen();
      } catch {
        viewer.classList.add("is-expanded");
        document.body.style.overflow = "hidden";
        expand.focus();
      }
    }
    setExpandedText();
  }
  expand.addEventListener("click", toggleExpanded);
  document.querySelectorAll("[data-enlarge]").forEach(b => b.addEventListener("click", toggleExpanded));
  document.addEventListener("fullscreenchange", setExpandedText);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && viewer.classList.contains("is-expanded")) toggleExpanded(); });

  function openPanel(id) {
    const dialog = document.getElementById(id);
    if (!dialog || dialog.open) return;
    resumeAfterPanel = !video.paused && !video.ended;
    autoplayCancelled = true;
    video.pause();
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog.querySelector("[data-close]")?.focus({preventScroll: true});
  }
  document.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openPanel(b.dataset.open)));
  signLinks.forEach(link => link.addEventListener("click", event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const source = link.getAttribute("href");
    const image = document.getElementById("certificate-original");
    image.src = source;
    image.alt = link.dataset.label + " · 지와이즈 증서 원본";
    document.getElementById("certificate-title").textContent = link.dataset.label;
    document.getElementById("certificate-scope").textContent = link.dataset.scope;
    document.getElementById("certificate-download").href = source;
    openPanel("certificate-view");
  }));
  document.querySelectorAll("dialog.drawer").forEach(dialog => {
    dialog.querySelector("[data-close]")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", e => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.style.overflow = "";
      dialog.querySelectorAll("audio").forEach(a => a.pause());
      if (resumeAfterPanel && !document.hidden) start();
      resumeAfterPanel = false;
    });
  });
  document.querySelectorAll(".library details").forEach(details => details.addEventListener("toggle", () => {
    if (!details.open) details.querySelector("audio")?.pause();
  }));
  document.addEventListener("play", e => {
    if (e.target.tagName === "AUDIO") document.querySelectorAll("audio").forEach(a => { if (a !== e.target) a.pause(); });
  }, true);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resumeAfterVisibility = !video.paused && !video.ended;
      video.pause();
    } else if (resumeAfterVisibility && !document.querySelector("dialog[open]")) {
      resumeAfterVisibility = false;
      start();
    }
  });
  reduceMotion.addEventListener("change", e => { if (e.matches) video.pause(); });
  window.addEventListener("pagehide", event => {
    if (!event.persisted && localMedia) URL.revokeObjectURL(localMedia);
  });
  setPosition();
  setPlaybackUI();
  const params = new URLSearchParams(location.search);
  const originalKey = params.get("reference") || params.get("scene") || location.hash.slice(1);
  const initialTopic = params.get("topic") || params.get("chapter") || data.legacy[originalKey];
  const detail = initialTopic && [...document.querySelectorAll("[data-topic]")].find(item => item.dataset.topic === initialTopic);
  if ((params.get("resources") === "1" || (data.page === "briefing" && location.pathname.endsWith("/reference.html"))) && document.getElementById("original-resources")) {
    openPanel("action-panel");
    const resources = document.getElementById("original-resources");
    resources.open = true;
    const reference = [...resources.querySelectorAll("[data-reference]")].find(el => el.dataset.reference === originalKey);
    if (reference) reference.open = true;
    (reference || resources).scrollIntoView({block:"start"});
  } else if (detail) {
    openPanel("action-panel");
    detail.open = true;
    detail.scrollIntoView({block:"center"});
  } else if (document.getElementById("brand-intro")?.open) {
    function enterMain() {
      if (reduceMotion.matches || autoplayCancelled || document.querySelector("dialog[open]")) return;
      if (document.hidden) document.addEventListener("visibilitychange", enterMain, {once:true});
      else start();
    }
    document.getElementById("brand-intro").addEventListener("close", enterMain, {once:true});
  } else if (!reduceMotion.matches && !document.hidden && !autoplayCancelled) {
    start();
  }

  const models = ["사내 LLM", "GPT", "Claude", "Gemini"];
  const modelButtons = [...document.querySelectorAll("[data-model]")];
  modelButtons.forEach((b, i) => b.addEventListener("click", () => {
    modelButtons.forEach((btn, j) => btn.setAttribute("aria-pressed", String(i === j)));
    document.getElementById("model-title").textContent = models[i];
    document.getElementById("model-text").textContent = i === 0
      ? "사내 서버에서 허용된 문단을 검색하고 로컬 모델이 근거를 붙여 답합니다."
      : "사내에서 문서 권한을 확인하고 전송을 허용한 항목과 마스킹 범위를 정한 뒤 " + models[i] + " API로 답변을 생성하는 구성입니다.";
  }));

  const enquiryButtons = [...document.querySelectorAll("[data-enquiry]")];
  function setEnquiry(i) {
    const [topic, help] = data.contact[i];
    enquiryButtons.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    document.getElementById("enquiry-name").textContent = topic;
    document.getElementById("enquiry-help").textContent = help;
    document.getElementById("enquiry-mail").href = "mailto:info@ziewise.com?subject=" + encodeURIComponent("[도입 문의] " + topic);
  }
  enquiryButtons.forEach((b, i) => b.addEventListener("click", () => setEnquiry(i)));
  if (enquiryButtons.length) setEnquiry(0);

  const form = document.getElementById("roi-form");
  if (form) {
    const fmt = n => new Intl.NumberFormat("ko-KR", {maximumFractionDigits:1}).format(n);
    const money = n => fmt(n/10000) + "만원";
    function updateROI() {
      const values = {};
      let valid = true;
      for (const input of form.querySelectorAll("input")) {
        valid = valid && input.validity.valid && Number.isFinite(input.valueAsNumber);
        values[input.name] = input.valueAsNumber;
      }
      const hours = values.volume * (values.before - values.after) / 60;
      const gross = hours * values.rate;
      const running = values.running * 10000, initial = values.initial * 10000;
      const net = gross - running, year = 12 * net - initial, cost = initial + 12 * running;
      const result = {hours:fmt(hours)+"시간",gross:money(gross),net:money(net),year:money(year),
                      roi:cost>0 ? fmt(100*year/cost)+"%" : "비용 0원 · 산정 제외",
                      payback:net>0 ? fmt(initial/net)+"개월" : "회수 불가"};
      form.querySelectorAll("[data-result]").forEach(el => el.textContent = valid ? result[el.dataset.result] : "—");
      document.getElementById("roi-status").textContent = !valid ? "모든 항목에 허용 범위 안의 숫자를 입력해 주세요." : hours<0 ? "입력한 조건에서는 도입 후 처리시간이 더 깁니다." : "";
    }
    form.addEventListener("input", updateROI);
    form.addEventListener("reset", () => requestAnimationFrame(updateROI));
    form.addEventListener("submit", e => e.preventDefault());
    updateROI();
  }
})();
