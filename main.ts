// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
import { pickFile } from '@ayonli/jsext/dialog';
import { Categorized, SheetJson } from './types.ts';

const file = Deno.args[0] || ((await pickFile()) as string | null);

if (!file) {
	console.log('No file selected');
	Deno.exit(0);
}

let workbook: XLSX.WorkBook;

try {
	workbook = XLSX.readFile(file);
} catch (e) {
	console.error("Couldn't read file", e);
	Deno.exit(1);
}

const firstSheetName = workbook.SheetNames[0];

const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
	range: 'B2:H999', // 999 is just a big number ig
});

categorize(json as SheetJson);

function categorize(data: SheetJson) {
	const categories: Categorized = {
		capacitors: [],
		resistors: [],
		others: [], // add more later
	};

	for (const row of data) {
		if (typeof row.Quantity === 'string') {
			continue;
		}

		if (row.Comment == 'Capacitor') {
			// check if this capacitor is already in the list
			// if it is then increment quantity
			// else add it to the list
			// ugh error handling
		}
	}
}
