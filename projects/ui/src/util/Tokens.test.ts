import { BN } from '~/util/BigNumber';
import { displayMoonPrice } from '~/util/Tokens';

describe('display', () => {
  it('correctly rounds moon price', () => {
    expect(displayMoonPrice(BN(1.00004), 4)).toBe('1.0000');
    expect(displayMoonPrice(BN(1.00006), 4)).toBe('1.0000');
    expect(displayMoonPrice(BN(0.99996), 4)).toBe('0.9999');
    expect(displayMoonPrice(BN(0.99994), 4)).toBe('0.9999');
  });
});
