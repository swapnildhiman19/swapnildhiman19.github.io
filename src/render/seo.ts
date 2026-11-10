// Machine-readable files: JSON-LD, sitemap.xml, robots.txt, llms.txt.
import { awards, experience, journey, lanes, person, projects, site, stats, type Project } from '../data.ts';
import { ogImage } from './assets.ts';

const personId = `${site.url}/#person`;

export function personLd(): object {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: person.name,
        url: `${site.url}/`,
        image: ogImage,
        jobTitle: 'Senior Software Engineer, iOS (Applied AI)',
        description: person.summary,
        email: `mailto:${person.email}`,
        worksFor: { '@type': 'Organization', name: person.company },
        alumniOf: [{ '@type': 'CollegeOrUniversity', name: person.education.school }],
        address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru', addressCountry: 'IN' },
        knowsAbout: [
          'iOS', 'Swift', 'SwiftUI', 'Identity and sign-in', 'Passkeys', 'LLM agents', 'Multi-agent systems',
          'Model Context Protocol', 'LLM routing', 'Prompt caching', 'Embeddings', 'Knowledge graphs',
          'On-device LLMs', 'Apple Foundation Models',
        ],
        sameAs: [person.linkedin, person.github],
      },
      {
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        url: `${site.url}/`,
        name: person.name,
        inLanguage: 'en',
        author: { '@id': personId },
      },
    ],
  };
}

export function projectLd(p: Project): object {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        name: p.title,
        description: p.oneLiner,
        url: `${site.url}/work/${p.slug}/`,
        creator: { '@id': personId, '@type': 'Person', name: person.name },
        keywords: p.stack.join(', '),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Work', item: `${site.url}/#work` },
          { '@type': 'ListItem', position: 2, name: p.title, item: `${site.url}/work/${p.slug}/` },
        ],
      },
    ],
  };
}

export const allPaths = (): string[] => ['/', ...projects.map((p) => `/work/${p.slug}/`), '/classic/'];

export function sitemap(): string {
  const urls = allPaths()
    .map((p) => `  <url><loc>${site.url}${p}</loc><lastmod>${site.updated}</lastmod><priority>${p === '/' ? '1.0' : '0.7'}</priority></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const robots = (): string => `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`;

export function llms(): string {
  const line = (p: Project) =>
    `- [${p.title}](${site.url}/work/${p.slug}/) (${p.org}): ${p.oneLiner} Result: ${p.result}`;
  const group = (lane: Project['lane']) => projects.filter((p) => p.lane === lane).map(line).join('\n');
  return `# ${person.name}

> ${person.role} at ${person.company}, ${person.location}. ${person.taglineLead} ${person.taglinePhone} and ${person.taglineLoop}

${person.summary}

## Headline numbers
${stats.map((s) => `- ${s.value}: ${s.label}`).join('\n')}

## ${lanes.loop.name}: agent systems
${group('loop')}

## ${lanes.seam.name}: on-device AI
${group('seam')}

## ${lanes.phone.name}: iOS shipped
${group('phone')}

## Experience
${experience.map((e) => `- ${e.role}, ${e.org}, ${e.when}`).join('\n')}

## Journey
${journey.map((j) => `- ${j.year}: ${j.items.join('; ')}`).join('\n')}

## Recognition
${awards.map((a) => `- ${a.title}, ${a.from}${a.year ? `, ${a.year}` : ''}`).join('\n')}

## Education
- ${person.education.school}: ${person.education.degree}. ${person.education.detail}.

## Contact
- Email: ${person.email}
- LinkedIn: ${person.linkedin}
- GitHub: ${person.github}
- Résumé (PDF): ${site.url}${site.resume}
- Plain view of this site: ${site.url}/classic/

Note: demos on the site are toy illustrations and re-enactments with sample data, not production systems.
`;
}
