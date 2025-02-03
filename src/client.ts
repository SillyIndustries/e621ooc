import schedule from 'node-schedule';
import { TelegramClient, html } from '@mtcute/node';
import { Dispatcher } from '@mtcute/dispatcher';

import config from './config.js';

import { startDp } from './dispatchers/start.js';
import transformDText from './dtext.js';

const tg = new TelegramClient({
  apiId: +config.api_id,
  apiHash: config.api_hash,
  storage: 'bot-data/session',
});

const dispatcher = Dispatcher.for(tg);
dispatcher.extend(startDp);

async function fetchComment() {
  const page = 1 + Math.floor(Math.random() * 749);
  const response = await fetch('https://e621.net/comments.json?group_by=comment&page=' + page, {
    headers: {
      'User-Agent': 'SillyIndustries/e621ooc',
    }
  });
  const data = await response.json();

  const variant = Math.floor(Math.random() * data.length);
  return data[variant].body;
}

async function act() {
  const comment = await fetchComment();
  const transformed = transformDText(comment);
  await tg.sendText(config.chat, html(transformed), {
    disableWebPreview: true,
  });
}

export async function start() {
  const user = await tg.start({ botToken: config.bot_token });
  console.log('Logged in as', user.username);

  schedule.scheduleJob(config.rule, act);
}