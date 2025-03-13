import { readFileSync } from 'fs';

interface Config {
  bot_token: string;
  e621_username: string;
  e621_token: string;
  api_id: string;
  api_hash: string;
  rule: string;
  chat: string;
}

const config: Config = JSON.parse(readFileSync('./config.json').toString('utf-8'));

export const e621Token = 'Basic ' + btoa(`${config.e621_username}:${config.e621_token}`);
export default config;