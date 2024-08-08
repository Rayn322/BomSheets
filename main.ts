// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
import { pickFile } from '@ayonli/jsext/dialog';

const file = (await pickFile()) as string | null;

if (!file) {
	console.log('No file selected');
	Deno.exit(0);
}

const workbook = XLSX.readFile(file);
const firstSheetName = workbook.SheetNames[0];

const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
	range: 'B2:H999', // 999 is just a big number ig
});

for (const row of json) {
	console.log(row);
}
