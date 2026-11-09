// The home page. Every section is plain HTML; scripts only enhance it.
import { h, type Raw } from './h.ts';
import {
  awards, diagrams, experience, journey, labels, lanes, person, projects, sideProjects, skillGroups,
  type Lane,
} from '../data.ts';
import { chips, device, diagram, ext, flowList, label, laneHead, projectCard, resumeLink } from './parts.ts';
import { xpSection } from './xp.ts';

function work(): Raw {
  const order: Lane[] = ['phone', 'seam', 'loop'];
  return h`<section class="section work" id="work" aria-labelledby="work-h">
  <header class="section__head">
    <p class="kicker">Selected work · ${projects.length} projects</p>
    <h2 id="work-h" class="section__title">Three lanes, one runtime boundary.</h2>
    <p class="section__lede">Left: the iOS I ship to 10M+ users. Right: the agent systems behind it. In the middle, the seam: AI that runs on the device itself. Every card leads with its result and opens a page with the details.</p>
  </header>
  <div class="lanes">
    ${order.map((lane) => {
      const items = projects.filter((p) => p.lane === lane);
      return h`<section class="lane" data-lane="${lane}" aria-label="${lanes[lane].name}">
        ${laneHead(lane, items.length)}
        <ul class="lane__list" role="list">${items.map(projectCard)}</ul>
      </section>`;
    })}
  </div>
</section>`;
}

function how(): Raw {
  return h`<section class="section how" id="how" aria-labelledby="how-h">
  <header class="section__head">
    <p class="kicker">Behind it · step by step</p>
    <h2 id="how-h" class="section__title">How the real router decides, one turn at a time.</h2>
    <p class="section__lede">The toy above fakes the classifier and the prices. This is the actual design of WibeyConductor. Step through it, or let it play. Each AI project page has its own diagram.</p>
  </header>
  ${diagram('wibeyconductor', diagrams.wibeyconductor)}
</section>`;
}

function otpScreen(): Raw {
  return h`<div class="app app--flow" data-flow-screen>
  <div class="app__head"><span class="app__title">Link accounts</span><span class="app__chip">US ↔ MX</span></div>
  <div class="flowscreen">
    <p class="flowscreen__big">Your US and Mexico accounts, in one app.</p>
    <p class="flowscreen__small">Link them once. Sign in to either market with the same account.</p>
    <button class="btn btn--primary btn--block js-only" type="button" data-flow-next>Link accounts</button>
  </div>
</div>`;
}

function ios(): Raw {
  const linking = projects.find((p) => p.slug === 'global-one-app-linking')!;
  const merge = projects.find((p) => p.slug === 'bodega-account-merge')!;
  return h`<section class="section ios" id="ios" aria-labelledby="ios-h">
  <header class="section__head">
    <p class="kicker">On the phone · re-enacted</p>
    <h2 id="ios-h" class="section__title">Identity flows you can tap through.</h2>
    <p class="section__lede">Two flows I shipped, rebuilt in a phone I drew. Every name, email and code here is sample data.</p>
  </header>
  <div class="ios__grid" data-flows>
    <div class="ios__device">
      <div class="seg js-only" role="group" aria-label="Choose a flow">
        <button type="button" aria-pressed="true" data-flow-tab="otp">Account linking</button>
        <button type="button" aria-pressed="false" data-flow-tab="merge">Account merge</button>
      </div>
      ${device(otpScreen(), label(labels.reenacted), 'device--flow')}
      <div class="ios__risk js-only" data-risk-wrap>
        <span id="risk-l">Sample risk level</span>
        <div class="seg seg--small" role="group" aria-labelledby="risk-l">
          <button type="button" aria-pressed="true" data-risk="low">Low</button>
          <button type="button" aria-pressed="false" data-risk="high">High</button>
        </div>
      </div>
    </div>
    <div class="ios__notes">
      <article class="ios__note" data-note="otp">
        <p class="kicker">${linking.kicker}</p>
        <h3><a href="/work/${linking.slug}/">${linking.title}</a></h3>
        <p>${linking.oneLiner}</p>
        ${flowList(linking.flow!)}
        <p class="ios__result"><b>${linking.metric.value}</b> ${linking.metric.label}</p>
      </article>
      <article class="ios__note" data-note="merge">
        <p class="kicker">${merge.kicker}</p>
        <h3><a href="/work/${merge.slug}/">${merge.title}</a></h3>
        <p>${merge.oneLiner}</p>
        ${flowList(merge.flow!)}
        <p class="ios__result"><b>${merge.metric.value}</b> ${merge.metric.label}</p>
      </article>
    </div>
  </div>
</section>`;
}

function journeySection(): Raw {
  return h`<section class="section journey" id="journey" aria-labelledby="journey-h">
  <header class="section__head">
    <p class="kicker">Journey · 2017 → 2026</p>
    <h2 id="journey-h" class="section__title">From mathematics to the phone, and the loop behind it.</h2>
  </header>
  <div class="journey__grid">
    <div class="journey__side">
      <h3 class="mini-h">Experience</h3>
      <ul class="roles" role="list">${experience.map((e) => h`<li><b>${e.role}</b><span>${e.org}</span><span class="muted">${e.when}</span></li>`)}</ul>
      <h3 class="mini-h">Education</h3>
      <p class="edu"><b>${person.education.school}</b><span>${person.education.degree}</span><span class="muted">${person.education.detail}</span></p>
    </div>
    <ol class="timeline" role="list">
      ${journey.map((j) => h`<li class="timeline__year"><span class="timeline__y">${j.year}</span><ul role="list">${j.items.map((t) => h`<li>${t}</li>`)}</ul></li>`)}
    </ol>
  </div>
</section>`;
}

function more(): Raw {
  return h`<section class="section more" aria-label="Recognition, side projects and skills">
  <div class="more__block" id="recognition">
    <h2 class="section__title section__title--sm">Recognition</h2>
    <ul class="awards" role="list">${awards.map((a) => h`<li class="award"><b>${a.title}</b><span>${a.from}${a.year ? ` · ${a.year}` : ''}</span></li>`)}</ul>
  </div>
  <div class="more__block" id="side">
    <h2 class="section__title section__title--sm">Side projects and research</h2>
    <ul class="side" role="list">${sideProjects.map((s) => h`<li class="side__item">
      <p class="kicker">${s.kicker}</p>
      <h3>${s.link ? h`<a href="${s.link}">${s.title}</a>` : s.title}</h3>
      <p>${s.text}</p>
      ${chips(s.stack)}
    </li>`)}</ul>
  </div>
  <div class="more__block" id="skills">
    <h2 class="section__title section__title--sm">Toolbox</h2>
    <div class="skills">${skillGroups.map((g) => h`<div class="skills__g"><h3 class="mini-h">${g.name}</h3>${chips(g.items)}</div>`)}</div>
  </div>
</section>`;
}

function contact(): Raw {
  return h`<section class="section contact" id="contact" aria-labelledby="contact-h">
  <p class="kicker">Contact</p>
  <h2 id="contact-h" class="contact__title">Building for the phone, the loop, or both? Let’s talk.</h2>
  <p class="contact__mail"><a href="mailto:${person.email}">${person.email}</a></p>
  <ul class="contact__links" role="list">
    <li>${ext(person.linkedin, 'LinkedIn')}</li>
    <li>${ext(person.github, 'GitHub')}</li>
    <li>${resumeLink('')}</li>
    <li><a href="/classic/">Classic view</a></li>
  </ul>
  <p class="muted">${person.location}</p>
</section>`;
}

export function homeBody(): Raw {
  return h`${xpSection()}<noscript><p class="noscript">JavaScript is off, so the 3D phone is a still image and the demos are static examples. Everything else works, and the <a href="/classic/">classic view</a> is plain text.</p></noscript>
${work()}${how()}${ios()}${journeySection()}${more()}${contact()}`;
}
