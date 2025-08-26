import Page from './routes/page.svelte';
import {mount} from 'svelte';

import './pcss/default.pcss';

mount( Page, {
	target: document.getElementById( 'app' )!,
} );
