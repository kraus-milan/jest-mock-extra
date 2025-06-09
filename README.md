# jest-mock-extra

> Type safe mocking extensions for Jest 🃏

[![test](https://github.com/kraus-milan/jest-mock-extra/actions/workflows/test.yml/badge.svg)](https://github.com/kraus-milan/jest-mock-extra/actions/workflows/test.yml)
[![cov](https://kraus-milan.github.io/jest-mock-extra/badges/coverage.svg)](https://github.com/kraus-milan/jest-mock-extra/actions)
[![license: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/jest-mock-extra.svg)](https://badge.fury.io/js/jest-mock-extra)
[![npm downloads](https://badgen.net/npm/dw/jest-mock-extra)](https://badge.fury.io/js/jest-mock-extra)

This library is based on [jest-mock-extended](https://github.com/marchaos/jest-mock-extended) from Marc McIntyre. Thank you for your great work!

## Features

- Provides complete Typescript type safety for interfaces, argument types and return types
- Ability to mock any interface or object
- calledWith() extension to provide argument specific expectations, which works for objects and functions.
- Extensive Matcher API compatible with Jasmine matchers
- Supports mocking deep objects / class instances.
- Familiar Jest like API

### New features not present in the original library

- `calledWith()` takes into account previous implementation set by `.mock*Value()` and uses it as default value
- Jest v30 support

## Installation

```bash
npm install jest-mock-extra --save-dev
```

or

```bash
yarn add jest-mock-extra --dev
```

## Example

```ts
import { mock } from 'jest-mock-extra';

interface PartyProvider {
  getPartyType: () => string;
  getSongs: (type: string) => string[];
  start: (type: string) => void;
}

describe('Party Tests', () => {
  test('Mock out an interface', () => {
    const mock = mock<PartyProvider>();
    mock.start('disco party');

    expect(mock.start).toHaveBeenCalledWith('disco party');
  });

  test('mock out a return type', () => {
    const mock = mock<PartyProvider>();
    mock.getPartyType.mockReturnValue('west coast party');

    expect(mock.getPartyType()).toBe('west coast party');
  });

  test('throwing an error if we forget to specify the return value');
  const mock = mock<PartyProvider>(
    {},
    {
      fallbackMockImplementation: () => {
        throw new Error('not mocked');
      },
    },
  );

  expect(() => mock.getPartyType()).toThrow('not mocked');
});
```

## Assigning Mocks with a Type

If you wish to assign a mock to a variable that requires a type in your test, then you should use the MockProxy<> type
given that this will provide the apis for calledWith() and other built-in jest types for providing test functionality.

```ts
import { MockProxy, mock } from 'jest-mock-extra';

describe('test', () => {
    let myMock: MockProxy<MyInterface>;

    beforeEach(() => {
        myMock = mock<MyInterface>();
    })

    test(() => {
         myMock.calledWith(1).mockReturnValue(2);
         ...
    })
});

```

## calledWith() Extension

`jest-mock-extra` allows for invocation matching expectations. Types of arguments, even when using matchers are type checked.

```ts
const provider = mock<PartyProvider>();
provider.getSongs.calledWith('disco party').mockReturnValue(['Dance the night away', 'Stayin Alive']);
expect(provider.getSongs('disco party')).toEqual(['Dance the night away', 'Stayin Alive']);

// Matchers
provider.getSongs.calledWith(any()).mockReturnValue(['Saw her standing there']);
provider.getSongs.calledWith(anyString()).mockReturnValue(['Saw her standing there']);
```

You can also use `mockFn()` to create a `jest.fn()` with the calledWith extension:

```ts
type MyFn = (x: number, y: number) => Promise<string>;
const fn = mockFn<MyFn>();
fn.calledWith(1, 2).mockReturnValue('str');
```

### Order of expectations

The latest defined expectaions using `.calledWith()` have higher prio than the previous expections. If you are using matchers that could match multiple invocations, define more specific matchers later:

```ts
type MyFn = (x: number, y: number) => Promise<string>;
const fn = mockFn<MyFn>();
fn.calledWith(any(), any()).mockReturnValue('one');
fn.calledWith(1, 2).mockReturnValue('two');

expect(fn(1, 2)).toBe('two');

const fn2 = mockFn<MyFn>();
fn.calledWith(1, 2).mockReturnValue('two');
fn.calledWith(any(), any()).mockReturnValue('one');

expect(fn(1, 2)).toBe('one');
```

### Default implementation

Mock implementation set before `.calledWith()` is called is used as default value and it is executed if no set matchers match the actual parameters of the function/method call.

```ts
type MyFn = (x: number, y: number) => Promise<string>;
const fn = mockFn<MyFn>();
fn.mockReturnValue('foo');
fn.calledWith(1, 2).mockReturnValue('bar');

expect(fn(3, 4)).toBe('foo');
```

Setting default implementation after the `.calledWith()` clears all the parameters expectations.

```ts
type MyFn = (x: number, y: number) => Promise<string>;
const fn = mockFn<MyFn>();
fn.calledWith(1, 2).mockReturnValue('bar');
fn.mockReturnValue('foo');

expect(fn(1, 2)).toBe('foo');
```

### Expectations for multiple calls with the same parameters

If you want to set expectations for different calls with the same parameters using `.mock*Once()`, you need to store the instance of the mock created using `.calledWith()` and add the expectations to it:

```ts
type MyFn = (x: number, y: number) => Promise<string>;
const fn = mockFn<MyFn>();
const oneTwo = fn.calledWith(1, 2);
oneTwo.mockReturnValueOnce('foo');
oneTwo.mockReturnValueOnce('bar');

expect(fn(1, 2)).toBe('foo');
expect(fn(1, 2)).toBe('bar');
```

## Clearing / Resetting Mocks

`jest-mock-extra` exposes a mockClear and mockReset for resetting or clearing mocks with the same
functionality as `jest.fn()`.

```ts
import { mock, mockClear, mockReset } from 'jest-mock-extra';

describe('test', () => {
   const mock: UserService = mock<UserService>();

   beforeEach(() => {
      mockReset(mock); // or mockClear(mock)
   });
   ...
})
```

## Deep mocks

If your class has objects returns from methods that you would also like to mock, you can use `mockDeep` in
replacement for mock.

```ts
import { mockDeep } from 'jest-mock-extra';

const mockObj: DeepMockProxy<Test1> = mockDeep<Test1>();
mockObj.deepProp.getNumber.calledWith(1).mockReturnValue(4);
expect(mockObj.deepProp.getNumber(1)).toBe(4);
```

if you also need support for properties on functions, you can pass in an option to enable this

```ts
import { mockDeep } from 'jest-mock-extra';

const mockObj: DeepMockProxy<Test1> = mockDeep<Test1>({ funcPropSupport: true });
mockObj.deepProp.calledWith(1).mockReturnValue(3);
mockObj.deepProp.getNumber.calledWith(1).mockReturnValue(4);

expect(mockObj.deepProp(1)).toBe(3);
expect(mockObj.deepProp.getNumber(1)).toBe(4);
```

Can can provide a fallback mock implementation used if you do not define a return value using `calledWith`.

```ts
import { mockDeep } from 'jest-mock-extra';
const mockObj = mockDeep<Test1>({
  fallbackMockImplementation: () => {
    throw new Error('please add expected return value using calledWith');
  },
});
expect(() => mockObj.getNumber()).toThrowError('not mocked');
```

## Available Matchers

| Matcher                | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| any()                  | Matches any arg of any type.                               |
| anyBoolean()           | Matches any boolean (true or false)                        |
| anyString()            | Matches any string including empty string                  |
| anyNumber()            | Matches any number that is not NaN                         |
| anyFunction()          | Matches any function                                       |
| anyObject()            | Matches any object (typeof m === 'object') and is not null |
| anyArray()             | Matches any array                                          |
| anyMap()               | Matches any Map                                            |
| anySet()               | Matches any Set                                            |
| isA(class)             | e.g isA(DiscoPartyProvider)                                |
| includes('value')      | Checks if value is in the argument array                   |
| containsKey('key')     | Checks if the key exists in the object                     |
| containsValue('value') | Checks if the value exists in an object                    |
| has('value')           | checks if the value exists in a Set                        |
| notNull()              | value !== null                                             |
| notUndefined()         | value !== undefined                                        |
| notEmpty()             | value !== undefined && value !== null && value !== ''      |
| captor()               | Used to capture an arg - alternative to mock.calls[0][0]   |

## Writing a Custom Matcher

Custom matchers can be written using a `MatcherCreator`

```ts
import { MatcherCreator, Matcher } from 'jest-mock-extra';

// expectedValue is optional
export const myMatcher: MatcherCreator<MyType> = (expectedValue) =>
  new Matcher((actualValue) => {
    return expectedValue === actualValue && actualValue.isSpecial;
  });
```

By default, the expected value and actual value are the same type. In the case where you need to type the expected value
differently than the actual value, you can use the optional 2 generic parameter:

```ts
import { MatcherCreator, Matcher } from 'jest-mock-extra';

// expectedValue is optional
export const myMatcher: MatcherCreator<string[], string> = (expectedValue) =>
  new Matcher((actualValue) => {
    return actualValue.includes(expectedValue);
  });
```
