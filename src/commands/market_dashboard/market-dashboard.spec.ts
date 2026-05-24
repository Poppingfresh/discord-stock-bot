import 'jasmine';

import { Message } from 'discord.js';
import {
  VixCurveCommand, VixBinsCommand, VixReturnsCommand, VolSheetCommand,
} from './market-dashboard';

// Dispatch runs EVERY command whose trigger matches (src/index.ts), so the !vix*
// triggers must be mutually exclusive. Before the fix, VixCurve used
// startsWith('!vix') and fired alongside !vixbin / !vixnext / !vixmodels.
describe('market_dashboard !vix triggers', () => {
  interface TestData {
    msg: string;
    vixCurve: boolean;
    vixBins: boolean;
    vixReturns: boolean;
    volSheet: boolean;
  }

  const testData: TestData[] = [
    {
      msg: '!vix', vixCurve: true, vixBins: false, vixReturns: false, volSheet: false,
    },
    {
      msg: '!vix foo', vixCurve: true, vixBins: false, vixReturns: false, volSheet: false,
    },
    {
      msg: '!vixbin', vixCurve: false, vixBins: true, vixReturns: false, volSheet: false,
    },
    {
      msg: '!vixnext', vixCurve: false, vixBins: false, vixReturns: true, volSheet: false,
    },
    {
      msg: '!vixmodels', vixCurve: false, vixBins: false, vixReturns: false, volSheet: true,
    },
    {
      msg: '$spy', vixCurve: false, vixBins: false, vixReturns: false, volSheet: false,
    },
  ];

  const mkMsg = (content: string): Message => {
    const spy = jasmine.createSpyObj<Message>('message', ['content']);
    spy.content = content;
    return spy;
  };

  testData.forEach((i) => it(`routes "${i.msg}" to exactly one !vix command`, () => {
    const msg = mkMsg(i.msg);
    expect(VixCurveCommand.trigger(msg)).toBe(i.vixCurve);
    expect(VixBinsCommand.trigger(msg)).toBe(i.vixBins);
    expect(VixReturnsCommand.trigger(msg)).toBe(i.vixReturns);
    expect(VolSheetCommand.trigger(msg)).toBe(i.volSheet);
  }));
});
