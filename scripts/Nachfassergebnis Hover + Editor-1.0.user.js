// ==UserScript==
// @name         Nachfassergebnis Hover + Editor
// @namespace    PRODINGER
// @version      1.0
// @description  Hoverfenster + großer Editor für Nachfassergebnis
// @match        https://mastebsapp.oci.prodinger.de/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ==========================
    // Hoverfenster
    // ==========================

    const hoverBox = document.createElement('div');

    hoverBox.style.cssText = `
        position:fixed;
        display:none;
        background:#ffffcc;
        border:1px solid #666;
        padding:10px;
        max-width:700px;
        min-width:300px;
        white-space:pre-wrap;
        word-break:break-word;
        z-index:999999;
        box-shadow:0 4px 12px rgba(0,0,0,0.3);
        font-size:12px;
        line-height:1.4;
        border-radius:4px;
        pointer-events:none;
    `;

    document.body.appendChild(hoverBox);

    // ==========================
    // Editorfenster
    // ==========================

    function openEditor(feld) {

        const overlay = document.createElement('div');

        overlay.style.cssText = `
            position:fixed;
            top:0;
            left:0;
            width:100%;
            height:100%;
            background:rgba(0,0,0,0.4);
            z-index:1000000;
            display:flex;
            justify-content:center;
            align-items:center;
        `;

        const popup = document.createElement('div');

        popup.style.cssText = `
            background:white;
            width:900px;
            height:650px;
            border-radius:8px;
            padding:15px;
            display:flex;
            flex-direction:column;
            box-shadow:0 0 20px rgba(0,0,0,0.4);
        `;

        const titel = document.createElement('h3');
        titel.textContent = 'Nachfassergebnis bearbeiten';

        const textarea = document.createElement('textarea');
        textarea.value = feld.value;

        textarea.style.cssText = `
            flex:1;
            width:100%;
            resize:none;
            font-size:14px;
            padding:10px;
        `;

        const buttons = document.createElement('div');
        buttons.style.textAlign = 'right';
        buttons.style.marginTop = '10px';

        const abbrechen = document.createElement('button');
        abbrechen.textContent = 'Abbrechen';

        const speichern = document.createElement('button');
        speichern.textContent = 'Übernehmen';
        speichern.style.marginLeft = '10px';

        abbrechen.onclick = () => {
            overlay.remove();
        };

        speichern.onclick = () => {

            feld.value = textarea.value;

            feld.dispatchEvent(new Event('input', {
                bubbles: true
            }));

            feld.dispatchEvent(new Event('change', {
                bubbles: true
            }));

            overlay.remove();
        };

        buttons.appendChild(abbrechen);
        buttons.appendChild(speichern);

        popup.appendChild(titel);
        popup.appendChild(textarea);
        popup.appendChild(buttons);

        overlay.appendChild(popup);

        document.body.appendChild(overlay);
    }

    // ==========================
    // Installation
    // ==========================

    function install() {

        const feld = document.getElementById('QotHdrFlex1');

        if (!feld) return;

        // Hover nur einmal installieren
        if (!feld.dataset.hoverInstalled) {

            feld.dataset.hoverInstalled = 'true';

            feld.addEventListener('mousemove', function (e) {

                const text = feld.value;

                if (!text || !text.trim()) {
                    hoverBox.style.display = 'none';
                    return;
                }

                hoverBox.textContent = text;

                hoverBox.style.left = (e.clientX + 20) + 'px';
                hoverBox.style.top = (e.clientY + 20) + 'px';
                hoverBox.style.display = 'block';
            });

            feld.addEventListener('mouseleave', function () {
                hoverBox.style.display = 'none';
            });
        }

        // Stift nur einmal anlegen
        if (document.getElementById('tmNachfassStift')) return;

        const stift = document.createElement('span');

        stift.id = 'tmNachfassStift';
        stift.innerHTML = '✏️';
        stift.title = 'Nachfassergebnis bearbeiten';

        stift.style.cssText = `
            cursor:pointer;
            margin-left:8px;
            font-size:18px;
            vertical-align:middle;
        `;

        stift.onclick = () => openEditor(feld);

        feld.parentNode.appendChild(stift);
    }

    setInterval(install, 1000);

})();