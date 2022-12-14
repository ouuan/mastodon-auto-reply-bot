/* eslint-disable import/prefer-default-export */

export function access(obj: any, path: string) {
  const parts = path.split('.');
  let result = obj;
  for (const part of parts) {
    result = result?.[part];
  }
  return result;
}
