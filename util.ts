// @deno-types="npm:@types/parse-unit"
import parse from 'npm:parse-unit';
// @deno-types="npm:@types/js-quantities"
import Qty from 'npm:js-quantities/esm';
import { Capacitor, Resistor, SheetRow } from './types.ts';

// attempts to format units so that Qty is happy
export function cleanUnits(value: string) {
	// downloading regex...
	const [number, unit] = parse(value);

	if (!number || !isFinite(number) || !unit) {
		return value;
	}

	// get out of regex result array
	const firstChar = unit[0].toLowerCase();
	let secondChar = unit[1]?.toLowerCase();
	const rest = unit.slice(2);

	// attempt to only capitalize when necessary
	if (firstChar === 'u' || firstChar === 'n' || firstChar === 'p') {
		if (secondChar === 'f' || !secondChar) {
			secondChar = 'F';
		}
	}

	return `${number}${firstChar}${secondChar ?? ''}${rest}`;
}

export function compareCapacitor(c: Capacitor, row: SheetRow) {
	let rowValue: Qty | null = null;
	let value: Qty | null = null;

	try {
		rowValue = row.Value ? Qty(cleanUnits(row.Value)) : null;
		value = c.Value ? Qty(cleanUnits(c.Value)) : null;
	} catch (_e) {
		// console.error('Error parsing value', row.Value, 'or', c.Value);
		return false;
	}

	if (!rowValue || !value) {
		return false;
	}

	const valueMatches = rowValue === value || (rowValue.isCompatible(value) && rowValue.eq(value));

	return valueMatches && c.Footprint === row.Footprint && c.Voltage === row.Voltage;
}

// same logic as capacitors for now minus voltage
export function compareResistor(r: Resistor, row: SheetRow) {
	let rowValue: number | null = null;
	let value: number | null = null;

	try {
		if (row.Value && r.Value) {
			rowValue = parseFloat(row.Value);
			value = parseFloat(r.Value);
		}
	} catch (_e) {
		console.error('Error parsing value', row.Value, 'or', r.Value);
		return false;
	}

	if (!rowValue || !value) {
		return false;
	}

	return rowValue === value && r.Footprint === row.Footprint;
}
