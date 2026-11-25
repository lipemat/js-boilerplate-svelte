import selectorParser, {type Combinator, type Pseudo, type Selector} from 'postcss-selector-parser';
import type {Plugin, Root} from 'postcss';

type Child = Selector['nodes'][number];

type ScopePseudo = ':global' | ':local';

interface Run {
	before: Child[];
	inner: Child[];
	separator: Combinator | undefined;
}


/**
 * Rewrite a bare `:global <rest>` into `:global(<rest>)`, the only
 * form `svelte-preprocess-cssmodules` mixed mode leaves unhashed.
 *
 * - Expects flattened CSS, after `postcss-nested`.
 * - A bare `:local` ends the global run and is dropped.
 * - A `:local(…)` is unwrapped, and the global run resumes after its compound.
 * - Within pseudo arguments of a top-level compound holding a class, mixed
 *   wraps the whole compound, so every `:global` inside is stripped.
 * - Within other pseudo arguments, bare `:global` is wrapped the same way.
 * - Within a `:global(…)` argument, `:global` inside pseudos is stripped.
 */
export default function postcssGlobalFunction(): Plugin {
	const processor = selectorParser( root => {
		root.each( selector => {
			ScopeRewriter.TOP_LEVEL.rewrite( selector );
		} );
	} );

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
 * Rewrites the scope pseudos of a selector in place.
 */
class ScopeRewriter {
	/**
	 * A rule's own selectors, where mixed mode wraps compounds holding a class in `:global(…)`.
	 */
	public static readonly TOP_LEVEL = new ScopeRewriter( true );

	/**
	 * Selectors within pseudo arguments.
	 */
	public static readonly NESTED = new ScopeRewriter( false );


	private constructor(
		private readonly topLevel: boolean
	) {
	}


	public rewrite( selector: Selector ): void {
		const nodes: Child[] = [ ...selector.nodes ];
		selector.removeAll();
		this.rewriteNodes( nodes ).forEach( node => selector.append( node ) );
	}


	private rewriteNodes( nodes: Child[] ): Child[] {
		const run = GlobalRun.find( nodes );
		if ( run instanceof GlobalRun ) {
			return [ ...this.rewritePseudos( run.before ), ...run.wrap(), ...this.rewriteNodes( run.after ) ];
		}
		return this.rewritePseudos( nodes );
	}


	/**
	 * Strip or wrap `:global` within the pseudo arguments of each compound.
	 */
	private rewritePseudos( nodes: Child[] ): Child[] {
		splitCompounds( nodes ).forEach( compound => {
			this.rewriteCompound( compound );
		} );
		return nodes;
	}


	private rewriteCompound( compound: Child[] ): void {
		const rewrite = this.topLevel && hasClass( compound ) ? stripArguments : wrapArguments;
		compound.forEach( rewrite );
	}
}


/**
 * The first bare `:global` among nodes, and the nodes it scopes up to the next bare `:local`.
 */
class GlobalRun {
	/**
	 * Nodes ahead of the `:global`, or through the run when it scopes nothing.
	 */
	public readonly before: Child[];

	/**
	 * Nodes past the dropped `:local`, or from the `:local` on when the run scopes nothing.
	 */
	public readonly after: Child[];

	private readonly inner: Child[];

	/**
	 * The strongest combinator around the dropped `:local`.
	 */
	private readonly joiner: Combinator | undefined;


	/**
	 * @param global - Wrapped in place by `wrap()`.
	 * @param before - Nodes ahead of `global`.
	 * @param run    - Nodes between `global` and the bare `:local`.
	 * @param rest   - The bare `:local` and the nodes after it.
	 */
	private constructor(
		private readonly global: Pseudo,
		before: Child[],
		run: Child[],
		rest: Child[]
	) {
		const split = splitRun( before, run );
		this.inner = split.inner;

		if ( 0 === split.inner.length ) {
			this.before = [ ...before, global, ...run ];
			this.after = rest;
			this.joiner = undefined;
		} else {
			const [ , next ] = rest;
			this.before = split.before;
			this.after = rest.slice( selectorParser.isCombinator( next ) ? 2 : 1 );
			this.joiner = strongest( split.separator, next );
		}
	}


	public static find( nodes: Child[] ): GlobalRun | undefined {
		const global = nodes.find( node => isBare( node, ':global' ) );
		if ( selectorParser.isPseudo( global ) ) {
			const start = nodes.indexOf( global );
			const local = nodes.find( ( node, index ) => start < index && ( isBare( node, ':local' ) || isFunction( node, ':local' ) ) );
			return GlobalRun.from( isFunction( local, ':local' ) ? expandLocal( nodes, local ) : nodes, global );
		}
		return undefined;
	}


	private static from( expanded: Child[], global: Pseudo ): GlobalRun {
		const start = expanded.indexOf( global );
		const local = expanded.findIndex( ( node, index ) => start < index && isBare( node, ':local' ) );
		const end = -1 === local ? expanded.length : local;
		return new GlobalRun( global, expanded.slice( 0, start ), expanded.slice( start + 1, end ), expanded.slice( end ) );
	}


	/**
	 * Move the scoped nodes into the `:global(…)`, followed by the combinator joining it to `after`.
	 */
	public wrap(): Child[] {
		if ( 0 === this.inner.length ) {
			return [];
		}
		this.inner.forEach( stripArguments );
		wrapGlobal( this.global, this.inner );

		if ( selectorParser.isCombinator( this.joiner ) && 0 < this.after.length ) {
			return [ this.global, this.joiner ];
		}
		return [ this.global ];
	}
}


/**
 * Spell `:local(<x>)` as a bare `:local <x>`, with a bare `:global` after its compound.
 */
function expandLocal( nodes: Child[], local: Pseudo ): Child[] {
	const index = nodes.indexOf( local );
	const next = nodes.findIndex( ( node, position ) => index < position && selectorParser.isCombinator( node ) );
	const inner: Child[] = [ ...local.first.nodes ];
	inner[ 0 ].spaces.before = '';
	const head: Child[] = [ ...nodes.slice( 0, index ), pseudo( ':local' ) ];
	if ( selectorParser.isCombinator( nodes[ index - 1 ] ) ) {
		head.push( descendant() );
	}

	if ( -1 === next ) {
		return [ ...head, ...inner, ...nodes.slice( index + 1 ) ];
	}
	return [ ...head, ...inner, ...nodes.slice( index + 1, next + 1 ), pseudo( ':global' ), descendant(), ...nodes.slice( next + 1 ) ];
}


/**
 * Trim combinators off both ends of the run, moving a leading `>`, `+`, or `~` into `before`.
 */
function splitRun( before: Child[], run: Child[] ): Run {
	const [ leading ] = run;
	if ( isExplicit( leading ) ) {
		if ( isDescendant( before.at( -1 ) ) ) {
			return trimRun( [ ...before.slice( 0, -1 ), leading ], run.slice( 1 ) );
		}
		return {
			before,
			inner: [],
			separator: undefined,
		};
	}
	return trimRun( before, run );
}


function trimRun( before: Child[], run: Child[] ): Run {
	const first = run.findIndex( node => ! isDescendant( node ) );
	const last = run.findLastIndex( node => ! selectorParser.isCombinator( node ) );
	const separator = run[ last + 1 ];

	return {
		before,
		inner: run.slice( first, last + 1 ),
		separator: selectorParser.isCombinator( separator ) ? separator : undefined,
	};
}


/**
 * The stronger of the combinators around the dropped `:local`.
 */
function strongest( separator: Combinator | undefined, next: Child | undefined ): Combinator | undefined {
	if ( isExplicit( separator ) ) {
		return separator;
	}
	if ( selectorParser.isCombinator( next ) ) {
		return next;
	}
	return separator;
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


/**
 * Wrap bare `:global` within the pseudo arguments of `node`.
 */
function wrapArguments( node: Child ): void {
	eachArgument( node, selector => {
		ScopeRewriter.NESTED.rewrite( selector );
	} );
}


/**
 * Strip `:global` within the pseudo arguments of `node`.
 */
function stripArguments( node: Child ): void {
	eachArgument( node, stripSelector );
}


/**
 * Run `callback` on each pseudo argument, or strip `:global` within a `:global(…)` argument.
 */
function eachArgument( node: Child, callback: ( selector: Selector ) => void ): void {
	if ( selectorParser.isPseudo( node ) && ':local' !== node.value ) {
		node.each( selector => {
			if ( ':global' === node.value ) {
				selector.nodes.forEach( stripArguments );
			} else {
				callback( selector );
			}
		} );
	}
}


/**
 * Remove every `:global` within the selector, recursively, keeping a function form's argument.
 */
function stripSelector( selector: Selector ): void {
	[ ...selector.nodes ].forEach( node => {
		if ( isBare( node, ':global' ) ) {
			removeBare( selector, node );
		} else if ( isFunction( node, ':global' ) ) {
			unwrapGlobal( node );
		} else {
			stripArguments( node );
		}
	} );
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
 * Replace `:global(<x>)` with `<x>`, stripping `:global` within its pseudo arguments.
 */
function unwrapGlobal( global: Pseudo ): void {
	const inner: Child[] = [ ...global.first.nodes ];
	inner[ 0 ].spaces.before = global.spaces.before;
	global.replaceWith( ...inner );
	inner.forEach( stripArguments );
}


/**
 * Remove a bare pseudo along with the descendant combinator it leaves dangling.
 */
function removeBare( selector: Selector, node: Child ): void {
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


function hasClass( compound: Child[] ): boolean {
	return compound.some( node => selectorParser.isClassName( node ) );
}


function isFunction( node: Child | undefined, value: ScopePseudo ): node is Pseudo {
	return selectorParser.isPseudo( node ) && value === node.value && 1 === node.nodes.length && 0 < node.first.nodes.length;
}


function isBare( node: Child, value: ScopePseudo ): boolean {
	return selectorParser.isPseudo( node ) && value === node.value && 0 === node.nodes.length;
}


function isDescendant( node: Child | undefined ): node is Combinator {
	return selectorParser.isCombinator( node ) && '' === node.value.trim();
}


/**
 * A `>`, `+`, or `~` combinator.
 */
function isExplicit( node: Child | undefined ): node is Combinator {
	return selectorParser.isCombinator( node ) && '' !== node.value.trim();
}


function descendant(): Combinator {
	return selectorParser.combinator( {
		value: ' ',
	} );
}


function pseudo( value: ScopePseudo ): Pseudo {
	return selectorParser.pseudo( {
		value,
	} );
}
