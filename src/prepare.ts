import { DataService }     from "./data/data";
import { PredictService }  from "./predict/predict";
import { ClassifierConst } from "./classifier/const";
import * as fs             from "fs-extra";

ClassifierConst.trainMode = true;

(async function () {
  try {
    const dataService = new DataService();
    await dataService.init();
    const predictService = new PredictService(dataService);
    await predictService.init();

    let results          = Object.keys(predictService.classifiers)
      .map(q => ({
        macroAverage: predictService.classifiers[ q ].macroAverage,
        microAverage: predictService.classifiers[ q ].microAverage
      }));
    let resultsWithExtra = Object.keys(predictService.classifiersWithExtra)
      .map(q => ({
        macroAverage: predictService.classifiersWithExtra[ q ].macroAverage,
        microAverage: predictService.classifiersWithExtra[ q ].microAverage
      }));

    await fs.writeJSON('./public/results.json', {
      results, resultsWithExtra
    });

    let avgB = 0;
    let avgC = 0;

    results = results.map(x => {
      avgB += x.microAverage.F1;
      return { macroAverage: x.macroAverage.F1, microAverage: x.microAverage.F1 }
    });
    resultsWithExtra = resultsWithExtra.map(x => {
      avgC += x.microAverage.F1;
      return { macroAverage: x.macroAverage.F1, microAverage: x.microAverage.F1 }
    });

    avgB /= results.length;
    avgC /= resultsWithExtra.length;



    let text_truncate = function(str, length, ending?) {
      if (length == null) {
        length = 100;
      }
      if (ending == null) {
        ending = '...';
      }
      if (str.length > length) {
        return str.substring(0, length - ending.length) + ending;
      } else {
        return str;
      }
    };

    avgB *= 100;
    avgC *= 100;

    let preCalcA = ["60.49","64.20","78.57","84.87","57.46","80.43","57.04","94.20","75.00","84.62","94.12","81.69"];
    let latexTable = '';
    for (const q of  predictService.groupsKeys) {
      const a = `${ (+preCalcA[predictService.groupsKeys.indexOf(q)]).toFixed(2) }`;
      const b = `${ (results[predictService.groupsKeys.indexOf(q)].microAverage * 100).toFixed(2) }`;
      const c = `${ (resultsWithExtra[predictService.groupsKeys.indexOf(q)].microAverage  * 100).toFixed(2) }`;
      latexTable += `\n\\multicolumn{1}{|l|}{${ text_truncate(q, 30) }} & \\textbf{${ a }\\%} & \\textbf{${b}\\%} & \\textbf{${c}\\%} \\\\ \\hline`
    }
    latexTable += `\n\\multicolumn{1}{|l|}{Skupaj} & \\textbf{${'63.76'}\\%} & \\textbf{${avgB.toFixed(2)}\\%} & \\textbf{${avgC.toFixed(2)}\\%} \\\\ \\hline`;

    // In a multi-class classification setup, micro-average is preferable if you suspect there might be class imbalance (i.e you may have many more examples of one class than of other classes).
    console.log(latexTable);
    console.log(` DONE  B${ avgB.toFixed(2) } C${ avgC.toFixed(2) }`);

    process.exit(0)
  } catch (e) {
    console.error(e);
  }
})();
