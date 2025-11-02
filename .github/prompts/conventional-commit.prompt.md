---
description:
  'Prompt and workflow for generating conventional commit messages using a structured XML format.
  including instructions, examples, and validation.'
tools: ['run_in_terminal', 'get_terminal_output']
---

### Instructions

```xml
	<description>This file contains a prompt template for generating conventional commit messages. It provides instructions, examples, and formatting guidelines to help users write standardized, descriptive commit messages in accordance with the Conventional Commits specification.</description>
	<note>
```

### Workflow

**Follow these steps:**

1. Run `git status` to review changed files.
2. Run `git diff` or `git diff --cached` to inspect changes.
3. Stage your changes with `git add <file>`.
4. Construct your commit message using the following XML structure.
5. After generating your commit message, Copilot will automatically run the following command in
   your integrated terminal (no confirmation needed):

```bash
git commit -m "emoji type(scope): description"
```

6. Just execute this prompt and Copilot will handle the commit for you in the terminal.

### Commit Message Structure

```xml
<commit-message>
	<emoji>Use gitmoji corresponding to the commit type</emoji>
	<type>feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert</type>
	<scope>()</scope>
	<description>A short, imperative summary of the change</description>
	<body>(optional: more detailed explanation)</body>
	<footer>(optional: e.g. BREAKING CHANGE: details, or issue references)</footer>
</commit-message>
```

### Gitmoji Reference

```xml
<gitmoji-guide>
	<mapping type="feat">✨ :sparkles: - Introduce new features</mapping>
	<mapping type="fix">🐛 :bug: - Fix a bug</mapping>
	<mapping type="docs">📝 :memo: - Add or update documentation</mapping>
	<mapping type="style">💄 :lipstick: - Add or update UI and style files</mapping>
	<mapping type="refactor">♻️ :recycle: - Refactor code</mapping>
	<mapping type="perf">⚡️ :zap: - Improve performance</mapping>
	<mapping type="test">✅ :white_check_mark: - Add or update tests</mapping>
	<mapping type="build">📦 :package: - Add or update compiled files or packages</mapping>
	<mapping type="ci">👷 :construction_worker: - Add or update CI build system</mapping>
	<mapping type="chore">🔧 :wrench: - Add or update configuration files</mapping>
	<mapping type="revert">⏪️ :rewind: - Revert changes</mapping>
	<note>Reference: https://gitmoji.dev/</note>
</gitmoji-guide>
```

### Examples

```xml
<examples>
	<example>✨ feat(parser): add ability to parse arrays</example>
	<example>🐛 fix(ui): correct button alignment</example>
	<example>📝 docs: update README with usage instructions</example>
	<example>♻️ refactor: improve performance of data processing</example>
	<example>🔧 chore: update dependencies</example>
	<example>✨ feat!: send email on registration (BREAKING CHANGE: email service required)</example>
</examples>
```

### Validation

```xml
<validation>
	<emoji>Required. Must match the commit type according to gitmoji.dev</emoji>
	<type>Must be one of the allowed types. See <reference>https://www.conventionalcommits.org/en/v1.0.0/#specification</reference></type>
	<scope>Optional, but recommended for clarity.</scope>
	<description>Required. Use the imperative mood (e.g., "add", not "added").</description>
	<body>Optional. Use for additional context.</body>
	<footer>Use for breaking changes or issue references.</footer>
</validation>
```

### Final Step

```xml
<final-step>
	<cmd>git commit -m "emoji type(scope): description"</cmd>
	<note>Replace with your constructed message including the appropriate gitmoji. Include body and footer if needed.</note>
</final-step>
```
