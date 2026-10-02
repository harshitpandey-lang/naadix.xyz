# Code and asset cleanup

The website remains a static site generator with a small Cloudflare location endpoint. This cleanup also brings the previously deployed website-services page into GitHub main.

- Removed the 18 unreferenced legacy images (1,753,855 bytes).
- Resized the existing logo from 1254px to 192px for its actual display/icon needs: 764,902 to 27,732 bytes (96.4% smaller). Explicit intrinsic dimensions and CSS preserve its display proportions.
- Removed the redundant fix-headers build step. The generator already emits the correct microphone policy.
- Added production minification of public JavaScript and CSS using esbuild, preserving module paths and lazy imports. Private HQ runtime and vendor transcription code remain intact.
- Lazy-loaded architecture/simulator code and its data only on pages that contain those features. Shared company config shrank from 3,512 to 531 bytes in the generated output.
- Consolidated superseded CSS declarations and formatted the website-services modules.
- Fixed the private inbox enhancement stylesheet path to its actual deployed asset location.
- Expanded syntax checking to all source and browser-test modules. Added an artifact check for static/lazy module imports and the injected inbox stylesheet.
- Kept visual verification screenshots as ignored local artifacts.
- Added GitHub Actions checks for install, syntax, build and tests on main pushes and pull requests.

Public JS/CSS after minification: approximately 96 KB to 67 KB, a 30% reduction. This is an asset-size measurement, not a claim about field Core Web Vitals.

Validation: syntax checks, production build, repository tests, desktop/mobile browser checks, website enquiry draft/edit/pause flow and homepage architecture interaction. No enquiry was sent and no private data was modified.
