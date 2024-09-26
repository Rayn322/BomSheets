// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
import { pickFile } from '@ayonli/jsext/dialog';
import { Categorized, SheetJson, SheetRow } from './types.ts';
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
	others: [],
	died: [],
};

for (const row of json) {
	// check for valid row
	if (typeof row.Quantity !== 'number' || typeof row['Total Quant'] !== 'number') {
		continue;
	}

	// TODO: consider extracting to a "compareCapacitor" function, I don't think calling Qty repatedly would be that bad
	// temporarily only looking at capacitors and resistors
	if (true) {
		let badValue = false;
		let value: Qty | null = null;

		try {
			value = row.Value ? Qty(cleanUnits(row.Value)) : null;
		} catch (_e) {
			console.error('Error parsing value', row.Value);
			badValue = true;
		}

		// set aside for now
		// TODO: bad idea this screws up everything else after cap and res
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

		// same logic as capacitors for now minus voltage
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

		// some catch all that just straight up compares all the rows

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
				categories.others.push({
					Quantity: row['Total Quant'],
					Value: row.Value,
					Voltage: row.Voltage,
					Tolerance: row.Tolerance,
					Comment: row.Comment,
					Footprint: row.Footprint,
				});
			}
		}
	}
}

console.log(categories);

// flatten so i can just use json_to_sheet
const output: SheetRow[] = [];
for (const item of categories.capacitors) {
	output.push({
		Quantity: item.Quantity,
		Value: item.Value,
		Voltage: item.Voltage,
		Tolerance: undefined,
		Comment: item.Comment,
		Footprint: item.Footprint,
	});
}
for (const item of categories.resistors) {
	output.push({
		Quantity: item.Quantity,
		Value: item.Value,
		Voltage: undefined,
		Tolerance: undefined,
		Comment: item.Comment,
		Footprint: item.Footprint,
	});
}
for (const item of categories.others) {
	output.push({
		Quantity: item.Quantity,
		Value: item.Value,
		Voltage: item.Voltage,
		Tolerance: item.Tolerance,
		Comment: item.Comment,
		Footprint: item.Footprint,
	});
}
for (const item of categories.died) {
	output.push({
		Quantity: item.Quantity,
		Value: item.Value,
		Voltage: item.Voltage,
		Tolerance: item.Tolerance,
		Comment: item.Comment,
		Footprint: item.Footprint,
	});
}

const sheet = XLSX.utils.json_to_sheet(output, { cellStyles: true });

// increase column width
// can calculate max characters later if i feel like it maybe
sheet['!cols'] = [
	{ wch: 20 }, // Quantity
	{ wch: 20 }, // Value
	{ wch: 20 }, // Voltage
	{ wch: 20 }, // Tolerance
	{ wch: 20 }, // Comment
	{ wch: 20 }, // Footprint
];

const outWorkbook = XLSX.utils.book_new(sheet);
XLSX.writeFile(outWorkbook, 'output.xlsx', { cellStyles: true });
