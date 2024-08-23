// // const Qty = require('js-quantities');
import Qty from 'npm:js-quantities';

const cap1 = Qty('0.1uF');
const cap2 = Qty('0.1uf');

console.log(cap1.eq(cap2)); // true, since 0.1uF = 100nF
