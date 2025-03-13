import { e621Token } from './config.js';

export default function transformDText(dtext: string, baseUrl: string = 'https://e621.net'): string {
  const replacements: { [key: string]: string | ((_: string, ...args: any[]) => string) } = {
    '<([^>]+)>': (_, p1) => {
      const url = p1.startsWith('http') ? p1 : `${baseUrl}${encodeURIComponent(p1)}`;
      return `<a href="${url}">${url}</a>`;
    },

    '\\[table\\](.*?)\\[\\/table\\]': '',

    '\\[b\\](.*?)\\[\\/b\\]': '<b>$1</b>',

    '\\[i\\](.*?)\\[\\/i\\]': '<i>$1</i>',

    '\\[u\\](.*?)\\[\\/u\\]': '<u>$1</u>',

    '\\[s\\](.*?)\\[\\/s\\]': '<s>$1</s>',

    '"([^"]+)":\\[?([^\\]]+)\\]?': (_, p1, p2) => {
      const url = p2.startsWith('http') ? p2 : `${baseUrl}${encodeURIComponent(p2)}`;
      return `<a href="${url}">${p1}</a>`;
    },

    '\\[spoiler\\](.*?)\\[\\/spoiler\\]': '<tg-spoiler>$1</tg-spoiler>',

    '^\\*\\s+(.*)$': '• $1',

    '\\[code\\](.*?)\\[\\/code\\]': '<pre><code>$1</code></pre>',

    '\\[quote\\](.*?)\\[\\/quote\\]': (_, p1) => {
      // hacky way of fixing mtcute not accounting for newlines in blockquotes(?)
      const amountOfNewlines = (p1.match(/\n/g) || []).length;

      let padding = '';
      if (amountOfNewlines > 0)
        padding = '<b>' + '‎'.repeat(Math.max(0, amountOfNewlines - 1)) + '‎</b>';

      return `<blockquote>${p1 + padding}</blockquote>`;
    },

    '\\[section(?:,expanded)?(?:=(.*?))?\\](.*?)\\[\\/section\\]': (_, title, content: string) => {
      const sectionTitle = title ? `<b>${title}</b><br><br>` : '';

      // hacky way of fixing mtcute not accounting for newlines in blockquotes(?)
      const amountOfNewlines = (content.match(/\n/g) || []).length;
      const padding = '<b>' + '‎'.repeat(1 + amountOfNewlines) + '‎</b>';

      return `<blockquote expandable>${sectionTitle + content + padding}</blockquote>`;
    },

    '\\[\\[(.*?)(?:\\|(.*?))?\\]\\]': (_, p1, p2) => {
      const url = `${baseUrl}/wiki_pages/${encodeURIComponent(p1)}`;
      const label = p2 || p1;
      return `<a href="${url}">${label}</a>`;
    },
    '\\{\\{(.*?)\\}\\}': (_, p1) => `<a href="${baseUrl}/posts?tags=${encodeURIComponent(p1)}">${p1}</a>`,
    'post #(\\d+)': (_, p1) => `<a href="${baseUrl}/posts/${p1}">post #${p1}</a>`,
    'post changes #(\\d+)': (_, p1) => `<a href="${baseUrl}/post_versions?search[post_id]=${p1}">post changes #${p1}</a>`,
    'topic #(\\d+)': (_, p1) => `<a href="${baseUrl}/forum_topics/${p1}">topic #${p1}</a>`,
    'comment #(\\d+)': (_, p1) => `<a href="${baseUrl}/comments/${p1}">comment #${p1}</a>`,
    'blip #(\\d+)': (_, p1) => `<a href="${baseUrl}/blips/${p1}">blip #${p1}</a>`,
    'pool #(\\d+)': (_, p1) => `<a href="${baseUrl}/pools/${p1}">pool #${p1}</a>`,
    'set #(\\d+)': (_, p1) => `<a href="${baseUrl}/post_sets/${p1}">set #${p1}</a>`,
    'takedown #(\\d+)': (_, p1) => `<a href="${baseUrl}/takedowns/${p1}">takedown #${p1}</a>`,
    'record #(\\d+)': (_, p1) => `<a href="${baseUrl}/user_feedbacks/${p1}">record #${p1}</a>`,
    'ticket #(\\d+)': (_, p1) => `<a href="${baseUrl}/tickets/${p1}">ticket #${p1}</a>`
  };

  for (const [pattern, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(pattern, 'gs');
    dtext = dtext.replace(regex, replacement as string);
  }

  dtext = dtext.replace(/^h[1-6]\.\s+(.*)$/gm, '<b>$1</b>');

  dtext = dtext.replace(/(<pre><code>[\s\S]*?<\/code><\/pre>)|(\n)/g, (match, p1, p2) => {
    if (p1)
      return p1;
    if (p2)
      return '<br>';
    return match;
  });

  return dtext;
}

const BLOCKQUOTE_REGEX = /(<blockquote[^>]*>.+?)<\/blockquote>/g;
const BR_REGEX = /<br\s*\/?>/g;
export async function transformDText2(body: string) {
  const response = await fetch('https://e621.net/dtext_preview.json', {
    method: 'post',
    body: JSON.stringify({ body }),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': e621Token,
      'User-Agent': 'SillyIndustries/e621ooc',
    }
  });
  const json = await response.json();

  // hacky way of fixing mtcute not accounting for newlines in blockquotes(?)
  const blockquotes = [...json.html.matchAll(BLOCKQUOTE_REGEX)];
  for (let i = 0; i < blockquotes.length; i++) {
    const amountOfNewlines = (blockquotes[i][1].match(BR_REGEX) || []).length;
    const padding = '<b>' + '‎'.repeat(1 + amountOfNewlines) + '‎</b>';
    json.html = json.html.replace(blockquotes[i][1], blockquotes[i][1] + padding);
  }

  return json.html;
}