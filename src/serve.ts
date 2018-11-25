import { Server }         from "./server/server";
import { DataService }    from "./data/data";
import { PredictService } from "./predict/predict";

(new DataService())
  .init()
  .then(dataService => {
    return (new PredictService(dataService)).init();
  })
  .then(predictService => {
    const server = new Server(predictService);
    server.listen();
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });