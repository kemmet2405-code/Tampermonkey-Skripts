// ==UserScript==
// @name         Angebotsprüfung Mindermenge
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Warnung anzeigen wenn Angebotswert unter 200€ liegt (optimiert für Oracle EBS)
// @author       Steffen
// @match        https://mastebsapp.oci.prodinger.de/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const WARNING_ID = 'mindermengen-warning';
    const AMOUNT_FIELD_ID = 'QotHdrAmt';
    const CHECK_INTERVAL_MS = 1000;

    let lastStateKey = '';
    let intervalStarted = false;

    // Mehrere Startpunkte (wichtig für Oracle EBS)
    window.addEventListener('load', startSafeChecker);
    document.addEventListener('readystatechange', startSafeChecker);

    function startSafeChecker() {
        if (intervalStarted) return;

        // Nur starten wenn Feld existiert
        if (!document.getElementById(AMOUNT_FIELD_ID)) {
            setTimeout(startSafeChecker, 1000);
            return;
        }

        intervalStarted = true;
        evaluatePage();

        setInterval(() => {
            evaluatePage();
        }, CHECK_INTERVAL_MS);
    }

    function evaluatePage() {
        const visibleAmountElements = getVisibleAmountElements();

        if (visibleAmountElements.length !== 1) {
            updateWarning(false, null);
            return;
        }

        const amountElement = visibleAmountElements[0];
        const amount = parseGermanAmount(amountElement.textContent);

        if (amount === null || isNaN(amount)) {
            updateWarning(false, null);
            return;
        }

        const shouldWarn = amount < 200;
        updateWarning(shouldWarn, amount);
    }

    function getVisibleAmountElements() {
        const elements = Array.from(document.querySelectorAll('#' + AMOUNT_FIELD_ID));
        return elements.filter(isActuallyVisible);
    }

    function isActuallyVisible(el) {
        if (!el || !document.body.contains(el)) return false;

        let current = el;

        while (current && current !== document.body) {
            const style = window.getComputedStyle(current);

            if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                style.opacity === '0'
            ) {
                return false;
            }

            current = current.parentElement;
        }

        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function parseGermanAmount(text) {
        if (!text) return null;

        let valueText = String(text).trim();
        valueText = valueText.replace(/[^\d,.\-]/g, '');
        valueText = valueText.replace(/\./g, '');
        valueText = valueText.replace(',', '.');

        const amount = parseFloat(valueText);
        return isNaN(amount) ? null : amount;
    }

    function updateWarning(shouldShow, amount) {
        const stateKey = `${shouldShow}|${amount !== null ? amount : 'none'}`;

        if (stateKey === lastStateKey) return;
        lastStateKey = stateKey;

        if (shouldShow) {
            showWarning(amount);
        } else {
            removeWarning();
        }
    }

    function showWarning(amount) {
        let warning = document.getElementById(WARNING_ID);

        const text =
            `⚠ Wert unter 200 Euro - Bitte Mindermenge + Frachtkosten prüfen. ` +
            `Kunde anrufen - Cross-Selling! (Betrag: ${formatEuro(amount)})`;

        if (!warning) {
            warning = document.createElement('div');
            warning.id = WARNING_ID;
            warning.textContent = text;

            warning.style.position = 'fixed';
            warning.style.top = '12px';
            warning.style.right = '12px';
            warning.style.background = '#e53935';
            warning.style.color = '#ffffff';
            warning.style.padding = '10px 14px';
            warning.style.fontSize = '14px';
            warning.style.fontWeight = '700';
            warning.style.borderRadius = '6px';
            warning.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
            warning.style.zIndex = '99999';
            warning.style.maxWidth = '360px';
            warning.style.lineHeight = '1.35';
            warning.style.cursor = 'pointer';

            // Klick = schließen
            warning.addEventListener('click', () => {
                warning.remove();
                lastStateKey = '';
            });

            document.body.appendChild(warning);
        } else if (warning.textContent !== text) {
            warning.textContent = text;
        }
    }

    function removeWarning() {
        const warning = document.getElementById(WARNING_ID);
        if (warning) {
            warning.remove();
        }
    }

    function formatEuro(value) {
        try {
            return new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR'
            }).format(value);
        } catch (e) {
            return value + ' €';
        }
    }

})();