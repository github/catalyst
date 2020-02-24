import {findTarget, findTargets} from '@catalyst/core'

export function target(proto: object, key: string) {
  Object.defineProperty(
    proto,
    key,
    {
      configurable: true,
      get: function() { return findTarget(this, key) }
    }
  );
}

export function targets(proto: object, key: string) {
  Object.defineProperty(
    proto,
    key,
    {
      configurable: true,
      get: function() { return findTargets(this, key) }
    }
  );
}
