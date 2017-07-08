const util = require('util');
const exec = util.promisify(require('child_process').exec);
const readFile = util.promisify(require('fs').readFile);
const writeFile = util.promisify(require('fs').writeFile);

const info = `
Usage: _node_ battlogger LOGFILE [OPTIONS]

  Log battery info with timestamp in json format in LOGFILE

Example: battlogger ~/logs/battery_log.json --limit 1000

Options:
  -n --limit [NUMBER] Number of entries to store, default is 10000
`;

(async function main(argv) {
  try {

    // Command line arguments parsing

    if (!argv[2]) throw ('No logfile specified')
    let logfile = argv[2]

    let limit = 10000

    let limitOptionIndex = argv.indexOf('-n') || argv.indexOf('--limit')
    if (limitOptionIndex > -1)
      limit = Number(argv[limitOptionIndex + 1])

    if (!limit) throw ('Can not parse limit option')

    // Update log

    let log = await getLog(logfile)

    log = { limit: limit,
            entries: !log.entries
              ? [ await newEntry() ]
              : [ ...log.entries.slice(-limit + 1), await newEntry() ] }

    await writeFile(logfile, `${JSON.stringify(log)}\n`, 'utf8')

  } catch (error) {
    console.log(info)
  }
}) (process.argv)

async function newEntry() {
  let { stdout } = await exec('acpi')
  stdout = stdout.split(' ')
  return {
    timestamp: Date.now(),
    battery: Number(stdout[1][0]),
    status: stdout[2].replace(',', ''),
    charge: Number.parseInt(stdout[3]),
    remaining: stdout[4]
  }
}

async function getLog(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (e) {
    return {}
  }
}

