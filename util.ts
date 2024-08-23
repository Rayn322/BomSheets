import { SheetRow } from './types.ts';

export function isValidRow(row: SheetRow) {
	return typeof row.Quantity === 'number';
}

export function cleanUnits(value: string) {
	// copilot generated regex idk
	const number = parseFloat(value);
	const unit = value.match(/[a-zA-Z]+/g);

	if (!number || !isFinite(number) || !unit) {
		return value;
	}

	// get out of regex result array
	const unitStr = unit[0];
	const firstChar = unitStr[0].toLowerCase();
	let secondChar = unitStr[1]?.toLowerCase();
	const rest = unitStr.slice(2);

	// attempt to only capitalize when necessary
	if (firstChar === 'u' || firstChar === 'n' || firstChar === 'p') {
		if (secondChar === 'f' || !secondChar) {
			secondChar = 'F';
		}
	}

	return `${number}${firstChar}${secondChar ?? ''}${rest}`;
}
