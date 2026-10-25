/* eslint-disable -- standalone Node QA script (Playwright), not part of the site */
// usage: node shots.js <outdir> [widths=1440,1024,768,390,360] [url]
const { chromium } = require('playwright');
const fs = require('fs');
const NEW = process.env.NEWMAP === '1';
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const widths = (process.argv[3] || '1440,1024,768,390,360').split(',').map(Number);
const url = process.argv[4] || 'http://localhost:3001/unknown';
const H = { 1440: 900, 1024: 768, 768: 1024, 430: 932, 390: 844, 360: 740 };
const SECTIONS = ['.unknown-showroom', '.unk-pants', '.unk-arrivals', '.unk-caps', '.unk-lookbook', '.unk-visit', '.unk-footer'];
(async () => {
  const b = await chromium.launch();
  const report = {};
  for (const w of widths) {
    const mobile = w < 800;
    const ctx = await b.newContext({ viewport: { width: w, height: H[w] }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
    const p = await ctx.newPage();
    const issues = [];
    p.on('console', m => { if (['error', 'warning'].includes(m.type())) issues.push(m.text().slice(0, 300)); });
    p.on('pageerror', e => issues.push('pageerror: ' + e.message));
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: '.unk-reveal-on [data-reveal]{opacity:1!important;transform:none!important;transition:none!important}' });
    await p.waitForTimeout(1200);
    const shot = async (name) => p.screenshot({ path: `${out}/${w}-${name}.png` });
    const go = async (y, wait = 900) => { await p.evaluate(y => window.scrollTo(0, y), Math.round(y)); await p.waitForTimeout(wait); };
    await shot('01-hero');
    const g = await p.evaluate((SECTIONS) => {
      const vh = innerHeight, sy = scrollY;
      const visible = (el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; if (cs.clipPath && cs.clipPath.includes('inset(50%')) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
      const content = (root) => {
        let top = Infinity, bottom = -Infinity;
        for (const el of root.querySelectorAll('*')) {
          if (el.closest('.unk-sr,.sr-only,[aria-hidden="true"] .unk-sr')) continue;
          const tag = el.tagName.toLowerCase();
          const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
          // components are measured by their container (M3): links / buttons / inputs by their box
          const media = ['img', 'svg', 'input', 'button', 'select', 'video', 'a'].includes(tag) || /__well|__input/.test(el.className?.baseVal ?? el.className ?? '');
          if (!(hasText || media) || !visible(el)) continue;
          if (el.closest('select')) continue;
          let hidden = false; for (let a = el; a && a !== root; a = a.parentElement) { if (getComputedStyle(a).opacity === '0') { hidden = true; break; } }
          if (hidden) continue;
          const r = el.getBoundingClientRect();
          top = Math.min(top, r.top + scrollY); bottom = Math.max(bottom, r.bottom + scrollY);
        }
        return { top: Math.round(top), bottom: Math.round(bottom) };
      };
      const res = {};
      for (const s of SECTIONS) { const el = document.querySelector(s); if (!el) continue; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); res[s] = { boxTop: Math.round(r.top + sy), boxBottom: Math.round(r.bottom + sy), padTop: cs.paddingTop, padBottom: cs.paddingBottom, content: s === '.unk-pants' ? null : content(el) }; }
      const pants = document.querySelector('.unk-pants'); const stage = pants.querySelector('[data-pants-stage]');
      const pTop = pants.getBoundingClientRect().top + sy;
      return { vh, res, pantsTop: Math.round(pTop), pantsH: pants.offsetHeight, stageH: stage.offsetHeight, docH: document.documentElement.scrollHeight };
    }, SECTIONS);
    const n = await p.evaluate(() => document.querySelectorAll('[data-pants-item]').length);
    const travel = g.pantsH - g.stageH, PAD = 0.03;
    const uEnd = n - 2 + 0.8, lead = 0.12 / (0.12 + uEnd * 0.94); const scrollFor = NEW ? (u) => g.pantsTop + travel * (lead + (1 - lead) * Math.min(u, uEnd) / uEnd) : (u) => g.pantsTop + travel * (PAD + (u / (n - 1)) * (1 - 2 * PAD));
    const release = g.pantsTop + travel;
    // the last pair finishes its swap at u = n-2 + 0.8 in the current build
    const settled = scrollFor(n - 2 + 0.8);
    await go(g.pantsTop - g.vh * 0.45, 1000); await shot('02-entry');
    await go(scrollFor(0), 1000); await shot('03-pants-rest0');
    await go(scrollFor(0.5), 120); await shot('04-pants-mid0');
    await go(scrollFor(1), 1000); await shot('05-pants-rest1');
    await go(scrollFor(1.5), 120); await shot('06-pants-mid1');
    await go(settled, 1000); await shot('07-pants-last');
    // release frame: stage at its final position; measure its bottom content, then show the join
    await go(release, 1000);
    const stageEnd = await p.evaluate(() => {
      const stage = document.querySelector('[data-pants-stage]'); let bottom = -Infinity;
      for (const el of stage.querySelectorAll('.unk-pants__nav, [data-pants-buy], .unk-pants__figure')) { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.height > 2 && cs.visibility !== 'hidden' && el.closest('[data-pants-item]')?.style.opacity !== '0') bottom = Math.max(bottom, r.bottom + scrollY); }
      return Math.round(bottom);
    });
    await go(release + g.vh * 0.5, 1000); await shot('08-release-join');
    for (const s of SECTIONS.slice(2)) { const el = await p.$(s); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await el.screenshot({ path: `${out}/${w}-sec${s.replace('.unk-', '-')}.png` }); } }
    await go(0, 600);
    await p.screenshot({ path: `${out}/${w}-full.png`, fullPage: true });
    const C = (s) => g.res[s]?.content;
    const gaps = {
      'pants > New Arrivals (visual, at release)': C('.unk-arrivals').top - stageEnd,
      'New Arrivals > Caps': C('.unk-caps').top - C('.unk-arrivals').bottom,
      'Caps > Lookbook': C('.unk-lookbook').top - C('.unk-caps').bottom,
      'Lookbook > Visit': C('.unk-visit').top - C('.unk-lookbook').bottom,
      'Visit > footer': C('.unk-footer').top - C('.unk-visit').bottom,
    };
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    report[w] = { vh: g.vh, deadScrollAfterLastPair: Math.round(release - settled), pantsHeightScreens: +(g.pantsH / g.vh).toFixed(2), gaps, sections: g.res, overflowX: overflow, issues };
    console.log(w, JSON.stringify({ dead: report[w].deadScrollAfterLastPair, gaps, overflow, issues: issues.length }));
    await ctx.close();
  }
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  await b.close();
})();
