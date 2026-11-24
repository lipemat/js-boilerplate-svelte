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


	it( 'rewrites selectors inside at-rules', () => {
		expect( rewrite( '@media (any-hover: hover) {\n\t.m:hover :global .f { color: purple; }\n\t:global .h:hover { color: teal; }\n}' ) )
			.toBe( '@media (any-hover: hover) {\n\t.m:hover :global(.f) { color: purple; }\n\t:global(.h:hover) { color: teal; }\n}' );
	} );


	it( 'keeps surrounding rules and formatting as written', () => {
		const input = '.a {\n\tcolor: red;\n}\n\n.b   >   .c :global .d {\n\tcolor: blue;\n}\n';
		expect( rewrite( input ) ).toBe( '.a {\n\tcolor: red;\n}\n\n.b   >   .c :global(.d) {\n\tcolor: blue;\n}\n' );
	} );
} );
