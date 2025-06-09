/** @returns {Promise<import('jest').Config>} */
module.exports = async () => ({
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/lib/'],
    coveragePathIgnorePatterns: ['/node_modules/', '/lib/'],
    coverageReporters: ['json-summary', 'html'],
});
