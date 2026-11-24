import postcss from 'postcss';
import postcssUnnestGlobal from '../../../svelte-plugins/postcss-unnest-global.mjs';


function rewrite( css: string ): string {
	return postcss( [ postcssUnnestGlobal() ] ).process( css, {
		from: undefined,
	} ).css;
}


describe( 'postcssUnnestGlobal', () => {
	it.each( [
		{
			input: ':global(.c:global(.x)) { color: red; }',
			output: ':global(.c.x) { color: red; }',
		},
		{
			input: '.a :global(:global(.b).c) { color: red; }',
			output: '.a :global(.b.c) { color: red; }',
		},
		{
			input: ':global(.c:global(.x):hover) .d { color: red; }',
			output: ':global(.c.x:hover) .d { color: red; }',
		},
		{
			input: ':global(.c:global(.x)), :global(.d:global(.y)) { color: red; }',
			output: ':global(.c.x), :global(.d.y) { color: red; }',
		},
		{
			input: ':global(.a:not(:global(.b))) { color: red; }',
			output: ':global(.a:not(.b)) { color: red; }',
		},
	] )( 'unwraps :global(…) nested in :global(…) in `$input`', ( {input, output} ) => {
		expect( rewrite( input ) ).toBe( output );
	} );


	it.each( [
		{
			case: 'function form outside :global(…)',
			input: '.a:global(.b) :global(.c) { color: red; }',
		},
		{
			case: 'no :global',
			input: '.a .b:not(.c) { color: red; }',
		},
	] )( 'leaves $case untouched', ( {input} ) => {
		expect( rewrite( input ) ).toBe( input );
	} );


	it( 'rewrites selectors inside at-rules', () => {
		expect( rewrite( '@media (any-hover: hover) {\n\t:global(.c:global(.x)) { color: red; }\n}' ) )
			.toBe( '@media (any-hover: hover) {\n\t:global(.c.x) { color: red; }\n}' );
	} );
} );
