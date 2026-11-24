import postcss from 'postcss';
import postcssGlobalFunction from '../../../svelte-plugins/postcss-global-function.mjs';


function rewrite( css: string ): string {
	return postcss( [ postcssGlobalFunction() ] ).process( css, {
		from: undefined,
	} ).css;
}


describe( 'postcssGlobalFunction', () => {
	it.each( [
		{
			input: '.form :global h3.title { color: red; }',
			output: '.form :global(h3.title) { color: red; }',
		},
		{
			input: ':global .top { color: black; }',
			output: ':global(.top) { color: black; }',
		},
		{
			input: '.form:hover :global .e { color: green; }',
			output: '.form:hover :global(.e) { color: green; }',
		},
		{
			input: '.a :global .b .c > .d { color: blue; }',
			output: '.a :global(.b .c > .d) { color: blue; }',
		},
		{
			input: '.a :global.b { color: blue; }',
			output: '.a :global(.b) { color: blue; }',
		},
	] )( 'wraps everything after bare :global in `$input`', ( {input, output} ) => {
		expect( rewrite( input ) ).toBe( output );
	} );


	it.each( [
		{
			input: '.form :global .b .d, .form :global .c .d { color: blue; }',
			output: '.form :global(.b .d), .form :global(.c .d) { color: blue; }',
		},
		{
			input: ':global .a, .b { color: navy; }',
			output: ':global(.a), .b { color: navy; }',
		},
		{
			input: '.a, :global .b { color: navy; }',
			output: '.a, :global(.b) { color: navy; }',
		},
	] )( 'wraps each comma-separated selector on its own in `$input`', ( {input, output} ) => {
		expect( rewrite( input ) ).toBe( output );
	} );


	it.each( [
		{
			input: '.a :global .b :local .c { color: olive; }',
			output: '.a :global(.b) .c { color: olive; }',
		},
		{
			input: '.a :global .b > :local .c { color: olive; }',
			output: '.a :global(.b) > .c { color: olive; }',
		},
		{
			input: '.a :global .b :local > .c { color: olive; }',
			output: '.a :global(.b) > .c { color: olive; }',
		},
		{
			input: '.a :global .b:local.c { color: olive; }',
			output: '.a :global(.b).c { color: olive; }',
		},
		{
			input: '.a :global .b :local { color: olive; }',
			output: '.a :global(.b) { color: olive; }',
		},
		{
			input: '.a :global .b :local .c :global .d { color: olive; }',
			output: '.a :global(.b) .c :global(.d) { color: olive; }',
		},
	] )( 'ends the global run at bare :local and drops it in `$input`', ( {input, output} ) => {
		expect( rewrite( input ) ).toBe( output );
	} );


	it.each( [
		{
			input: ':global :local(.a):not(div) { color: olive; }',
			output: ':global :local .a:not(div) { color: olive; }',
		},
		{
			input: '.a :global .b :local(.c) { color: olive; }',
			output: '.a :global(.b) .c { color: olive; }',
		},
		{
			input: '.a :global .b :local(.c) .d { color: olive; }',
			output: '.a :global(.b) .c :global(.d) { color: olive; }',
		},
		{
			input: '.a :global .b :local(.c) > .d { color: olive; }',
			output: '.a :global(.b) .c > :global(.d) { color: olive; }',
		},
		{
			input: '.a :global .b:local(.c) .d { color: olive; }',
			output: '.a :global(.b).c :global(.d) { color: olive; }',
		},
		{
			input: '.a :global .b > :local(.c .e) .d { color: olive; }',
			output: '.a :global(.b) > .c .e :global(.d) { color: olive; }',
		},
		{
			input: '.a :global .b :local(.c) .d :local .e { color: olive; }',
			output: '.a :global(.b) .c :global(.d) .e { color: olive; }',
		},
	] )( 'unwraps :local(…) and resumes the global run after its compound in `$input`', ( {
		input,
		output,
	} ) => {
		expect( rewrite( input ) ).toBe( output );
	} );


	it.each( [
		{
			input: '.a :global > .b { color: red; }',
			output: '.a > :global(.b) { color: red; }',
		},
		{
			input: '.a :global ~ .b { color: red; }',
			output: '.a ~ :global(.b) { color: red; }',
		},
	] )( 'moves a leading combinator out of the wrap in `$input`', ( {input, output} ) => {
		expect( rewrite( input ) ).toBe( output );
	} );


	it.each( [
		{
			case: 'trailing bare :global',
			input: '.a :global { color: red; }',
		},
		{
			case: 'existing function form',
			input: '.a :global(.b) .c { color: red; }',
		},
		{
			case: 'leading function form',
			input: ':global(.b) .a { color: red; }',
		},
		{
			case: 'bare :global followed by bare :local',
			input: '.a :global :local .b { color: red; }',
		},
		{
			case: 'leading combinator with no compound before :global',
			input: ':global > .b { color: red; }',
		},
		{
			case: 'bare :local with no :global',
			input: ':local .a .b { color: red; }',
		},
		{
			case: 'no :global',
			input: '.a .b, .c > .d { color: red; }',
		},
		{
			case: ':global inside an attribute value',
			input: '[data-x=":global .b"] .c { color: red; }',
		},
	] )( 'leaves $case untouched', ( {input} ) => {
		expect( rewrite( input ) ).toBe( input );
	} );


	it.each( [
		{
			input: '.a:not(:global .b) { color: red; }',
			output: '.a:not(.b) { color: red; }',
		},
		{
			input: '.a:not(:global(.b)) { color: red; }',
			output: '.a:not(.b) { color: red; }',
		},
		{
			input: '.a:is(:global .b, :global(.c)) { color: red; }',
			output: '.a:is(.b, .c) { color: red; }',
		},
		{
			input: '.a:has(:global .b) { color: red; }',
			output: '.a:has(.b) { color: red; }',
		},
		{
			input: '.a:has(> :global .b) { color: red; }',
			output: '.a:has(> .b) { color: red; }',
		},
		{
			input: '.a:where(.x :global .b) { color: red; }',
			output: '.a:where(.x .b) { color: red; }',
		},
		{
			input: '.a:not(.x :global > .b) { color: red; }',
			output: '.a:not(.x > .b) { color: red; }',
		},
		{
			input: '.a:not(.x :global) { color: red; }',
			output: '.a:not(.x) { color: red; }',
		},
		{
			input: '.a:not(:global.b) { color: red; }',
			output: '.a:not(.b) { color: red; }',
		},
		{
			input: 'div.a:not(:global .b) { color: red; }',
			output: 'div.a:not(.b) { color: red; }',
		},
		{
			input: '.x .a:not(:global .b) { color: red; }',
			output: '.x .a:not(.b) { color: red; }',
		},
		{
			input: '.a:not(:is(:global .b)) { color: red; }',
			output: '.a:not(:is(.b)) { color: red; }',
		},
		{
			input: '.a:not(:is(:global(.b))) { color: red; }',
			output: '.a:not(:is(.b)) { color: red; }',
		},
		{
			input: '.a:not(:global(.b:is(:global .c))) { color: red; }',
			output: '.a:not(.b:is(.c)) { color: red; }',
		},
	] )( 'strips :global inside pseudo arguments of a class compound in `$input`', ( {
		input,
		output,
	} ) => {
		expect( rewrite( input ) ).toBe( output );
	} );


	it.each( [
		{
			input: 'div:not(:global .b) { color: red; }',
			output: 'div:not(:global(.b)) { color: red; }',
		},
		{
			input: ':not(:global .b) { color: red; }',
			output: ':not(:global(.b)) { color: red; }',
		},
		{
			input: '.a :is(:global .b, .c) { color: red; }',
			output: '.a :is(:global(.b), .c) { color: red; }',
		},
		{
			input: ':is(:global .b) .a { color: red; }',
			output: ':is(:global(.b)) .a { color: red; }',
		},
		{
			input: '.a :where(:global .b) { color: red; }',
			output: '.a :where(:global(.b)) { color: red; }',
		},
		{
			input: 'div:has(> :global .b .c) { color: red; }',
			output: 'div:has(> :global(.b .c)) { color: red; }',
		},
		{
			input: '.a :is(.x :global .b) { color: red; }',
			output: '.a :is(.x :global(.b)) { color: red; }',
		},
		{
			input: '.a :is(:global .b :local .c, .d) { color: red; }',
			output: '.a :is(:global(.b) .c, .d) { color: red; }',
		},
		{
			input: 'div:not(:is(:global .b)) { color: red; }',
			output: 'div:not(:is(:global(.b))) { color: red; }',
		},
		{
			input: 'div:not(.x:is(:global .b)) { color: red; }',
			output: 'div:not(.x:is(:global(.b))) { color: red; }',
		},
	] )( 'wraps bare :global inside pseudo arguments of other compounds in `$input`', ( {
		input,
		output,
	} ) => {
		expect( rewrite( input ) ).toBe( output );
	} );


	it.each( [
		{
			input: '.a :global .b:not(:global .c) { color: red; }',
			output: '.a :global(.b:not(.c)) { color: red; }',
		},
		{
			input: ':global div :is(:global(.c)) { color: red; }',
			output: ':global(div :is(.c)) { color: red; }',
		},
		{
			input: '.a:not(:global .b) :global .c { color: red; }',
			output: '.a:not(.b) :global(.c) { color: red; }',
		},
		{
			input: '.a :global .b :local div:not(:global .c) { color: red; }',
			output: '.a :global(.b) div:not(:global(.c)) { color: red; }',
		},
	] )( 'combines pseudo arguments with a top-level global run in `$input`', ( {
		input,
		output,
	} ) => {
		expect( rewrite( input ) ).toBe( output );
	} );


	it.each( [
		{
			input: ':global(.a:not(:global .b)) { color: red; }',
			output: ':global(.a:not(.b)) { color: red; }',
		},
		{
			input: '.x :global(.a:is(:global(.b), :global .c)) { color: red; }',
			output: '.x :global(.a:is(.b, .c)) { color: red; }',
		},
		{
			input: 'div :is(:global(.a:not(:global .b))) { color: red; }',
			output: 'div :is(:global(.a:not(.b))) { color: red; }',
		},
	] )( 'strips :global inside pseudo arguments of a function form in `$input`', ( {
		input,
		output,
	} ) => {
		expect( rewrite( input ) ).toBe( output );
	} );


	it.each( [
		{
			case: 'function form inside a non-class compound',
			input: 'div:not(:global(.b)) { color: red; }',
		},
		{
			case: 'function form inside a descendant pseudo',
			input: '.a :is(:global(.b), .c) { color: red; }',
		},
	] )( 'leaves $case untouched', ( {input} ) => {
		expect( rewrite( input ) ).toBe( input );
	} );


	it( 'rewrites selectors inside at-rules', () => {
		expect( rewrite( '@media (any-hover: hover) {\n\t.m:hover :global .f { color: purple; }\n\t:global .h:hover { color: teal; }\n}' ) )
			.toBe( '@media (any-hover: hover) {\n\t.m:hover :global(.f) { color: purple; }\n\t:global(.h:hover) { color: teal; }\n}' );
	} );


	it( 'keeps surrounding rules and formatting as written', () => {
		const input = '.a {\n\tcolor: red;\n}\n\n.b   >   .c :global .d {\n\tcolor: blue;\n}\n';
		expect( rewrite( input ) ).toBe( '.a {\n\tcolor: red;\n}\n\n.b   >   .c :global(.d) {\n\tcolor: blue;\n}\n' );
	} );
} );
