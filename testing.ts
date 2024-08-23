import Qty from 'npm:js-quantities/esm';

const cap1 = Qty('0.1uF');
const cap2 = Qty('100nF');

console.log(cap1.eq(cap2)); // true, since 0.1uF = 100nF
