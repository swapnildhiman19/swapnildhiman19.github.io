// The classic view: everything on one plain, fast, printable page. No scripts, no motion.
import { h, type Raw } from './h.ts';
import { awards, experience, journey, lanes, person, projects, sideProjects, site, skillGroups, stats, type Lane } from '../data.ts';

export function classicBody(): Raw {
  const order: Lane[] = ['loop', 'seam', 'phone'];
  return h`<article class="classic">
  <header>
    <h1>${person.name}</h1>
    <p><b>${person.roleLong}</b></p>
    <p>${person.company}, ${person.location} · ${person.tenure}</p>
    <p>${person.taglineLead} ${person.taglinePhone} and ${person.taglineLoop}</p>
    <p><a href="mailto:${person.email}">${person.email}</a> · <a href="${person.linkedin}">LinkedIn</a> · <a href="${person.github}">GitHub</a> · <a href="${site.resume}">Résumé (PDF)</a> · <a href="/">Full site</a></p>
  </header>

  <section><h2>Summary</h2><p>${person.summary}</p></section>

  <section><h2>Headline numbers</h2><ul>${stats.map((s) => h`<li><b>${s.value}</b> ${s.label}</li>`)}</ul></section>

  <section><h2>Experience</h2><ul>${experience.map((e) => h`<li><b>${e.role}</b>, ${e.org} (${e.when})</li>`)}</ul></section>

  ${order.map((lane) => h`<section><h2>${lanes[lane].name}: ${lanes[lane].blurb}</h2>
    ${projects.filter((p) => p.lane === lane).map((p) => h`<div class="c-proj">
      <h3><a href="/work/${p.slug}/">${p.title}</a></h3>
      <p class="c-meta">${p.org} · ${p.kicker}${p.status ? ` · ${p.status}` : ''}</p>
      <p><b>${p.metric.value}</b> ${p.metric.label}${(p.extraMetrics ?? []).map((m) => h`; <b>${m.value}</b> ${m.label}`)}</p>
      <p>${p.oneLiner}</p>
      ${p.credit ? h`<p><i>${p.credit}</i></p>` : ''}
      <ul>${p.how.map((t) => h`<li>${t}</li>`)}</ul>
      <p class="c-meta">Stack: ${p.stack.join(', ')}</p>
    </div>`)}
  </section>`)}

  <section><h2>Journey</h2><ul>${journey.map((j) => h`<li><b>${j.year}</b>: ${j.items.join('; ')}</li>`)}</ul></section>
  <section><h2>Recognition</h2><ul>${awards.map((a) => h`<li>${a.title}, ${a.from}${a.year ? `, ${a.year}` : ''}</li>`)}</ul></section>
  <section><h2>Side projects and research</h2><ul>${sideProjects.map((s) => h`<li><b>${s.title}</b> (${s.kicker}): ${s.text}</li>`)}</ul></section>
  <section><h2>Education</h2><p>${person.education.school}: ${person.education.degree}. ${person.education.detail}. ${person.education.thesis}</p></section>
  <section><h2>Skills</h2>${skillGroups.map((g) => h`<p><b>${g.name}:</b> ${g.items.join(', ')}</p>`)}</section>
  <footer><p>Demos on the full site are toy illustrations and re-enactments with sample data. Updated ${site.updated}.</p></footer>
</article>`;
}
