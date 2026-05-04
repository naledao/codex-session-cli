#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { App } from './components/App';

const args = process.argv.slice(2);
const dirIndex = args.indexOf('--dir');
const directory = dirIndex !== -1 ? args[dirIndex + 1] : undefined;

render(React.createElement(App, { directory }));
