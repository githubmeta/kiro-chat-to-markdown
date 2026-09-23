# Contributing

Thanks for considering a contribution to Kiro Chat to Markdown Converter.

## Development workflow

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/my-change
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Run the type-check:

   ```bash
   npm run lint
   ```

6. Build the production bundle:

   ```bash
   npm run build
   ```

7. Commit your changes and open a pull request.

## Pull requests

Please keep pull requests focused on one change when possible. Include a short explanation of the problem, the solution, and any testing you performed.

For parser changes, include a representative Kiro export example or describe the export structure that the change supports. Do not commit private conversations or sensitive data.

## Code style

- Use TypeScript for application code.
- Prefer small, focused functions and components.
- Keep parsing logic in `src/utils/kiroParser.ts` and Markdown generation logic in `src/utils/markdownGenerator.ts`.
- Avoid adding a backend dependency when the feature can remain client-side.
- Do not commit API keys, credentials, private Kiro exports, or generated personal conversation data.
