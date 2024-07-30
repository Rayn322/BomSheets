// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';

const workbook = XLSX.readFile('Order 1 BOMs.xlsx');
const firstSheetName = workbook.SheetNames[0];
// console.log(workbook.Sheets[firstSheetName]);

const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
	range: 'B2:H1000',
});

for (const row of json) {
	console.log(row);
	// if (row.Quantity == 'Quantity') {
	// 	console.log(row);
	// }
}
