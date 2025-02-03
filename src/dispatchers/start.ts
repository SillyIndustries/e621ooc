import { Dispatcher, filters } from '@mtcute/dispatcher';

export const startDp = Dispatcher.child();

startDp.onNewMessage(filters.start, async (msg) => {
  msg.replyText('no u');
});