// @deno-types="npm:@types/parse-unit"
import parse from 'npm:parse-unit';
import { SheetRow } from './types.ts';

export function isValidRow(row: SheetRow) {
	return typeof row.Quantity === 'number';
}

export function cleanUnits(value: string) {
	// downloading regex...
	const [number, unit] = parse(value);

	if (!number || !isFinite(number) || !unit) {
		return value;
	}

	if (unit.toLowerCase() === 'k') {
		return `${number * 1000}`;
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
