import { fn as jestFn, FunctionLike, Mock } from 'jest-mock';

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

const implementationRegistry = new WeakMap<Mock, FunctionLike>();

const checkCalledWith = <T extends FunctionLike>(
  fn: Mock,
  calledWithStack: CalledWithStackItem<T>[],
  actualArgs: [...Parameters<T>],
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

  if (calledWithInstance) {
    return calledWithInstance.calledWithFn(...actualArgs);
  }

  return implementationRegistry.get(fn)?.(...actualArgs);
};

export const calledWithFn = <T extends FunctionLike>({
  fallbackMockImplementation,
}: { fallbackMockImplementation?: T } = {}): CalledWithMock<T> => {
  const fn = jestFn(fallbackMockImplementation);

  let calledWithStack: CalledWithStackItem<T>[] = [];

  const calledWithImplementation = ((...args: Parameters<T>) => checkCalledWith(fn, calledWithStack, args)) as T;

  (fn as CalledWithMock<T>).calledWith = (...args) => {
    // We create new function to delegate any interactions (mockReturnValue etc.) to for this set of args.
    // If that set of args is matched, we just call that jest.fn() for the result.
    const calledWithFn = jestFn(((...args) => implementationRegistry.get(fn)?.(...args)) as T);

    const mockImplementation = fn.getMockImplementation();

    if (mockImplementation && mockImplementation !== calledWithImplementation) {
      implementationRegistry.set(fn, mockImplementation);
    }

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
