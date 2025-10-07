# Changelog

# [0.9.0](https://github.com/aurynx/vite-plugin/compare/v0.8.0...v0.9.0) (2025-10-07)


### Bug Fixes

* **compiler:** simplify slot invocation logic in PHP output ([0c00c2c](https://github.com/aurynx/vite-plugin/commit/0c00c2c1e0e0692fb663b0794bce8206f860eb54))


### Features

* **plugin:** add foreach opening and closing tag generation methods ([e19ae6a](https://github.com/aurynx/vite-plugin/commit/e19ae6aeb753b044d08198001206a4aa351ac169))
* **plugin:** add support for if, elseif, else, and endif directives ([a045cca](https://github.com/aurynx/vite-plugin/commit/a045cca1e059393d69650bb3e3929c0fd627dc98))

# [0.8.0](https://github.com/aurynx/vite-plugin/compare/v0.7.0...v0.8.0) (2025-10-07)


### Features

* **compiler:** add PHP statement and variable assignment methods ([d931ddb](https://github.com/aurynx/vite-plugin/commit/d931ddba8e9858dc42934d0d7d0198f49ed623b2))

# [0.7.0](https://github.com/aurynx/vite-plugin/compare/v0.6.0...v0.7.0) (2025-10-07)


### Features

* **compiler:** optimize data_get() calls within foreach loops ([1fb8efe](https://github.com/aurynx/vite-plugin/commit/1fb8efe48e180d32a38fe12cf620039d3d5bb4a0))

# [0.6.0](https://github.com/aurynx/vite-plugin/compare/v0.5.0...v0.6.0) (2025-10-07)


### Features

* **compiler:** add static arrow and regular function creation methods ([e4b4877](https://github.com/aurynx/vite-plugin/commit/e4b48772da2e52d3ae5886ac282ccd6a79bf9a8d))
* **compiler:** optimize repeated data_get() calls with variable assignments ([fe589de](https://github.com/aurynx/vite-plugin/commit/fe589def43bc97e0f5b136436e913d50974a4a3f))
* **plugin:** add support for loop variables in [@each](https://github.com/each) directive ([a4d8df5](https://github.com/aurynx/vite-plugin/commit/a4d8df5c8a84687bdf00fa8e01146ea41f2e7d38))

# [0.5.0](https://github.com/aurynx/vite-plugin/compare/v0.4.0...v0.5.0) (2025-10-07)


### Features

* **compiler:** enhance component call formatting with indentation ([4c81feb](https://github.com/aurynx/vite-plugin/commit/4c81febc674586644fb2466311b92e514ba8959a))
* **compiler:** enhance function handling for single expressions with variables ([d65371a](https://github.com/aurynx/vite-plugin/commit/d65371a8930a28f427d124cccc4ccd7191229de6))
* **compiler:** improve formatting of component arguments and slots ([d4ac67b](https://github.com/aurynx/vite-plugin/commit/d4ac67bb581aa48d434c89d7325a052825723cf9))
* **compiler:** optimize closure handling for variable extraction ([a00968a](https://github.com/aurynx/vite-plugin/commit/a00968af68f02e291ba3595419762121987c2d01))
* **compiler:** optimize function signatures for single expressions ([6f03a45](https://github.com/aurynx/vite-plugin/commit/6f03a452c14ddad2c672b7a3b28c14be6a21b894))
* **compiler:** optimize PHP output with string concatenation ([4b01912](https://github.com/aurynx/vite-plugin/commit/4b01912ca232e4701e182bb8de67bc293d6c7caf))
* **compiler:** optimize PHP slot handling with echo statements ([4ab0f2a](https://github.com/aurynx/vite-plugin/commit/4ab0f2a5287fdcd5f1163818e8e366918c45ebab))
* **compiler:** optimize simple foreach loops to use array_map and implode ([b2fe12b](https://github.com/aurynx/vite-plugin/commit/b2fe12b1916165bbbaa46c2aa118d9dacf8f6ad8))
* **compiler:** replace extract() with explicit variable assignments ([db27bf3](https://github.com/aurynx/vite-plugin/commit/db27bf3e8691a25ea9434ead854a8e1a581892d6))

# [0.4.0](https://github.com/aurynx/vite-plugin/compare/v0.3.1...v0.4.0) (2025-10-06)


### Features

* **compiler:** wrap compiled templates in closures ([37548b2](https://github.com/aurynx/vite-plugin/commit/37548b21699483e188359e34fda622f014a7cd4e))
* **compiler:** wrap compiled templates in closures for runtime optimization ([16f69e7](https://github.com/aurynx/vite-plugin/commit/16f69e70e6f9681b722a743cfb075bee73d1fd71))

# [0.3.0](https://github.com/aurynx/vite-plugin/compare/v0.2.0...v0.3.0) (2025-10-03)


### Features

* **compiler:** add support for named slots in component compilation ([885ed92](https://github.com/aurynx/vite-plugin/commit/885ed926a2daafd56738426ae08be1ebd397985c))

# [0.2.0](https://github.com/aurynx/vite-plugin/compare/v0.1.1...v0.2.0) (2025-10-03)


### Features

* **compiler:** add automatic `use` clause generation for slots ([a037631](https://github.com/aurynx/vite-plugin/commit/a037631517d8475c712d1e8256a41b3d439843de))
* **logger:** implement a logger utility with prefixed console outputs ([4c577cb](https://github.com/aurynx/vite-plugin/commit/4c577cb42a9db5e8e2f2c474968329d78f494493))
* **plugin:** add initial compilation on startup option and implement initial build process ([176d767](https://github.com/aurynx/vite-plugin/commit/176d7672c30da39f1e5400f5dd175afcef06fd2a))
* **tests:** add tests for automatic `use` clause generation and variable detection ([9d4b150](https://github.com/aurynx/vite-plugin/commit/9d4b1506570c6a1ea9c679282d31a8fddcd81d45))
* **tests:** enhance test setup by cleaning full resource and cache directories ([545b844](https://github.com/aurynx/vite-plugin/commit/545b8445ed6da7194440c89b7fa09dbb3d640928))

## [0.1.1](https://github.com/aurynx/vite-plugin/compare/v0.1.0...v0.1.1) (2025-10-02)


### Bug Fixes

* **build:** correct build process for Node.js environment ([373ccc5](https://github.com/aurynx/vite-plugin/commit/373ccc5f80f4378e5a4f7340c02b2c53c98fa844))
