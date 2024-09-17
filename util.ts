// @deno-types="npm:@types/parse-unit"
import parse from 'npm:parse-unit';

// attempts to format units so that Qty is happy
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
