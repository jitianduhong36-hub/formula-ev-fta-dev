# Third-party notices

## SheetJS Community Edition 0.20.3
Official source: https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js
Documentation: https://docs.sheetjs.com/docs/getting-started/installation/standalone/
License: Apache-2.0. Full text is in vendor/SheetJS-LICENSE.txt.
SHA-256 (xlsx.full.min.js): cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41

The pinned library is served with this app and runs in a local Web Worker. Importing a workbook does not send the workbook to SheetJS or another service. Macro code is not run; formulas are read as cached values and are not evaluated. Worker execution time and input dimensions are bounded.
