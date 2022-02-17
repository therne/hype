import { assignOptions } from '../../src/utils';

describe('Testing assignOptions()', () => {
  const defaults = {
    null: 'no override',
    undefined: 'no override',
    notDefined: 'no override',
  };

  describe('when a non-null value is given', () => {
    const override = { notDefined: 'override' };

    it('it should override the default value', () => {
      expect(assignOptions(defaults, override)).toEqual({
        null: 'no override',
        undefined: 'no override',
        notDefined: 'override',
      });
    });
  });

  describe('when null is given', () => {
    const override = { null: null };

    it('it should not override the default value', () => {
      expect(assignOptions(defaults, override)).toEqual(defaults);
    });
  });

  describe('when undefined is given', () => {
    const override = { undefined: undefined };

    it('it should not override the default value', () => {
      expect(assignOptions(defaults, override)).toEqual(defaults);
    });
  });
});
