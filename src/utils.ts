/* eslint-disable import/prefer-default-export */

export function access(obj: any, path: string) {
  if (path === '.' || path === '') return obj;
  const parts = path.split('.');
  let result = obj;
  for (const part of parts) {
    result = result?.[part];
  }
  return result;
}
