// Two identity flows, re-enacted with sample data inside the drawn phone:
// - Global One App account linking: OTP, then a risk-based step-up when the sample risk is high.
// - Bodega account merge: email step-up, merge preview, token exchange, success.
import { wait } from './motion.ts';
import { play } from './sound.ts';
import { esc } from '../render/h.ts';

type Flow = 'otp' | 'merge';
type Risk = 'low' | 'high';

const CODE_OTP = '246810';
const CODE_EMAIL = '135790';

const head = (title: string, chip: string, step: string) =>
  `<div class="app__head"><span class="app__title" tabindex="-1" data-focus-target>${esc(title)}</span><span class="app__chip">${esc(chip)}</span></div><p class="flowscreen__steps">${esc(step)}</p>`;

const codeScreen = (title: string, chip: string, step: string, to: string, code: string, cta: string) =>
  `${head(title, chip, step)}<div class="flowscreen">
    <p class="flowscreen__small">We sent a 6-digit code to <b>${esc(to)}</b>.</p>
    <div class="otp" role="group" aria-label="6-digit code">${Array.from({ length: 6 }, (_, k) => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${k + 1}"${k === 0 ? ' autocomplete="one-time-code"' : ''}>`).join('')}</div>
    <p class="flowscreen__hint">Sample code: ${code}</p>
    <p class="flowscreen__err" data-err aria-live="polite"></p>
    <button class="btn btn--primary btn--block" type="button" data-verify>${esc(cta)}</button>
  </div>`;

const busyScreen = (title: string, chip: string, text: string) =>
  `${head(title, chip, '')}<div class="flowscreen"><div class="spinner" aria-hidden="true"></div><p class="flowscreen__small flowscreen__center">${esc(text)}</p></div>`;

const doneScreen = (title: string, chip: string, text: string) =>
  `${head(title, chip, 'Done')}<div class="flowscreen"><div class="okmark" aria-hidden="true">✓</div><p class="flowscreen__big flowscreen__center">${esc(text)}</p><button class="btn btn--ghost btn--block" type="button" data-restart>Start over</button></div>`;

export function initFlows(root: HTMLElement): void {
  const screen = root.querySelector<HTMLElement>('[data-flow-screen]')!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-flow-tab]')];
  const notes = [...root.querySelectorAll<HTMLElement>('[data-note]')];
  const riskWrap = root.querySelector<HTMLElement>('[data-risk-wrap]')!;
  const riskBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-risk]')];
  let flow: Flow = 'otp';
  let risk: Risk = 'low';
  let run = 0; // cancels async steps from an older run

  function mount(html: string, focus: boolean) {
    screen.innerHTML = html;
    if (focus) screen.querySelector<HTMLElement>('[data-focus-target]')?.focus({ preventScroll: true });
  }

  function bindCode(code: string, onOk: () => void) {
    const inputs = [...screen.querySelectorAll<HTMLInputElement>('.otp input')];
    const err = screen.querySelector<HTMLElement>('[data-err]')!;
    const box = screen.querySelector<HTMLElement>('.otp')!;
    inputs.forEach((inp, k) => {
      inp.addEventListener('focus', () => inp.select()); // typing into a filled box replaces its digit
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/\D/g, '').slice(-1);
        if (inp.value && k < 5) inputs[k + 1].focus();
        play('tick');
      });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !inp.value && k > 0) inputs[k - 1].focus(); if (e.key === 'Enter') verify(); });
      inp.addEventListener('paste', (e) => {
        const digits = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
        if (!digits) return;
        e.preventDefault();
        inputs.forEach((x, j) => { x.value = digits[j] ?? ''; });
        inputs[Math.min(5, digits.length)].focus();
      });
    });
    const verify = () => {
      const v = inputs.map((x) => x.value).join('');
      if (v === code) { play('ok'); onOk(); return; }
      box.classList.add('is-wrong');
      err.textContent = v.length < 6 ? 'Enter all 6 digits.' : 'That code doesn’t match. Try again.';
      play('err');
      if (v.length === 6) inputs.forEach((x) => { x.value = ''; }); // a wrong code is cleared, ready to retype
      inputs[v.length < 6 ? v.length : 0].focus();
    };
    screen.querySelector('[data-verify]')!.addEventListener('click', verify);
  }

  async function busyThen(id: number, html: string, next: () => void) {
    mount(html, true);
    await wait(1100);
    if (id === run) next();
  }

  const restart = () => screen.querySelector('[data-restart]')?.addEventListener('click', () => start(true));

  function otpFlow(focus: boolean) {
    const id = ++run;
    mount(`${head('Link accounts', 'US ↔ MX', 'Step 1 of 4')}<div class="flowscreen">
      <p class="flowscreen__big">Your US and Mexico accounts, in one app.</p>
      <p class="flowscreen__small">Link them once and sign in to either market with the same account.</p>
      <button class="btn btn--primary btn--block" type="button" data-go>Link accounts</button></div>`, focus);
    screen.querySelector('[data-go]')!.addEventListener('click', () => {
      mount(codeScreen('Verify it’s you', 'OTP', 'Step 2 of 4', 's•••@example.com', CODE_OTP, 'Verify'), true);
      bindCode(CODE_OTP, () => {
        const finish = () => busyThen(id, busyScreen('Linking', 'US ↔ MX', 'Linking your accounts…'), () => { mount(doneScreen('Linked', 'US ↔ MX', 'Both accounts, one sign-in.'), true); restart(); });
        if (risk === 'low') { void finish(); return; }
        mount(codeScreen('One more check', 'Risk: high', 'Step 3 of 4 · step-up', 'your email', CODE_EMAIL, 'Confirm'), true);
        screen.querySelector('.flowscreen')!.insertAdjacentHTML('afterbegin', '<p class="flowscreen__small">This sign-in looks unusual (sample risk: high), so we ask for one more code.</p>');
        bindCode(CODE_EMAIL, () => void finish());
      });
    });
  }

  function mergeFlow(focus: boolean) {
    const id = ++run;
    mount(`${head('Welcome back', 'Merge', 'Step 1 of 5 · on app launch')}<div class="flowscreen">
      <p class="flowscreen__big">We found two accounts with your email.</p>
      <p class="flowscreen__small">Merge them to keep your orders, addresses and payment methods in one place.</p>
      <button class="btn btn--primary btn--block" type="button" data-go>Review and merge</button></div>`, focus);
    screen.querySelector('[data-go]')!.addEventListener('click', () => {
      mount(codeScreen('Confirm your email', 'Step-up', 'Step 2 of 5', 's•••@example.com', CODE_EMAIL, 'Continue'), true);
      bindCode(CODE_EMAIL, () => {
        mount(`${head('Merge preview', 'Merge', 'Step 3 of 5')}<div class="flowscreen">
          <p class="flowscreen__small">After the merge, one account will have:</p>
          <ul class="merge-list"><li><span>Orders</span><b>16</b></li><li><span>Addresses</span><b>3</b></li><li><span>Payment methods</span><b>2</b></li></ul>
          <p class="flowscreen__hint">Sample numbers</p>
          <button class="btn btn--primary btn--block" type="button" data-merge>Merge accounts</button></div>`, true);
        screen.querySelector('[data-merge]')!.addEventListener('click', () =>
          void busyThen(id, busyScreen('Merging', 'Step 4 of 5', 'Exchanging tokens…'), () => { mount(doneScreen('Merged', 'Step 5 of 5', 'One account, all your history.'), true); restart(); }));
      });
    });
  }

  function start(focus: boolean) {
    notes.forEach((n) => n.classList.toggle('is-active', n.dataset.note === flow));
    riskWrap.hidden = flow !== 'otp';
    if (flow === 'otp') otpFlow(focus); else mergeFlow(focus);
  }

  tabs.forEach((t) => t.addEventListener('click', () => {
    flow = t.dataset.flowTab as Flow;
    tabs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    start(false);
  }));
  riskBtns.forEach((b) => b.addEventListener('click', () => {
    risk = b.dataset.risk as Risk;
    riskBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (flow === 'otp') start(false);
  }));
  start(false);
}
