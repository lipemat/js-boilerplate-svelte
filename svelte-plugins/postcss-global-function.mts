import selectorParser, {type Combinator, type Pseudo, type Selector} from 'postcss-selector-parser';
import type {Plugin, Root} from 'postcss';

type Child = Selector['nodes'][number];

interface Run {
	before: Child[];
	inner: Child[];
	separator: Child | undefined;
}

const processor = selectorParser( root => {
	root.each( selector => {
		rewriteSelector( selector );
	} );
} );


/**
 * Rewrite a bare `:global <rest>` into `:global(<rest>)`, the only
 * form `svelte-preprocess-cssmodules` mixed mode leaves unhashed.
 *
 * - Expects flattened CSS, after `postcss-nested`.
 * - A bare `:local` ends the global run and is dropped.
 * - Pseudo arguments are left as is.
 */
export default function postcssGlobalFunction(): Plugin {
	return {
		postcssPlugin: 'lipemat:global-function',
		Once( root: Root ): void {
			root.walkRules( rule => {
				if ( rule.selector.includes( ':global' ) ) {
					rule.selector = processor.processSync( rule.selector );
				}
			} );
		},
	};
}

postcssGlobalFunction.postcss = true;


function rewriteSelector( selector: Selector ): void {
	const original: Child[] = [ ...selector.nodes ];
	selector.removeAll();
	rewriteNodes( original ).forEach( node => selector.append( node ) );
}


function rewriteNodes( nodes: Child[] ): Child[] {
	const global = nodes.find( ( node ): node is Pseudo => isBare( node, ':global' ) );

	if ( selectorParser.isPseudo( global ) ) {
		return rewriteRun( nodes, global );
	}
	return nodes;
}


/**
 * Wrap everything after `global`, up to the next bare `:local`.
 */
function rewriteRun( nodes: Child[], global: Pseudo ): Child[] {
	const start = nodes.indexOf( global );
	const localIndex = nodes.findIndex( ( node, index ) => index > start && isBare( node, ':local' ) );
	const end = -1 === localIndex ? nodes.length : localIndex;
	const run = splitRun( nodes.slice( 0, start ), nodes.slice( start + 1, end ) );

	if ( 0 === run.inner.length ) {
		return [ ...nodes.slice( 0, end ), ...rewriteNodes( nodes.slice( end ) ) ];
	}

	wrapGlobal( global, run.inner );

	if ( -1 === localIndex ) {
		return [ ...run.before, global ];
	}
	return [ ...run.before, global, ...afterLocal( nodes.slice( localIndex + 1 ), run.separator ) ];
}


/**
 * Trim combinators off both ends of the run, moving a leading `>`, `+`, or `~` into `before`.
 */
function splitRun( before: Child[], nodes: Child[] ): Run {
	const leading = nodes[ 0 ];
	if ( selectorParser.isCombinator( leading ) && ! isDescendant( leading ) ) {
		if ( isDescendant( before.at( -1 ) ) ) {
			return trimRun( [ ...before.slice( 0, -1 ), leading ], nodes.slice( 1 ) );
		}

		return {
			before,
			inner: [],
			separator: undefined,
		};
	}
	return trimRun( before, nodes );
}


function trimRun( before: Child[], nodes: Child[] ): Run {
	const first = nodes.findIndex( node => ! isDescendant( node ) );
	const last = nodes.findLastIndex( node => ! selectorParser.isCombinator( node ) );

	return {
		before,
		inner: nodes.slice( first, last + 1 ),
		separator: nodes[ last + 1 ],
	};
}


/**
 * Nodes following a dropped `:local`, joined by the strongest combinator around it.
 */
function afterLocal( nodes: Child[], separator: Child | undefined ): Child[] {
	const after: Child[] = [ ...nodes ];
	const next = after[ 0 ];
	let joiner = separator;
	if ( selectorParser.isCombinator( next ) ) {
		after.shift();
		if ( ! selectorParser.isCombinator( separator ) || isDescendant( separator ) ) {
			joiner = next;
		}
	}
	if ( 0 === after.length ) {
		return [];
	}
	if ( selectorParser.isCombinator( joiner ) ) {
		return [ joiner, ...rewriteNodes( after ) ];
	}
	return rewriteNodes( after );
}


function wrapGlobal( global: Pseudo, nodes: Child[] ): void {
	const argument = selectorParser.selector( {
		nodes: [],
		value: '',
	} );
	nodes.forEach( node => argument.append( node ) );
	argument.first.spaces.before = '';
	argument.last.spaces.after = '';
	global.removeAll();
	global.append( argument );
}


function isBare( node: Child, value: ':global' | ':local' ): node is Pseudo {
	return selectorParser.isPseudo( node ) && value === node.value && 0 === node.nodes.length;
}


function isDescendant( node: Child | undefined ): node is Combinator {
	return selectorParser.isCombinator( node ) && '' === node.value.trim();
}
