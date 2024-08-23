// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
import { pickFile } from '@ayonli/jsext/dialog';
import { Categorized, SheetJson } from './types.ts';
import { cleanUnits, isValidRow } from './util.ts';
import Qty from 'npm:js-quantities/esm';

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
}) as SheetJson;

const categories: Categorized = {
	capacitors: [],
	resistors: [],
	others: [], // add more later
	died: [],
};

for (const row of json) {
	if (!isValidRow(row)) {
		continue;
	}

	// sticking with capacitors for now but probably wont keep this structure
	if (row.Comment == 'Capacitor') {
		if (typeof row['Total Quant'] === 'number') {
			let died = false;

			// look at voltage?
			const capacitor = categories.capacitors.find((c) => {
				let valueMatches = false;

				// TODO: handle errors, check what units are failing
				try {
					// KEEPS LOOPING OVER BROKEN BAD UNITS AND BREAKS ALL FUTURE LOOPS
					// move off ternary to better try/catch
					const valueA = c.Value ? Qty(cleanUnits(c.Value)) : null;
					const valueB = row.Value ? Qty(cleanUnits(row.Value)) : null;

					valueMatches = valueA === valueB || valueA.eq(valueB);

					died = true;
				} catch (e) {
					console.error('Error comparing values', e);
				}

				return valueMatches && c.Footprint === row.Footprint;
			});

			// set aside for now
			if (died) {
				categories.died.push(row);

				died = false;
				continue;
			}

			if (capacitor) {
				capacitor.Quantity += row['Total Quant'];
			} else {
				categories.capacitors.push({
					Quantity: row['Total Quant'],
					Value: row.Value,
					Voltage: row.Voltage,
					Comment: row.Comment,
					Footprint: row.Footprint,
				});
			}
		}
	}
}

console.log(categories);
