const fs = require('fs');

const fix_addresses = (o) => {
  const newObject = {};
  Object.keys(o).forEach((key) => {
    newObject[key.toLowerCase()] = o[key];
  });
  return newObject;
};

fs.writeFileSync(
  './unripe-moons-merkle.json',
  JSON.stringify(fix_addresses(
    JSON.parse(
      fs.readFileSync('./unripe-moons-merkle-raw.json', 'utf-8')
    )
  )),
  'utf-8'
);

fs.writeFileSync(
  './unripe-moon3crv-merkle.json',
  JSON.stringify(fix_addresses(
    JSON.parse(
      fs.readFileSync('./unripe-moon3crv-merkle-raw.json', 'utf-8')
    )
  )),
  'utf-8'
);
