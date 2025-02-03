import { readFileSync } from 'fs';

interface Config {
  bot_token: string;
  api_id: string;
  api_hash: string;
  rule: string;
  chat: string;
}

const config: Config = JSON.parse(readFileSync('./config.json').toString('utf-8'));
export default config;