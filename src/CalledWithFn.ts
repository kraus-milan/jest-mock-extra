import { jest } from '@jest/globals';
import { FunctionLike, Mock } from 'jest-mock';

import { Matcher, MatchersOrLiterals } from './Matchers';
import { CalledWithMock } from './Mock';

interface CalledWithStackItem<T extends FunctionLike> {
  args: MatchersOrLiterals<[...Parameters<T>]>;
  calledWithFn: Mock<T>;
}

interface JestAsymmetricMatcher {
  asymmetricMatch(...args: any[]): boolean;
}
function isJestAsymmetricMatcher(obj: any): obj is JestAsymmetricMatcher {
  return !!obj && typeof obj === 'object' && 'asymmetricMatch' in obj && typeof obj.asymmetricMatch === 'function';
}

const checkCalledWith = <T extends FunctionLike>(
  calledWithStack: Array<CalledWithStackItem<T>>,
  actualArgs: [...Parameters<T>],
  defaultFn?: T,
): ReturnType<T> => {
  const calledWithInstance = calledWithStack.find((instance) =>
    instance.args.every((matcher, i) => {
      if (matcher instanceof Matcher) {
        return matcher.asymmetricMatch(actualArgs[i]);
      }

      if (isJestAsymmetricMatcher(matcher)) {
        return matcher.asymmetricMatch(actualArgs[i]);
      }

      return actualArgs[i] === matcher;
    }),
  );

  const fn = calledWithInstance?.calledWithFn ?? defaultFn;

  return fn?.(...actualArgs);
};

export const calledWithFn = <T extends FunctionLike>({
  fallbackMockImplementation,
}: { fallbackMockImplementation?: T } = {}): CalledWithMock<T> => {
  const fn = jest.fn(fallbackMockImplementation);

  let calledWithStack: CalledWithStackItem<T>[] = [];
  let defaultFn = fallbackMockImplementation;

  const calledWithImplementation = ((...args: Parameters<T>) => checkCalledWith(calledWithStack, args, defaultFn)) as T;

  (fn as CalledWithMock<T>).calledWith = (...args) => {
    const mockImplementation = fn.getMockImplementation();

    if (mockImplementation !== calledWithImplementation) {
      defaultFn = mockImplementation;
    }

    // We create new function to delegate any interactions (mockReturnValue etc.) to for this set of args.
    // If that set of args is matched, we just call that jest.fn() for the result.
    const calledWithFn = jest.fn(defaultFn);

    if (!mockImplementation || mockImplementation !== calledWithImplementation) {
      // Our original function gets a mock implementation which handles the matching
      fn.mockImplementation(calledWithImplementation);

      calledWithStack = [];
    }

    calledWithStack.unshift({ args, calledWithFn });

    return calledWithFn;
  };

  return fn as CalledWithMock<T>;
};

export default calledWithFn;
