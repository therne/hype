/**
 * Unlike [Object.assign] does override `null` and `undefined` values,
 * this method doesn't override nullish values.
 *
 * @param target (e.g. a default option object)
 * @param source (e.g. an user-given options)
 */
export const assignOptions = <T, U>(target: T, source: U): T & U =>
  Object.assign(target, Object.fromEntries(Object.entries(source).filter(([, val]) => val != null)) as U);
