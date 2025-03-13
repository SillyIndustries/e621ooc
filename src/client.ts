import schedule from 'node-schedule';
import { BotKeyboard, TelegramClient, html } from '@mtcute/node';
import { Dispatcher } from '@mtcute/dispatcher';

import config from './config.js';

import { startDp } from './dispatchers/start.js';
import transformDText, { transformDText2 } from './dtext.js';

const tg = new TelegramClient({
  apiId: +config.api_id,
  apiHash: config.api_hash,
  storage: 'bot-data/session',
});

const dispatcher = Dispatcher.for(tg);
dispatcher.extend(startDp);

async function fetchComment(bailout = false) {
  const page = 1 + Math.floor(Math.random() * 749);
  const response = await fetch('https://e621.net/comments.json?group_by=comment&limit=100&page=' + page, {
    headers: {
      'User-Agent': 'SillyIndustries/e621ooc',
    }
  });
  const data = await response.json();
  if (data.success === false) {
    if (bailout)
      throw new Error()
    else
      return await fetchComment(true);
  }

  const variant = Math.floor(Math.random() * data.length);
  return { comment: data[variant].body, id: data[variant].id };
}

async function act() {
  try {
    const { comment, id } = await fetchComment();
    const transformed = await transformDText2(comment);

    await tg.sendText(config.chat, html(transformed), {
      disableWebPreview: true,
      replyMarkup: BotKeyboard.inline([
        [BotKeyboard.url('view on e621', 'https://e621.net/comments/' + id)]
      ])
    });
  } catch (err) {}
}

export async function start() {
  const user = await tg.start({ botToken: config.bot_token });
  console.log('Logged in as', user.username);

  schedule.scheduleJob(config.rule, act);
}