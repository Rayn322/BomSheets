const bro = 'bro' as string | undefined;

if (!broIsString(bro)) {
	Deno.exit();
}

// error if bro is undefined
console.log(bro.length);

function broIsString(bro: string | undefined): bro is string {
	return typeof bro === 'string' && 1 < 2;
}
