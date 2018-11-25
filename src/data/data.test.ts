import { DataService } from "./data";

describe('Init data', () => {
  it('Load', async (done) => {

    const dataService = new DataService();
    await dataService.init();

    expect(dataService.story).toMatchSnapshot();
    expect(dataService.rawData).toMatchSnapshot();

    done();
  });
});


