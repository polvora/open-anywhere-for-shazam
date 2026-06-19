/* Open Anywhere for Shazam
 * Inyecta botones de YouTube / YouTube Music / Spotify en las páginas de
 * canciones de shazam.com, junto al botón existente de Apple Music.
 *
 * No usa ninguna API ni recolecta datos. Solo lee artista + título del DOM y
 * construye enlaces de búsqueda. Compatible con todo navegador Chromium y con
 * Firefox (solo content script + DOM; sin APIs específicas de navegador).
 *
 * Shazam es una SPA (Next.js): el script reacciona a los cambios de URL y del
 * DOM para re-inyectar cuando cambia la canción.
 */
(function () {
  "use strict";

  const WRAP_ID = "sy-yt-buttons";
  const DATA_KEY = "syKey"; // marca qué canción está inyectada

  // ---- Configuración de servicios -----------------------------------------
  // query = `${artist} ${title}`
  const SERVICES = [
    {
      id: "youtube",
      label: "YouTube",
      cls: "sy-btn sy-yt",
      url: (q) =>
        "https://www.youtube.com/results?search_query=" + encodeURIComponent(q),
      icon: ytIcon(),
    },
    {
      id: "ytmusic",
      label: "YouTube Music",
      cls: "sy-btn sy-ytm",
      url: (q) =>
        "https://music.youtube.com/search?q=" + encodeURIComponent(q),
      icon: ytMusicIcon(),
    },
    {
      id: "spotify",
      label: "Spotify",
      cls: "sy-btn sy-sp",
      url: (q) => "https://open.spotify.com/search/" + encodeURIComponent(q),
      icon: spotifyIcon(),
    },
  ];

  // Etiqueta localizada ("Listen on:" / "Escuchar en:") con fallback seguro.
  function uiLabel() {
    try {
      const m =
        typeof chrome !== "undefined" &&
        chrome.i18n &&
        chrome.i18n.getMessage("listen_on");
      if (m) return m;
    } catch (e) {
      /* noop */
    }
    return "Listen on:";
  }

  // ---- Extracción de artista + título (independiente del idioma) ----------
  function meta(prop) {
    const el =
      document.querySelector('meta[property="' + prop + '"]') ||
      document.querySelector('meta[name="' + prop + '"]');
    return el ? el.getAttribute("content") : null;
  }

  function clean(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function extractSong() {
    // Estrategia 1 (locale-agnostic): enlace del artista en la cabecera +
    // document.title con formato "TÍTULO - ARTISTA: <sufijo localizado>".
    const header =
      document.querySelector(
        '[class*="TrackPageHeader"], [class*="NewTrackPageHeader"]'
      ) || document;
    const aEl =
      header.querySelector('a[class*="ArtistLink"], a[class*="artistLink"]') ||
      document.querySelector('a[class*="ArtistLink"], a[class*="artistLink"]');
    const artist = aEl ? clean(aEl.textContent) : "";
    if (artist) {
      const t = document.title || "";
      const idx = t.indexOf(" - " + artist);
      if (idx > 0) return { title: clean(t.slice(0, idx)), artist };
    }

    // Estrategia 2: og:description en inglés -> "Listen to TÍTULO by ARTISTA."
    const d = meta("og:description");
    if (d) {
      const m = d.match(/^Listen to (.+) by (.+?)\.\s/);
      if (m) return { title: clean(m[1]), artist: clean(m[2]) };
    }

    // Estrategia 3: og:title -> "TÍTULO - ARTISTA: ..."
    const ot = meta("og:title") || document.title;
    if (ot) {
      const m = ot.match(/^(.+) - (.+?):/);
      if (m) return { title: clean(m[1]), artist: clean(m[2]) };
    }
    return null;
  }

  // ---- Construcción de los botones ----------------------------------------
  function buildButtons(song) {
    const q = song.artist + " " + song.title;
    const wrap = document.createElement("div");
    wrap.id = WRAP_ID;
    wrap.className = "sy-wrap";
    wrap.dataset[DATA_KEY] = song.artist + "|" + song.title;

    const label = document.createElement("span");
    label.className = "sy-title";
    label.textContent = uiLabel();
    wrap.appendChild(label);

    const row = document.createElement("div");
    row.className = "sy-row";
    SERVICES.forEach((s) => {
      const a = document.createElement("a");
      a.className = s.cls;
      a.href = s.url(q);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = s.icon + "<span>" + s.label + "</span>";
      a.title = song.title + " — " + song.artist + " · " + s.label;
      row.appendChild(a);
    });
    wrap.appendChild(row);
    return wrap;
  }

  // ---- Inyección ----------------------------------------------------------
  function inject() {
    const song = extractSong();
    if (!song || !song.title || !song.artist) return;

    const key = song.artist + "|" + song.title;
    const existing = document.getElementById(WRAP_ID);
    if (existing) {
      if (existing.dataset[DATA_KEY] === key) return; // ya está, misma canción
      existing.remove(); // cambió de canción -> reconstruir
    }

    const node = buildButtons(song);

    // Punto de anclaje preferido: contenedor de botones de música de Shazam.
    const container = document.querySelector('[class*="musicButtonsContainer"]');
    if (container) {
      container.appendChild(node);
      return;
    }
    // Fallback 1: junto al botón de Apple Music.
    const apple =
      document.querySelector('a[class*="AppleMusicButton"]') ||
      [...document.querySelectorAll("a")].find((a) =>
        /apple music/i.test(a.textContent)
      );
    if (apple && apple.parentElement) {
      apple.parentElement.insertAdjacentElement("afterend", node);
      return;
    }
    // Fallback 2: botón flotante.
    node.classList.add("sy-floating");
    document.body.appendChild(node);
  }

  // ---- Reacción a SPA (cambios de URL) y a cambios del DOM -----------------
  let lastUrl = location.href;

  function onChange() {
    clearTimeout(onChange._t);
    onChange._t = setTimeout(inject, 350); // debounce
  }

  function isSongPage() {
    return /\/song\//.test(location.pathname);
  }

  // Parchea pushState/replaceState para detectar navegación SPA.
  ["pushState", "replaceState"].forEach((fn) => {
    const orig = history[fn];
    history[fn] = function () {
      const r = orig.apply(this, arguments);
      window.dispatchEvent(new Event("sy:locationchange"));
      return r;
    };
  });
  window.addEventListener("popstate", () =>
    window.dispatchEvent(new Event("sy:locationchange"))
  );
  window.addEventListener("sy:locationchange", () => {
    lastUrl = location.href;
    const old = document.getElementById(WRAP_ID);
    if (old) old.remove();
    if (isSongPage()) onChange();
  });

  // Observa el DOM: re-inyecta si Shazam re-renderiza la cabecera o si la URL
  // cambió sin disparar los eventos de history.
  const mo = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      const old = document.getElementById(WRAP_ID);
      if (old) old.remove();
    }
    if (isSongPage()) onChange();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  if (isSongPage()) onChange();

  // ---- Iconos SVG inline ---------------------------------------------------
  function ytIcon() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/></svg>';
  }
  function ytMusicIcon() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-2-12 6 4-6 4V8Z"/></svg>';
  }
  function spotifyIcon() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.7.7 0 0 1-1 .2c-2.6-1.6-5.9-2-9.8-1.1a.7.7 0 1 1-.3-1.4c4.2-1 7.9-.5 10.8 1.3.3.2.4.6.3 1Zm1.2-2.7a.9.9 0 0 1-1.2.3c-3-1.8-7.6-2.4-11.1-1.3a.9.9 0 1 1-.5-1.7c4-1.2 9-.6 12.5 1.5.4.3.6.8.3 1.2Zm.1-2.8C14.3 8.9 8.4 8.7 5 9.7a1 1 0 1 1-.6-2c3.9-1.2 10.4-.9 14.4 1.4a1 1 0 0 1-1 1.8Z"/></svg>';
  }
})();
