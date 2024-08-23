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

	const unitArr = unit[0].split('');

	unitArr[0] = unitArr[0].toLowerCase();

	if (unitArr[0] === 'u' || unitArr[0] === 'n' || unitArr[0] === 'p') {
		if (unitArr.length == 1) {
			unitArr.push('F');
		} else if (unitArr.length == 2) {
			unitArr[1] = unitArr[1].toUpperCase();
		}
	}

	return `${number}${unitArr.join('')}`;
}

console.log(cleanUnits('0.1uf'));
