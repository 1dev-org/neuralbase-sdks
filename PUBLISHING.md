# SDK Publishing

This repo is now prepared for:

- npm package: `@neuralbase/js`
- PyPI package: `neuralbase`
- Release workflow: `.github/workflows/release-sdks.yml`

## Before first publish

1. Make sure you control the npm scope `@neuralbase`.
2. Make sure you own the PyPI project name `neuralbase`.
3. SDK package metadata is set to `MIT` and each SDK directory includes its own `LICENSE` file.
4. Bump versions in:
   - `sdks/javascript/package.json`
   - `sdks/python/pyproject.toml`
   - `sdks/python/neuralbase.py`

## JavaScript package

Build and inspect:

```bash
cd sdks/javascript
npm install
npm run build
npm pack --dry-run
```

Publish:

```bash
npm login
npm publish --access public
```

GitHub Actions:

- Workflow: `.github/workflows/publish-js-sdk.yml`
- Trigger manually from Actions or push a tag like `js-sdk-v0.1.0`
- For the recommended trusted-publishing path, use `.github/workflows/release-sdks.yml` as the trusted workflow filename on npm

## Python package

Build and validate:

```bash
cd sdks/python
python -m pip install --upgrade build twine
python -m build
python -m twine check dist/*
```

Publish:

```bash
python -m twine upload dist/*
```

GitHub Actions:

- Workflow: `.github/workflows/publish-python-sdk.yml`
- Trigger manually from Actions or push a tag like `python-sdk-v0.1.0`
- For the recommended trusted-publishing path, use `.github/workflows/release-sdks.yml` as the trusted workflow filename on PyPI

## Combined release workflow

Trigger `.github/workflows/release-sdks.yml` with a version like `0.1.0`.

What it does:

1. Confirms both SDK package files already contain that version
2. Creates and pushes:
   - `js-sdk-v0.1.0`
   - `python-sdk-v0.1.0`
3. Publishes npm from the top-level release workflow
4. Builds and publishes PyPI from the top-level release workflow
5. Creates one GitHub Release for each SDK tag

## Recommended release order

1. Configure npm trusted publishing for `@neuralbase/js`
2. Configure PyPI trusted publishing for `neuralbase`
3. Bump both SDK versions in code
4. Run the combined release workflow
5. Update public docs examples if package names or versions changed
