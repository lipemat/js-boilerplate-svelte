import {readFileSync} from 'fs';
import type {Plugin, UserConfig, ViteDevServer} from 'vite';
import {basename} from 'path';
import localByDefault from 'postcss-modules-local-by-default';
import extractImports from 'postcss-modules-extract-imports';
import modulesScope from 'postcss-modules-scope';
import postcss from 'postcss';
import {unlinkSync} from 'node:fs';

import camelCase from '@lipemat/js-boilerplate-shared/helpers/camel-case.js';
import {generateModuleTypeDefinition, writeTypingsFile} from '@lipemat/js-boilerplate-shared/lib/css-module-types.js';


/**
 * Extracts CSS module keys from the content of a CSS Module file.
 *
 * @param {string} content      - The content of the CSS Module file.
 * @param {string} resourcePath - The path of the CSS Module file.
 * @return {string[]} - An array of unique CSS module keys.
 */
async function getCssModuleKeys( content: string, resourcePath: string ): Promise<string[]> {
	const result: postcss.Result = await postcss( [ localByDefault, extractImports, modulesScope ] ).process( content, {
		from: resourcePath,
		to: resourcePath,
	} );

	const classes = new Set<string>();
	result.root.walkRules( ':export', ( rule: postcss.Rule ) => {
		rule.walkDecls( ( decl: postcss.Declaration ) => {
			classes.add( camelCase( decl.prop ) );
		} );
	} );
	return Array.from( classes );
}


export default function cssModuleTypes(): Plugin {
	return {
		name: 'lipemat:css-module-types',

		// Genereate all CSS module typings on build.
		config: (): Pick<UserConfig, 'css'> => {
			return {
				css: {
					modules: {
						getJSON: ( fileName, keys ): void => {
							const cssModuleKeys = Object.keys( keys );
							if ( 0 >= cssModuleKeys.length ) {
								return;
							}

							const typingsPath = fileName.replace( /\.pcss$/, '.pcss.d.ts' );
							const cssModuleDefinition = generateModuleTypeDefinition( cssModuleKeys, camelCase( basename( fileName ), true ) );

							writeTypingsFile( typingsPath, cssModuleDefinition );
						},
					},
				},
			};
		},

		// Generate CSS module typings on change during `serve`.
		configureServer: ( server: ViteDevServer ): void => {
			server.watcher.on( 'change', async fileName => {
				if ( ! fileName.endsWith( `.pcss` ) || /[/\\]pcss[/\\].*/.test( fileName ) ) {
					return;
				}
				const typingsPath = fileName.replace( /\.pcss$/, '.pcss.d.ts' );
				const content = readFileSync( fileName, 'utf8' );

				const cssModuleKeys = await getCssModuleKeys( content, fileName );

				if ( 0 < cssModuleKeys.length ) {
					const cssModuleDefinition = generateModuleTypeDefinition( cssModuleKeys, camelCase( basename( fileName ), true ) );
					writeTypingsFile( typingsPath, cssModuleDefinition );
				}
			} );
			server.watcher.on( 'unlink', ( fileName: string ): void => {
				if ( ! fileName.endsWith( `.pcss` ) ) {
					return;
				}

				try {
					unlinkSync( fileName + '.d.ts' );
				} catch {
				}
			} );
		},
	};
}
