import 'core-js/stable';
import 'regenerator-runtime/runtime';


// eslint-disable-next-line no-undef
jest.spyOn( global.console, 'warn' ).mockImplementation( () => jest.fn() );
// eslint-disable-next-line no-undef
jest.spyOn( global.console, 'error' ).mockImplementation( () => jest.fn() );

// Mock environmental variables
global.__TEST__ = true;
