import { DataService }                   from "./data/data";
import { PredictService }                from "./predict/predict";

DataService.readyMode = true;

(async function () {
  try {
    const dataService = new DataService();
    await dataService.init();
    const predictService = new PredictService(dataService);
    await predictService.init();

    console.log('DONE');

    process.exit(0)
  } catch (e) {
    console.error(e);
  }
})();
