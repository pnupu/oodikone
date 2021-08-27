const path = require('path')
const cwd = process.cwd()
const dockerCmdBase = `docker run --rm --volume ${cwd}:/oodikone --workdir /oodikone`
const relativeFilePaths = files => [...files.map(file => path.relative(cwd, file))].join(' ')

module.exports = {
  '{services,updater}/**/*.{js,jsx}': files => `eslint --fix ${files.join(' ')}`,
  '*.{js,json,md,yml,yaml,html}': files => `prettier --write ${files.join(' ')}`,
  '*.css': files => `stylelint --fix ${files.join(' ')}`,
  Dockerfile: files => `${dockerCmdBase} hadolint/hadolint:v2.7.0-alpine hadolint ${relativeFilePaths(files)}`,
  '*.sh': files => `${dockerCmdBase} koalaman/shellcheck-alpine:v0.7.2 ${relativeFilePaths(files)} -x`,
  '.github/workflows/*': files => `${dockerCmdBase} rhysd/actionlint:1.6.2 ${relativeFilePaths(files)}`,
  'docker-compose*': files => {
    const composeFiles = file => {
      if (['docker-compose.ci.yml', 'docker-compose.test.yml'].some(f => file.includes(f))) {
        return `--file ${file}`
      }
      if (file.includes('docker-compose.real.yml')) {
        return `--file ${cwd}/docker-compose.yml --file ${file}`
      }
      return ''
    }

    return files.map(file => `docker-compose ${composeFiles(file)} config --quiet`)
  },
}
