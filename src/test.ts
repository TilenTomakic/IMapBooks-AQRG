import { DataService }       from "./data/data";
import { PredictService }    from "./predict/predict";
import { ClassifierConst }   from "./classifier/const";

DataService.readyMode = true;
ClassifierConst.readyMode = true;

(async function () {
  try {
    const dataService = new DataService();
    await dataService.init();
    const predictService = new PredictService(dataService);
    await predictService.init();

    console.log('Data OK.');
    process.exit(0)
  } catch (e) {
    console.error(e);
    process.exit(2)
  }
})();
