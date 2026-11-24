import selectorParser, {type Combinator, type Pseudo, type Selector} from 'postcss-selector-parser';
import type {Plugin, Root} from 'postcss';

type Child = Selector['nodes'][number];

type ScopePseudo = ':global' | ':local';

interface Run {
	before: Child[];
	inner: Child[];
	separator: Child | undefined;
}

const SCOPE_PSEUDOS: string[] = [ ':global', ':local' ] satisfies ScopePseudo[];

const processor = selectorParser( root => {
	root.each( selector => {
		rewriteSelector( selector, true );
	} );
} );


/**
 * Rewrite a bare `:global <rest>` into `:global(<rest>)`, the only
 * form `svelte-preprocess-cssmodules` mixed mode leaves unhashed.
 *
 * - Expects flattened CSS, after `postcss-nested`.
 * - A bare `:local` ends the global run and is dropped.
 * - Within pseudo arguments of a top-level compound holding a class, mixed
 *   wraps the whole compound, so every `:global` inside is stripped.
 * - Within other pseudo arguments, bare `:global` is wrapped the same way.
 * - Within a `:global(…)` argument, `:global` inside pseudos is stripped.
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


/**
 * @param selector - Rewritten in place.
 * @param topLevel - Mixed mode wraps compounds holding a class in `:global(…)`.
 */
function rewriteSelector( selector: Selector, topLevel: boolean ): void {
	const original: Child[] = [ ...selector.nodes ];
	selector.removeAll();
	rewriteNodes( original, topLevel ).forEach( node => selector.append( node ) );
}


function rewriteNodes( nodes: Child[], topLevel: boolean ): Child[] {
	const global = nodes.find( ( node ): node is Pseudo => isBare( node, ':global' ) );

	if ( selectorParser.isPseudo( global ) ) {
		return rewriteRun( nodes, global, topLevel );
	}
	return rewritePseudos( nodes, topLevel );
}


/**
 * Wrap everything after `global`, up to the next bare `:local`.
 */
function rewriteRun( nodes: Child[], global: Pseudo, topLevel: boolean ): Child[] {
	const start = nodes.indexOf( global );
	const localIndex = nodes.findIndex( ( node, index ) => index > start && isBare( node, ':local' ) );
	const end = -1 === localIndex ? nodes.length : localIndex;
	const run = splitRun( nodes.slice( 0, start ), nodes.slice( start + 1, end ) );

	if ( 0 === run.inner.length ) {
		return [ ...rewritePseudos( nodes.slice( 0, end ), topLevel ), ...rewriteNodes( nodes.slice( end ), topLevel ) ];
	}

	run.inner.forEach( stripArguments );
	wrapGlobal( global, run.inner );
	const before = rewritePseudos( run.before, topLevel );

	if ( -1 === localIndex ) {
		return [ ...before, global ];
	}
	return [ ...before, global, ...afterLocal( nodes.slice( localIndex + 1 ), run.separator, topLevel ) ];
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
function afterLocal( nodes: Child[], separator: Child | undefined, topLevel: boolean ): Child[] {
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
		return [ joiner, ...rewriteNodes( after, topLevel ) ];
	}
	return rewriteNodes( after, topLevel );
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


/**
 * Strip or wrap `:global` within the pseudo arguments of each compound.
 */
function rewritePseudos( nodes: Child[], topLevel: boolean ): Child[] {
	splitCompounds( nodes ).forEach( compound => {
		rewriteCompound( compound, topLevel );
	} );
	return nodes;
}


function rewriteCompound( compound: Child[], topLevel: boolean ): void {
	const rewrite = topLevel && hasClass( compound ) ? stripArguments : wrapArguments;
	compound.forEach( rewrite );
}


function hasClass( compound: Child[] ): boolean {
	return compound.some( node => selectorParser.isClassName( node ) );
}


function splitCompounds( nodes: Child[] ): Child[][] {
	const compounds: Child[][] = [ [] ];
	nodes.forEach( node => {
		if ( selectorParser.isCombinator( node ) ) {
			compounds.push( [] );
		} else {
			compounds[ compounds.length - 1 ].push( node );
		}
	} );
	return compounds;
}


function wrapArguments( node: Child ): void {
	eachArgument( node, selector => {
		rewriteSelector( selector, false );
	} );
}


function stripArguments( node: Child ): void {
	eachArgument( node, stripSelector );
}


/**
 * Run `callback` on each pseudo argument, or strip `:global` within a `:global(…)` argument.
 */
function eachArgument( node: Child, callback: ( selector: Selector ) => void ): void {
	if ( selectorParser.isPseudo( node ) && 0 < node.nodes.length ) {
		if ( ':global' === node.value ) {
			node.each( selector => {
				selector.nodes.forEach( stripArguments );
			} );
		} else if ( ! SCOPE_PSEUDOS.includes( node.value ) ) {
			node.each( selector => {
				callback( selector );
			} );
		}
	}
}


/**
 * Remove every `:global` within the selector, recursively, keeping a function form's argument.
 */
function stripSelector( selector: Selector ): void {
	[ ...selector.nodes ].forEach( node => {
		stripNode( selector, node );
	} );
}


function stripNode( selector: Selector, node: Child ): void {
	if ( selectorParser.isPseudo( node ) ) {
		if ( isBare( node, ':global' ) ) {
			removeBare( selector, node );
		} else if ( isGlobalFunction( node ) ) {
			const inner: Child[] = [ ...node.first.nodes ];
			inner[ 0 ].spaces.before = node.spaces.before;
			node.replaceWith( ...inner );
			inner.forEach( stripArguments );
		} else {
			stripArguments( node );
		}
	}
}


/**
 * Remove a bare pseudo along with the descendant combinator it leaves dangling.
 */
function removeBare( selector: Selector, node: Pseudo ): void {
	const index = selector.index( node );
	const next: Child | undefined = selector.nodes[ index + 1 ];
	const prev: Child | undefined = selector.nodes[ index - 1 ];
	if ( isDescendant( next ) && ( undefined === prev || selectorParser.isCombinator( prev ) ) ) {
		next.remove();
	} else if ( isDescendant( prev ) ) {
		prev.remove();
	}
	node.remove();
	if ( undefined === prev && 0 < selector.nodes.length ) {
		selector.first.spaces.before = node.spaces.before;
	}
}


function isGlobalFunction( node: Pseudo ): boolean {
	return ':global' === node.value && 1 === node.nodes.length && 0 < node.first.nodes.length;
}


function isBare( node: Child, value: ScopePseudo ): boolean {
	return selectorParser.isPseudo( node ) && value === node.value && 0 === node.nodes.length;
}


function isDescendant( node: Child | undefined ): node is Combinator {
	return selectorParser.isCombinator( node ) && '' === node.value.trim();
}
