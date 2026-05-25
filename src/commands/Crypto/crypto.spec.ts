import 'jasmine';

import { Message } from 'discord.js';
import { CryptoCommand } from './crypto';
import { TickerTracker } from '../../services/tickerTracker';

describe('crypto', () => {
  interface TestData {
    msg: string;
    result: boolean;
  }
  const testData: TestData[] = [
    { msg: '$.btc', result: true },
    { msg: '$.eth rsi macd 5m', result: true },
    { msg: '$spy', result: false },
    { msg: '$/es', result: false },
    { msg: '$123', result: false },
    { msg: 'tim $.btc', result: false },
    { msg: 'tim aapl', result: false },
  ];

  testData.forEach((i) => it('tigger', () => {
    const spy = jasmine.createSpyObj<Message>('message', ['content']);
    spy.content = i.msg;
    expect(CryptoCommand.trigger(spy)).toBe(i.result);
  }));

  it('should send message', async () => {
    // The command records usage in SQLite; mock the tracker so the test
    // doesn't write to a real DB (otherwise the missing author.id throws a
    // NOT NULL constraint error). Mirrors the pattern in stocks.spec.ts.
    spyOn(TickerTracker, 'postTicker');
    spyOn(TickerTracker, 'lastTicker');
    const spy = jasmine.createSpyObj<Message>('message', ['content', 'channel', 'author']);
    spy.content = '$.btc';
    const msgSpy = jasmine.createSpy();
    msgSpy.and.returnValue({ id: '' });
    spy.channel.send = msgSpy;
    await CryptoCommand.command(spy);
    expect(spy.channel.send).toHaveBeenCalled();
  });
});
