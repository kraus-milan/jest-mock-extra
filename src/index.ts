export {
    CalledWithMock,
    DeepMockProxy,
    GlobalConfig,
    JestMockExtended,
    mockClear,
    mockDeep,
    mockFn,
    MockProxy,
    mockReset,
    stub,
} from './Mock';

import { default as mockDefault } from './Mock';

export const mock = mockDefault;

import { default as calledWithFnDefault } from './CalledWithFn';

export const calledWithFn = calledWithFnDefault;

export * from './Matchers';
