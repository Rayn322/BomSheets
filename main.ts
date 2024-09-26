// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
import { pickFile } from '@ayonli/jsext/dialog';
import { Categorized, SheetJson } from './types.ts';
import { cleanUnits } from './util.ts';
// @deno-types="npm:@types/js-quantities"
import Qty from 'npm:js-quantities/esm';

// not restricting file type, who cares
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
	// check for valid row
	if (typeof row.Quantity !== 'number' || typeof row['Total Quant'] !== 'number') {
		continue;
	}

	// TODO: consider calling a "compareCapacitor" function, I don't think calling Qty repatedly would be that bad
	// temporarily only looking at capacitors and resistors
	if (row.Comment === 'Capacitor' || row.Comment === 'Resistor') {
		let badValue = false;
		let value: Qty | null = null;

		try {
			value = row.Value ? Qty(cleanUnits(row.Value)) : null;
		} catch (_e) {
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

				valueMatches =
					value === otherValue || (value.isCompatible(otherValue) && value.eq(otherValue));
			} catch (e) {
				console.error('Error comparing values', c.Value, 'with', value.toString());
				console.error(e);
				return false;
			}

			return valueMatches && c.Footprint === row.Footprint && c.Voltage === row.Voltage;
		});

		// same logic as capacitors for now BUT CHANGE AT SOME POINT?
		const resistor = categories.resistors.find((c) => {
			let valueMatches = false;

			try {
				const otherValue = c.Value ? Qty(cleanUnits(c.Value)) : null;

				if (!otherValue) {
					return false;
				}

				valueMatches =
					value === otherValue || (value.isCompatible(otherValue) && value.eq(otherValue));
			} catch (e) {
				console.error('Error comparing values', c.Value, 'with', value.toString());
				console.error(e);
				return false;
			}

			return valueMatches && c.Footprint === row.Footprint;
		});

		if (capacitor) {
			capacitor.Quantity += row['Total Quant'];
		} else if (resistor) {
			resistor.Quantity += row['Total Quant'];
		} else {
			const cleanValue = row.Value ? cleanUnits(row.Value) : undefined;

			if (row.Comment === 'Capacitor') {
				categories.capacitors.push({
					Quantity: row['Total Quant'],
					Value: cleanValue,
					Voltage: row.Voltage,
					Comment: row.Comment,
					Footprint: row.Footprint,
				});
			} else if (row.Comment === 'Resistor') {
				categories.resistors.push({
					Quantity: row['Total Quant'],
					Value: cleanValue,
					Comment: row.Comment,
					Footprint: row.Footprint,
				});
			} else {
				categories.others.push(row);
			}
		}
	}
}

// console.log(categories);

const sheet = XLSX.utils.json_to_sheet(categories.capacitors, { cellStyles: true });

// increase column width
// can calculate max characters later if i feel like it maybe
sheet['!cols'] = [
	{ wch: 20 }, // Quantity
	{ wch: 20 }, // Value
	{ wch: 20 }, // Voltage
	{ wch: 20 }, // Comment
	{ wch: 20 }, // Footprint
];

//

const outWorkbook = XLSX.utils.book_new(sheet);
XLSX.writeFile(outWorkbook, 'output.xlsx', { cellStyles: true });
