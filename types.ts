export interface SheetRow {
	Quantity?: number | string;
	Value?: string;
	Voltage?: string;
	Tolerance?: string;
	Comment?: string;
	Footprint?: string;
	'Total Quant'?: number;
}

export type SheetJson = SheetRow[];

export interface Categorized {
	capacitors: Capacitor[];
	resistors: Resistor[];
	others: SheetRow[];
}

export interface Capacitor {
	Quantity: number;
	Value?: string;
	Voltage?: string;
	Comment?: string;
	Footprint?: string;
}

export interface Resistor {
	Quantity: number;
	Value?: string;
	Comment?: string;
	Footprint?: string;
}
