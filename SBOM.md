# SBOM

Software Bill of Materials (SBOM) for `mgifford/markdown-slides-editor`.

## Scope

- Static web application source in this repository.
- Tooling and dependencies declared in `package.json` / `package-lock.json`.
- Versions and licenses are captured from repository files plus documented validated toolchain versions.

## Primary technologies

| Component | Version | License | Source |
|---|---:|---|---|
| markdown-slides-editor (this project) | 0.1.0 | AGPL-3.0-only | `package.json`, `LICENSE` |
| HTML5 / CSS3 / ECMAScript modules (browser runtime) | N/A (web standards) | N/A (specifications, not vendored packages) | `index.html`, `src/**/*.js`, `styles/app.css` |
| Node.js (validated in repo docs) | 18.20.8 | MIT | `AGENTS.md` |
| npm CLI (validated in repo docs) | 10.8.2 | Artistic-2.0 | `AGENTS.md` |
| Python (validated in repo docs, for local static server) | 3.9.6 | PSF-2.0 | `AGENTS.md` |
| @cucumber/cucumber (direct dev dependency) | 12.8.2 | MIT | `package.json`, `package-lock.json` |

## npm dependency inventory

- Direct runtime dependencies: none
- Direct dev dependencies: 1 (`@cucumber/cucumber`)
- Total resolved npm packages in lockfile: 116
- Lockfile: `package-lock.json` (lockfileVersion 3)

### npm license summary (resolved packages)

| License | Package count |
|---|---:|
| MIT | 91 |
| Apache-2.0 | 5 |
| BlueOak-1.0.0 | 5 |
| ISC | 5 |
| (MIT OR CC0-1.0) | 4 |
| BSD-3-Clause | 2 |
| 0BSD | 1 |
| BSD-2-Clause | 1 |
| CC-BY-3.0 | 1 |
| CC0-1.0 | 1 |

### npm package list (resolved)

| Package | Version | License | Scope |
|---|---:|---|---|
| `@babel/code-frame` | 7.29.0 | MIT | dev |
| `@babel/helper-validator-identifier` | 7.28.5 | MIT | dev |
| `@colors/colors` | 1.5.0 | MIT | dev |
| `@cucumber/ci-environment` | 13.0.0 | MIT | dev |
| `@cucumber/cucumber` | 12.8.2 | MIT | dev |
| `@cucumber/cucumber-expressions` | 19.0.0 | MIT | dev |
| `@cucumber/gherkin` | 38.0.0 | MIT | dev |
| `@cucumber/gherkin-streams` | 6.0.0 | MIT | dev |
| `@cucumber/gherkin-streams/node_modules/commander` | 14.0.0 | MIT | dev |
| `@cucumber/gherkin-utils` | 11.0.0 | MIT | dev |
| `@cucumber/gherkin-utils/node_modules/commander` | 14.0.2 | MIT | dev |
| `@cucumber/html-formatter` | 23.1.0 | MIT | dev |
| `@cucumber/junit-xml-formatter` | 0.13.3 | MIT | dev |
| `@cucumber/message-streams` | 4.1.1 | MIT | dev |
| `@cucumber/messages` | 32.3.1 | MIT | dev |
| `@cucumber/pretty-formatter` | 1.0.1 | MIT | dev |
| `@cucumber/query` | 15.0.1 | MIT | dev |
| `@cucumber/tag-expressions` | 9.1.0 | MIT | dev |
| `@teppeis/multimaps` | 3.0.0 | MIT | dev |
| `@types/normalize-package-data` | 2.4.4 | MIT | dev |
| `ansi-regex` | 4.1.1 | MIT | dev |
| `ansi-styles` | 5.2.0 | MIT | dev |
| `any-promise` | 1.3.0 | MIT | dev |
| `assertion-error-formatter` | 3.0.0 | MIT | dev |
| `balanced-match` | 4.0.4 | MIT | dev |
| `brace-expansion` | 5.0.5 | MIT | dev |
| `buffer-from` | 1.1.2 | MIT | dev |
| `capital-case` | 1.0.4 | MIT | dev |
| `chalk` | 4.1.2 | MIT | dev |
| `chalk/node_modules/ansi-styles` | 4.3.0 | MIT | dev |
| `chalk/node_modules/supports-color` | 7.2.0 | MIT | dev |
| `class-transformer` | 0.5.1 | MIT | dev |
| `cli-table3` | 0.6.5 | MIT | dev |
| `color-convert` | 2.0.1 | MIT | dev |
| `color-name` | 1.1.4 | MIT | dev |
| `commander` | 14.0.3 | MIT | dev |
| `debug` | 4.4.3 | MIT | dev |
| `diff` | 4.0.4 | BSD-3-Clause | dev |
| `emoji-regex` | 8.0.0 | MIT | dev |
| `error-stack-parser` | 2.1.4 | MIT | dev |
| `escape-string-regexp` | 1.0.5 | MIT | dev |
| `figures` | 3.2.0 | MIT | dev |
| `find-up-simple` | 1.0.1 | MIT | dev |
| `glob` | 13.0.6 | BlueOak-1.0.0 | dev |
| `global-dirs` | 3.0.1 | MIT | dev |
| `has-ansi` | 4.0.1 | MIT | dev |
| `has-flag` | 4.0.0 | MIT | dev |
| `hosted-git-info` | 9.0.3 | ISC | dev |
| `indent-string` | 4.0.0 | MIT | dev |
| `index-to-position` | 1.2.0 | MIT | dev |
| `ini` | 2.0.0 | ISC | dev |
| `is-fullwidth-code-point` | 3.0.0 | MIT | dev |
| `is-installed-globally` | 0.4.0 | MIT | dev |
| `is-path-inside` | 3.0.3 | MIT | dev |
| `is-stream` | 2.0.1 | MIT | dev |
| `js-tokens` | 4.0.0 | MIT | dev |
| `knuth-shuffle-seeded` | 1.0.6 | Apache-2.0 | dev |
| `lodash.merge` | 4.6.2 | MIT | dev |
| `lodash.mergewith` | 4.6.2 | MIT | dev |
| `lodash.sortby` | 4.7.0 | MIT | dev |
| `lower-case` | 2.0.2 | MIT | dev |
| `lru-cache` | 11.3.5 | BlueOak-1.0.0 | dev |
| `luxon` | 3.7.2 | MIT | dev |
| `mime` | 3.0.0 | MIT | dev |
| `minimatch` | 10.2.5 | BlueOak-1.0.0 | dev |
| `minipass` | 7.1.3 | BlueOak-1.0.0 | dev |
| `mkdirp` | 3.0.1 | MIT | dev |
| `ms` | 2.1.3 | MIT | dev |
| `mz` | 2.7.0 | MIT | dev |
| `no-case` | 3.0.4 | MIT | dev |
| `normalize-package-data` | 8.0.0 | BSD-2-Clause | dev |
| `object-assign` | 4.1.1 | MIT | dev |
| `pad-right` | 0.2.2 | MIT | dev |
| `parse-json` | 8.3.0 | MIT | dev |
| `path-scurry` | 2.0.2 | BlueOak-1.0.0 | dev |
| `picocolors` | 1.1.1 | ISC | dev |
| `progress` | 2.0.3 | MIT | dev |
| `property-expr` | 2.0.6 | MIT | dev |
| `read-package-up` | 12.0.0 | MIT | dev |
| `read-package-up/node_modules/type-fest` | 5.6.0 | (MIT OR CC0-1.0) | dev |
| `read-pkg` | 10.1.0 | MIT | dev |
| `read-pkg/node_modules/type-fest` | 5.6.0 | (MIT OR CC0-1.0) | dev |
| `reflect-metadata` | 0.2.2 | Apache-2.0 | dev |
| `regexp-match-indices` | 1.0.2 | Apache-2.0 | dev |
| `regexp-tree` | 0.1.27 | MIT | dev |
| `repeat-string` | 1.6.1 | MIT | dev |
| `seed-random` | 2.2.0 | MIT | dev |
| `semver` | 7.7.4 | ISC | dev |
| `source-map` | 0.6.1 | BSD-3-Clause | dev |
| `source-map-support` | 0.5.21 | MIT | dev |
| `spdx-correct` | 3.2.0 | Apache-2.0 | dev |
| `spdx-exceptions` | 2.5.0 | CC-BY-3.0 | dev |
| `spdx-expression-parse` | 3.0.1 | MIT | dev |
| `spdx-license-ids` | 3.0.23 | CC0-1.0 | dev |
| `stackframe` | 1.3.4 | MIT | dev |
| `string-argv` | 0.3.1 | MIT | dev |
| `string-width` | 4.2.3 | MIT | dev |
| `strip-ansi` | 6.0.1 | MIT | dev |
| `strip-ansi/node_modules/ansi-regex` | 5.0.1 | MIT | dev |
| `supports-color` | 8.1.1 | MIT | dev |
| `tagged-tag` | 1.0.0 | MIT | dev |
| `thenify` | 3.3.1 | MIT | dev |
| `thenify-all` | 1.6.0 | MIT | dev |
| `tiny-case` | 1.0.3 | MIT | dev |
| `toposort` | 2.0.2 | MIT | dev |
| `ts-dedent` | 2.2.0 | MIT | dev |
| `tslib` | 2.8.1 | 0BSD | dev |
| `type-fest` | 4.41.0 | (MIT OR CC0-1.0) | dev |
| `unicorn-magic` | 0.4.0 | MIT | dev |
| `upper-case-first` | 2.0.2 | MIT | dev |
| `util-arity` | 1.1.0 | MIT | dev |
| `validate-npm-package-license` | 3.0.4 | Apache-2.0 | dev |
| `xmlbuilder` | 15.1.1 | MIT | dev |
| `yaml` | 2.8.4 | ISC | dev |
| `yup` | 1.7.1 | MIT | dev |
| `yup/node_modules/type-fest` | 2.19.0 | (MIT OR CC0-1.0) | dev |

## Security process notes

- This repo is static-first (GitHub Pages friendly), so default runtime does not require server-side package deployment.
- Dependency versions and licenses should be reviewed whenever `package-lock.json` changes.
- Suggested review loop:
  1. Run `npm install` and `npm test`.
  2. Review `package-lock.json` diff for new packages and license changes.
  3. Run `npm audit` and triage reported vulnerabilities.
  4. Update this `SBOM.md` when dependencies or major toolchain versions change.

## Last updated

- Date (UTC): 2026-05-23
- Prepared from repository state at commit time in this branch.
