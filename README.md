# Diamond AI

Diamond is a static Five Oaks reference app. Its factual content is a bundled snapshot copied verbatim from the current Five Oaks Knowledge Base records:

- `src/data/five-oaks/books.json`
- `src/data/five-oaks/characters.json`
- `src/data/five-oaks/relationships.json`
- `src/data/five-oaks/animals.json`

Diamond searches and answers only from these four files. It has no manuscript retrieval, legacy canon fallback, inference source, embedding, network, or API source. When a fact is not represented by the snapshot, Diamond reports that it is unavailable.

To sync Diamond, copy the four current source JSON files from the Five Oaks Knowledge Base into `src/data/five-oaks/` without editing them, then commit the snapshot update. The validation command checks the required fields and record references before tests and production builds.
