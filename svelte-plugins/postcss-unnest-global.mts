import selectorParser, {type Pseudo, type Selector} from 'postcss-selector-parser';
import type {Plugin, Root} from 'postcss';

type Child = Selector['nodes'][number];

const processor = selectorParser( root => {
	const nested: Pseudo[] = [];
	root.walkPseudos( pseudo => {
		if ( isGlobalFunction( pseudo ) && hasGlobalAncestor( pseudo ) ) {
			nested.push( pseudo );
		}
	} );
	nested.reverse().forEach( unwrap );
} );


/**
 * Unwrap a `:global(…)` nested within another `:global(…)`, which Svelte leaves in the CSS.
 *
 * - Runs after `svelte-preprocess-cssmodules` mixed mode, which wraps
 *   each compound holding a class in `:global(…)`, including any
 *   `:global(…)` already within it.
 */
export default function postcssUnnestGlobal(): Plugin {
	return {
		postcssPlugin: 'lipemat:unnest-global',
		Once( root: Root ): void {
			root.walkRules( rule => {
				if ( rule.selector.includes( ':global' ) ) {
					rule.selector = processor.processSync( rule.selector );
				}
			} );
		},
	};
}

postcssUnnestGlobal.postcss = true;


function unwrap( pseudo: Pseudo ): void {
	const inner: Child[] = [ ...pseudo.first.nodes ];
	inner[ 0 ].spaces.before = pseudo.spaces.before;
	inner[ inner.length - 1 ].spaces.after = pseudo.spaces.after;
	pseudo.replaceWith( ...inner );
}


function hasGlobalAncestor( pseudo: Pseudo ): boolean {
	let parent = pseudo.parent;
	while ( undefined !== parent ) {
		if ( selectorParser.isPseudo( parent ) && ':global' === parent.value ) {
			return true;
		}
		parent = parent.parent;
	}
	return false;
}


function isGlobalFunction( pseudo: Pseudo ): boolean {
	return ':global' === pseudo.value && 1 === pseudo.nodes.length && 0 < pseudo.first.nodes.length;
}
