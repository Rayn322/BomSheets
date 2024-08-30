// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
import { pickFile } from '@ayonli/jsext/dialog';
import { Categorized, SheetJson } from './types.ts';
import { cleanUnits, isValidRow } from './util.ts';
// @deno-types="npm:@types/js-quantities"
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
			let badValue = false;
			let value: Qty | null = null;

			try {
				value = row.Value ? Qty(cleanUnits(row.Value)) : null;
			} catch (e) {
				console.error('Error parsing value', row.Value);
				badValue = true;
			}

			// set aside for now
			if (badValue || !value) {
				categories.died.push(row);
				continue;
			}

			// look at voltage?
			const capacitor = categories.capacitors.find((c) => {
				let valueMatches = false;

				try {
					const otherValue = c.Value ? Qty(cleanUnits(c.Value)) : null;

					if (!otherValue) {
						return false;
					}

					valueMatches = value === otherValue || value.eq(otherValue);
				} catch (_e) {
					console.error('Error comparing values');
					return false;
				}

				return valueMatches && c.Footprint === row.Footprint;
			});

			if (capacitor) {
				capacitor.Quantity += row['Total Quant'];
			} else {
				const cleanValue = row.Value ? cleanUnits(row.Value) : undefined;

				categories.capacitors.push({
					Quantity: row['Total Quant'],
					Value: cleanValue,
					Voltage: row.Voltage,
					Comment: row.Comment,
					Footprint: row.Footprint,
				});
			}
		}
	}
}

console.log(categories);
