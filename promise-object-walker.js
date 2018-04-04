// @flow
const URL_PATTERN = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

/**
 * Test whether a string matches a URL pattern
 */
function isURL (url: string): boolean {
  return URL_PATTERN.test(url);
}

/**
 * Traverses an object until it finds URLs, which it requests
 */
export default async function objectWalker (obj: Array<string | Object> | Object | string): Promise<Object | Array<*>> {
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(objectWalker));
  }

  if (typeof obj === 'object') {
    const next: Object = {};

    for (const prop: string in obj) {
      if (obj.hasOwnProperty(prop)) {
        next[prop] = objectWalker(obj[prop]);
      }
    }

    const pairs: Array<[string, *]> = Object.entries(next);
    const flatten: Array<*> = [].concat(...pairs);
    const resolvedPairs: Array<*> = await Promise.all(flatten);
    const final: Object = {};

    for (let i: number = 0; i < resolvedPairs.length; i++) {
      final[resolvedPairs[i]] = resolvedPairs[++i];
    }

    return Promise.resolve(final);
  }

  if (typeof obj === 'string' && isURL(obj)) {
    return fetch(obj);
  }

  return Promise.reject({
    code: 500,
    error: `asyncProps contains a value of type '${typeof obj}'`
  });
}