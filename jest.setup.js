jest.mock('csv-parse/browser/esm/sync', () => {
  return {
    parse: require('csv-parse/sync').parse
  };
});
