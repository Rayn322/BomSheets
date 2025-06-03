// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
// @deno-types="npm:@types/parse-unit"
import parse from 'npm:parse-unit';
import { pickFile } from '@ayonli/jsext/dialog';
import { Categorized, SheetJson, SheetRow } from './types.ts';
import { cleanUnits, compareCapacitor, compareResistor } from './util.ts';

const jsonList = [];

for (const fileName of Deno.args) {
	let workbook: XLSX.WorkBook;

	try {
		workbook = XLSX.readFile(fileName);
	} catch (e) {
		console.error("Couldn't read file", e);
		Deno.exit(1);
	}

	const firstSheetName = workbook.SheetNames[0];

	const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
		range: 'A1:I999', // 999 is just a big number ig
	}) as SheetJson;

	jsonList.push(json);
}

// who cares
if (jsonList.length === 0) {
	const fileName = (await pickFile()) as string | null;

	if (!fileName) {
		console.error('No file selected');
		Deno.exit(1);
	}

	let workbook: XLSX.WorkBook;

	try {
		workbook = XLSX.readFile(fileName);
	} catch (e) {
		console.error("Couldn't read file", e);
		Deno.exit(1);
	}

	const firstSheetName = workbook.SheetNames[0];

	const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
		range: 'A1:I999', // 999 is just a big number ig
	}) as SheetJson;

	jsonList.push(json);
}

const categories: Categorized = {
	capacitors: [],
	resistors: [],
	others: [],
};

for (const json of jsonList) {
	for (const row of json) {
		// check for valid row
		if (typeof row.Quantity !== 'number') {
			continue;
		}

		const capacitor = categories.capacitors.find((c) => compareCapacitor(c, row));

		const resistor = categories.resistors.find((r) => compareResistor(r, row));

		// catch all that just straight up compares all the rows
		const fallback = categories.others.find((o) => {
			return (
				o.Comment === row.Comment &&
				o.Footprint === row.Footprint &&
				o.Value === row.Value &&
				o.Voltage === row.Voltage &&
				o.Tolerance === row.Tolerance
			);
		});

		if (capacitor) {
			capacitor.Quantity += row.Quantity;
		} else if (resistor) {
			resistor.Quantity += row.Quantity;
		} else if (
			fallback &&
			fallback.Quantity &&
			row.Quantity &&
			typeof fallback.Quantity === 'number'
		) {
			fallback.Quantity += row.Quantity;
		} else {
			const cleanValue = row.Value ? cleanUnits(row.Value) : undefined;

			if (row.Comment === 'Capacitor') {
				categories.capacitors.push({
					Quantity: row.Quantity,
					Value: cleanValue,
					Voltage: row.Voltage,
					Comment: row.Comment,
					Footprint: row.Footprint,
				});
			} else if (row.Comment === 'Resistor') {
				categories.resistors.push({
					Quantity: row.Quantity,
					Value: cleanValue ? `${parse(cleanValue)[0]}k` : undefined, // stupid but works
					Comment: row.Comment,
					Footprint: row.Footprint,
				});
			} else {
				categories.others.push({
					Quantity: row.Quantity,
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
