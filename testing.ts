// @deno-types="npm:@types/js-quantities"
import Qty from 'npm:js-quantities/esm';

const cap1 = Qty('0.1');
const cap2 = Qty(1 / 10);

console.log(cap1.eq(cap2)); // true, since 0.1uF = 100nF
