import { DataService }       from "./data";
import { ClassifierService } from "./classifier";

DataService.readyMode = true;
ClassifierService.readyMode = true;

describe('Init data', () => {
  it('Load', async (done) => {

    const dataService = new DataService();
    await dataService.init();

    expect(dataService.story).toMatchSnapshot();
    expect(dataService.rawData).toMatchSnapshot();

    done();
  });
});


