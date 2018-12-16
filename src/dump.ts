import { validate } from "./validation/validation";
import * as fs      from "fs-extra";

(String.prototype as any).pad = function (size) {
  var s = String(this);
  while (s.length < (size || 2)) {
    s = " " + s;
  }
  return s;
};

(async function () {
  try {
    const rows = await validate();
    await fs.writeJSON('./public/dump.json', rows);
    // const rows = await fs.readJson('./data/dump.json');

    const text = rows
      .map((r, i) => `${ (i + '' as any).pad(2)
        }\tEX: ${ (r.rating + '' as any).pad(3)
        }\t\tA: ${ (r.testA.score + '' as any).pad(3) }\t\tB: ${ (r.testB.score + '' as any).pad(3) }\t\tC: ${ (r.testC.score + '' as any).pad(3)
        }\t\t${ r.rating !== r.testA.score ? 'AX' : '  '} ${ r.rating !== r.testB.score ? 'BX' : '  '} ${ r.rating !== r.testC.score ? 'CX' : '  '}`)
      .join('\n');

    const ar = (rows.reduce((a, r) => r.rating === r.testA.score ? ++a : a, 0) / rows.length * 100).toFixed(2);
    const br = (rows.reduce((a, r) => r.rating === r.testB.score ? ++a : a, 0) / rows.length * 100).toFixed(2);
    const cr = (rows.reduce((a, r) => r.rating === r.testC.score ? ++a : a, 0) / rows.length * 100).toFixed(2);

    await fs.writeFile('./public/dump.txt', `              A rate ${ (ar + '' as any).pad(5)}%,   B rate ${ (br + '' as any).pad(5)}%,   C rate ${ (cr + '' as any).pad(5)}%\n${ text }`);

    process.exit(0)
  } catch (e) {
    console.error(e);
  }
})();
