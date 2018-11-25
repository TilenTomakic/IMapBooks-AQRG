module.exports = {
  setupTestFrameworkScriptFile: './jest.setup.js',
	globals: {
		'ts-jest': {
			tsConfigFile: 'tsconfig.json'
		}
	},
	moduleFileExtensions: [
		'ts',
		'js'
	],
	transform: {
		'^.+\\.(ts|tsx)$': './node_modules/ts-jest/preprocessor.js'
	},
	testMatch: [
		'**/**/*.test.(ts|js)'
	],
	testEnvironment: 'node'
};
